import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StarRating = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className 
}) => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)} data-testid="star-rating">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        const isHalf = !isFilled && starValue - 0.5 <= rating;
        
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(starValue)}
            className={cn(
              'relative transition-transform',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            disabled={!interactive}
            data-testid={`star-${starValue}`}
          >
            <Star
              className={cn(
                sizes[size],
                isFilled ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200',
                isHalf && 'fill-amber-400/50 text-amber-400'
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-zinc-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export const RatingDisplay = ({ rating, reviewCount, size = 'md' }) => {
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-emerald-600';
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-2" data-testid="rating-display">
      <StarRating rating={rating} size={size} />
      <span className={cn('font-bold', getRatingColor(rating))}>
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-sm text-zinc-500">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export default StarRating;
