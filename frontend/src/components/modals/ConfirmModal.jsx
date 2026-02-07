import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    requireText = '',
    onConfirm,
    onClose,
    loading = false,
}) => {
    const [typedValue, setTypedValue] = useState('');
    const requiresInput = Boolean(requireText);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !loading) {
                setTypedValue('');
                onClose?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const canConfirm = !loading && (!requiresInput || typedValue === requireText);
    const confirmButtonClass =
        variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
            : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300';

    const handleClose = () => {
        if (loading) return;
        setTypedValue('');
        onClose?.();
    };

    const handleConfirm = () => {
        if (!canConfirm) return;
        setTypedValue('');
        onConfirm?.();
    };

    return (
        <div
            className="fixed inset-0 z-70 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">{title}</h3>
                            <p className="mt-1 text-sm text-gray-600">{message}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                        aria-label="Close confirmation modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                {requiresInput && (
                    <div className="px-5 pt-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Type "{requireText}" to confirm
                        </label>
                        <input
                            type="text"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder={requireText}
                            autoFocus
                        />
                    </div>
                )}

                <div className="px-5 py-4 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${confirmButtonClass}`}
                    >
                        {loading ? 'Please wait...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
