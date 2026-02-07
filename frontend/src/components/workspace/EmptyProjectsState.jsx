import { Plus } from 'lucide-react';

const EmptyProjectsState = ({ hasProjects, onCreateProject }) => {
    if (!hasProjects) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-10 py-16 text-center">
                <div className="text-lg font-semibold text-gray-800">No projects in this workspace yet</div>
                <p className="text-sm text-gray-500 mt-1">Create your first project to get started.</p>
                <button
                    onClick={onCreateProject}
                    className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                >
                    <Plus size={16} />
                    Create your first project
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-10 py-12 text-center text-gray-500">
            No projects match your search.
        </div>
    );
};

export default EmptyProjectsState;
