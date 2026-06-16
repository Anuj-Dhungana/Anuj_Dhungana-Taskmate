import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Sparkles, Loader2, CheckCircle2, Trash2, RotateCcw, Zap } from 'lucide-react';

const AiSubtaskGeneratorModal = ({ isOpen, onClose, cardId, taskTitle, taskDescription, onCreated }) => {
    const [generating, setGenerating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [subtasks, setSubtasks] = useState([]);
    const [error, setError] = useState('');
    const [hasGenerated, setHasGenerated] = useState(false);

    // Auto-generate on open
    useEffect(() => {
        if (isOpen && taskTitle && !hasGenerated) {
            handleGenerate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setError('');
        setGenerating(true);
        setSubtasks([]);

        try {
            const res = await axios.post('/api/ai/generate', {
                actionType: 'breakdown_task',
                taskTitle: taskTitle,
                taskDescription: taskDescription || '',
            });
            setSubtasks(res.data.subtasks || []);
            setHasGenerated(true);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to break down task. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setGenerating(false);
        }
    };

    const handleRemoveSubtask = (index) => {
        setSubtasks((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCreateSubtasks = async () => {
        if (!subtasks.length) return;
        setCreating(true);
        setError('');

        try {
            const promises = subtasks.map((text) =>
                axios.post(`/api/board/cards/${cardId}/subtasks`, { text })
            );
            await Promise.all(promises);

            toast.success(`${subtasks.length} subtasks added!`);
            onCreated?.();
            handleClose();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create subtasks. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setSubtasks([]);
        setError('');
        setGenerating(false);
        setCreating(false);
        setHasGenerated(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4"
            onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="AI Task Breakdown"
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <Zap size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Break Down Task</h2>
                            <p className="text-[11px] text-gray-500 truncate max-w-[260px]">{taskTitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 flex items-center justify-center transition"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* Loading State */}
                    {generating && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                                <Loader2 size={22} className="animate-spin text-violet-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Analyzing task and generating subtasks...</p>
                            <p className="text-xs text-gray-400">This usually takes a few seconds</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !generating && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 mx-auto bg-red-100 px-3 py-1.5 rounded-md transition"
                            >
                                <RotateCcw size={12} /> Try Again
                            </button>
                        </div>
                    )}

                    {/* Generated Subtasks */}
                    {!generating && subtasks.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-violet-500" />
                                    Generated Subtasks ({subtasks.length})
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1.5 bg-violet-50 px-2.5 py-1.5 rounded-md transition"
                                >
                                    <RotateCcw size={12} /> Regenerate
                                </button>
                            </div>

                            <div className="space-y-2">
                                {subtasks.map((text, idx) => (
                                    <div
                                        key={idx}
                                        className="group relative flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-violet-300 transition-colors shadow-sm"
                                    >
                                        <div className="shrink-0 w-5 h-5 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center text-[10px] font-bold border border-violet-100">
                                            {idx + 1}
                                        </div>
                                        <span className="flex-1 text-sm text-gray-800 font-medium">{text}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubtask(idx)}
                                            className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove subtask"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty after generation */}
                    {!generating && hasGenerated && subtasks.length === 0 && !error && (
                        <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No subtasks generated. Try regenerating.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    {subtasks.length > 0 && (
                        <button
                            type="button"
                            onClick={handleCreateSubtasks}
                            disabled={creating}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                                creating
                                    ? 'bg-violet-300 cursor-not-allowed'
                                    : 'bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-200'
                            }`}
                        >
                            {creating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} />
                                    Create as Subtasks
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiSubtaskGeneratorModal;
