import { useEffect, useRef, useState } from 'react';
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
import usePresenceStore from '../../store/usePresenceStore';

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
    
    // Presence / Status
    const isOnline = usePresenceStore((state) => state.isOnline(user._id));
    const baseStatus = getMemberStatus(user); // 'active' or 'inactive'
    
    let statusLabel = baseStatus === 'active' ? 'Offline' : 'Inactive';
    let statusStyle = STATUS_STYLES.inactive;
    
    if (baseStatus === 'inactive') {
        statusLabel = 'Inactive';
        statusStyle = STATUS_STYLES.inactive;
    } else if (isOnline) {
        statusLabel = 'Online';
        statusStyle = STATUS_STYLES.online;
    } else {
        statusLabel = 'Offline';
        statusStyle = STATUS_STYLES.inactive; // reuse inactive styling for offline
    }

    const isMe = user._id === currentUserId;
    const isOwner = myRole === 'owner';
    const isAdmin = myRole === 'admin';
    const canManage = isOwner || isAdmin;

    const canChange = canChangeRole(myRole, member.role, isMe);
    const canRemove = canRemoveMember(myRole, member.role, isMe);
    const roleActionLabel = getRoleActionLabel(member.role);
    const roleActionValue = getRoleActionValue(member.role);
    const buttonRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [avatarError, setAvatarError] = useState(false);
    const isMenuOpen = openMenuId === user._id && canManage;

    useEffect(() => {
        if (!isMenuOpen || !buttonRef.current) return;

        const updateMenuPosition = () => {
            const rect = buttonRef.current.getBoundingClientRect();
            const menuWidth = 176;
            const menuHeight = 96;
            const margin = 8;
            let left = rect.right - menuWidth;
            let top = rect.bottom + margin;

            if (left < margin) left = margin;
            if (left + menuWidth > window.innerWidth - margin) {
                left = window.innerWidth - menuWidth - margin;
            }
            if (top + menuHeight > window.innerHeight - margin) {
                top = rect.top - menuHeight - margin;
            }
            if (top < margin) top = margin;

            setMenuPosition({ top, left });
        };

        updateMenuPosition();
        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);

        return () => {
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [isMenuOpen]);

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {user.avatar && !avatarError ? (
                        <img
                            src={user.avatar}
                            alt={user.fullname}
                            onError={() => setAvatarError(true)}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            {initials}
                        </div>
                    )}
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
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle}`}
                    title={baseStatus === 'inactive' ? 'User account disabled or not verified' : (isOnline ? 'User is currently online' : 'User is currently offline')}
                >
                    {isOnline && baseStatus !== 'inactive' && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    )}
                    {(!isOnline || baseStatus === 'inactive') && (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
                    )}
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
                        ref={buttonRef}
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
                    {isMenuOpen && (
                        <div
                            className="fixed w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-[1000]"
                            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
                        >
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
