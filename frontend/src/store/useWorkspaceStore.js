import { create } from 'zustand';

const STORAGE_KEY = 'currentWorkspaceId';

const resolveMemberUserId = (member) => {
  if (!member) return '';
  return String(member?.user?._id || member?.user || '');
};

const useWorkspaceStore = create((set) => ({
  workspaces: [],
  selectedWorkspace: null, // The full object (workspace + channels + projects)
  currentWorkspaceId: localStorage.getItem(STORAGE_KEY) || null,

  setWorkspaces: (workspaces) => set({ workspaces }),

  setSelectedWorkspace: (data) => set({ selectedWorkspace: data }),

  patchSelectedWorkspace: (patch) =>
    set((state) => ({
      selectedWorkspace: state.selectedWorkspace
        ? {
            ...state.selectedWorkspace,
            workspace: {
              ...(state.selectedWorkspace.workspace || {}),
              ...(patch || {}),
            },
          }
        : state.selectedWorkspace,
    })),

  setSelectedWorkspaceMembers: (members) =>
    set((state) => ({
      selectedWorkspace: state.selectedWorkspace
        ? {
            ...state.selectedWorkspace,
            workspace: {
              ...(state.selectedWorkspace.workspace || {}),
              members: Array.isArray(members) ? members : [],
            },
          }
        : state.selectedWorkspace,
    })),

  upsertProjectInSelectedWorkspace: (project) =>
    set((state) => {
      if (!state.selectedWorkspace || !project?._id) return {};
      const currentProjects = Array.isArray(state.selectedWorkspace.projects)
        ? state.selectedWorkspace.projects
        : [];
      const index = currentProjects.findIndex((p) => String(p?._id) === String(project._id));
      const nextProjects =
        index === -1
          ? [project, ...currentProjects]
          : currentProjects.map((p, i) => (i === index ? { ...p, ...project } : p));
      return {
        selectedWorkspace: {
          ...state.selectedWorkspace,
          projects: nextProjects,
        },
      };
    }),

  removeProjectFromSelectedWorkspace: (projectId) =>
    set((state) => {
      if (!state.selectedWorkspace || !projectId) return {};
      const currentProjects = Array.isArray(state.selectedWorkspace.projects)
        ? state.selectedWorkspace.projects
        : [];
      return {
        selectedWorkspace: {
          ...state.selectedWorkspace,
          projects: currentProjects.filter((p) => String(p?._id) !== String(projectId)),
        },
      };
    }),

  applyRoleChangeInSelectedWorkspace: ({ memberId, newRole }) =>
    set((state) => {
      if (!state.selectedWorkspace || !memberId || !newRole) return {};
      const members = state.selectedWorkspace.workspace?.members || [];
      const nextMembers = members.map((m) =>
        resolveMemberUserId(m) === String(memberId) ? { ...m, role: newRole } : m
      );
      return {
        selectedWorkspace: {
          ...state.selectedWorkspace,
          workspace: {
            ...(state.selectedWorkspace.workspace || {}),
            members: nextMembers,
          },
        },
      };
    }),

  removeMemberFromSelectedWorkspace: (memberId) =>
    set((state) => {
      if (!state.selectedWorkspace || !memberId) return {};
      const members = state.selectedWorkspace.workspace?.members || [];
      const nextMembers = members.filter((m) => resolveMemberUserId(m) !== String(memberId));
      return {
        selectedWorkspace: {
          ...state.selectedWorkspace,
          workspace: {
            ...(state.selectedWorkspace.workspace || {}),
            members: nextMembers,
          },
        },
      };
    }),

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
