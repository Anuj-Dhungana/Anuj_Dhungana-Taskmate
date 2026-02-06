import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskCard = ({ card, onDelete, onClick, canDrag = true }) => {
  // Hook to make this element draggable
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
    opacity: isDragging ? 0.5 : 1, // Fade out when dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners} // This makes the whole card draggable
      onClick={onClick}
      className={`bg-white p-3.5 rounded-xl shadow-md border-2 border-gray-200 mb-2.5 touch-none transition-all ${
        canDrag ? 'cursor-grab hover:border-blue-400 hover:shadow-lg' : 'cursor-pointer'
      }`}
    >
      <h4 className="text-sm font-semibold text-gray-800">{card.title}</h4>
      
      {/* Show Assignees if any */}
      {card.assignees && card.assignees.length > 0 && (
        <div className="flex mt-2.5">
            {card.assignees.map(u => (
                <div key={u._id} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-[10px] flex items-center justify-center text-white font-bold border-2 border-white -ml-1 first:ml-0 shadow-md">
                    {u.fullname.substring(0,1)}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
