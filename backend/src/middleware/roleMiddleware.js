import Workspace from '../models/Workspace.js';

// allowedRoles is an array, e.g., ['owner', 'admin']
const checkWorkspaceRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // 1. Identify Workspace ID (It could be in params, body, or query)
            const workspaceId = req.params.id || req.body.workspaceId || req.query.workspaceId;

            if (!workspaceId) {
                return res.status(400).json({ message: "Workspace ID missing for role check" });
            }

            // 2. Find the Workspace
            const workspace = await Workspace.findById(workspaceId);
            
            if (!workspace) {
                return res.status(404).json({ message: "Workspace not found" });
            }

            // 3. Find the Current User in the Members list
            const member = workspace.members.find(
                (m) => m.user.toString() === req.user._id.toString()
            );

            if (!member) {
                return res.status(403).json({ message: "You are not a member of this workspace" });
            }

            // 4. Check if their role is allowed
            if (!allowedRoles.includes(member.role)) {
                return res.status(403).json({ 
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
                });
            }

            // 5. Pass the workspace object to the next controller (optimization)
            req.workspace = workspace;
            next();

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server Error during role check" });
        }
    };
};

export default checkWorkspaceRole;
