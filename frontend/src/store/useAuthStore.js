import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // Initial State: Check localStorage
  userInfo: localStorage.getItem('userInfo') 
    ? JSON.parse(localStorage.getItem('userInfo')) 
    : null,

  // Action: Login/Register
  setCredentials: (data) => {
    localStorage.setItem('userInfo', JSON.stringify(data));
    set({ userInfo: data });
  },

  // Action: Update current user profile fields while preserving other auth payload keys
  setUserInfo: (data) =>
    set((state) => {
      const merged = { ...(state.userInfo || {}), ...(data || {}) };
      localStorage.setItem('userInfo', JSON.stringify(merged));
      return { userInfo: merged };
    }),

  // Action: Logout
  logout: () => {
    localStorage.removeItem('userInfo');
    set({ userInfo: null });
  },
}));

export default useAuthStore;
