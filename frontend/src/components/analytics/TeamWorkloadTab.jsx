import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Trophy, TrendingUp, User } from 'lucide-react';
import ChartCard from './ChartCard';
import { CHART_COLORS } from './analyticsHelpers';

/* ─── Member Workload (stacked bar) ─── */
function MemberWorkloadChart({ data, loading }) {
  const sorted = [...(data || [])].sort((a, b) => (b.todo + b.inProgress + b.overdue) - (a.todo + a.inProgress + a.overdue));

  return (
    <ChartCard
      title="Member Workload"
      subtitle="Task distribution per member"
      loading={loading}
      empty={!sorted.length}
    >
      <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 40)}>
        <BarChart data={sorted} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="fullname"
            type="category"
            width={100}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Legend iconType="circle" iconSize={8} />
          <Bar dataKey="todo" stackId="a" fill={CHART_COLORS.blue} name="To Do" radius={[0, 0, 0, 0]} />
          <Bar dataKey="inProgress" stackId="a" fill={CHART_COLORS.amber} name="In Progress" />
          <Bar dataKey="overdue" stackId="a" fill={CHART_COLORS.rose} name="Overdue" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Overloaded badges */}
      {sorted.some((m) => m.overloaded) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {sorted
            .filter((m) => m.overloaded)
            .map((m) => (
              <span
                key={m._id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200"
              >
                <AlertTriangle className="w-3 h-3" />
                {m.fullname} — Overloaded
              </span>
            ))}
        </div>
      )}
    </ChartCard>
  );
}

/* ─── Completed Tasks Per Member ─── */
function CompletedPerMemberChart({ data, loading }) {
  const sorted = [...(data || [])].sort((a, b) => b.completed - a.completed);

  return (
    <ChartCard
      title="Completed Tasks Per Member"
      subtitle="All time"
      loading={loading}
      empty={!sorted.length}
    >
      <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 40)}>
        <BarChart data={sorted} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="fullname"
            type="category"
            width={100}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Bar dataKey="completed" fill={CHART_COLORS.emerald} radius={[0, 6, 6, 0]} name="Completed" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ─── Workload Balance Insights ─── */
function WorkloadInsights({ insights, loading }) {
  if (loading || !insights) {
    return (
      <ChartCard title="Workload Balance" loading={loading}>
        <div />
      </ChartCard>
    );
  }

  const cards = [
    {
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50',
      label: 'Most Loaded',
      name: insights.mostLoaded?.name,
      value: insights.mostLoaded?.count,
      unit: 'active tasks',
    },
    {
      icon: TrendingUp,
      color: 'text-red-600 bg-red-50',
      label: 'Most Overdue',
      name: insights.mostOverdue?.name,
      value: insights.mostOverdue?.count,
      unit: 'overdue',
    },
    {
      icon: Trophy,
      color: 'text-emerald-600 bg-emerald-50',
      label: 'Best Throughput',
      name: insights.bestThroughput?.name,
      value: insights.bestThroughput?.count,
      unit: 'completed',
    },
  ];

  return (
    <ChartCard title="Workload Balance Insights" subtitle="Quick overview of team distribution">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`p-1.5 rounded-lg ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-xs font-medium text-gray-500">{c.label}</span>
              </div>
              {c.name ? (
                <>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.value} {c.unit}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400">—</p>
              )}
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

/* ─── Tab 3 Composed ─── */
export default function TeamWorkloadTab({ data, loading }) {
  const tw = data?.teamWorkload;

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberWorkloadChart data={tw?.memberWorkload} loading={loading} />
        <CompletedPerMemberChart data={tw?.memberCompleted} loading={loading} />
      </div>

      {/* Row 2 — insights */}
      <WorkloadInsights insights={tw?.insights} loading={loading} />
    </div>
  );
}
