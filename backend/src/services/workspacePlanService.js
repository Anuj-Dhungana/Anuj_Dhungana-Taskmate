import Project from '../models/Project.js';
import { WORKSPACE_PLAN, WORKSPACE_PLAN_FEATURES, normalizeWorkspacePlan } from '../config/workspacePlans.js';

export const getWorkspacePlan = (workspace) =>
    normalizeWorkspacePlan(workspace?.settings?.billing?.currentPlan);

export const getWorkspacePlanLimits = (workspace) =>
    WORKSPACE_PLAN_FEATURES[getWorkspacePlan(workspace)] || WORKSPACE_PLAN_FEATURES[WORKSPACE_PLAN.FREE];

const isUnlimited = (value) => value === null;

export const getWorkspaceMemberCount = (workspace) =>
    Array.isArray(workspace?.members) ? workspace.members.length : 0;

export const canAddMembersToWorkspace = (workspace, additionalMembers = 1) => {
    const limits = getWorkspacePlanLimits(workspace);
    const currentMembers = getWorkspaceMemberCount(workspace);

    if (isUnlimited(limits.maxMembers)) {
        return {
            allowed: true,
            limit: limits.maxMembers,
            currentMembers,
            nextMembers: currentMembers + additionalMembers,
        };
    }

    const nextMembers = currentMembers + additionalMembers;
    const allowed = nextMembers <= limits.maxMembers;

    return {
        allowed,
        limit: limits.maxMembers,
        currentMembers,
        nextMembers,
    };
};

export const canAccessWorkspaceAnalytics = (workspace) => {
    const limits = getWorkspacePlanLimits(workspace);
    return Boolean(limits.analyticsEnabled);
};

export const canCreateProjectInWorkspace = async (workspace) => {
    const limits = getWorkspacePlanLimits(workspace);
    const projectCount = await Project.countDocuments({ workspace: workspace._id });

    if (isUnlimited(limits.maxProjects)) {
        return {
            allowed: true,
            limit: limits.maxProjects,
            projectCount,
            nextProjects: projectCount + 1,
        };
    }

    const nextProjects = projectCount + 1;
    const allowed = nextProjects <= limits.maxProjects;

    return {
        allowed,
        limit: limits.maxProjects,
        projectCount,
        nextProjects,
    };
};
