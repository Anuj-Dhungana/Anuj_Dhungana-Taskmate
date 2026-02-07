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
                        onChange={(e) => onSearchChange(e.target.value)}
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
                        {filteredMembers.map((member) => (
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
        </div>
    );
};

export default MembersTable;
