import { useRef, useCallback } from 'react';
import {
  BarChart3,
  RefreshCw,
  ChevronDown,
  FolderKanban,
  MessageSquare,
  Users,
  ShieldAlert,
} from 'lucide-react';
import useAnalytics, { DATE_RANGES } from '../hooks/useAnalytics';
import KPIStrip from '../components/analytics/KPIStrip';
import ProjectHealthTab from '../components/analytics/ProjectHealthTab';
import CommunicationTab from '../components/analytics/CommunicationTab';
import TeamWorkloadTab from '../components/analytics/TeamWorkloadTab';
import PageSkeleton from '../components/common/PageSkeleton';

const TABS = [
  { key: 'projectHealth', label: 'Project Health', icon: FolderKanban },
  { key: 'communication', label: 'Communication', icon: MessageSquare },
  { key: 'teamWorkload', label: 'Team Workload', icon: Users },
];

const Analytics = () => {
  const {
    data,
    loading,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    canView,
    hasAnalyticsRole,
    analyticsEnabled,
    workspace,
    currentWorkspaceId,
    refresh,
  } = useAnalytics();

  const tabContentRef = useRef(null);

  const handleScrollTo = useCallback(
    (tabKey) => {
      setActiveTab(tabKey);
      setTimeout(() => {
        tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    },
    [setActiveTab]
  );

  /* ── Guard states ── */
  if (!currentWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-400 text-sm">Select a workspace to view analytics.</p>
      </div>
    );
  }

  if (!workspace) {
    return <PageSkeleton kind="analytics" />;
  }

  if (!canView) {
    const isNotPro = hasAnalyticsRole && !analyticsEnabled;
    const message = !hasAnalyticsRole
      ? 'Analytics is available to workspace owners and admins only.'
      : !analyticsEnabled
      ? 'Analytics is available only for Pro workspaces.'
      : 'You are not allowed to access analytics for this workspace.';

    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-5 max-w-sm w-full">
          <div className="flex items-center gap-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-5 py-4 text-sm w-full">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            {message}
          </div>
          {isNotPro && (
            <div className="border-2 border-indigo-200 bg-linear-to-br from-indigo-50 to-white rounded-xl p-5 w-full">
              <p className="text-sm font-semibold text-gray-900 mb-2">Pro Plan</p>
              <p className="text-xl font-bold text-gray-900 mb-3">Rs. 10<span className="text-xs font-normal text-gray-500"> / workspace</span></p>
              <ul className="space-y-1.5 text-xs text-gray-600 mb-4">
                <li className="flex items-center gap-2">✓ Unlimited projects</li>
                <li className="flex items-center gap-2">✓ Unlimited members</li>
                <li className="flex items-center gap-2">✓ Analytics enabled</li>
              </ul>
              <button
                onClick={() => window.location.href = '/settings'}
                className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50/80 to-white">
      {/* ── Page Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          {/* Left */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              Workspace insights&nbsp;•&nbsp;{workspace.name}
            </p>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Date range */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* Refresh */}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500
                         hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* ── KPI Strip ── */}
        <KPIStrip kpi={data?.kpi} loading={loading} onScrollTo={handleScrollTo} />

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div ref={tabContentRef}>
          {activeTab === 'projectHealth' && (
            <ProjectHealthTab data={data} loading={loading} />
          )}
          {activeTab === 'communication' && (
            <CommunicationTab data={data} loading={loading} />
          )}
          {activeTab === 'teamWorkload' && (
            <TeamWorkloadTab data={data} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
