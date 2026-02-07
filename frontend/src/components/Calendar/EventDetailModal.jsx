import { format } from 'date-fns';
import { X, Calendar as CalendarIcon, Clock, Flag, CheckCircle2, AlertCircle } from 'lucide-react';
import TypeBadge from './TypeBadge';

const EventDetailModal = ({ event, onClose }) => {
    if (!event) return null;
    
    const meta = event.meta || {};
    const projectName = meta.projectName || event.resource?.projectId?.name || event.resource?.name;
    const listTitle = meta.listTitle || event.resource?.listId?.title;
    const priority = meta.priority || event.resource?.priority;
    const description = meta.description || event.resource?.description;
    const status = event.resource?.status;
    const isProjectEvent = event.source?.startsWith('project');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <TypeBadge type={event.type} />
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                        <X size={18} />
                    </button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{event.title}</h3>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon size={14} />
                        <span>{format(event.start, 'EEEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>{format(event.start, 'h:mm a')} – {format(event.end, 'h:mm a')}</span>
                    </div>
                    {projectName && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Flag size={14} />
                            <span>Project: {projectName}</span>
                        </div>
                    )}
                    {listTitle && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CheckCircle2 size={14} />
                            <span>List: {listTitle}</span>
                        </div>
                    )}
                    {priority && (
                        <div className="flex items-center gap-2 text-sm">
                            <AlertCircle size={14} className={
                                priority === 'High' ? 'text-red-500' :
                                priority === 'Medium' ? 'text-amber-500' : 'text-gray-400'
                            } />
                            <span className="text-gray-500">Priority: {priority}</span>
                        </div>
                    )}
                    {isProjectEvent && status && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <AlertCircle size={14} className="text-indigo-500" />
                            <span>Status: {status}</span>
                        </div>
                    )}
                    {description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                            {description}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetailModal;
