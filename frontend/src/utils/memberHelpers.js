import { Crown, Shield, User as UserIcon } from 'lucide-react';

export const ROLE_STYLES = {
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

export const STATUS_STYLES = {
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
    online: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getMemberInitials = (fullname) => {
    if (!fullname) return 'U';
    return fullname
        .split(' ')
        .map((part) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

export const getMemberStatus = (user) => {
    return user?.isVerified === false ? 'inactive' : 'active';
};

export const canChangeRole = (myRole, memberRole, isMe) => {
    if (isMe) return false;
    if (myRole === 'owner' && memberRole !== 'owner') return true;
    // Admins cannot change any roles — only owners can promote/demote
    return false;
};

export const canRemoveMember = (myRole, memberRole, isMe) => {
    if (isMe) return false;
    if (myRole === 'owner' && memberRole !== 'owner') return true;
    if (myRole === 'admin' && memberRole === 'member') return true;
    return false;
};

export const getRoleActionLabel = (role) => {
    return role === 'admin' ? 'Make Member' : 'Make Admin';
};

export const getRoleActionValue = (role) => {
    return role === 'admin' ? 'member' : 'admin';
};

export const calculateMemberStats = (members, cards) => {
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.user?.isVerified !== false).length;
    const adminCount = members.filter((m) => ['owner', 'admin'].includes(m.role)).length;
    const totalTasks = cards.length;

    return { totalMembers, activeMembers, adminCount, totalTasks };
};

export const buildTasksByUser = (cards) => {
    const map = {};
    cards.forEach((card) => {
        (card.assignees || []).forEach((assignee) => {
            const id = assignee?._id || assignee;
            if (!id) return;
            map[id] = (map[id] || 0) + 1;
        });
    });
    return map;
};

export const buildProjectsByUser = (projects) => {
    const map = {};
    projects.forEach((project) => {
        (project.members || []).forEach((member) => {
            const id = member?.user?._id || member?.user;
            if (!id) return;
            map[id] = (map[id] || 0) + 1;
        });
    });
    return map;
};

export const filterMembers = (members, searchTerm) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) => {
        const name = m.user?.fullname?.toLowerCase() || '';
        const email = m.user?.email?.toLowerCase() || '';
        return name.includes(term) || email.includes(term);
    });
};
