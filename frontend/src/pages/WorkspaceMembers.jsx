import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Crown, Shield, User as UserIcon, MoreHorizontal, Search, Users } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';
import InviteUserModal from '../components/modals/InviteUserModal';
import ConfirmModal from '../components/modals/ConfirmModal';

const ROLE_STYLES = {
    owner: {
        label: 'Owner',
        className: 'bg-purple-100 text-purple-700 border border-purple-200',
        Icon: Crown,
    },
    admin: {
        label: 'Admin',
        className: 'bg-blue-100 text-blue-700 border border-blue-200',
        Icon: Shield,
    },
    member: {
        label: 'Member',
        className: 'bg-gray-100 text-gray-700 border border-gray-200',
        Icon: UserIcon,
    },
};

const STATUS_STYLES = {
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const WorkspaceMembers = () => {
    const { userInfo } = useAuthStore();
    const { currentWorkspaceId, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [cards, setCards] = useState([]);
    const [search, setSearch] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [removingMember, setRemovingMember] = useState(false);

    const refreshWorkspace = async () => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const [workspaceRes, projectsRes, cardsRes] = await Promise.allSettled([
                axios.get(`/api/workspaces/${currentWorkspaceId}`),
                axios.get(`/api/projects?workspaceId=${currentWorkspaceId}`),
                axios.get(`/api/board/workspace-cards?workspaceId=${currentWorkspaceId}`),
            ]);

            if (workspaceRes.status === 'fulfilled') {
                setSelectedWorkspace(workspaceRes.value.data);
            } else {
                console.error('Failed to load workspace members', workspaceRes.reason);
            }

            setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data || [] : []);
            setCards(cardsRes.status === 'fulfilled' ? cardsRes.value.data || [] : []);
        } catch (err) {
            console.error('Failed to load workspace members', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshWorkspace();
    }, [currentWorkspaceId]);

    const workspace = selectedWorkspace?.workspace;
    const members = workspace?.members || [];

    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const isOwner = myRole === 'owner';
    const isAdmin = myRole === 'admin';
    const canInvite = isOwner || isAdmin;

    const tasksByUser = useMemo(() => {
        const map = {};
        cards.forEach((card) => {
            (card.assignees || []).forEach((assignee) => {
                const id = assignee?._id || assignee;
                if (!id) return;
                map[id] = (map[id] || 0) + 1;
            });
        });
        return map;
    }, [cards]);

    const projectsByUser = useMemo(() => {
        const map = {};
        projects.forEach((project) => {
            (project.members || []).forEach((member) => {
                const id = member?.user?._id || member?.user;
                if (!id) return;
                map[id] = (map[id] || 0) + 1;
            });
        });
        return map;
    }, [projects]);

    const filteredMembers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return members;
        return members.filter((m) => {
            const name = m.user?.fullname?.toLowerCase() || '';
            const email = m.user?.email?.toLowerCase() || '';
            return name.includes(term) || email.includes(term);
        });
    }, [members, search]);

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.user?.isVerified !== false).length;
    const adminCount = members.filter((m) => ['owner', 'admin'].includes(m.role)).length;
    const totalTasks = cards.length;

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/workspaces/${workspace._id}/role`, { memberId: userId, newRole });
            toast.success('Role updated');
            setOpenMenuId(null);
            refreshWorkspace();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update role');
        }
    };

    const handleKick = (userId, fullname) => {
        setMemberToRemove({ userId, fullname });
        setOpenMenuId(null);
    };

    const confirmKick = async () => {
        if (!memberToRemove?.userId) return;
        setRemovingMember(true);
        try {
            await axios.delete(`/api/workspaces/${workspace._id}/members/${memberToRemove.userId}`);
            toast.success('Member removed');
            setMemberToRemove(null);
            refreshWorkspace();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to remove user');
        } finally {
            setRemovingMember(false);
        }
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view members.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="text-gray-500">Loading members...</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                        <p className="text-gray-500 text-sm">Manage your team members and their permissions.</p>
                    </div>
                    {canInvite && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                        >
                            Invite Member
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Members', value: totalMembers },
                    { label: 'Active', value: activeMembers },
                    { label: 'Admins', value: adminCount },
                    { label: 'Total Tasks', value: totalTasks },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                <Users size={18} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                            onChange={(e) => setSearch(e.target.value)}
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
                            {filteredMembers.map((member) => {
                                const user = member.user || {};
                                const initials = user.fullname
                                    ? user.fullname
                                          .split(' ')
                                          .map((part) => part[0])
                                          .join('')
                                          .substring(0, 2)
                                          .toUpperCase()
                                    : 'U';
                                const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.member;
                                const status = user.isVerified === false ? 'inactive' : 'active';
                                const statusLabel = status === 'active' ? 'Active' : 'Inactive';
                                const isMe = user._id === userInfo?._id;
                                const canChangeRole =
                                    (isOwner && member.role !== 'owner' && !isMe) ||
                                    (isAdmin && member.role === 'member' && !isMe);
                                const canRemove =
                                    (isOwner && member.role !== 'owner' && !isMe) ||
                                    (isAdmin && member.role === 'member' && !isMe);
                                const canManage = isOwner || isAdmin;

                                const roleActionLabel = member.role === 'admin' ? 'Make Member' : 'Make Admin';
                                const roleActionValue = member.role === 'admin' ? 'member' : 'admin';

                                return (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
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
                                                    onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
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
                                                            onClick={() => handleRoleChange(user._id, roleActionValue)}
                                                            disabled={!canChangeRole}
                                                            title={
                                                                canChangeRole
                                                                    ? 'Change role'
                                                                    : member.role === 'owner'
                                                                        ? 'Owner role cannot be changed'
                                                                        : isMe
                                                                            ? 'You cannot change your own role'
                                                                            : isAdmin
                                                                                ? 'Admins can only promote members'
                                                                                : 'Only owners can change roles'
                                                            }
                                                            className={`w-full px-3 py-2 text-left text-xs ${
                                                                canChangeRole
                                                                    ? 'text-gray-700 hover:bg-gray-50'
                                                                    : 'text-gray-300 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {roleActionLabel}
                                                        </button>
                                                        <button
                                                            onClick={() => handleKick(user._id, user.fullname)}
                                                            disabled={!canRemove}
                                                            title={
                                                                canRemove
                                                                    ? 'Remove member'
                                                                    : member.role === 'owner'
                                                                        ? 'Owner cannot be removed'
                                                                        : isMe
                                                                            ? 'You cannot remove yourself'
                                                                            : isAdmin
                                                                                ? 'Admins can only remove members'
                                                                                : 'Only admins can remove members'
                                                            }
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
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredMembers.length === 0 && (
                    <div className="px-6 py-10 text-center text-sm text-gray-400">No matching members found.</div>
                )}
            </div>

            {showInviteModal && (
                <InviteUserModal
                    isOpen={showInviteModal}
                    onClose={() => {
                        setShowInviteModal(false);
                        refreshWorkspace();
                    }}
                    workspaceId={workspace?._id}
                />
            )}

            <ConfirmModal
                isOpen={!!memberToRemove}
                title="Remove Member"
                message={`Remove ${memberToRemove?.fullname || 'this user'} from the workspace?`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                loading={removingMember}
                onClose={() => !removingMember && setMemberToRemove(null)}
                onConfirm={confirmKick}
            />
        </div>
    );
};

export default WorkspaceMembers;
