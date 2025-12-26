import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryAPI, itemAPI, seedData } from '@/lib/api';
import { RatingDisplay } from '@/components/common/StarRating';

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Seed data first if needed
      await seedData().catch(() => {});
      
      const [categoriesRes, itemsRes] = await Promise.all([
        categoryAPI.getRoot(),
        itemAPI.getAll({ limit: 6 }),
      ]);
      
      setCategories(categoriesRes.data);
      setTrendingItems(itemsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categoryImages = {
    'Restaurants': 'https://images.pexels.com/photos/11065504/pexels-photo-11065504.jpeg',
    'Electronics': 'https://images.pexels.com/photos/3496992/pexels-photo-3496992.jpeg',
    'Hotels': 'https://images.pexels.com/photos/3434997/pexels-photo-3434997.jpeg',
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-pattern py-16 md:py-24">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 
              className="text-5xl md:text-7xl tracking-tighter font-black text-zinc-900 mb-6 animate-fade-in"
              style={{ fontFamily: 'Chivo, sans-serif' }}
              data-testid="hero-title"
            >
              Discover What's
              <br />
              <span className="gradient-text">Actually Good</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 mb-8 max-w-xl animate-fade-in stagger-1">
              Granular feedback at the variant level. Find the exact product or service that matches your preferences.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="animate-fade-in stagger-2">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search for dishes, products, services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 text-lg border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                    data-testid="hero-search-input"
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg"
                  className="h-14 px-8 bg-zinc-900 hover:bg-zinc-800 rounded-xl"
                  data-testid="hero-search-button"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 mt-10 animate-fade-in stagger-3">
              <div>
                <div className="text-3xl font-black text-zinc-900" style={{ fontFamily: 'Chivo, sans-serif' }}>10K+</div>
                <div className="text-sm text-zinc-500">Verified Reviews</div>
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-900" style={{ fontFamily: 'Chivo, sans-serif' }}>500+</div>
                <div className="text-sm text-zinc-500">Businesses</div>
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-900" style={{ fontFamily: 'Chivo, sans-serif' }}>50+</div>
                <div className="text-sm text-zinc-500">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-zinc-50">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 
                className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight"
                style={{ fontFamily: 'Chivo, sans-serif' }}
              >
                Browse Categories
              </h2>
              <p className="text-zinc-600 mt-1">Explore feedback by category</p>
            </div>
            <Link 
              to="/categories" 
              className="hidden md:flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-700"
              data-testid="view-all-categories"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl skeleton" />
              ))
            ) : (
              categories.slice(0, 3).map((category, index) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.id}`}
                  className={`category-card h-64 animate-fade-in stagger-${index + 1}`}
                  data-testid={`category-card-${category.name.toLowerCase()}`}
                >
                  <img
                    src={category.image_url || categoryImages[category.name] || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="category-card-content">
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-sm text-zinc-300">{category.description || 'Explore items'}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Trending Items Section */}
      <section className="py-16">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h2 
                className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight"
                style={{ fontFamily: 'Chivo, sans-serif' }}
              >
                Trending Now
              </h2>
            </div>
            <Link 
              to="/browse" 
              className="hidden md:flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-700"
              data-testid="view-all-items"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl skeleton" />
              ))
            ) : trendingItems.length > 0 ? (
              trendingItems.map((item, index) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className={`group bg-white border border-zinc-100 rounded-xl p-5 card-hover animate-fade-in stagger-${(index % 5) + 1}`}
                  data-testid={`item-card-${item.id}`}
                >
                  <div className="flex items-start gap-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-zinc-100 flex items-center justify-center">
                        <Star className="w-8 h-8 text-zinc-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <RatingDisplay 
                          rating={item.avg_rating || 0} 
                          reviewCount={item.review_count || 0}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Star className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500">No items yet. Be the first to add one!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-zinc-900">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4"
              style={{ fontFamily: 'Chivo, sans-serif' }}
            >
              Ready to Share Your Experience?
            </h2>
            <p className="text-zinc-400 mb-8">
              Your feedback helps others make better decisions. Join our community of reviewers today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate('/register')}
                data-testid="cta-signup"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
                onClick={() => navigate('/register?type=business')}
                data-testid="cta-business"
              >
                For Businesses
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
