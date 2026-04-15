import {
    createProject as createProjectService,
    getProjectsByWorkspace as getProjectsByWorkspaceService,
    getProjectById as getProjectByIdService,
    updateProject as updateProjectService,
    deleteProject as deleteProjectService,
} from '../services/projectService.js';

// POST /api/projects
export const createProject = async (req, res) => {
    try {
        const project = await createProjectService(req.body, req.user._id, req);
        res.status(201).json(project);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Server Error',
            ...(error.code && { code: error.code }),
            ...(error.limit !== undefined && { limit: error.limit }),
            ...(error.currentCount !== undefined && { currentCount: error.currentCount }),
        });
    }
};

// GET /api/projects?workspaceId=...
export const getProjectsByWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.query;
        if (!workspaceId) {
            return res.status(400).json({ message: 'workspaceId is required' });
        }
        const projects = await getProjectsByWorkspaceService(workspaceId, req.user._id);
        res.json(projects);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// GET /api/projects/:id
export const getProjectById = async (req, res) => {
    try {
        const project = await getProjectByIdService(req.params.id, req.user._id);
        res.json(project);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
    try {
        const updatedProject = await updateProjectService(
            req.params.id,
            req.body,
            req.user._id,
            req
        );
        res.json(updatedProject);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
    try {
        await deleteProjectService(req.params.id, req.user._id, req);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};
