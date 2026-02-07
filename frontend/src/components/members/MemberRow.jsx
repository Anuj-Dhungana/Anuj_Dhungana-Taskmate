import { MoreHorizontal } from 'lucide-react';
import {
    ROLE_STYLES,
    STATUS_STYLES,
    formatDate,
    getMemberInitials,
    getMemberStatus,
    canChangeRole,
    canRemoveMember,
    getRoleActionLabel,
    getRoleActionValue,
} from '../../utils/memberHelpers';

const MemberRow = ({
    member,
    currentUserId,
    myRole,
    projectsByUser,
    tasksByUser,
    openMenuId,
    onToggleMenu,
    onRoleChange,
    onKick,
}) => {
    const user = member.user || {};
    const initials = getMemberInitials(user.fullname);
    const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.member;
    const status = getMemberStatus(user);
    const statusLabel = status === 'active' ? 'Active' : 'Inactive';
    const isMe = user._id === currentUserId;
    const isOwner = myRole === 'owner';
    const isAdmin = myRole === 'admin';
    const canManage = isOwner || isAdmin;

    const canChange = canChangeRole(myRole, member.role, isMe);
    const canRemove = canRemoveMember(myRole, member.role, isMe);
    const roleActionLabel = getRoleActionLabel(member.role);
    const roleActionValue = getRoleActionValue(member.role);

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        {initials}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-900">{user.fullname}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleStyle.className}`}>
                    <roleStyle.Icon size={12} />
                    {roleStyle.label}
                </span>
            </td>
            <td className="px-6 py-4">
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}
                    title={status === 'inactive' ? 'User account disabled or not verified' : 'Active member'}
                >
                    {statusLabel}
                </span>
            </td>
            <td className="px-6 py-4 text-gray-700 font-semibold">
                {projectsByUser[user._id] || 0}
            </td>
            <td className="px-6 py-4 text-gray-700 font-semibold">
                {tasksByUser[user._id] || 0}
            </td>
            <td className="px-6 py-4 text-gray-500">
                {formatDate(member.joinedAt)}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="relative inline-block text-left">
                    <button
                        onClick={() => onToggleMenu(user._id)}
                        disabled={!canManage}
                        title={canManage ? 'Actions' : 'Only workspace admins can manage members'}
                        className={`w-8 h-8 inline-flex items-center justify-center rounded-full border border-gray-200 ${
                            canManage
                                ? 'text-gray-600 hover:bg-gray-100'
                                : 'text-gray-300 cursor-not-allowed bg-gray-50'
                        }`}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === user._id && canManage && (
                        <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
                            <button
                                onClick={() => onRoleChange(user._id, roleActionValue)}
                                disabled={!canChange}
                                className={`w-full px-3 py-2 text-left text-xs ${
                                    canChange
                                        ? 'text-gray-700 hover:bg-gray-50'
                                        : 'text-gray-300 cursor-not-allowed'
                                }`}
                            >
                                {roleActionLabel}
                            </button>
                            <button
                                onClick={() => onKick(user._id, user.fullname)}
                                disabled={!canRemove}
                                className={`w-full px-3 py-2 text-left text-xs ${
                                    canRemove
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Remove member
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default MemberRow;
