import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(number) {
  return new Intl.NumberFormat('en-US').format(number);
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getRatingColor(rating) {
  if (rating >= 4.5) return 'text-emerald-600';
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-amber-600';
  if (rating >= 2) return 'text-orange-600';
  return 'text-red-600';
}

export function getRatingLabel(rating) {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4) return 'Very Good';
  if (rating >= 3) return 'Good';
  if (rating >= 2) return 'Fair';
  return 'Poor';
}
