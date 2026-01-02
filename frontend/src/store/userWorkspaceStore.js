import { create } from 'zustand';

const useWorkspaceStore = create((set) => ({
  workspaces: [],
  selectedWorkspace: null, // The full object (ws + channels + projects)
  
  setWorkspaces: (workspaces) => set({ workspaces }),
  
  setSelectedWorkspace: (data) => set({ selectedWorkspace: data }),
}));

export default useWorkspaceStore;