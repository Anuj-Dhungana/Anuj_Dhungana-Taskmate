import { X } from 'lucide-react';

const ChannelEditorModal = ({
    isOpen,
    mode = 'create',
    value,
    error = '',
    loading = false,
    onChange,
    onClose,
    onSubmit,
}) => {
    if (!isOpen) return null;

    const isRename = mode === 'rename';
    const title = isRename ? 'Rename Channel' : 'Create Channel';
    const actionText = isRename ? 'Save Changes' : 'Create Channel';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-500">
                            {isRename ? 'Update the channel name.' : 'Add a new channel for your workspace.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        aria-label="Close channel modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit?.();
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Channel Name</label>
                        <input
                            value={value}
                            onChange={(event) => onChange?.(event.target.value)}
                            placeholder="e.g. product-updates"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            autoFocus
                        />
                        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Please wait...' : actionText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChannelEditorModal;
