import { asyncHandler } from '../middleware/errorHandler.js';
import {
    createProject as createProjectService,
    getProjectsByWorkspace as getProjectsByWorkspaceService,
    getProjectById as getProjectByIdService,
    updateProject as updateProjectService,
    deleteProject as deleteProjectService,
} from '../services/projectService.js';

// POST /api/projects
export const createProject = asyncHandler(async (req, res) => {
    const project = await createProjectService(req.body, req.user._id, req);
    res.status(201).json(project);
});

// GET /api/projects?workspaceId=...
export const getProjectsByWorkspace = asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) {
        const err = new Error('workspaceId is required');
        err.statusCode = 400;
        throw err;
    }
    const projects = await getProjectsByWorkspaceService(workspaceId, req.user._id);
    res.json(projects);
});

// GET /api/projects/:id
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await getProjectByIdService(req.params.id, req.user._id);
    res.json(project);
});

// PUT /api/projects/:id
export const updateProject = asyncHandler(async (req, res) => {
    const updatedProject = await updateProjectService(
        req.params.id,
        req.body,
        req.user._id,
        req
    );
    res.json(updatedProject);
});

// DELETE /api/projects/:id
export const deleteProject = asyncHandler(async (req, res) => {
    await deleteProjectService(req.params.id, req.user._id, req);
    res.json({ message: 'Project deleted successfully' });
});
