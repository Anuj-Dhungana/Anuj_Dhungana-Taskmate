export const PRIORITY_STYLES = {
    High: 'bg-red-100 text-red-700 border border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

export const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export const renderMarkdownLite = (value = '') => {
    const escaped = escapeHtml(value);
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withLinks = withBold.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 underline">$1</a>'
    );
    return withLinks.replace(/\n/g, '<br/>');
};

export const renderCommentLite = (value = '') => {
    const escaped = escapeHtml(value);
    const withMentions = escaped.replace(
        /@([A-Za-z0-9_.-]+(?:\s+[A-Za-z0-9_.-]+)?)/g,
        '<span class="inline-block px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-medium">@$1</span>'
    );
    const withBold = withMentions.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withLinks = withBold.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 underline">$1</a>'
    );
    return withLinks.replace(/\n/g, '<br/>');
};

export const normalizeDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

export const formatRelativeTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

export const initialsFromName = (name = '') =>
    String(name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U';

export const isImageUrl = (url = '') => /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);

export const extractUserId = (member) =>
    String(member?.user?._id || member?.user || member?._id || '');

export const toCommentAuthor = (comment) => comment?.author || {};
