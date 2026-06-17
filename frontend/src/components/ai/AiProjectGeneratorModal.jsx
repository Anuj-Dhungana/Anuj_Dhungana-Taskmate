import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Loader2, CheckCircle2, ListTodo, Trash2, RotateCcw } from 'lucide-react';
import { emitProjectDataChanged } from '../../utils/projectEvents';

const AiProjectGeneratorModal = ({ isOpen, onClose, workspaceId, onCreated }) => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [result, setResult] = useState(null); // { projectName, tasks: [...] }
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a project idea');
            return;
        }
        setError('');
        setGenerating(true);
        setResult(null);

        try {
            const res = await axios.post('/api/ai/generate', {
                prompt: prompt.trim(),
                actionType: 'generate_project',
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

    const handleCreateProject = async () => {
        if (!result || !result.tasks?.length) return;
        setCreating(true);
        setError('');

        try {
            // Step 1: Create the project
            const projectRes = await axios.post('/api/projects', {
                name: result.projectName,
                description: `AI-generated project from: "${prompt.trim()}"`,
                workspaceId: workspaceId,
                status: 'Planning',
                priority: 'Medium',
            });
            const project = projectRes.data;

            // Step 2: Fetch the default lists created by the backend
            const boardRes = await axios.get(`/api/board/${project._id}`);
            const defaultLists = boardRes.data.lists || [];
            
            // Find the "To Do" list, or fallback to the first list if somehow missing
            let targetList = defaultLists.find((l) => l.title.toLowerCase() === 'to do');
            if (!targetList && defaultLists.length > 0) {
                targetList = defaultLists[0];
            }

            // Step 3: Create all tasks (cards) in the target list
            if (targetList) {
                const cardPromises = result.tasks.map((task) =>
                    axios.post('/api/board/cards', {
                        title: task.title,
                        description: task.description || '',
                        listId: targetList._id,
                        projectId: project._id,
                    })
                );
                await Promise.all(cardPromises);
            }

            toast.success(`Project "${result.projectName}" created with ${result.tasks.length} tasks!`);
            
            // Note: We don't need to call onCreated() because we are navigating away from the workspace page.
            // The socket event was already emitted by the backend to update other clients.
            
            onClose();
            navigate(`/projects/${project._id}`);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create project. Please try again.';
            setError(msg);
            toast.error(msg);
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
                aria-label="AI Project Generator"
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">AI Project Generator</h2>
                            <p className="text-[11px] text-gray-500">Describe your idea and let AI create a structured project</p>
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
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            What do you want to build?
                        </label>
                        <textarea
                            rows={3}
                            placeholder='e.g. "Build an ecommerce website with user authentication, product management, and payment integration"'
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-gray-400"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={generating || creating}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !result) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                        />
                    </div>

                    {/* Generate Button (only show if no result yet) */}
                    {!result && (
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating || !prompt.trim()}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                generating || !prompt.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-200'
                            }`}
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Generating tasks with AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate Project Plan
                                </>
                            )}
                        </button>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    {/* Results Preview */}
                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Project Name */}
                            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 size={16} className="text-indigo-600" />
                                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Project Name</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{result.projectName}</h3>
                            </div>

                            {/* Tasks List */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <ListTodo size={16} className="text-gray-500" />
                                        <span className="text-xs font-semibold text-gray-700">
                                            Generated Tasks ({result.tasks?.length || 0})
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition"
                                    >
                                        <RotateCcw size={12} />
                                        Regenerate
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                                    {result.tasks?.map((task, index) => (
                                        <div
                                            key={index}
                                            className="group bg-white border border-gray-150 rounded-xl p-3 hover:border-indigo-200 hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-bold shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                            {task.title}
                                                        </h4>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-xs text-gray-500 mt-1 ml-7 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTask(index)}
                                                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                                    title="Remove task"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (only if we have a result) */}
                {result && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/80">
                        <p className="text-xs text-gray-500">
                            Tasks will be added to a <span className="font-semibold">"To Do"</span> list
                        </p>
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
                                onClick={handleCreateProject}
                                disabled={creating || !result.tasks?.length}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                                    creating || !result.tasks?.length
                                        ? 'bg-indigo-300 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                                }`}
                            >
                                {creating ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Project'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiProjectGeneratorModal;
