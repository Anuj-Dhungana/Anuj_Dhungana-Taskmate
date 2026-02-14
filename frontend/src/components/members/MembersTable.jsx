import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import MemberRow from './MemberRow';

const MembersTable = ({
    filteredMembers,
    currentUserId,
    myRole,
    projectsByUser,
    tasksByUser,
    openMenuId,
    onToggleMenu,
    onRoleChange,
    onKick,
    search,
    onSearchChange,
}) => {
    const PAGE_SIZE = 15;
    const [currentPage, setCurrentPage] = useState(1);
    const totalMembers = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalMembers / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedMembers = useMemo(
        () => filteredMembers.slice(startIndex, endIndex),
        [filteredMembers, startIndex, endIndex]
    );
    const showingFrom = totalMembers === 0 ? 0 : startIndex + 1;
    const showingTo = totalMembers === 0 ? 0 : Math.min(endIndex, totalMembers);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-bold text-gray-900">All Members</h2>
                    <p className="text-xs text-gray-500">View and manage your team members</p>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => {
                            setCurrentPage(1);
                            onSearchChange(e.target.value);
                        }}
                        placeholder="Search by name or email"
                        className="w-60 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left">Member</th>
                            <th className="px-6 py-3 text-left">Role</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left" title="Projects this member is involved in">Projects</th>
                            <th className="px-6 py-3 text-left" title="Tasks currently assigned">Tasks</th>
                            <th className="px-6 py-3 text-left">Joined</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedMembers.map((member) => (
                            <MemberRow
                                key={member.user?._id}
                                member={member}
                                currentUserId={currentUserId}
                                myRole={myRole}
                                projectsByUser={projectsByUser}
                                tasksByUser={tasksByUser}
                                openMenuId={openMenuId}
                                onToggleMenu={onToggleMenu}
                                onRoleChange={onRoleChange}
                                onKick={onKick}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredMembers.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-gray-400">No matching members found.</div>
            )}

            {filteredMembers.length > 0 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        Showing {showingFrom}-{showingTo} of {totalMembers}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                            disabled={safeCurrentPage === 1}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Prev
                        </button>
                        <span className="text-xs text-gray-500">
                            Page {safeCurrentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                            disabled={safeCurrentPage >= totalPages}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersTable;
