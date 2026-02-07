import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { emitProjectDataChanged } from '../../utils/projectEvents';


const BoardList = ({ list, cards, onCardAdded, onCardDelete, onCardClick, canDragCard }) => { // Accept onCardAdded, onCardDelete, onCardClick props
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
        emitProjectDataChanged({
            projectId: list.projectId,
            source: 'board-list-add-card',
        });
        setNewCardTitle('');
        setIsAdding(false);
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="w-72 bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 shadow-md flex-shrink-0 flex flex-col max-h-full border-2 border-gray-200">
      {/* Header */}
      <h3 className="font-bold text-gray-800 mb-3 flex justify-between items-center text-sm">
        {list.title}
        <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
            {cards.length}
        </span>
      </h3>

      {/* Droppable Area (Cards go here) */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px] bg-gradient-to-b from-gray-50 to-gray-100/50 rounded-xl border-2 border-dashed border-gray-300 p-3">
        <SortableContext 
            items={cards.map(c => c._id)} 
            strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-6">No tasks</div>
          ) : (
            cards.map((card) => (
              <TaskCard
                key={card._id}
                card={card}
                onDelete={onCardDelete}
                onClick={() => onCardClick(card)}
                canDrag={canDragCard ? canDragCard(card) : true}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Dynamic Footer */}
      {isAdding ? (
          <form onSubmit={handleAddCard} className="mt-2">
              <input 
                  className="w-full p-2.5 rounded-xl border-2 border-blue-500 shadow-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                 placeholder="Enter title..."
                 value={newCardTitle}
                 onChange={e => setNewCardTitle(e.target.value)}
                    onBlur={() => !newCardTitle && setIsAdding(false)} // Close if empty and clicked away
              />
              <div className="flex gap-2 mt-2">
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-4 py-1.5 rounded-lg font-medium shadow-md hover:from-blue-700 hover:to-blue-800 transition-all">Add</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors">Cancel</button>
              </div>
          </form>
      ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="mt-3 w-full text-left text-gray-600 hover:bg-gray-100 p-2 rounded-lg text-sm flex items-center font-medium transition-all hover:shadow-sm"
          >
             <Plus size={16} className="mr-1.5"/> Add a card
          </button>
      )}
    </div>
  );
};

export default BoardList;
