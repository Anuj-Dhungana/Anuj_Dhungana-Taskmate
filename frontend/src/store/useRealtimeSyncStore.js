import { create } from 'zustand';
import socket from '../lib/socket';
import useWorkspaceStore from './useWorkspaceStore';
import { emitProjectDataChanged } from '../utils/projectEvents';

const toWorkspaceId = (payload = {}) =>
    String(payload.workspaceId || payload.workspace?._id || '');
const toProjectId = (payload = {}) =>
    String(
        payload.projectId ||
            payload.project?._id ||
            payload.task?.projectId ||
            payload.card?.projectId ||
            payload.list?.projectId ||
            payload.entity?.projectId ||
            ''
    );
const toProject = (payload = {}) => payload.project || payload.entity || null;
const toTask = (payload = {}) => payload.task || payload.card || null;
const toMemberId = (payload = {}) =>
    String(
        payload.memberId ||
            payload.member?._id ||
            payload.member?.user?._id ||
            payload.member?.user ||
            ''
    );
const toMemberRole = (payload = {}) =>
    payload.newRole || payload.member?.role || '';
const toWorkspace = (payload = {}) => payload.workspace || payload.entity || null;
const shouldHandleWorkspace = (payload = {}) => {
    const eventWorkspaceId = toWorkspaceId(payload);
    if (!eventWorkspaceId) return true;
    const currentWorkspaceId = String(
        useWorkspaceStore.getState().currentWorkspaceId || ''
    );
    return !currentWorkspaceId || eventWorkspaceId === currentWorkspaceId;
};

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
            if (!shouldHandleWorkspace(payload)) return;
            const workspaceId = toWorkspaceId(payload);
            const project = toProject(payload);
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
            if (!shouldHandleWorkspace(payload)) return;
            const workspaceId = toWorkspaceId(payload);
            const projectId = payload?.project?._id || payload?.projectId;
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
            if (!shouldHandleWorkspace(payload)) return;
            const workspaceId = toWorkspaceId(payload);
            const project = toProject(payload);
            if (project?._id) {
                useWorkspaceStore.getState().upsertProjectInSelectedWorkspace(project);
            }
            emitProjectDataChanged({
                workspaceId,
                projectId: project?._id || toProjectId(payload),
                source: 'socket:project_updated',
            });
        };

        const onTaskEvent = (payload, source) => {
            if (!shouldHandleWorkspace(payload)) return;
            const workspaceId = toWorkspaceId(payload);
            const projectId = toProjectId(payload);
            emitProjectDataChanged({
                workspaceId,
                projectId,
                source,
            });
        };

        const onRoleChanged = (payload) => {
            if (!shouldHandleWorkspace(payload)) return;
            const workspaceId = toWorkspaceId(payload);
            const memberId = toMemberId(payload);
            const newRole = toMemberRole(payload);
            if (memberId && newRole) {
                useWorkspaceStore.getState().applyRoleChangeInSelectedWorkspace({
                    memberId,
                    newRole,
                });
            }
            emitProjectDataChanged({
                workspaceId,
                source: 'socket:role_changed',
            });
        };

        const onMemberRemoved = (payload) => {
            if (!shouldHandleWorkspace(payload)) return;
            const workspaceId = toWorkspaceId(payload);
            const memberId = toMemberId(payload);
            if (memberId) {
                useWorkspaceStore.getState().removeMemberFromSelectedWorkspace(memberId);
            }
            emitProjectDataChanged({
                workspaceId,
                source: 'socket:member_removed',
            });
        };

        const onMemberAdded = (payload) => {
            if (!shouldHandleWorkspace(payload)) return;
            const workspaceId = toWorkspaceId(payload);
            emitProjectDataChanged({
                workspaceId,
                source: 'socket:member_added',
            });
        };

        const onWorkspaceUpdated = (payload) => {
            if (!shouldHandleWorkspace(payload)) return;
            const workspace = toWorkspace(payload);
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

        const onTaskCreated = (payload) => onTaskEvent(payload, 'socket:task_created');
        const onTaskUpdated = (payload) => onTaskEvent(payload, 'socket:task_updated');
        const onTaskDeleted = (payload) => onTaskEvent(payload, 'socket:task_deleted');
        const onTaskMoved = (payload) => {
            const task = toTask(payload);
            onTaskEvent(
                {
                    ...payload,
                    projectId:
                        toProjectId(payload) ||
                        task?.projectId ||
                        task?.project?._id,
                },
                'socket:task_moved'
            );
        };
        const onListCreated = (payload) => onTaskEvent(payload, 'socket:list_created');
        const bind = (eventName, handler) => {
            socket.off(eventName, handler);
            socket.on(eventName, handler);
        };

        bind('connect', onConnect);
        bind('disconnect', onDisconnect);
        bind('project_created', onProjectCreated);
        bind('project_deleted', onProjectDeleted);
        bind('project_updated', onProjectUpdated);
        bind('task_created', onTaskCreated);
        bind('task_updated', onTaskUpdated);
        bind('task_deleted', onTaskDeleted);
        bind('task_moved', onTaskMoved);
        bind('list_created', onListCreated);
        bind('role_changed', onRoleChanged);
        bind('member_removed', onMemberRemoved);
        bind('member_added', onMemberAdded);
        bind('workspace_updated', onWorkspaceUpdated);

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
