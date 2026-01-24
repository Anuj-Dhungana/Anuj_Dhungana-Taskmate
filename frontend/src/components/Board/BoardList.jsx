import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';


const BoardList = ({ list, cards, onCardAdded, onCardDelete, onCardClick }) => { // Accept onCardAdded, onCardDelete, onCardClick props
  // Hook to make this list a "drop zone"
  const { setNodeRef } = useDroppable({
    id: list._id,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = async (e) => {
    e.preventDefault();
    if(!newCardTitle.trim()) return setIsAdding(false);

    try {
        const res = await axios.post('/api/board/cards', {
            title: newCardTitle,
            listId: list._id,
            projectId: list.projectId 
        });
        // We need to tell the parent (BoardView) to update the cards array
        onCardAdded(res.data); 
        setNewCardTitle('');
        setIsAdding(false);
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="w-72 bg-white rounded-lg p-3 shadow-sm flex-shrink-0 flex flex-col max-h-full border">
      {/* Header */}
      <h3 className="font-bold text-gray-700 mb-3 flex justify-between items-center">
        {list.title}
        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {cards.length}
        </span>
      </h3>

      {/* Droppable Area (Cards go here) */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px] bg-gray-50 rounded border border-dashed border-gray-200 p-2">
        <SortableContext 
            items={cards.map(c => c._id)} 
            strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-6">No tasks</div>
          ) : (
            cards.map((card) => (
              <TaskCard key={card._id} card={card} onDelete={onCardDelete} onClick={() => onCardClick(card)} />
            ))
          )}
        </SortableContext>
      </div>

      {/* Dynamic Footer */}
      {isAdding ? (
          <form onSubmit={handleAddCard} className="mt-2">
              <input 
                  className="w-full p-2 rounded border border-blue-500 shadow-sm"
                 placeholder="Enter title..."
                 value={newCardTitle}
                 onChange={e => setNewCardTitle(e.target.value)}
                    onBlur={() => !newCardTitle && setIsAdding(false)} // Close if empty and clicked away
              />
              <div className="flex gap-2 mt-2">
                  <button className="bg-blue-600 text-white text-xs px-3 py-1 rounded">Add</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 text-xs">Cancel</button>
              </div>
          </form>
      ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="mt-2 w-full text-left text-gray-500 hover:bg-gray-200 p-1 rounded text-sm flex items-center"
          >
             <Plus size={16} className="mr-1"/> Add a card
          </button>
      )}
    </div>
  );
};

export default BoardList;