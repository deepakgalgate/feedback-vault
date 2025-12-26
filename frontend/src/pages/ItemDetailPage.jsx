import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { itemAPI, variantAPI, reviewAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RatingDisplay, StarRating } from '@/components/common/StarRating';
import { DimensionalRating } from '@/components/common/DimensionalRating';
import { TagSelector, TagDisplay } from '@/components/common/TagSelector';
import { ReviewCard } from '@/components/common/ReviewCard';
import { AIInsights } from '@/components/common/AIInsights';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [variants, setVariants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewDimensions, setReviewDimensions] = useState({});
  const [reviewTags, setReviewTags] = useState([]);
  const [shortReview, setShortReview] = useState('');
  const [fullReview, setFullReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItemData();
  }, [itemId]);

  const loadItemData = async () => {
    setLoading(true);
    try {
      const [itemRes, variantsRes, reviewsRes] = await Promise.all([
        itemAPI.getById(itemId),
        variantAPI.getByItem(itemId),
        reviewAPI.getAll({ item_id: itemId, limit: 20 }),
      ]);
      
      setItem(itemRes.data);
      setVariants(variantsRes.data);
      setReviews(reviewsRes.data);
      
      if (variantsRes.data.length > 0) {
        setSelectedVariant(variantsRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to load item:', error);
      toast.error('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!selectedVariant) {
      toast.error('Please select a variant to review');
      return;
    }
    
    if (reviewRating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      await reviewAPI.create({
        variant_id: selectedVariant.id,
        overall_rating: reviewRating,
        dimensional_ratings: reviewDimensions,
        tags: reviewTags,
        short_review: shortReview,
        full_review: fullReview,
      });
      
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      
      // Reset form
      setReviewRating(0);
      setReviewDimensions({});
      setReviewTags([]);
      setShortReview('');
      setFullReview('');
      
      // Reload data
      loadItemData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 py-8">
        <div className="container-wide">
          <div className="h-64 skeleton rounded-xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 skeleton rounded-xl" />
            <div className="h-64 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-zinc-50 py-8">
        <div className="container-wide text-center py-16">
          <Star className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Item not found</h2>
          <Button onClick={() => navigate('/browse')}>Browse Items</Button>
        </div>
      </div>
    );
  }

  const dimensionFields = ['taste', 'portion', 'freshness', 'value', 'consistency'];
  const tagOptions = ['fresh', 'authentic', 'spicy', 'worth-price', 'would-recommend', 'great-service', 'consistent'];

  return (
    <div className="min-h-screen bg-zinc-50 py-8" data-testid="item-detail-page">
      <div className="container-wide">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link to="/browse" className="hover:text-zinc-900">Browse</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-zinc-900">{item.name}</span>
        </nav>

        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Item Header */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full md:w-48 h-48 rounded-xl object-cover"
              />
            ) : (
              <div className="w-full md:w-48 h-48 rounded-xl bg-zinc-100 flex items-center justify-center">
                <Star className="w-16 h-16 text-zinc-300" />
              </div>
            )}
            <div className="flex-1">
              <h1 
                className="text-3xl font-bold text-zinc-900 mb-2"
                style={{ fontFamily: 'Chivo, sans-serif' }}
                data-testid="item-name"
              >
                {item.name}
              </h1>
              {item.description && (
                <p className="text-zinc-600 mb-4">{item.description}</p>
              )}
              <div className="mb-4">
                <RatingDisplay 
                  rating={item.avg_rating || 0} 
                  reviewCount={item.review_count || 0}
                  size="lg"
                />
              </div>
              {item.tags?.length > 0 && (
                <TagDisplay tags={item.tags} />
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={!isAuthenticated}
                    data-testid="write-review-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Write a Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Variant Selection */}
                    {variants.length > 0 && (
                      <div className="space-y-2">
                        <Label>Select Variant</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {variants.map((variant) => (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => setSelectedVariant(variant)}
                              className={`p-3 text-left border rounded-lg transition-colors ${
                                selectedVariant?.id === variant.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-zinc-200 hover:border-zinc-300'
                              }`}
                            >
                              <p className="font-medium text-sm">{variant.name}</p>
                              {variant.avg_rating > 0 && (
                                <p className="text-xs text-zinc-500">{variant.avg_rating.toFixed(1)} avg</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overall Rating */}
                    <div className="space-y-2">
                      <Label>Overall Rating *</Label>
                      <StarRating 
                        rating={reviewRating} 
                        size="xl" 
                        interactive 
                        onChange={setReviewRating}
                      />
                    </div>

                    {/* Dimensional Ratings */}
                    <div className="space-y-2">
                      <Label>Detailed Ratings (Optional)</Label>
                      <DimensionalRating
                        dimensions={reviewDimensions}
                        interactive
                        onChange={setReviewDimensions}
                      />
                      <div className="flex flex-wrap gap-2">
                        {dimensionFields.map((field) => (
                          <button
                            key={field}
                            type="button"
                            onClick={() => {
                              if (reviewDimensions[field]) {
                                const { [field]: _, ...rest } = reviewDimensions;
                                setReviewDimensions(rest);
                              } else {
                                setReviewDimensions({ ...reviewDimensions, [field]: 3 });
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              reviewDimensions[field]
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label>Tags (Optional)</Label>
                      <TagSelector
                        tags={tagOptions}
                        selectedTags={reviewTags}
                        onChange={setReviewTags}
                      />
                    </div>

                    {/* Short Review */}
                    <div className="space-y-2">
                      <Label htmlFor="shortReview">Quick Summary (Optional)</Label>
                      <Input
                        id="shortReview"
                        placeholder="One-line takeaway..."
                        value={shortReview}
                        onChange={(e) => setShortReview(e.target.value)}
                        maxLength={160}
                      />
                      <p className="text-xs text-zinc-500">{shortReview.length}/160</p>
                    </div>

                    {/* Full Review */}
                    <div className="space-y-2">
                      <Label htmlFor="fullReview">Full Review (Optional)</Label>
                      <Textarea
                        id="fullReview"
                        placeholder="Share your detailed experience..."
                        value={fullReview}
                        onChange={(e) => setFullReview(e.target.value)}
                        maxLength={500}
                        rows={4}
                      />
                      <p className="text-xs text-zinc-500">{fullReview.length}/500</p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={submitting || reviewRating === 0}
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              {!isAuthenticated && (
                <p className="text-xs text-zinc-500 text-center">
                  <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link> to write a review
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Variants Section */}
            {variants.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Available Variants
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`variant-card ${selectedVariant?.id === variant.id ? 'selected' : ''} ${index === 0 ? 'popular' : ''}`}
                      data-testid={`variant-${variant.id}`}
                    >
                      <h3 className="font-semibold text-zinc-900 mb-1">{variant.name}</h3>
                      <div className="mb-2">
                        <RatingDisplay 
                          rating={variant.avg_rating || 0} 
                          reviewCount={variant.review_count || 0}
                          size="sm"
                        />
                      </div>
                      {Object.keys(variant.attributes || {}).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <span key={key} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      {Object.keys(variant.dimensional_ratings || {}).length > 0 && (
                        <div className="mt-3">
                          <DimensionalRating dimensions={variant.dimensional_ratings} compact />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-zinc-900 mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Reviews ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} showVariant />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Insights */}
            {reviews.length > 0 && (
              <AIInsights 
                itemId={itemId} 
                variantId={selectedVariant?.id}
              />
            )}
            {/* Rating Summary */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">Rating Summary</h3>
              <div className="text-center mb-4">
                <div className="text-5xl font-black text-zinc-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  {(item.avg_rating || 0).toFixed(1)}
                </div>
                <StarRating rating={item.avg_rating || 0} size="lg" />
                <p className="text-sm text-zinc-500 mt-1">{item.review_count || 0} reviews</p>
              </div>
            </div>

            {/* Selected Variant Details */}
            {selectedVariant && (
              <div className="bg-white border border-zinc-200 rounded-xl p-6">
                <h3 className="font-semibold text-zinc-900 mb-4">
                  {selectedVariant.name}
                </h3>
                <div className="mb-4">
                  <RatingDisplay 
                    rating={selectedVariant.avg_rating || 0} 
                    reviewCount={selectedVariant.review_count || 0}
                  />
                </div>
                {Object.keys(selectedVariant.dimensional_ratings || {}).length > 0 && (
                  <DimensionalRating dimensions={selectedVariant.dimensional_ratings} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
