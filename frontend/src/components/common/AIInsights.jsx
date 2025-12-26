import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Lightbulb, ThumbsUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiAPI } from '@/lib/api';
import { Progress } from '@/components/ui/progress';

export const AIInsights = ({ itemId, variantId, className }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInsights();
  }, [itemId, variantId]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = variantId 
        ? await aiAPI.getVariantInsights(variantId)
        : await aiAPI.getItemInsights(itemId);
      setInsights(response.data);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      setError('Unable to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          <span className="font-semibold text-indigo-900">AI Insights</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className={cn('bg-zinc-50 border border-zinc-200 rounded-xl p-6', className)}>
        <div className="flex items-center gap-2 text-zinc-500">
          <AlertCircle className="w-5 h-5" />
          <span>Insights unavailable</span>
        </div>
      </div>
    );
  }

  const getSentimentColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getSentimentBg = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6', className)} data-testid="ai-insights">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-indigo-900">AI-Powered Insights</h3>
          <p className="text-xs text-indigo-600">Generated from customer reviews</p>
        </div>
      </div>

      {/* Summary */}
      {insights.summary && (
        <p className="text-sm text-zinc-700 mb-4 leading-relaxed">
          {insights.summary}
        </p>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-1">Sentiment Score</div>
          <div className="flex items-center gap-2">
            <span className={cn('text-2xl font-bold', getSentimentColor(insights.sentiment_score))}>
              {insights.sentiment_score}%
            </span>
            {insights.sentiment_score >= 70 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <Progress value={insights.sentiment_score} className="h-1.5 mt-2" />
        </div>
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-1">Would Recommend</div>
          <div className="flex items-center gap-2">
            <span className={cn('text-2xl font-bold', getSentimentColor(insights.recommendation_percentage))}>
              {insights.recommendation_percentage}%
            </span>
            <ThumbsUp className="w-4 h-4 text-indigo-500" />
          </div>
          <Progress value={insights.recommendation_percentage} className="h-1.5 mt-2" />
        </div>
      </div>

      {/* Key Insights */}
      {insights.insights && insights.insights.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-700">Key Insights</span>
          </div>
          <ul className="space-y-1.5">
            {insights.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-zinc-600">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-4">
        {insights.key_strengths && insights.key_strengths.length > 0 && (
          <div>
            <div className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Strengths
            </div>
            <div className="flex flex-wrap gap-1">
              {insights.key_strengths.map((strength, index) => (
                <span key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {strength}
                </span>
              ))}
            </div>
          </div>
        )}
        {insights.areas_for_improvement && insights.areas_for_improvement.length > 0 && (
          <div>
            <div className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              To Improve
            </div>
            <div className="flex flex-wrap gap-1">
              {insights.areas_for_improvement.map((area, index) => (
                <span key={index} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popular Tags */}
      {insights.popular_tags && Object.keys(insights.popular_tags).length > 0 && (
        <div className="mt-4 pt-4 border-t border-indigo-100">
          <div className="text-xs font-medium text-zinc-500 mb-2">Most Mentioned</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(insights.popular_tags).slice(0, 6).map(([tag, count]) => (
              <span key={tag} className="text-xs bg-white text-zinc-600 px-2 py-1 rounded-lg border border-zinc-200">
                {tag.replace(/-/g, ' ')} <span className="text-indigo-600 font-medium">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
