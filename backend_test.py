#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FeedbackVaultAPITester:
    def __init__(self, base_url="https://insight-hub-194.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_seed_data(self):
        """Test seeding initial data"""
        print("\n🔍 Testing Data Seeding...")
        result = self.run_test("Seed Data", "POST", "seed", 200)
        return result is not None

    def test_categories(self):
        """Test category endpoints"""
        print("\n🔍 Testing Category Endpoints...")
        
        # Get root categories
        categories = self.run_test("Get Root Categories", "GET", "categories", 200)
        
        # Get all categories
        all_categories = self.run_test("Get All Categories", "GET", "categories/all", 200)
        
        if categories and len(categories) > 0:
            # Get specific category
            category_id = categories[0]['id']
            self.run_test("Get Category by ID", "GET", f"categories/{category_id}", 200)
            return category_id
        
        return None

    def test_auth_flow(self):
        """Test authentication flow"""
        print("\n🔍 Testing Authentication...")
        
        # Test with existing user
        login_data = {
            "email": "test@example.com",
            "password": "test123"
        }
        
        result = self.run_test("Login Existing User", "POST", "auth/login", 200, login_data)
        
        if result and 'token' in result:
            self.token = result['token']
            print(f"🔑 Token obtained: {self.token[:20]}...")
            
            # Test protected endpoint
            self.run_test("Get User Profile", "GET", "auth/me", 200)
            return True
        else:
            # Try to register new user
            register_data = {
                "name": "Test User",
                "email": "test@example.com", 
                "password": "test123",
                "user_type": "customer"
            }
            
            result = self.run_test("Register New User", "POST", "auth/register", 200, register_data)
            
            if result and 'token' in result:
                self.token = result['token']
                print(f"🔑 Token obtained: {self.token[:20]}...")
                self.run_test("Get User Profile", "GET", "auth/me", 200)
                return True
        
        return False

    def test_items(self, category_id=None):
        """Test item endpoints"""
        print("\n🔍 Testing Item Endpoints...")
        
        # Get all items
        items = self.run_test("Get All Items", "GET", "items", 200)
        
        # Get trending items
        self.run_test("Get Trending Items", "GET", "items/trending", 200)
        
        # Test search
        search_result = self.run_test("Search Items", "GET", "search?q=test", 200)
        
        if items and len(items) > 0:
            # Get specific item
            item_id = items[0]['id']
            self.run_test("Get Item by ID", "GET", f"items/{item_id}", 200)
            return item_id
        
        # Create a test item if authenticated and have category
        if self.token and category_id:
            item_data = {
                "name": "Test Item",
                "description": "A test item for API testing",
                "category_id": category_id,
                "tags": ["test", "api"]
            }
            
            result = self.run_test("Create Item", "POST", "items", 200, item_data)
            if result:
                return result.get('id')
        
        return None

    def test_variants(self, item_id):
        """Test variant endpoints"""
        if not item_id:
            return None
            
        print("\n🔍 Testing Variant Endpoints...")
        
        # Get variants for item
        variants = self.run_test("Get Item Variants", "GET", f"variants?item_id={item_id}", 200)
        
        # Create a variant if authenticated
        if self.token:
            variant_data = {
                "name": "Test Variant",
                "item_id": item_id,
                "attributes": {"size": "medium", "spice": "mild"},
                "price": 15.99
            }
            
            result = self.run_test("Create Variant", "POST", "variants", 200, variant_data)
            if result:
                variant_id = result.get('id')
                self.run_test("Get Variant by ID", "GET", f"variants/{variant_id}", 200)
                return variant_id
        
        if variants and len(variants) > 0:
            return variants[0]['id']
        
        return None

    def test_reviews(self, variant_id):
        """Test review endpoints"""
        if not variant_id or not self.token:
            return
            
        print("\n🔍 Testing Review Endpoints...")
        
        # Get reviews
        self.run_test("Get All Reviews", "GET", "reviews", 200)
        
        # Create a review
        review_data = {
            "variant_id": variant_id,
            "overall_rating": 4,
            "dimensional_ratings": {"taste": 5, "value": 4},
            "tags": ["delicious", "worth-price"],
            "short_review": "Great taste and good value!",
            "full_review": "Really enjoyed this item. The taste was excellent and felt like good value for money."
        }
        
        result = self.run_test("Create Review", "POST", "reviews", 200, review_data)
        
        if result:
            # Get my reviews
            self.run_test("Get My Reviews", "GET", "reviews/my-reviews", 200)

    def test_ai_insights(self):
        """Test AI insights endpoints"""
        print("\n🔍 Testing AI Insights...")
        
        # Test with known item that has reviews
        test_item_id = "72acec37-4f3f-4f51-b27d-fc4aa7118867"
        
        # Test AI insights for item
        insights = self.run_test("Get AI Insights for Item", "GET", f"ai/insights/{test_item_id}", 200)
        
        if insights:
            # Verify required fields are present
            required_fields = ['summary', 'sentiment_score', 'key_strengths', 'areas_for_improvement', 'popular_tags']
            missing_fields = [field for field in required_fields if field not in insights]
            
            if missing_fields:
                self.log_test("AI Insights Fields Validation", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("AI Insights Fields Validation", True, "All required fields present")
                
                # Validate data types
                if isinstance(insights.get('sentiment_score'), (int, float)) and 0 <= insights['sentiment_score'] <= 100:
                    self.log_test("Sentiment Score Validation", True, f"Score: {insights['sentiment_score']}")
                else:
                    self.log_test("Sentiment Score Validation", False, f"Invalid score: {insights.get('sentiment_score')}")

    def test_business_item_management(self):
        """Test business item management endpoints"""
        if not self.token:
            return
            
        print("\n🔍 Testing Business Item Management...")
        
        # First create a business owner user
        business_user_data = {
            "name": "Business Owner Test",
            "email": f"business_test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "test123",
            "user_type": "business_owner"
        }
        
        # Register business owner
        result = self.run_test("Register Business Owner", "POST", "auth/register", 200, business_user_data)
        
        if result and 'token' in result:
            # Store original token
            original_token = self.token
            self.token = result['token']
            
            # Create a business first
            business_data = {
                "name": "Test Business",
                "description": "A test business for API testing",
                "category_id": "test-category-id",  # Will use first available category
                "location": "Test City"
            }
            
            # Get categories first to use real category ID
            categories = self.run_test("Get Categories for Business", "GET", "categories/all", 200)
            if categories and len(categories) > 0:
                business_data["category_id"] = categories[0]["id"]
                
                business_result = self.run_test("Create Business", "POST", "businesses", 200, business_data)
                
                if business_result:
                    # Test business item management endpoints
                    self.run_test("Get Business Items", "GET", "business/items", 200)
                    
                    # Create a test item for the business
                    item_data = {
                        "name": "Business Test Item",
                        "description": "Test item for business management",
                        "category_id": categories[0]["id"],
                        "price_range": "$10-15",
                        "tags": ["test", "business"]
                    }
                    
                    created_item = self.run_test("Create Business Item", "POST", "items", 200, item_data)
                    
                    if created_item:
                        item_id = created_item.get('id')
                        
                        # Test update item
                        update_data = {
                            "name": "Updated Business Item",
                            "description": "Updated description"
                        }
                        self.run_test("Update Business Item", "PUT", f"business/items/{item_id}", 200, update_data)
                        
                        # Test create variant
                        variant_data = {
                            "name": "Business Test Variant",
                            "item_id": item_id,
                            "attributes": {"size": "large"},
                            "price": 12.99
                        }
                        
                        created_variant = self.run_test("Create Business Variant", "POST", "variants", 200, variant_data)
                        
                        if created_variant:
                            variant_id = created_variant.get('id')
                            
                            # Test get variants for item
                            self.run_test("Get Item Variants", "GET", f"business/items/{item_id}/variants", 200)
                            
                            # Test update variant
                            variant_update = {"name": "Updated Variant"}
                            self.run_test("Update Business Variant", "PUT", f"business/variants/{variant_id}", 200, variant_update)
                            
                            # Test delete variant
                            self.run_test("Delete Business Variant", "DELETE", f"business/variants/{variant_id}", 200)
                        
                        # Test delete item (should be last)
                        self.run_test("Delete Business Item", "DELETE", f"business/items/{item_id}", 200)
            
            # Restore original token
            self.token = original_token

    def test_business_features(self):
        """Test business-related endpoints"""
        if not self.token:
            return
            
        print("\n🔍 Testing Business Features...")
        
        # Get businesses
        self.run_test("Get Businesses", "GET", "businesses", 200)
        
        # Try to get analytics (may fail if not business owner)
        self.run_test("Get Analytics Overview", "GET", "analytics/overview", 403)  # Expected to fail for customer

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting FeedbackVault API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Basic health checks
        self.test_health_check()
        
        # Seed data
        self.test_seed_data()
        
        # Test categories
        category_id = self.test_categories()
        
        # Test authentication
        auth_success = self.test_auth_flow()
        
        # Test items
        item_id = self.test_items(category_id)
        
        # Test variants
        variant_id = self.test_variants(item_id)
        
        # Test reviews
        self.test_reviews(variant_id)
        
        # Test business features
        self.test_business_features()
        
        # Test AI insights
        self.test_ai_insights()
        
        # Test business item management
        self.test_business_item_management()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("❌ Some tests failed. Check the details above.")
            return 1
        else:
            print("🎉 All tests passed!")
            return 0

def main():
    tester = FeedbackVaultAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())