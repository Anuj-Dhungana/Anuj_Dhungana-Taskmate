import { create } from 'zustand';
import socket from '../lib/socket';
import useWorkspaceStore from './useWorkspaceStore';
import { emitProjectDataChanged } from '../utils/projectEvents';

const toWorkspaceId = (payload = {}) =>
    String(payload.workspaceId || payload.workspace?._id || '');

const useRealtimeSyncStore = create((set, get) => ({
    initialized: false,
    connected: socket.connected,
    joinedWorkspaceId: null,

    initialize: () => {
        if (get().initialized) return;

        const onConnect = () => {
            const joinedWorkspaceId = get().joinedWorkspaceId;
            if (joinedWorkspaceId) {
                socket.emit('join_workspace', `workspace_${joinedWorkspaceId}`);
            }
            set({ connected: true });
        };
        const onDisconnect = () => set({ connected: false });

        const onProjectCreated = (payload) => {
            const workspaceId = toWorkspaceId(payload);
            const project = payload?.project;
            if (project?._id) {
                useWorkspaceStore.getState().upsertProjectInSelectedWorkspace(project);
            }
            emitProjectDataChanged({
                workspaceId,
                projectId: project?._id,
                source: 'socket:project_created',
            });
        };

        const onProjectDeleted = (payload) => {
            const workspaceId = toWorkspaceId(payload);
            const projectId = payload?.projectId;
            if (projectId) {
                useWorkspaceStore.getState().removeProjectFromSelectedWorkspace(projectId);
            }
            emitProjectDataChanged({
                workspaceId,
                projectId,
                source: 'socket:project_deleted',
            });
        };

        const onProjectUpdated = (payload) => {
            const workspaceId = toWorkspaceId(payload);
            if (payload?.project?._id) {
                useWorkspaceStore.getState().upsertProjectInSelectedWorkspace(payload.project);
            }
            emitProjectDataChanged({
                workspaceId,
                projectId: payload?.project?._id || payload?.projectId,
                source: 'socket:project_updated',
            });
        };

        const onTaskEvent = (payload, source) => {
            const workspaceId = toWorkspaceId(payload);
            emitProjectDataChanged({
                workspaceId,
                projectId: payload?.projectId,
                source,
            });
        };

        const onRoleChanged = (payload) => {
            const workspaceId = toWorkspaceId(payload);
            useWorkspaceStore.getState().applyRoleChangeInSelectedWorkspace({
                memberId: payload?.memberId,
                newRole: payload?.newRole,
            });
            emitProjectDataChanged({
                workspaceId,
                source: 'socket:role_changed',
            });
        };

        const onMemberRemoved = (payload) => {
            const workspaceId = toWorkspaceId(payload);
            useWorkspaceStore.getState().removeMemberFromSelectedWorkspace(payload?.memberId);
            emitProjectDataChanged({
                workspaceId,
                source: 'socket:member_removed',
            });
        };

        const onMemberAdded = (payload) => {
            const workspaceId = toWorkspaceId(payload);
            emitProjectDataChanged({
                workspaceId,
                source: 'socket:member_added',
            });
        };

        const onWorkspaceUpdated = (payload) => {
            const workspace = payload?.workspace;
            const workspaceId = toWorkspaceId(payload);
            if (workspace) {
                useWorkspaceStore.getState().patchSelectedWorkspace(workspace);
                if (workspace?.members) {
                    useWorkspaceStore.getState().setSelectedWorkspaceMembers(workspace.members);
                }
            }
            emitProjectDataChanged({
                workspaceId,
                source: 'socket:workspace_updated',
            });
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('project_created', onProjectCreated);
        socket.on('project_deleted', onProjectDeleted);
        socket.on('project_updated', onProjectUpdated);
        socket.on('task_created', (payload) => onTaskEvent(payload, 'socket:task_created'));
        socket.on('task_updated', (payload) => onTaskEvent(payload, 'socket:task_updated'));
        socket.on('task_deleted', (payload) => onTaskEvent(payload, 'socket:task_deleted'));
        socket.on('task_moved', (payload) => onTaskEvent(payload, 'socket:task_moved'));
        socket.on('list_created', (payload) => onTaskEvent(payload, 'socket:list_created'));
        socket.on('role_changed', onRoleChanged);
        socket.on('member_removed', onMemberRemoved);
        socket.on('member_added', onMemberAdded);
        socket.on('workspace_updated', onWorkspaceUpdated);

        set({ initialized: true, connected: socket.connected });
    },

    joinWorkspace: (workspaceId) => {
        if (!workspaceId) return;
        const current = get().joinedWorkspaceId;
        if (String(current || '') === String(workspaceId)) return;
        socket.emit('join_workspace', `workspace_${workspaceId}`);
        set({ joinedWorkspaceId: String(workspaceId) });
    },
}));

export default useRealtimeSyncStore;
