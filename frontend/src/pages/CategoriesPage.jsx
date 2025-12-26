import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { categoryAPI } from '@/lib/api';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group categories by parent
  const rootCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId) => categories.filter((c) => c.parent_id === parentId);

  const categoryImages = {
    'Restaurants': 'https://images.pexels.com/photos/11065504/pexels-photo-11065504.jpeg',
    'Electronics': 'https://images.pexels.com/photos/3496992/pexels-photo-3496992.jpeg',
    'Hotels': 'https://images.pexels.com/photos/3434997/pexels-photo-3434997.jpeg',
    'Indian Cuisine': 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg',
    'Italian Cuisine': 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-8" data-testid="categories-page">
      <div className="container-wide">
        <div className="mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight"
            style={{ fontFamily: 'Chivo, sans-serif' }}
          >
            All Categories
          </h1>
          <p className="text-zinc-600 mt-1">
            Explore feedback by category and subcategory
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl skeleton" />
            ))}
          </div>
        ) : rootCategories.length > 0 ? (
          <div className="space-y-12">
            {rootCategories.map((category, index) => {
              const children = getChildren(category.id);
              
              return (
                <div key={category.id} className={`animate-fade-in stagger-${index + 1}`}>
                  {/* Parent Category */}
                  <Link
                    to={`/browse?category=${category.id}`}
                    className="category-card h-48 md:h-64 block mb-4"
                    data-testid={`category-${category.id}`}
                  >
                    <img
                      src={category.image_url || categoryImages[category.name] || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="category-card-content">
                      <h2 className="text-2xl md:text-3xl font-bold mb-1">{category.name}</h2>
                      <p className="text-sm text-zinc-300">{category.description || 'Explore items'}</p>
                    </div>
                  </Link>

                  {/* Subcategories */}
                  {children.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          to={`/browse?category=${child.id}`}
                          className="group bg-white border border-zinc-100 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                          data-testid={`subcategory-${child.id}`}
                        >
                          {child.image_url || categoryImages[child.name] ? (
                            <div className="w-full aspect-square rounded-lg overflow-hidden mb-3">
                              <img
                                src={child.image_url || categoryImages[child.name]}
                                alt={child.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-square rounded-lg bg-zinc-100 flex items-center justify-center mb-3">
                              <Star className="w-8 h-8 text-zinc-300" />
                            </div>
                          )}
                          <h3 className="font-medium text-zinc-900 text-sm truncate group-hover:text-indigo-600">
                            {child.name}
                          </h3>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">No categories yet</h3>
            <p className="text-zinc-500">Categories will appear here once they're added.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
