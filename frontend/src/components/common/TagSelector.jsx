import { cn } from '@/lib/utils';

const DEFAULT_TAGS = [
  'fresh',
  'authentic',
  'spicy',
  'worth-price',
  'would-recommend',
  'great-service',
  'consistent',
  'premium-quality',
];

export const TagSelector = ({ 
  tags = DEFAULT_TAGS,
  selectedTags = [],
  onChange,
  interactive = true,
  className 
}) => {
  const handleTagClick = (tag) => {
    if (!interactive || !onChange) return;
    
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const formatTag = (tag) => {
    return tag
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)} data-testid="tag-selector">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            disabled={!interactive}
            className={cn(
              'tag-pill',
              isSelected && 'selected',
              !interactive && 'cursor-default'
            )}
            data-testid={`tag-${tag}`}
          >
            {formatTag(tag)}
          </button>
        );
      })}
    </div>
  );
};

export const TagDisplay = ({ tags = [], className }) => {
  const formatTag = (tag) => {
    return tag
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!tags.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)} data-testid="tag-display">
      {tags.map((tag) => (
        <span key={tag} className="tag-pill">
          {formatTag(tag)}
        </span>
      ))}
    </div>
  );
};

export default TagSelector;
