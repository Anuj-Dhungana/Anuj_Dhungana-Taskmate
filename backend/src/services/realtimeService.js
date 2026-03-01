export const getWorkspaceRoom = (workspaceId) => `workspace_${workspaceId?.toString?.() || workspaceId}`;

export const emitWorkspace = (req, workspaceId, event, payload = {}) => {
    if (!workspaceId || !req?.app) return;
    const io = req.app.get('io');
    io?.to(getWorkspaceRoom(workspaceId)).emit(event, {
        workspaceId: workspaceId.toString(),
        ...payload,
    });
};

export const emitRoleChanged = (req, workspaceId, userId, role) =>
    emitWorkspace(req, workspaceId, 'role_changed', {
        member: {
            user: String(userId),
            role,
        },
    });

export const emitMemberAdded = (req, workspaceId, userId, role = 'member') =>
    emitWorkspace(req, workspaceId, 'member_added', {
        member: {
            user: String(userId),
            role,
        },
    });

export const emitMemberRemoved = (req, workspaceId, userId) =>
    emitWorkspace(req, workspaceId, 'member_removed', {
        member: {
            user: String(userId),
        },
    });

export const emitWorkspaceUpdated = (req, workspaceId, workspace) =>
    emitWorkspace(req, workspaceId, 'workspace_updated', {
        workspace,
    });
