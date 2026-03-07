export const WORKSPACE_PLAN = Object.freeze({
    FREE: 'free',
    PRO: 'pro',
});

export const WORKSPACE_PLAN_FEATURES = Object.freeze({
    [WORKSPACE_PLAN.FREE]: Object.freeze({
        maxProjects: 5,
        maxMembers: 5,
        analyticsEnabled: false,
    }),
    [WORKSPACE_PLAN.PRO]: Object.freeze({
        maxProjects: null,
        maxMembers: null,
        analyticsEnabled: true,
    }),
});

export const normalizeWorkspacePlan = (plan) => {
    const normalized = String(plan || '').trim().toLowerCase();

    if (normalized === 'premium' || normalized === WORKSPACE_PLAN.PRO) {
        return WORKSPACE_PLAN.PRO;
    }

    return WORKSPACE_PLAN.FREE;
};
