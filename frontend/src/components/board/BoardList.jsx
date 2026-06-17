import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus, Circle, Clock3, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import api from '../../api';
import { emitProjectDataChanged } from '../../utils/projectEvents';

/* Column icon + accent colour by list title */
const columnMeta = {
  'To Do':       { icon: Circle,       color: 'text-gray-400',  dot: 'bg-gray-400' },
  'In Progress': { icon: Clock3,       color: 'text-blue-500',  dot: 'bg-blue-500' },
  'Done':        { icon: CheckCircle2, color: 'text-green-500', dot: 'bg-green-500' },
  'Completed':   { icon: CheckCircle2, color: 'text-green-500', dot: 'bg-green-500' },
};

const BoardList = ({ list, cards, onCardAdded, onCardDelete, onCardClick, canDragCard, isAdminOrOwner }) => {
  const { setNodeRef } = useDroppable({ id: list._id });
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const meta = columnMeta[list.title] || columnMeta['To Do'];
  const Icon = meta.icon;

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return setIsAdding(false);

    try {
      const res = await api.post('/api/board/cards', {
        title: newCardTitle,
        listId: list._id,
        projectId: list.projectId,
      });
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
    <div className="min-w-[280px] flex-1 bg-gray-50/80 rounded-2xl p-3 shrink-0 flex flex-col max-h-full border border-gray-200/60">
      {/* ─── Column Header ─── */}
      <div className="flex items-center justify-between px-1.5 mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} className={meta.color} />
          <h3 className="text-[13px] font-semibold text-gray-700">{list.title}</h3>
          <span className="text-[11px] font-medium text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded-md">
            {cards.length}
          </span>
        </div>
        {isAdminOrOwner && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* ─── Task Cards ─── */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto min-h-15 px-0.5 space-y-0"
      >
        <SortableContext
          items={cards.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-8">No tasks yet</div>
          ) : (
            cards.map((card) => (
              <TaskCard
                key={card._id}
                card={card}
                onDelete={onCardDelete}
                onClick={() => onCardClick(card)}
                canDrag={canDragCard ? canDragCard(card) : true}
                canEdit={isAdminOrOwner}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* ─── Inline Add Task (triggered from header +) ─── */}
      {isAdding && (
        <form onSubmit={handleAddCard} className="mt-2">
          <input
            autoFocus
            className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
            placeholder="Task title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onBlur={() => !newCardTitle && setIsAdding(false)}
          />
          <div className="flex gap-2 mt-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition">
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-gray-500 hover:text-gray-700 text-xs font-medium transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BoardList;
