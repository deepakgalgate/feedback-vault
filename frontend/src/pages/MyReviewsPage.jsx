import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { reviewAPI } from '@/lib/api';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewCard } from '@/components/common/ReviewCard';

const MyReviewsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadReviews();
    }
  }, [isAuthenticated]);

  const loadReviews = async () => {
    try {
      const response = await reviewAPI.getMyReviews();
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16">
        <div className="container-narrow text-center">
          <Star className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">My Reviews</h1>
          <p className="text-zinc-500 mb-6">Log in to see your reviews</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8" data-testid="my-reviews-page">
      <div className="container-narrow">
        <Link to="/profile" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Profile
        </Link>

        <h1 
          className="text-3xl font-bold text-zinc-900 tracking-tight mb-2"
          style={{ fontFamily: 'Chivo, sans-serif' }}
        >
          My Reviews
        </h1>
        <p className="text-zinc-600 mb-8">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} written
        </p>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 skeleton rounded-xl" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} showVariant />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
            <Star className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">No reviews yet</h3>
            <p className="text-zinc-500 mb-6">Start sharing your experiences!</p>
            <Link to="/browse">
              <Button>Browse Items</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviewsPage;
