import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/common/StarRating';
import { DimensionalRating } from '@/components/common/DimensionalRating';
import { TagDisplay } from '@/components/common/TagSelector';
import { Button } from '@/components/ui/button';
import { reviewAPI } from '@/lib/api';

export const ReviewCard = ({ review, showVariant = false, className }) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);

  const handleMarkHelpful = async () => {
    if (hasMarkedHelpful) return;
    
    try {
      await reviewAPI.markHelpful(review.id);
      setHelpfulCount((prev) => prev + 1);
      setHasMarkedHelpful(true);
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const createdAt = new Date(review.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <div className={cn('review-card', className)} data-testid="review-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-semibold">
              {review.user_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900">{review.user_name}</span>
              {review.verified && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <span className="text-sm text-zinc-500">{timeAgo}</span>
          </div>
        </div>
        <StarRating rating={review.overall_rating} size="sm" />
      </div>

      {/* Dimensional Ratings */}
      {Object.keys(review.dimensional_ratings || {}).length > 0 && (
        <div className="mb-3">
          <DimensionalRating 
            dimensions={review.dimensional_ratings} 
            compact 
          />
        </div>
      )}

      {/* Tags */}
      {review.tags?.length > 0 && (
        <div className="mb-3">
          <TagDisplay tags={review.tags} />
        </div>
      )}

      {/* Review Text */}
      {review.short_review && (
        <p className="text-zinc-700 font-medium mb-2">
          "{review.short_review}"
        </p>
      )}
      {review.full_review && (
        <p className="text-zinc-600 text-sm leading-relaxed">
          {review.full_review}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkHelpful}
          disabled={hasMarkedHelpful}
          className={cn(
            'text-zinc-500 hover:text-zinc-700',
            hasMarkedHelpful && 'text-indigo-600'
          )}
          data-testid="helpful-button"
        >
          <ThumbsUp className={cn('w-4 h-4 mr-1', hasMarkedHelpful && 'fill-current')} />
          Helpful ({helpfulCount})
        </Button>
        
        {showVariant && review.variant_name && (
          <span className="text-xs text-zinc-500">
            Variant: {review.variant_name}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
