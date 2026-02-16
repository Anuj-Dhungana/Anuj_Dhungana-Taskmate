import {
  TrendingUp,
  Zap,
  AlertTriangle,
  FolderKanban,
  MessageSquare,
} from 'lucide-react';
import { fmt } from './analyticsHelpers';

const kpiConfig = [
  {
    key: 'completionRate',
    label: 'Completion Rate',
    icon: TrendingUp,
    color: 'text-indigo-600 bg-indigo-50',
    format: (kpi) => `${kpi.completionRate}%`,
    sub: (kpi) => `${kpi.completedCards} / ${kpi.totalCards}`,
    scrollTo: 'projectHealth',
  },
  {
    key: 'throughput',
    label: 'Throughput (Weekly)',
    icon: Zap,
    color: 'text-emerald-600 bg-emerald-50',
    format: (kpi) => `${kpi.throughputWeekly}`,
    sub: () => 'tasks / week',
    scrollTo: 'projectHealth',
  },
  {
    key: 'overdue',
    label: 'Overdue Tasks',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50',
    format: (kpi) => fmt(kpi.overdueTasks),
    sub: () => 'need attention',
    scrollTo: 'projectHealth',
  },
  {
    key: 'projects',
    label: 'Active Projects',
    icon: FolderKanban,
    color: 'text-blue-600 bg-blue-50',
    format: (kpi) => fmt(kpi.activeProjects),
    sub: () => 'in progress',
    scrollTo: 'projectHealth',
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    color: 'text-purple-600 bg-purple-50',
    format: (kpi) => fmt(kpi.totalMessages),
    sub: () => 'in this period',
    scrollTo: 'communication',
  },
];

export default function KPIStrip({ kpi, loading, onScrollTo }) {
  if (loading || !kpi) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpiConfig.map((cfg) => {
        const Icon = cfg.icon;
        return (
          <button
            key={cfg.key}
            onClick={() => onScrollTo?.(cfg.scrollTo)}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left
                       hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`p-1.5 rounded-lg ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-xs font-medium text-gray-500 truncate">
                {cfg.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{cfg.format(kpi)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{cfg.sub(kpi)}</p>
          </button>
        );
      })}
    </div>
  );
}
