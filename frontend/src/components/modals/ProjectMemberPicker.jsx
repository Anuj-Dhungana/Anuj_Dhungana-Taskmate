import { ChevronDown, ChevronUp } from 'lucide-react';

const ProjectMemberPicker = ({
    members,
    selectedMembers,
    selectedList,
    isOpen,
    onToggleOpen,
    onToggleMember,
    onUpdateRole,
    isAdminOrOwner,
}) => {
    if (!isAdminOrOwner) {
        return (
            <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Project Members</p>
                <div className="border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed">
                    Project members are managed by admins
                </div>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Project Members</p>
            <button
                type="button"
                onClick={onToggleOpen}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-left text-sm bg-white flex items-center justify-between"
            >
                <span className="truncate text-gray-700">
                    {selectedList.length === 0
                        ? 'Select members'
                        : selectedList.map((m) => m.fullname).join(', ')}
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
                    {members.map((m) => {
                        const id = m.user._id;
                        const checked = !!selectedMembers[id];
                        const role = selectedMembers[id] || 'Contributor';

                        return (
                            <div key={id} className="px-3 py-2.5 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggleMember(id)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {m.user.fullname}
                                </label>

                                <select
                                    value={role}
                                    onChange={(e) => onUpdateRole(id, e.target.value)}
                                    disabled={!checked}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 disabled:bg-gray-100"
                                >
                                    <option value="Manager">Manager</option>
                                    <option value="Contributor">Contributor</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProjectMemberPicker;
