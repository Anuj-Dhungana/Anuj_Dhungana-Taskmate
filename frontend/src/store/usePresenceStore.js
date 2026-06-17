import { create } from 'zustand';

const usePresenceStore = create((set, get) => ({
    onlineUserIds: new Set(),

    setOnlineUsers: (userIds) => {
        set({ onlineUserIds: new Set(userIds) });
    },

    addOnlineUser: (userId) => {
        set((state) => {
            const next = new Set(state.onlineUserIds);
            next.add(String(userId));
            return { onlineUserIds: next };
        });
    },

    removeOnlineUser: (userId) => {
        set((state) => {
            const next = new Set(state.onlineUserIds);
            next.delete(String(userId));
            return { onlineUserIds: next };
        });
    },

    isOnline: (userId) => {
        return get().onlineUserIds.has(String(userId));
    },
}));

export default usePresenceStore;
