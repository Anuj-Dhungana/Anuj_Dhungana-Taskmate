import { create } from 'zustand';

const STORAGE_KEY = 'currentWorkspaceId';

const useWorkspaceStore = create((set) => ({
  workspaces: [],
  selectedWorkspace: null, // The full object (workspace + channels + projects)
  currentWorkspaceId: localStorage.getItem(STORAGE_KEY) || null,

  setWorkspaces: (workspaces) => set({ workspaces }),

  setSelectedWorkspace: (data) => set({ selectedWorkspace: data }),

  setCurrentWorkspaceId: (workspaceId) => {
    if (workspaceId) {
      localStorage.setItem(STORAGE_KEY, workspaceId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ currentWorkspaceId: workspaceId });
  },

  resetWorkspaceState: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ workspaces: [], selectedWorkspace: null, currentWorkspaceId: null });
  },
}));

export default useWorkspaceStore;
