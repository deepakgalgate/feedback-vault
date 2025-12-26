# FeedbackVault - Granular Customer Feedback Platform

## Original Problem Statement
Build FeedbackVault: A unified feedback platform that captures authentic, granular customer insights at the product/service variant level, enabling customers to discover recommendations tailored to their preferences while empowering businesses with actionable intelligence for product optimization.

## Architecture & Tech Stack
- **Frontend**: React 19 with TailwindCSS, Shadcn/UI components, Recharts for analytics
- **Backend**: FastAPI (Python) with async MongoDB (Motor)
- **Database**: MongoDB
- **Authentication**: JWT-based auth with bcrypt password hashing
- **AI Integration**: OpenAI GPT via emergentintegrations library for review summarization

## Completed Features (MVP + Phase 2)

### Consumer Features
- [x] Homepage with hero section, search, category cards, trending items
- [x] User registration (customer & business owner types)
- [x] User login with JWT authentication
- [x] Browse page with filters (category, rating, search)
- [x] Categories page with hierarchical display
- [x] Item detail page with variant comparison
- [x] Review submission with dimensional ratings, tags, and narrative
- [x] Profile page with review history
- [x] Star rating display and interactive rating input
- [x] **AI-Powered Insights** - Auto-generated summaries from reviews

### AI Features (Phase 2)
- [x] AI-powered review summaries using OpenAI GPT
- [x] Sentiment score calculation (percentage)
- [x] Key strengths extraction from reviews
- [x] Areas for improvement identification
- [x] Popular tags frequency analysis
- [x] Actionable insights like "87% of reviewers love the taste"

### Business Features
- [x] Business owner account type
- [x] Business dashboard with analytics overview
- [x] Dimensional breakdown (radar chart)
- [x] Tag frequency analysis (bar chart)
- [x] Top performing items list
- [x] Recent reviews feed
- [x] **Item Management** - Add, edit, delete items
- [x] **Variant Management** - Add, delete variants with attributes

### Backend API
- [x] Auth endpoints: register, login, me
- [x] Categories: CRUD with hierarchical structure
- [x] Items: CRUD with search and filtering
- [x] Variants: CRUD with attributes
- [x] Reviews: Create, list, mark helpful
- [x] Analytics: Overview and item-level analytics
- [x] **AI Insights**: /api/ai/insights/{item_id} and /api/ai/insights/variant/{variant_id}
- [x] **Business Management**: /api/business/items, /api/business/variants
- [x] Seed data endpoint

## Design System
- **Theme**: Swiss High-Contrast (White/Black/Indigo)
- **Fonts**: Chivo (headings), Manrope (body), JetBrains Mono (code)
- **Components**: Shadcn/UI base with custom rating, tag, review, and AI insights components

## Next Action Items

### Phase 3 - Enhanced Discovery
- [ ] Advanced search with autocomplete
- [ ] Location-based filtering
- [ ] Price tracking for variants
- [ ] Social features (follow reviewers, upvote)
- [ ] Review response functionality for businesses

### Phase 4 - Rich Media & Marketplace
- [ ] Photo/video attachments for reviews
- [ ] AR integration for portion visualization
- [ ] Direct purchasing integration
- [ ] Subscription alerts for favorites
- [ ] Export analytics data

## Environment Variables
```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=feedbackvault-super-secret-jwt-key-2025
EMERGENT_LLM_KEY=sk-emergent-xxx

# Frontend (.env)
REACT_APP_BACKEND_URL=https://xxx.preview.emergentagent.com
```

## GitHub Repository
Target: https://github.com/deepakgalgate/rate-me-app

### To Push to GitHub:
1. Use Emergent's built-in "Save to GitHub" button
2. Connect your GitHub account if not already connected
3. Select your repository and push
