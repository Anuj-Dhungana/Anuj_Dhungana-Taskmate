import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskCard = ({ card }) => {
  // Hook to make this element draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card._id, data: { ...card } });

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
      className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-grab hover:border-blue-400 mb-2 touch-none"
    >
      <h4 className="text-sm font-medium text-gray-800">{card.title}</h4>
      
      {/* Show Assignees if any */}
      {card.assignees && card.assignees.length > 0 && (
        <div className="flex mt-2">
            {card.assignees.map(u => (
                <div key={u._id} className="w-5 h-5 rounded-full bg-blue-100 text-[10px] flex items-center justify-center text-blue-700 font-bold border border-white -ml-1 first:ml-0">
                    {u.fullname.substring(0,1)}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;