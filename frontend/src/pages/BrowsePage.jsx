import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { itemAPI, categoryAPI } from '@/lib/api';
import { RatingDisplay } from '@/components/common/StarRating';

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minRating, setMinRating] = useState(searchParams.get('rating') || '');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = {};
      const q = searchParams.get('q');
      const category = searchParams.get('category');
      const rating = searchParams.get('rating');

      if (category) params.category_id = category;
      if (rating) params.min_rating = parseFloat(rating);
      if (q) {
        const response = await itemAPI.search(q, params);
        setItems(response.data.items || []);
      } else {
        const response = await itemAPI.getAll(params);
        setItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('q', searchQuery);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set('category', value);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleRatingChange = (value) => {
    setMinRating(value);
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set('rating', value);
    } else {
      newParams.delete('rating');
    }
    setSearchParams(newParams);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
    if (sortBy === 'reviews') return (b.review_count || 0) - (a.review_count || 0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="min-h-screen bg-zinc-50 py-8" data-testid="browse-page">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight"
            style={{ fontFamily: 'Chivo, sans-serif' }}
          >
            {searchParams.get('q') ? `Results for "${searchParams.get('q')}"` : 'Browse All Items'}
          </h1>
          <p className="text-zinc-600 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} found
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="browse-search"
                />
              </div>
            </form>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-48" data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rating Filter */}
            <Select value={minRating} onValueChange={handleRatingChange}>
              <SelectTrigger className="w-full md:w-40" data-testid="rating-filter">
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Rating</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviewed</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl skeleton" />
            ))}
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item, index) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className={`group bg-white border border-zinc-100 rounded-xl p-5 card-hover animate-fade-in stagger-${(index % 5) + 1}`}
                data-testid={`browse-item-${item.id}`}
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
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">No items found</h3>
            <p className="text-zinc-500 mb-6">Try adjusting your filters or search query</p>
            <Button onClick={() => setSearchParams({})} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;
