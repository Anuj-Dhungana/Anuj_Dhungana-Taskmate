import { create } from 'zustand';

const useRightPanelStore = create((set) => ({
    isOpen: false,
    panelType: null,
    panelData: null,
    
    openPanel: (type, data) => set({ isOpen: true, panelType: type, panelData: data }),
    closePanel: () => set({ isOpen: false, panelType: null, panelData: null }),
}));

export default useRightPanelStore;
