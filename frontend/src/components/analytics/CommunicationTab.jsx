import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';
import { CHART_COLORS, PIE_COLORS } from './analyticsHelpers';

/* ─── Messages vs Tasks Completed (dual line) ─── */
function MessagesVsTasksChart({ data, loading }) {
  // Show max 30 data points for readability
  const trimmed = (data || []).slice(-30);

  return (
    <ChartCard
      title="Messages vs Tasks Completed"
      subtitle="Daily comparison"
      loading={loading}
      empty={!trimmed.length}
    >
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trimmed}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Legend iconType="circle" iconSize={8} />
          <Line type="monotone" dataKey="messages" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} name="Messages" />
          <Line type="monotone" dataKey="tasksCompleted" stroke={CHART_COLORS.emerald} strokeWidth={2} dot={false} name="Tasks Completed" />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-gray-400 mt-2">
        High chat + low completion may indicate blockers or discussions
      </p>
    </ChartCard>
  );
}

/* ─── Active Channels (bars) ─── */
function ActiveChannelsChart({ data, loading }) {
  const sorted = [...(data || [])].sort((a, b) => b.messages - a.messages).slice(0, 10);

  return (
    <ChartCard
      title="Active Channels"
      subtitle="Messages per channel"
      loading={loading}
      empty={!sorted.length}
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={sorted} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Bar dataKey="messages" fill={CHART_COLORS.purple} radius={[6, 6, 0, 0]} name="Messages" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ─── DM vs Channel Ratio (donut) ─── */
function DmVsChannelChart({ data, loading }) {
  const pieData = data
    ? [
        { name: 'Direct Messages', value: data.dm },
        { name: 'Channels', value: data.channel },
      ]
    : [];
  const total = (data?.dm || 0) + (data?.channel || 0);

  return (
    <ChartCard
      title="DM vs Channel Ratio"
      subtitle="Message distribution"
      loading={loading}
      empty={total === 0}
    >
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}
          />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ─── Tab 2 Composed ─── */
export default function CommunicationTab({ data, loading }) {
  const comm = data?.communication;

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessagesVsTasksChart data={comm?.messagesVsTasks} loading={loading} />
        <ActiveChannelsChart data={comm?.channelActivity} loading={loading} />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DmVsChannelChart data={comm?.dmVsChannel} loading={loading} />
      </div>
    </div>
  );
}
