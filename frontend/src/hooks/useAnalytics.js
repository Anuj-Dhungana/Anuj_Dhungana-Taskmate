import { useState, useEffect, useCallback } from 'react';
import api from '../api/index';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';

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
  const canView = myRole === 'owner' || myRole === 'admin';

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
    workspace,
    currentWorkspaceId,
    refresh: fetchAnalytics,
  };
}
