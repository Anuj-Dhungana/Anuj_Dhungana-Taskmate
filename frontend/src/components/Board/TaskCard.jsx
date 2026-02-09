import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, MessageSquare, Paperclip, MoreHorizontal } from 'lucide-react';

const priorityStyles = {
  High: 'bg-red-50 text-red-600 border border-red-200',
  Medium: 'bg-orange-50 text-orange-600 border border-orange-200',
  Low: 'bg-gray-50 text-gray-500 border border-gray-200',
};

const TaskCard = ({ card, onDelete, onClick, canDrag = true, canEdit = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card._id, data: { ...card }, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = card.priority || 'Medium';
  const assignees = card.assignees || [];
  const attachmentCount = card.attachments?.length || 0;
  const hasDueDate = !!card.dueDate;
  const dueDateStr = hasDueDate
    ? new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-4 rounded-xl border border-gray-150 mb-3 touch-none transition-all group ${
        canDrag
          ? 'cursor-grab hover:border-gray-300 hover:shadow-md'
          : 'cursor-pointer hover:bg-gray-50'
      } ${isDragging ? 'shadow-2xl scale-105' : 'shadow-sm'}`}
    >
      {/* Top Row: Priority + Menu */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${priorityStyles[priority]}`}>
          {priority}
        </span>
        {canEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-gray-600 transition"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-800 leading-snug">{card.title}</h4>

      {/* Description (1 line) */}
      {card.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{card.description}</p>
      )}

      {/* Bottom Meta Row */}
      {(hasDueDate || attachmentCount > 0 || assignees.length > 0) && (
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
          {/* Left: Icons */}
          <div className="flex items-center gap-3 text-gray-400">
            {hasDueDate && (
              <span className="flex items-center gap-1 text-[11px]">
                <CalendarDays size={12} />
                {dueDateStr}
              </span>
            )}
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <Paperclip size={12} />
                {attachmentCount}
              </span>
            )}
          </div>

          {/* Right: Assignee Avatars */}
          {assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {assignees.slice(0, 3).map((u) => (
                <div
                  key={u._id}
                  title={u.fullname}
                  className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-[10px] flex items-center justify-center text-white font-bold border-2 border-white shadow-sm"
                >
                  {u.fullname?.charAt(0)?.toUpperCase()}
                </div>
              ))}
              {assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 text-[9px] flex items-center justify-center text-gray-500 font-bold border-2 border-white">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
