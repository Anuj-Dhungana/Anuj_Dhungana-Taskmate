/* ── Shared colours & helpers for all analytics charts ── */

export const CHART_COLORS = {
  indigo: '#6366F1',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  sky: '#0EA5E9',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  slate: '#64748B',
  pink: '#EC4899',
  teal: '#14B8A6',
};

export const STATUS_COLORS = {
  'To Do': CHART_COLORS.blue,
  'In Progress': CHART_COLORS.amber,
  Done: CHART_COLORS.emerald,
};

export const PRIORITY_COLORS = {
  High: CHART_COLORS.rose,
  Medium: CHART_COLORS.amber,
  Low: CHART_COLORS.blue,
};

export const PIE_COLORS = [
  CHART_COLORS.indigo,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.rose,
  CHART_COLORS.sky,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.pink,
];

/* Severity helpers for stuck-task badges */
export const stuckSeverity = (days) => {
  if (days >= 10) return { label: 'Critical', bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-200' };
  if (days >= 5) return { label: 'Warning', bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' };
  return { label: 'Watch', bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-200' };
};

/* Compact number formatter */
export const fmt = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
