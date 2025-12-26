import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { analyticsAPI, itemAPI, businessAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MessageSquare, 
  Package,
  Plus,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { RatingDisplay } from '@/components/common/StarRating';
import { formatDistanceToNow } from 'date-fns';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isBusinessOwner } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [items, setItems] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/dashboard');
      return;
    }
    
    loadDashboardData();
  }, [isAuthenticated, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isBusinessOwner && user?.business_id) {
        const [analyticsRes, itemsRes, businessRes] = await Promise.all([
          analyticsAPI.getOverview().catch(() => ({ data: null })),
          itemAPI.getAll({ business_id: user.business_id }),
          businessAPI.getMyBusiness().catch(() => ({ data: null })),
        ]);
        
        setAnalytics(analyticsRes.data);
        setItems(itemsRes.data);
        setBusiness(businessRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 py-8">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 skeleton rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 skeleton rounded-xl" />
            <div className="h-80 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isBusinessOwner) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16" data-testid="dashboard-page">
        <div className="container-narrow text-center">
          <BarChart3 className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Business Dashboard</h1>
          <p className="text-zinc-500 mb-6">
            The dashboard is available for business accounts only.
          </p>
          <Button onClick={() => navigate('/register?type=business')}>
            Create Business Account
          </Button>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16" data-testid="dashboard-page">
        <div className="container-narrow text-center">
          <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">No Business Found</h1>
          <p className="text-zinc-500 mb-6">
            You haven't created a business yet. Create one to start collecting feedback.
          </p>
          <Button onClick={() => navigate('/dashboard/create-business')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Business
          </Button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const dimensionalData = analytics?.dimensional_breakdown
    ? Object.entries(analytics.dimensional_breakdown).map(([key, value]) => ({
        dimension: key.charAt(0).toUpperCase() + key.slice(1),
        value: value,
        fullMark: 5,
      }))
    : [];

  const tagData = analytics?.tag_frequency
    ? Object.entries(analytics.tag_frequency).slice(0, 8).map(([tag, count]) => ({
        tag: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 py-8" data-testid="dashboard-page">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 
              className="text-3xl font-bold text-zinc-900 tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif' }}
            >
              Dashboard
            </h1>
            <p className="text-zinc-600 mt-1">
              Welcome back, {user?.name?.split(' ')[0]}
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => navigate('/dashboard/items')}>
              Manage Items
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">Total Reviews</span>
              <MessageSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="metric-value text-zinc-900">
              {analytics?.total_reviews || 0}
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">Average Rating</span>
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="metric-value text-zinc-900">
                {(analytics?.avg_rating || 0).toFixed(1)}
              </span>
              {analytics?.rating_trend !== 0 && (
                <span className={`metric-trend ${analytics?.rating_trend > 0 ? 'positive' : 'negative'}`}>
                  {analytics?.rating_trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(analytics?.rating_trend || 0).toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">Total Items</span>
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="metric-value text-zinc-900">
              {items.length}
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">Top Performer</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="truncate font-semibold text-zinc-900">
              {analytics?.top_items?.[0]?.name || 'N/A'}
            </div>
            {analytics?.top_items?.[0] && (
              <div className="text-sm text-zinc-500">
                {analytics.top_items[0].rating?.toFixed(1)} ★ · {analytics.top_items[0].reviews} reviews
              </div>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Dimensional Breakdown */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Dimensional Breakdown</h3>
            {dimensionalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={dimensionalData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} />
                  <Radar
                    name="Rating"
                    dataKey="value"
                    stroke="#4F46E5"
                    fill="#4F46E5"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-400">
                No dimensional data yet
              </div>
            )}
          </div>

          {/* Tag Frequency */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Popular Tags</h3>
            {tagData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tagData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="tag" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-400">
                No tag data yet
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900">Top Performing Items</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/items')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {analytics?.top_items?.length > 0 ? (
              <div className="space-y-3">
                {analytics.top_items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-zinc-900">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RatingDisplay rating={item.rating || 0} size="sm" />
                      <span className="text-sm text-zinc-500">{item.reviews} reviews</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                No items yet. Add your first item!
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900">Recent Reviews</h3>
            </div>
            {analytics?.recent_reviews?.length > 0 ? (
              <div className="space-y-3">
                {analytics.recent_reviews.map((review, index) => (
                  <div key={index} className="p-3 bg-zinc-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-zinc-900">{review.user}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{review.rating}</span>
                      </div>
                    </div>
                    {review.review && (
                      <p className="text-sm text-zinc-600 line-clamp-2">{review.review}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-1">
                      {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                No reviews yet. Share your items to get feedback!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
