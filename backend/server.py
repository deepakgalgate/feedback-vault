from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# AI Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="FeedbackVault API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str = "customer"  # customer, business_owner

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    user_type: str
    created_at: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    user_type: str
    business_id: Optional[str] = None
    review_count: int = 0
    created_at: str

# Category Models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    dimension_fields: List[str] = ["quality", "value", "consistency"]
    tags: List[str] = []

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    dimension_fields: List[str] = []
    tags: List[str] = []
    level: int = 0
    created_at: str

# Item Models
class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: str
    business_id: Optional[str] = None
    image_url: Optional[str] = None
    price_range: Optional[str] = None
    tags: List[str] = []

class ItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    category_id: str
    business_id: Optional[str] = None
    image_url: Optional[str] = None
    price_range: Optional[str] = None
    tags: List[str] = []
    avg_rating: float = 0.0
    review_count: int = 0
    created_at: str

# Variant Models
class VariantCreate(BaseModel):
    name: str
    item_id: str
    attributes: Dict[str, str] = {}  # e.g., {"spice_level": "medium", "portion": "regular"}
    price: Optional[float] = None

class VariantResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    item_id: str
    attributes: Dict[str, str] = {}
    price: Optional[float] = None
    avg_rating: float = 0.0
    review_count: int = 0
    dimensional_ratings: Dict[str, float] = {}
    created_at: str

# Review Models
class ReviewCreate(BaseModel):
    variant_id: str
    overall_rating: int = Field(ge=1, le=5)
    dimensional_ratings: Dict[str, int] = {}  # e.g., {"taste": 5, "portion": 4}
    tags: List[str] = []
    short_review: Optional[str] = None
    full_review: Optional[str] = None

class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    variant_id: str
    item_id: str
    overall_rating: int
    dimensional_ratings: Dict[str, int] = {}
    tags: List[str] = []
    short_review: Optional[str] = None
    full_review: Optional[str] = None
    helpful_count: int = 0
    verified: bool = False
    created_at: str

# Business Models
class BusinessCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: str
    location: Optional[str] = None
    image_url: Optional[str] = None

class BusinessResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    category_id: str
    location: Optional[str] = None
    image_url: Optional[str] = None
    avg_rating: float = 0.0
    review_count: int = 0
    created_at: str

# Analytics Models
class AnalyticsOverview(BaseModel):
    total_reviews: int
    avg_rating: float
    rating_trend: float  # Change vs last period
    top_items: List[Dict[str, Any]]
    recent_reviews: List[Dict[str, Any]]
    dimensional_breakdown: Dict[str, float]
    tag_frequency: Dict[str, int]

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Optional auth - returns None if no token
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[dict]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "user_type": user_data.user_type,
        "business_id": None,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id, user_data.email)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "user_type": user_data.user_type
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "user_type": user["user_type"],
            "business_id": user.get("business_id")
        }
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        user_type=current_user["user_type"],
        business_id=current_user.get("business_id"),
        review_count=current_user.get("review_count", 0),
        created_at=current_user["created_at"]
    )

# ==================== CATEGORY ROUTES ====================

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    category_id = str(uuid.uuid4())
    level = 0
    if category.parent_id:
        parent = await db.categories.find_one({"id": category.parent_id}, {"_id": 0})
        if parent:
            level = parent.get("level", 0) + 1
    
    cat_doc = {
        "id": category_id,
        "name": category.name,
        "description": category.description,
        "parent_id": category.parent_id,
        "image_url": category.image_url,
        "dimension_fields": category.dimension_fields,
        "tags": category.tags,
        "level": level,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(cat_doc)
    return CategoryResponse(**cat_doc)

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(parent_id: Optional[str] = None):
    query = {}
    if parent_id:
        query["parent_id"] = parent_id
    else:
        query["parent_id"] = None  # Root categories
    
    categories = await db.categories.find(query, {"_id": 0}).to_list(100)
    return [CategoryResponse(**cat) for cat in categories]

@api_router.get("/categories/all", response_model=List[CategoryResponse])
async def get_all_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(500)
    return [CategoryResponse(**cat) for cat in categories]

@api_router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse(**category)

# ==================== ITEM ROUTES ====================

@api_router.post("/items", response_model=ItemResponse)
async def create_item(item: ItemCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    item_doc = {
        "id": item_id,
        "name": item.name,
        "description": item.description,
        "category_id": item.category_id,
        "business_id": item.business_id or current_user.get("business_id"),
        "image_url": item.image_url,
        "price_range": item.price_range,
        "tags": item.tags,
        "avg_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.items.insert_one(item_doc)
    return ItemResponse(**item_doc)

@api_router.get("/items", response_model=List[ItemResponse])
async def get_items(
    category_id: Optional[str] = None,
    business_id: Optional[str] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = None,
    limit: int = 50
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if business_id:
        query["business_id"] = business_id
    if min_rating:
        query["avg_rating"] = {"$gte": min_rating}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}}
        ]
    
    items = await db.items.find(query, {"_id": 0}).sort("avg_rating", -1).to_list(limit)
    return [ItemResponse(**item) for item in items]

@api_router.get("/items/trending", response_model=List[ItemResponse])
async def get_trending_items(limit: int = 10):
    # Get items with most reviews in last 30 days
    items = await db.items.find({}, {"_id": 0}).sort([("review_count", -1), ("avg_rating", -1)]).to_list(limit)
    return [ItemResponse(**item) for item in items]

@api_router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return ItemResponse(**item)

# ==================== VARIANT ROUTES ====================

@api_router.post("/variants", response_model=VariantResponse)
async def create_variant(variant: VariantCreate, current_user: dict = Depends(get_current_user)):
    variant_id = str(uuid.uuid4())
    variant_doc = {
        "id": variant_id,
        "name": variant.name,
        "item_id": variant.item_id,
        "attributes": variant.attributes,
        "price": variant.price,
        "avg_rating": 0.0,
        "review_count": 0,
        "dimensional_ratings": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.variants.insert_one(variant_doc)
    return VariantResponse(**variant_doc)

@api_router.get("/variants", response_model=List[VariantResponse])
async def get_variants(item_id: str):
    variants = await db.variants.find({"item_id": item_id}, {"_id": 0}).to_list(100)
    return [VariantResponse(**v) for v in variants]

@api_router.get("/variants/{variant_id}", response_model=VariantResponse)
async def get_variant(variant_id: str):
    variant = await db.variants.find_one({"id": variant_id}, {"_id": 0})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    return VariantResponse(**variant)

# ==================== REVIEW ROUTES ====================

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    # Get variant to find item_id
    variant = await db.variants.find_one({"id": review.variant_id}, {"_id": 0})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "variant_id": review.variant_id,
        "item_id": variant["item_id"],
        "overall_rating": review.overall_rating,
        "dimensional_ratings": review.dimensional_ratings,
        "tags": review.tags,
        "short_review": review.short_review,
        "full_review": review.full_review,
        "helpful_count": 0,
        "verified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    # Update variant ratings
    await update_variant_ratings(review.variant_id)
    
    # Update item ratings
    await update_item_ratings(variant["item_id"])
    
    # Update user review count
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"review_count": 1}}
    )
    
    return ReviewResponse(**review_doc)

async def update_variant_ratings(variant_id: str):
    reviews = await db.reviews.find({"variant_id": variant_id}, {"_id": 0}).to_list(10000)
    if not reviews:
        return
    
    avg_rating = sum(r["overall_rating"] for r in reviews) / len(reviews)
    
    # Calculate dimensional averages
    dim_totals = {}
    dim_counts = {}
    for r in reviews:
        for dim, val in r.get("dimensional_ratings", {}).items():
            dim_totals[dim] = dim_totals.get(dim, 0) + val
            dim_counts[dim] = dim_counts.get(dim, 0) + 1
    
    dimensional_ratings = {dim: dim_totals[dim] / dim_counts[dim] for dim in dim_totals}
    
    await db.variants.update_one(
        {"id": variant_id},
        {"$set": {
            "avg_rating": round(avg_rating, 2),
            "review_count": len(reviews),
            "dimensional_ratings": dimensional_ratings
        }}
    )

async def update_item_ratings(item_id: str):
    reviews = await db.reviews.find({"item_id": item_id}, {"_id": 0}).to_list(10000)
    if not reviews:
        return
    
    avg_rating = sum(r["overall_rating"] for r in reviews) / len(reviews)
    
    await db.items.update_one(
        {"id": item_id},
        {"$set": {
            "avg_rating": round(avg_rating, 2),
            "review_count": len(reviews)
        }}
    )

@api_router.get("/reviews", response_model=List[ReviewResponse])
async def get_reviews(
    variant_id: Optional[str] = None,
    item_id: Optional[str] = None,
    user_id: Optional[str] = None,
    min_rating: Optional[int] = None,
    limit: int = 50,
    sort_by: str = "recent"  # recent, helpful, rating
):
    query = {}
    if variant_id:
        query["variant_id"] = variant_id
    if item_id:
        query["item_id"] = item_id
    if user_id:
        query["user_id"] = user_id
    if min_rating:
        query["overall_rating"] = {"$gte": min_rating}
    
    sort_field = "created_at"
    sort_order = -1
    if sort_by == "helpful":
        sort_field = "helpful_count"
    elif sort_by == "rating":
        sort_field = "overall_rating"
    
    reviews = await db.reviews.find(query, {"_id": 0}).sort(sort_field, sort_order).to_list(limit)
    return [ReviewResponse(**r) for r in reviews]

@api_router.post("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Marked as helpful"}

@api_router.get("/reviews/my-reviews", response_model=List[ReviewResponse])
async def get_my_reviews(current_user: dict = Depends(get_current_user)):
    reviews = await db.reviews.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ReviewResponse(**r) for r in reviews]

# ==================== BUSINESS ROUTES ====================

@api_router.post("/businesses", response_model=BusinessResponse)
async def create_business(business: BusinessCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "business_owner":
        raise HTTPException(status_code=403, detail="Only business owners can create businesses")
    
    business_id = str(uuid.uuid4())
    business_doc = {
        "id": business_id,
        "name": business.name,
        "description": business.description,
        "owner_id": current_user["id"],
        "category_id": business.category_id,
        "location": business.location,
        "image_url": business.image_url,
        "avg_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.businesses.insert_one(business_doc)
    
    # Update user with business_id
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"business_id": business_id}}
    )
    
    return BusinessResponse(**business_doc)

@api_router.get("/businesses", response_model=List[BusinessResponse])
async def get_businesses(category_id: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    businesses = await db.businesses.find(query, {"_id": 0}).to_list(100)
    return [BusinessResponse(**b) for b in businesses]

@api_router.get("/businesses/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str):
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return BusinessResponse(**business)

@api_router.get("/businesses/my-business", response_model=BusinessResponse)
async def get_my_business(current_user: dict = Depends(get_current_user)):
    if not current_user.get("business_id"):
        raise HTTPException(status_code=404, detail="No business found for this user")
    
    business = await db.businesses.find_one({"id": current_user["business_id"]}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return BusinessResponse(**business)

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(current_user: dict = Depends(get_current_user)):
    if not current_user.get("business_id"):
        raise HTTPException(status_code=403, detail="No business associated with this account")
    
    business_id = current_user["business_id"]
    
    # Get items for this business
    items = await db.items.find({"business_id": business_id}, {"_id": 0}).to_list(1000)
    item_ids = [item["id"] for item in items]
    
    # Get all reviews for these items
    reviews = await db.reviews.find({"item_id": {"$in": item_ids}}, {"_id": 0}).to_list(10000)
    
    total_reviews = len(reviews)
    avg_rating = sum(r["overall_rating"] for r in reviews) / total_reviews if reviews else 0
    
    # Calculate dimensional breakdown
    dim_totals = {}
    dim_counts = {}
    tag_frequency = {}
    
    for r in reviews:
        for dim, val in r.get("dimensional_ratings", {}).items():
            dim_totals[dim] = dim_totals.get(dim, 0) + val
            dim_counts[dim] = dim_counts.get(dim, 0) + 1
        for tag in r.get("tags", []):
            tag_frequency[tag] = tag_frequency.get(tag, 0) + 1
    
    dimensional_breakdown = {dim: round(dim_totals[dim] / dim_counts[dim], 2) for dim in dim_totals}
    
    # Top items by rating
    top_items = sorted(items, key=lambda x: (x.get("avg_rating", 0), x.get("review_count", 0)), reverse=True)[:5]
    
    # Recent reviews
    recent_reviews = sorted(reviews, key=lambda x: x["created_at"], reverse=True)[:5]
    
    return AnalyticsOverview(
        total_reviews=total_reviews,
        avg_rating=round(avg_rating, 2),
        rating_trend=0.0,  # Would need historical data to calculate
        top_items=[{"name": i["name"], "rating": i.get("avg_rating", 0), "reviews": i.get("review_count", 0)} for i in top_items],
        recent_reviews=[{"rating": r["overall_rating"], "review": r.get("short_review", ""), "user": r["user_name"], "date": r["created_at"]} for r in recent_reviews],
        dimensional_breakdown=dimensional_breakdown,
        tag_frequency=dict(sorted(tag_frequency.items(), key=lambda x: x[1], reverse=True)[:10])
    )

@api_router.get("/analytics/items/{item_id}")
async def get_item_analytics(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get all variants and their reviews
    variants = await db.variants.find({"item_id": item_id}, {"_id": 0}).to_list(100)
    reviews = await db.reviews.find({"item_id": item_id}, {"_id": 0}).to_list(10000)
    
    # Rating distribution
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        rating_dist[r["overall_rating"]] = rating_dist.get(r["overall_rating"], 0) + 1
    
    return {
        "item": item,
        "variants": variants,
        "total_reviews": len(reviews),
        "rating_distribution": rating_dist,
        "recent_reviews": sorted(reviews, key=lambda x: x["created_at"], reverse=True)[:10]
    }

# ==================== SEARCH ROUTES ====================

@api_router.get("/search")
async def search(q: str, category_id: Optional[str] = None, min_rating: Optional[float] = None):
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$in": [q.lower()]}}
        ]
    }
    if category_id:
        query["category_id"] = category_id
    if min_rating:
        query["avg_rating"] = {"$gte": min_rating}
    
    items = await db.items.find(query, {"_id": 0}).sort("avg_rating", -1).to_list(50)
    
    return {
        "items": [ItemResponse(**item) for item in items],
        "count": len(items)
    }

# ==================== AI INSIGHTS ROUTES ====================

class AIInsightsResponse(BaseModel):
    summary: str
    key_strengths: List[str]
    areas_for_improvement: List[str]
    sentiment_score: float
    recommendation_percentage: float
    popular_tags: Dict[str, int]
    insights: List[str]

async def generate_ai_insights(reviews: List[dict], item_name: str) -> dict:
    """Generate AI-powered insights from reviews using OpenAI"""
    if not EMERGENT_LLM_KEY or not reviews:
        return generate_fallback_insights(reviews, item_name)
    
    try:
        # Prepare review text for analysis
        review_texts = []
        for r in reviews[:20]:  # Limit to 20 reviews for context
            text = f"Rating: {r['overall_rating']}/5"
            if r.get('short_review'):
                text += f" - {r['short_review']}"
            if r.get('tags'):
                text += f" [Tags: {', '.join(r['tags'])}]"
            review_texts.append(text)
        
        reviews_content = "\n".join(review_texts)
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"insights-{item_name}-{uuid.uuid4()}",
            system_message="You are an expert at analyzing customer reviews and extracting actionable insights. Respond in JSON format only."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Analyze these customer reviews for "{item_name}" and provide insights in JSON format:

Reviews:
{reviews_content}

Respond with ONLY valid JSON in this exact format:
{{
    "summary": "A 2-3 sentence summary of overall customer sentiment",
    "key_strengths": ["strength1", "strength2", "strength3"],
    "areas_for_improvement": ["area1", "area2"],
    "insights": ["insight1 with percentage", "insight2 with percentage", "insight3"]
}}"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        # Clean response - find JSON in the response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        ai_data = json.loads(response_text.strip())
        
        # Calculate metrics from reviews
        total_reviews = len(reviews)
        avg_rating = sum(r['overall_rating'] for r in reviews) / total_reviews if total_reviews > 0 else 0
        recommend_count = sum(1 for r in reviews if 'would-recommend' in r.get('tags', []))
        
        # Count tags
        tag_counts = {}
        for r in reviews:
            for tag in r.get('tags', []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        return {
            "summary": ai_data.get("summary", ""),
            "key_strengths": ai_data.get("key_strengths", [])[:5],
            "areas_for_improvement": ai_data.get("areas_for_improvement", [])[:3],
            "sentiment_score": round(avg_rating / 5 * 100, 1),
            "recommendation_percentage": round((recommend_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            "popular_tags": dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:8]),
            "insights": ai_data.get("insights", [])[:5]
        }
        
    except Exception as e:
        logger.error(f"AI insights generation failed: {e}")
        return generate_fallback_insights(reviews, item_name)

def generate_fallback_insights(reviews: List[dict], item_name: str) -> dict:
    """Generate basic insights without AI"""
    total_reviews = len(reviews)
    if total_reviews == 0:
        return {
            "summary": f"No reviews yet for {item_name}. Be the first to share your experience!",
            "key_strengths": [],
            "areas_for_improvement": [],
            "sentiment_score": 0,
            "recommendation_percentage": 0,
            "popular_tags": {},
            "insights": []
        }
    
    avg_rating = sum(r['overall_rating'] for r in reviews) / total_reviews
    recommend_count = sum(1 for r in reviews if 'would-recommend' in r.get('tags', []))
    
    # Count tags and ratings
    tag_counts = {}
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        rating_dist[r['overall_rating']] = rating_dist.get(r['overall_rating'], 0) + 1
        for tag in r.get('tags', []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # Generate insights based on data
    insights = []
    five_star_pct = round((rating_dist[5] / total_reviews) * 100, 1)
    if five_star_pct > 50:
        insights.append(f"{five_star_pct}% of reviewers gave 5 stars")
    
    for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:3]:
        pct = round((count / total_reviews) * 100, 1)
        tag_display = tag.replace('-', ' ').title()
        insights.append(f"{pct}% of reviewers mentioned '{tag_display}'")
    
    # Determine strengths based on common positive tags
    positive_tags = ['fresh', 'authentic', 'worth-price', 'would-recommend', 'great-service', 'premium-quality']
    strengths = [tag.replace('-', ' ').title() for tag in positive_tags if tag in tag_counts][:5]
    
    # Determine areas for improvement (low-rated aspects)
    improvements = []
    if avg_rating < 4:
        improvements.append("Overall consistency")
    if rating_dist.get(1, 0) + rating_dist.get(2, 0) > total_reviews * 0.2:
        improvements.append("Address negative feedback patterns")
    
    sentiment = "excellent" if avg_rating >= 4.5 else "positive" if avg_rating >= 4 else "mixed" if avg_rating >= 3 else "needs attention"
    
    return {
        "summary": f"{item_name} has {sentiment} feedback with an average rating of {avg_rating:.1f}/5 based on {total_reviews} reviews.",
        "key_strengths": strengths,
        "areas_for_improvement": improvements,
        "sentiment_score": round(avg_rating / 5 * 100, 1),
        "recommendation_percentage": round((recommend_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
        "popular_tags": dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:8]),
        "insights": insights
    }

@api_router.get("/ai/insights/{item_id}", response_model=AIInsightsResponse)
async def get_ai_insights(item_id: str):
    """Get AI-powered insights for an item"""
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    reviews = await db.reviews.find({"item_id": item_id}, {"_id": 0}).to_list(100)
    insights = await generate_ai_insights(reviews, item["name"])
    
    return AIInsightsResponse(**insights)

@api_router.get("/ai/insights/variant/{variant_id}", response_model=AIInsightsResponse)
async def get_variant_ai_insights(variant_id: str):
    """Get AI-powered insights for a specific variant"""
    variant = await db.variants.find_one({"id": variant_id}, {"_id": 0})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    reviews = await db.reviews.find({"variant_id": variant_id}, {"_id": 0}).to_list(100)
    insights = await generate_ai_insights(reviews, variant["name"])
    
    return AIInsightsResponse(**insights)

# ==================== BUSINESS ITEM MANAGEMENT ====================

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price_range: Optional[str] = None
    tags: Optional[List[str]] = None

class VariantUpdate(BaseModel):
    name: Optional[str] = None
    attributes: Optional[Dict[str, str]] = None
    price: Optional[float] = None

@api_router.get("/business/items", response_model=List[ItemResponse])
async def get_business_items(current_user: dict = Depends(get_current_user)):
    """Get all items for the current business owner"""
    if not current_user.get("business_id"):
        raise HTTPException(status_code=404, detail="No business associated with this account")
    
    items = await db.items.find({"business_id": current_user["business_id"]}, {"_id": 0}).to_list(500)
    return [ItemResponse(**item) for item in items]

@api_router.put("/business/items/{item_id}", response_model=ItemResponse)
async def update_business_item(item_id: str, item_update: ItemUpdate, current_user: dict = Depends(get_current_user)):
    """Update an item owned by the business"""
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.get("business_id") != current_user.get("business_id"):
        raise HTTPException(status_code=403, detail="You don't own this item")
    
    update_data = {k: v for k, v in item_update.model_dump().items() if v is not None}
    if update_data:
        await db.items.update_one({"id": item_id}, {"$set": update_data})
    
    updated_item = await db.items.find_one({"id": item_id}, {"_id": 0})
    return ItemResponse(**updated_item)

@api_router.delete("/business/items/{item_id}")
async def delete_business_item(item_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an item owned by the business"""
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.get("business_id") != current_user.get("business_id"):
        raise HTTPException(status_code=403, detail="You don't own this item")
    
    # Delete item and its variants and reviews
    await db.reviews.delete_many({"item_id": item_id})
    await db.variants.delete_many({"item_id": item_id})
    await db.items.delete_one({"id": item_id})
    
    return {"message": "Item deleted successfully"}

@api_router.get("/business/items/{item_id}/variants", response_model=List[VariantResponse])
async def get_item_variants(item_id: str, current_user: dict = Depends(get_current_user)):
    """Get all variants for an item"""
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    variants = await db.variants.find({"item_id": item_id}, {"_id": 0}).to_list(100)
    return [VariantResponse(**v) for v in variants]

@api_router.put("/business/variants/{variant_id}", response_model=VariantResponse)
async def update_variant(variant_id: str, variant_update: VariantUpdate, current_user: dict = Depends(get_current_user)):
    """Update a variant"""
    variant = await db.variants.find_one({"id": variant_id}, {"_id": 0})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Check ownership through item
    item = await db.items.find_one({"id": variant["item_id"]}, {"_id": 0})
    if item.get("business_id") != current_user.get("business_id"):
        raise HTTPException(status_code=403, detail="You don't own this variant")
    
    update_data = {k: v for k, v in variant_update.model_dump().items() if v is not None}
    if update_data:
        await db.variants.update_one({"id": variant_id}, {"$set": update_data})
    
    updated_variant = await db.variants.find_one({"id": variant_id}, {"_id": 0})
    return VariantResponse(**updated_variant)

@api_router.delete("/business/variants/{variant_id}")
async def delete_variant(variant_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a variant"""
    variant = await db.variants.find_one({"id": variant_id}, {"_id": 0})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Check ownership through item
    item = await db.items.find_one({"id": variant["item_id"]}, {"_id": 0})
    if item.get("business_id") != current_user.get("business_id"):
        raise HTTPException(status_code=403, detail="You don't own this variant")
    
    await db.reviews.delete_many({"variant_id": variant_id})
    await db.variants.delete_one({"id": variant_id})
    
    return {"message": "Variant deleted successfully"}

# ==================== SEED DATA ROUTE ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial categories and sample data"""
    # Check if already seeded
    existing = await db.categories.find_one({"name": "Restaurants"})
    if existing:
        return {"message": "Data already seeded"}
    
    # Create root categories
    categories = [
        {
            "id": str(uuid.uuid4()),
            "name": "Restaurants",
            "description": "Food and dining establishments",
            "parent_id": None,
            "image_url": "https://images.pexels.com/photos/11065504/pexels-photo-11065504.jpeg",
            "dimension_fields": ["taste", "portion", "freshness", "value", "consistency"],
            "tags": ["fresh", "authentic", "spicy", "worth-price", "would-recommend"],
            "level": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Electronics",
            "description": "Tech products and gadgets",
            "parent_id": None,
            "image_url": "https://images.pexels.com/photos/3496992/pexels-photo-3496992.jpeg",
            "dimension_fields": ["quality", "performance", "value", "durability", "features"],
            "tags": ["reliable", "fast", "premium", "worth-price", "would-recommend"],
            "level": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Hotels",
            "description": "Accommodation and hospitality",
            "parent_id": None,
            "image_url": "https://images.pexels.com/photos/3434997/pexels-photo-3434997.jpeg",
            "dimension_fields": ["cleanliness", "comfort", "service", "location", "value"],
            "tags": ["clean", "comfortable", "friendly-staff", "great-location", "would-recommend"],
            "level": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.categories.insert_many(categories)
    
    # Create subcategories for Restaurants
    restaurant_id = categories[0]["id"]
    subcategories = [
        {
            "id": str(uuid.uuid4()),
            "name": "Indian Cuisine",
            "description": "Traditional Indian dishes",
            "parent_id": restaurant_id,
            "image_url": "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg",
            "dimension_fields": ["taste", "portion", "freshness", "value", "consistency"],
            "tags": ["spicy", "authentic", "vegetarian", "non-vegetarian"],
            "level": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Italian Cuisine",
            "description": "Italian and Mediterranean dishes",
            "parent_id": restaurant_id,
            "image_url": "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg",
            "dimension_fields": ["taste", "portion", "freshness", "value", "consistency"],
            "tags": ["authentic", "fresh-ingredients", "vegetarian", "seafood"],
            "level": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.categories.insert_many(subcategories)
    
    return {"message": "Data seeded successfully", "categories": len(categories) + len(subcategories)}

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "FeedbackVault API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
