const PROJECT_DATA_CHANGED_EVENT = 'taskmate:project-data-changed';

export const emitProjectDataChanged = ({ workspaceId, projectId, source } = {}) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent(PROJECT_DATA_CHANGED_EVENT, {
            detail: { workspaceId, projectId, source, at: Date.now() },
        })
    );
};

export const addProjectDataChangedListener = (handler) => {
    if (typeof window === 'undefined') return () => {};
    const listener = (event) => handler?.(event?.detail || {});
    window.addEventListener(PROJECT_DATA_CHANGED_EVENT, listener);
    return () => window.removeEventListener(PROJECT_DATA_CHANGED_EVENT, listener);
};

export { PROJECT_DATA_CHANGED_EVENT };
