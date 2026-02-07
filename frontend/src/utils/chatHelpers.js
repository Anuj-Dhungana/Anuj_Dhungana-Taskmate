/**
 * Process DM threads to include display metadata
 */
export const processDmThreads = (dmThreads, memberLookup, currentUserId) => {
    return dmThreads.map((dm) => {
        const membersList = dm.members || [];
        const other = membersList.find((m) => {
            const id = m?._id || m;
            return id && id.toString() !== currentUserId;
        });
        const otherUser = other?._id ? other : memberLookup[other] || null;
        return {
            ...dm,
            type: 'dm',
            displayName: otherUser?.fullname || 'Direct Message',
            displayEmail: otherUser?.email || '',
            displayAvatar: otherUser?.avatar || '',
        };
    });
};

/**
 * Create member lookup map from workspace members
 */
export const createMemberLookup = (members) => {
    const map = {};
    members.forEach((m) => {
        if (m?.user?._id) {
            map[m.user._id] = m.user;
        }
    });
    return map;
};

/**
 * Filter channels by search term
 */
export const filterChannels = (channels, searchTerm) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return channels;
    return channels.filter((ch) => ch.name.toLowerCase().includes(term));
};

/**
 * Filter DMs by search term (name or email)
 */
export const filterDMs = (dmThreads, searchTerm) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return dmThreads;
    return dmThreads.filter((dm) => {
        const name = dm.displayName?.toLowerCase() || '';
        const email = dm.displayEmail?.toLowerCase() || '';
        return name.includes(term) || email.includes(term);
    });
};

/**
 * Filter members for DM picker
 */
export const filterMembersForDm = (members, searchTerm, currentUserId) => {
    const term = searchTerm.trim().toLowerCase();
    return members
        .map((m) => m.user)
        .filter((u) => u && u._id !== currentUserId)
        .filter((u) => {
            if (!term) return true;
            return (
                u.fullname?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term)
            );
        });
};

/**
 * Select preferred channel from combined list
 */
export const selectPreferredChannel = (channels, dmThreads, preferred, current) => {
    const combined = [...channels, ...dmThreads];
    const preferredId = preferred?._id;
    
    if (preferredId) {
        const match = combined.find((c) => c._id === preferredId);
        if (match) return match;
    }
    
    if (current) {
        const match = combined.find((c) => c._id === current._id);
        if (match) return match;
    }
    
    return channels[0] || dmThreads[0] || null;
};
