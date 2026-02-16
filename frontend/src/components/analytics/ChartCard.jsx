import { Loader2 } from 'lucide-react';

/**
 * Reusable wrapper for every chart / data card in Analytics.
 * Consistent styling: title, subtitle, optional right action, loading & empty states.
 */
export default function ChartCard({
  title,
  subtitle,
  action,
  loading,
  empty,
  emptyText = 'No data in this date range',
  className = '',
  children,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 ml-3">{action}</div>}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pb-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : empty ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
