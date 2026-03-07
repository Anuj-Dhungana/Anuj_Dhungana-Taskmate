import { useState, useEffect, useCallback } from 'react';
import api from '../api/index';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import { WORKSPACE_PLAN, WORKSPACE_PLAN_FEATURES, normalizeWorkspacePlan } from '../constants/workspacePlans';

const DATE_RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

export { DATE_RANGES };

export default function useAnalytics() {
  const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();
  const { userInfo } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [activeTab, setActiveTab] = useState('projectHealth');

  const workspace = selectedWorkspace?.workspace;
  const members = workspace?.members || [];
  const myRole = members.find(
    (m) => (m.user?._id || m.user) === userInfo?._id
  )?.role;
  const currentPlan = normalizeWorkspacePlan(workspace?.settings?.billing?.currentPlan);
  const planFeatures = WORKSPACE_PLAN_FEATURES[currentPlan] || WORKSPACE_PLAN_FEATURES[WORKSPACE_PLAN.FREE];
  const analyticsEnabled = Boolean(planFeatures.analyticsEnabled);
  const canView = myRole === 'owner' && analyticsEnabled;

  const fetchAnalytics = useCallback(async () => {
    if (!currentWorkspaceId || !canView) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/api/board/workspace-analytics?workspaceId=${currentWorkspaceId}&days=${dateRange}`
      );
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId, dateRange, canView]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    canView,
    analyticsEnabled,
    workspace,
    currentWorkspaceId,
    currentPlan,
    refresh: fetchAnalytics,
  };
}
