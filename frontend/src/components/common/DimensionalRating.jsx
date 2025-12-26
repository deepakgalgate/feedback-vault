import { cn } from '@/lib/utils';

export const DimensionalRating = ({ 
  dimensions = {}, 
  maxRating = 5,
  interactive = false,
  onChange,
  compact = false,
  className 
}) => {
  const getRatingColor = (value) => {
    const percentage = (value / maxRating) * 100;
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-green-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleChange = (dimension, value) => {
    if (interactive && onChange) {
      onChange({ ...dimensions, [dimension]: value });
    }
  };

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)} data-testid="dimensional-rating-compact">
        {Object.entries(dimensions).map(([key, value]) => (
          <div 
            key={key}
            className="dimension-pill"
            data-testid={`dimension-${key}`}
          >
            <span className="text-zinc-600">{formatLabel(key)}</span>
            <span className={cn(
              'font-semibold',
              value >= 4 ? 'text-emerald-600' : value >= 3 ? 'text-amber-600' : 'text-red-600'
            )}>
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="dimensional-rating">
      {Object.entries(dimensions).map(([key, value]) => (
        <div key={key} className="space-y-1" data-testid={`dimension-${key}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">{formatLabel(key)}</span>
            <span className="text-sm font-bold text-zinc-900">
              {typeof value === 'number' ? value.toFixed(1) : value}/{maxRating}
            </span>
          </div>
          <div className="rating-bar">
            <div 
              className={cn('rating-bar-fill', getRatingColor(value))}
              style={{ width: `${(value / maxRating) * 100}%` }}
            />
          </div>
          {interactive && (
            <div className="flex gap-1 mt-1">
              {Array.from({ length: maxRating }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChange(key, i + 1)}
                  className={cn(
                    'w-8 h-8 rounded-md text-sm font-medium transition-colors',
                    value === i + 1 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DimensionalRating;
