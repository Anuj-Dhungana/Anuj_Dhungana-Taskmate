import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Sparkles, Loader2, CheckCircle2, ListTodo, Trash2, RotateCcw } from 'lucide-react';

const AiTaskGeneratorModal = ({ isOpen, onClose, projectId, onCreated }) => {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [result, setResult] = useState(null); // { tasks: [...] }
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a feature or idea to break down');
            return;
        }
        setError('');
        setGenerating(true);
        setResult(null);

        try {
            const res = await axios.post('/api/ai/generate', {
                prompt: prompt.trim(),
                actionType: 'generate_tasks',
            });
            setResult(res.data);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to generate tasks. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setGenerating(false);
        }
    };

    const handleRemoveTask = (index) => {
        if (!result) return;
        const newTasks = result.tasks.filter((_, i) => i !== index);
        setResult({ ...result, tasks: newTasks });
    };

    const handleCreateTasks = async () => {
        if (!result || !result.tasks?.length) return;
        setCreating(true);
        setError('');

        try {
            // Step 1: Fetch the board to find the "To Do" list
            const boardRes = await axios.get(`/api/board/${projectId}`);
            const lists = boardRes.data.lists || [];
            
            // Find the "To Do" list
            let targetList = lists.find((l) => l.title.toLowerCase() === 'to do');
            
            // If it doesn't exist, create it
            if (!targetList) {
                const listRes = await axios.post('/api/board/lists', {
                    title: 'To Do',
                    projectId: projectId,
                });
                targetList = listRes.data;
            }

            // Step 2: Create all tasks (cards) in the target list
            const cardPromises = result.tasks.map((task) =>
                axios.post('/api/board/cards', {
                    title: task.title,
                    description: task.description || '',
                    listId: targetList._id,
                    projectId: projectId,
                })
            );
            await Promise.all(cardPromises);

            toast.success(`${result.tasks.length} tasks added to your project!`);
            
            onCreated?.(); // Refresh the board
            onClose();     // Close the modal
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to add tasks. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setPrompt('');
        setResult(null);
        setError('');
        setGenerating(false);
        setCreating(false);
        onClose();
    };

    const handleReset = () => {
        setResult(null);
        setError('');
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center px-4"
            onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="AI Task Generator"
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">AI Task Generator</h2>
                            <p className="text-[11px] text-gray-500">Break down a feature into actionable tasks</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 flex items-center justify-center transition"
                        aria-label="Close AI modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Prompt Input */}
                    {!result && (
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-700 tracking-wide">
                                What feature or idea do you want to break down?
                            </label>
                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => {
                                        setPrompt(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="e.g., Build the authentication module with Google Sign-in..."
                                    className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition resize-none text-sm bg-gray-50/50"
                                    disabled={generating || creating}
                                    autoFocus
                                />
                                {generating && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                        <div className="flex items-center gap-2 text-indigo-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-100">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span className="text-sm font-medium">Generating tasks...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {error && (
                                <p className="text-xs font-medium text-red-500 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Preview Generated Tasks */}
                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <ListTodo size={16} className="text-indigo-500" />
                                    Generated Tasks ({result.tasks?.length || 0})
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1.5 rounded-md transition"
                                >
                                    <RotateCcw size={12} /> Regenerate
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {result.tasks?.map((task, idx) => (
                                    <div 
                                        key={idx} 
                                        className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors shadow-sm shadow-gray-100/50"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-100">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 pr-6">
                                                <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                                                {task.description && (
                                                    <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTask(idx)}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove task"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {result.tasks?.length === 0 && (
                                    <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                                        No tasks generated. Try tweaking your prompt.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500 font-medium">
                        Tasks will be added to the "To Do" list
                    </p>
                    
                    {!result ? (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={generating || !prompt.trim()}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                                    generating || !prompt.trim()
                                        ? 'bg-blue-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200'
                                }`}
                            >
                                {generating ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        Generate Tasks
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateTasks}
                                disabled={creating || !result.tasks?.length}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                                    creating || !result.tasks?.length
                                        ? 'bg-blue-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200'
                                }`}
                            >
                                {creating ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Adding Tasks...
                                    </>
                                ) : (
                                    'Add to Project'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiTaskGeneratorModal;
