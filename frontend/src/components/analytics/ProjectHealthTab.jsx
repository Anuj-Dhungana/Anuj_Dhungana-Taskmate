import { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import ChartCard from './ChartCard';
import { CHART_COLORS, STATUS_COLORS, stuckSeverity } from './analyticsHelpers';

/* ─── Velocity / Throughput ─── */
function VelocityChart({ data, loading }) {
  return (
    <ChartCard
      title="Velocity / Throughput"
      subtitle="Tasks completed per week"
      loading={loading}
      empty={!data?.length}
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Bar dataKey="completed" fill={CHART_COLORS.indigo} radius={[6, 6, 0, 0]} name="Completed" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-gray-400 mt-2">Based on task updatedAt timestamps</p>
    </ChartCard>
  );
}

/* ─── Cumulative Flow ─── */
function CumulativeFlowChart({ data, loading }) {
  return (
    <ChartCard
      title="Cumulative Flow"
      subtitle="Task distribution over time"
      loading={loading}
      empty={!data?.length}
    >
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Legend iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="Done" stackId="1" fill={STATUS_COLORS.Done} stroke={STATUS_COLORS.Done} fillOpacity={0.7} />
          <Area type="monotone" dataKey="In Progress" stackId="1" fill={STATUS_COLORS['In Progress']} stroke={STATUS_COLORS['In Progress']} fillOpacity={0.7} />
          <Area type="monotone" dataKey="To Do" stackId="1" fill={STATUS_COLORS['To Do']} stroke={STATUS_COLORS['To Do']} fillOpacity={0.7} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-gray-400 mt-2">
        Thick &quot;In Progress&quot; band may indicate a bottleneck
      </p>
    </ChartCard>
  );
}

/* ─── Project Progress Comparison ─── */
function ProjectProgressChart({ data, loading }) {
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filtered = showActiveOnly
    ? (data || []).filter((p) => (p.status || '').toLowerCase() !== 'completed')
    : data || [];

  const sorted = [...filtered].sort((a, b) => a.progress - b.progress);

  return (
    <ChartCard
      title="Project Progress Comparison"
      subtitle="Sorted by lowest progress"
      loading={loading}
      empty={!sorted.length}
      action={
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={() => setShowActiveOnly(!showActiveOnly)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
          />
          Active only
        </label>
      }
    >
      <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 36)}>
        <BarChart data={sorted} layout="vertical" barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <YAxis
            dataKey="name"
            type="category"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v) => `${v}%`}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Bar dataKey="progress" fill={CHART_COLORS.indigo} radius={[0, 6, 6, 0]} name="Progress" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ─── Stuck Tasks Table ─── */
function StuckTasksTable({ data, loading, onTaskClick }) {
  return (
    <ChartCard
      title="Stuck Tasks"
      subtitle="Tasks in progress for 3+ days"
      loading={loading}
      empty={!data?.length}
      emptyText="No stuck tasks — great job!"
    >
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Task</th>
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 font-medium">Assignee</th>
              <th className="pb-2 font-medium">Days Stuck</th>
              <th className="pb-2 font-medium">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((t) => {
              const sev = stuckSeverity(t.daysStuck);
              return (
                <tr
                  key={t._id}
                  onClick={() => onTaskClick?.(t)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 pr-3 font-medium text-gray-900 max-w-50 truncate">
                    {t.title}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-500">{t.project}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex -space-x-1">
                      {(t.assignees || []).slice(0, 3).map((a, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-indigo-600"
                          title={a.fullname}
                        >
                          {a.avatar ? (
                            <img src={a.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                          ) : (
                            (a.fullname || '?')[0]
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${sev.bg} ${sev.text} ${sev.ring}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {t.daysStuck}d
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">
                    {new Date(t.lastUpdated).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

/* ─── Tab 1 Composed ─── */
export default function ProjectHealthTab({ data, loading, onTaskClick }) {
  const ph = data?.projectHealth;

  return (
    <div className="space-y-6">
      {/* Row 1: velocity + cumulative flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VelocityChart data={ph?.velocity} loading={loading} />
        <CumulativeFlowChart data={ph?.cumulativeFlow} loading={loading} />
      </div>

      {/* Row 2: project progress comparison */}
      <ProjectProgressChart data={ph?.projectProgress} loading={loading} />

      {/* Row 3: stuck tasks table */}
      <StuckTasksTable data={ph?.stuckTasks} loading={loading} onTaskClick={onTaskClick} />
    </div>
  );
}
