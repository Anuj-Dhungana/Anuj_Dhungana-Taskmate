// Workspace color options
export const WORKSPACE_COLORS = [
    { name: 'Blue', value: 'bg-blue-500', hex: '#3B82F6' },
    { name: 'Purple', value: 'bg-purple-500', hex: '#A855F7' },
    { name: 'Pink', value: 'bg-pink-500', hex: '#EC4899' },
    { name: 'Orange', value: 'bg-orange-500', hex: '#F97316' },
    { name: 'Green', value: 'bg-green-500', hex: '#10B981' },
    { name: 'Red', value: 'bg-red-500', hex: '#EF4444' },
    { name: 'Teal', value: 'bg-teal-500', hex: '#14B8A6' },
    { name: 'Indigo', value: 'bg-indigo-500', hex: '#6366F1' },
];

// Default workspace color
export const DEFAULT_WORKSPACE_COLOR = 'bg-blue-500';

// Helper to get color class by name
export const getWorkspaceColor = (colorName) => {
    const color = WORKSPACE_COLORS.find(c => c.name.toLowerCase() === colorName?.toLowerCase());
    return color ? color.value : DEFAULT_WORKSPACE_COLOR;
};

// Helper to get hex color by name
export const getWorkspaceColorHex = (colorName) => {
    const color = WORKSPACE_COLORS.find(c => c.name.toLowerCase() === colorName?.toLowerCase());
    return color ? color.hex : WORKSPACE_COLORS[0].hex;
};
