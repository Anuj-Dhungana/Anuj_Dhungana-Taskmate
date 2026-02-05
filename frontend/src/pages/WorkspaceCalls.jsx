import useWorkspaceStore from '../store/userWorkspaceStore';

const WorkspaceCalls = () => {
    const { currentWorkspaceId } = useWorkspaceStore();

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to manage calls.</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Calls</h1>
                <p className="text-gray-500">Start or join a call in this workspace.</p>
                <div className="mt-6">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                        Start Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceCalls;
