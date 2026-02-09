import { ChevronDown, ChevronUp } from 'lucide-react';
import { COLOR_OPTIONS } from '../../hooks/useProjectForm';

const ProjectAdvancedOptions = ({
    isOpen,
    onToggle,
    projectColor,
    onColorChange,
    projectLabel,
    onLabelChange,
    calendarEnabled,
    onCalendarChange,
}) => {
    return (
        <div className="border border-gray-200 rounded-xl p-3">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
            >
                <span>Advanced Options</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="mt-3 space-y-3">
                    <div>
                        <p className="text-xs text-gray-600 mb-1">Project Color</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {COLOR_OPTIONS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => onColorChange(color)}
                                    className={`w-7 h-7 rounded-full border-2 ${
                                        projectColor === color ? 'border-gray-900' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select ${color} project color`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Project Label</label>
                        <input
                            type="text"
                            value={projectLabel}
                            onChange={(e) => onLabelChange(e.target.value)}
                            placeholder="e.g., UI, Backend, Frontend, Design"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Appears next to project title</p>
                    </div>

                    <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                        <span className="text-gray-700">Enable project calendar</span>
                        <input
                            type="checkbox"
                            checked={calendarEnabled}
                            onChange={(e) => onCalendarChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                </div>
            )}
        </div>
    );
};

export default ProjectAdvancedOptions;
