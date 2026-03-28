import { renderMarkdownLite } from './taskDetailUtils';

const TaskDescriptionSection = ({
    description,
    canEditTask,
    descriptionEditOpen,
    setDescriptionEditOpen,
    setDescription,
    onSave,
    isSaving,
    originalDescription,
}) => {
    return (
        <section className="rounded-xl border border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Description</h3>
                {canEditTask && !descriptionEditOpen && (
                    <button
                        onClick={() => setDescriptionEditOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Edit
                    </button>
                )}
            </div>
            <div className="p-4">
                {descriptionEditOpen ? (
                    <div className="space-y-2">
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            className="w-full h-28 p-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Add a description..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setDescription(originalDescription);
                                    setDescriptionEditOpen(false);
                                }}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => canEditTask && setDescriptionEditOpen(true)}
                        className={`w-full text-left text-sm ${
                            description ? 'text-gray-700' : 'text-gray-400 italic'
                        }`}
                    >
                        {description ? (
                            <span dangerouslySetInnerHTML={{ __html: renderMarkdownLite(description) }} />
                        ) : (
                            'Add a description...'
                        )}
                    </button>
                )}
            </div>
        </section>
    );
};

export default TaskDescriptionSection;
