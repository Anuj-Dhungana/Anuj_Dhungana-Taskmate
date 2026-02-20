import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import ChartCard from './ChartCard';
import {
  CHART_COLORS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  stuckSeverity,
} from './analyticsHelpers';

const PRIORITY_ORDER = ['High', 'Medium', 'Low'];

const normalizeDistributionData = (data = []) => {
  const byPriority = new Map(
    (data || []).map((item) => [item?.priority, Number(item?.count) || 0])
  );

  return PRIORITY_ORDER.map((priority) => ({
    priority,
    count: byPriority.get(priority) || 0,
  }));
};

const normalizeCompletionData = (data = []) => {
  const byPriority = new Map(
    (data || []).map((item) => [item?.priority, item || {}])
  );

  return PRIORITY_ORDER.map((priority) => {
    const item = byPriority.get(priority) || {};
    return {
      priority,
      total: Number(item?.total) || 0,
      completed: Number(item?.completed) || 0,
      completionRate: Number(item?.completionRate) || 0,
    };
  });
};

function VelocityChart({ data, loading }) {
  return (
    <ChartCard
      title="Velocity (Tasks per week)"
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
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,.08)',
            }}
          />
          <Bar
            dataKey="completed"
            fill={CHART_COLORS.indigo}
            radius={[6, 6, 0, 0]}
            name="Completed"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function CumulativeFlowChart({ data, loading }) {
  return (
    <ChartCard
      title="Cumulative Flow Diagram"
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
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,.08)',
            }}
          />
          <Legend iconType="circle" iconSize={8} />
          <Area
            type="monotone"
            dataKey="Done"
            stackId="1"
            fill={STATUS_COLORS.Done}
            stroke={STATUS_COLORS.Done}
            fillOpacity={0.7}
          />
          <Area
            type="monotone"
            dataKey="In Progress"
            stackId="1"
            fill={STATUS_COLORS['In Progress']}
            stroke={STATUS_COLORS['In Progress']}
            fillOpacity={0.7}
          />
          <Area
            type="monotone"
            dataKey="To Do"
            stackId="1"
            fill={STATUS_COLORS['To Do']}
            stroke={STATUS_COLORS['To Do']}
            fillOpacity={0.7}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function PriorityDistributionChart({ data, loading }) {
  const chartData = useMemo(() => normalizeDistributionData(data), [data]);
  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartCard
      title="Project Priority Distribution"
      subtitle="Active and planning projects"
      loading={loading}
      empty={totalCount === 0}
    >
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="priority"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={86}
            paddingAngle={4}
          >
            {chartData.map((item) => (
              <Cell
                key={item.priority}
                fill={PRIORITY_COLORS[item.priority] || CHART_COLORS.slate}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value}`, 'Projects']}
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,.08)',
            }}
          />
          <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function CompletionRateByPriorityChart({ data, loading }) {
  const chartData = useMemo(() => normalizeCompletionData(data), [data]);
  const hasData = chartData.some((item) => item.total > 0);

  return (
    <ChartCard
      title="Completion Rate by Priority"
      subtitle="Based on selected date range"
      loading={loading}
      empty={!hasData}
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} barSize={34}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            formatter={(value, _name, item) => [
              `${value}%`,
              `${item?.payload?.completed || 0}/${item?.payload?.total || 0} completed`,
            ]}
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,.08)',
            }}
          />
          <Bar dataKey="completionRate" radius={[6, 6, 0, 0]} name="Completion %">
            {chartData.map((item) => (
              <Cell
                key={item.priority}
                fill={PRIORITY_COLORS[item.priority] || CHART_COLORS.indigo}
              />
            ))}
            <LabelList
              dataKey="completionRate"
              position="top"
              formatter={(value) => `${value}%`}
              style={{ fontSize: 11, fill: '#475569' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function StuckTasksTable({ data, loading, onTaskClick }) {
  return (
    <ChartCard
      title="Stuck Tasks"
      subtitle="Tasks in progress for 3+ days"
      loading={loading}
      empty={!data?.length}
      emptyText="No stuck tasks - great job!"
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
            {(data || []).map((task) => {
              const severity = stuckSeverity(task.daysStuck);

              return (
                <tr
                  key={task._id}
                  onClick={() => onTaskClick?.(task)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 pr-3 font-medium text-gray-900 max-w-50 truncate">
                    {task.title}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-500">{task.project}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex -space-x-1">
                      {(task.assignees || []).slice(0, 3).map((assignee, index) => (
                        <div
                          key={`${task._id}-assignee-${index}`}
                          className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-indigo-600"
                          title={assignee.fullname}
                        >
                          {assignee.avatar ? (
                            <img
                              src={assignee.avatar}
                              className="w-full h-full rounded-full object-cover"
                              alt=""
                            />
                          ) : (
                            (assignee.fullname || '?')[0]
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${severity.bg} ${severity.text} ${severity.ring}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {task.daysStuck}d
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">
                    {new Date(task.lastUpdated).toLocaleDateString('en', {
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

export default function ProjectHealthTab({ data, loading, onTaskClick }) {
  const projectHealth = data?.projectHealth;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VelocityChart data={projectHealth?.velocity} loading={loading} />
        <CumulativeFlowChart data={projectHealth?.cumulativeFlow} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriorityDistributionChart
          data={projectHealth?.priorityDistribution}
          loading={loading}
        />
        <CompletionRateByPriorityChart
          data={projectHealth?.completionRateByPriority}
          loading={loading}
        />
      </div>

      <StuckTasksTable
        data={projectHealth?.stuckTasks}
        loading={loading}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
