import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const CreatePollModal = ({ isOpen, onClose, onSubmit }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [multipleAnswers, setMultipleAnswers] = useState(false);

    if (!isOpen) return null;

    const handleOptionChange = (idx, value) => {
        const newOptions = [...options];
        newOptions[idx] = value;
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (idx) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== idx);
            setOptions(newOptions);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validOptions = options.filter(opt => opt.trim() !== '');
        
        if (!question.trim() || validOptions.length < 2) {
            return;
        }

        const pollData = {
            question: question.trim(),
            options: validOptions.map(opt => ({ text: opt, votes: [] })),
            multipleAnswers
        };

        onSubmit(pollData);
        
        // Reset
        setQuestion('');
        setOptions(['', '']);
        setMultipleAnswers(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] sm:p-6 backdrop-blur-sm">
            <div 
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Create Poll</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        
                        {/* Question */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Question</label>
                            <input
                                type="text"
                                placeholder="Ask a question..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                autoFocus
                            />
                        </div>

                        {/* Options */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Options</label>
                            <div className="space-y-3">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Option ${index + 1}`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                        />
                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(index)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {options.length < 10 && (
                                <button
                                    type="button"
                                    onClick={handleAddOption}
                                    className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-1 pb-1"
                                >
                                    <Plus size={16} />
                                    Add another option
                                </button>
                            )}
                        </div>

                        {/* Settings */}
                        <div className="pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={multipleAnswers}
                                        onChange={(e) => setMultipleAnswers(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-10 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out ${multipleAnswers ? 'bg-indigo-600' : ''}`}></div>
                                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm ${multipleAnswers ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Multiple answers</span>
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
                        >
                            Create Poll
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePollModal;
