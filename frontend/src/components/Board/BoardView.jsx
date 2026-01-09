import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import BoardList from './BoardList';
import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';

const BoardView = ({ projectId }) => {
    const [lists, setLists] = useState([]);
    const [cards, setCards] = useState([]);
    const [newListTitle, setNewListTitle] = useState('');
    const [activeId, setActiveId] = useState(null); // For drag overlay
const [selectedCard, setSelectedCard] = useState(null);

    // Sensors handle mouse/touch interactions
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // Drag starts after 5px movement
        })
    );

    const handleCardClick = (card) => {
    setSelectedCard(card);
};

    // Fetch Board Data
    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const res = await axios.get(`/api/board/${projectId}`);
                setLists(res.data.lists);
                setCards(res.data.cards);
            } catch (err) { console.error(err); }
        };
        fetchBoard();
    }, [projectId]);

    // Create New List
    const handleAddList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;
        try {
            const res = await axios.post('/api/board/lists', { title: newListTitle, projectId });
            setLists([...lists, res.data]);
            setNewListTitle('');
        } catch (err) { console.error(err); }
    };

    // Delete Card
    const handleDeleteCard = (cardId) => {
        setCards(cards.filter(c => c._id !== cardId));
    };

    //  DRAG AND DROP LOGIC 

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeCardId = active.id;
        const overId = over.id; // Could be a Card ID or a List ID

        // Find the card being dragged
        const activeCard = cards.find(c => c._id === activeCardId);
        
        // Find destination List ID
        let newListId = null;
        
        // Case A: Dropped over another Card
        const overCard = cards.find(c => c._id === overId);
        if (overCard) {
            newListId = overCard.listId;
        } 
        // Case B: Dropped over an empty List
        else {
            const overList = lists.find(l => l._id === overId);
            if (overList) newListId = overList._id;
        }

        if (!newListId) return;

        // Optimistic UI Update
        if (activeCard.listId !== newListId || activeCardId !== overId) {
            
            setCards((prevCards) => {
                const oldIndex = prevCards.findIndex(c => c._id === activeCardId);
                let newIndex;
                
                if (overCard) {
                    newIndex = prevCards.findIndex(c => c._id === overId);
                } else {
                    // Dropped in empty list -> Add to end
                    newIndex = prevCards.length; 
                }

                // Create new array with updated listId
                const updatedCards = [...prevCards];
                updatedCards[oldIndex] = { ...updatedCards[oldIndex], listId: newListId };
                
                return arrayMove(updatedCards, oldIndex, newIndex);
            });

            // API Call to Persist Change
            try {
                await axios.put('/api/board/cards/reorder', {
                    cardId: activeCardId,
                    newListId: newListId,
                    newOrder: 0 // Ideally we calculate index, simplified for now
                });
            } catch (err) {
                console.error("Failed to save order", err);
            }
        }
    };

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full overflow-x-auto p-4 flex items-start space-x-4">
                
                {/* Render Lists */}
                {lists.map(list => (
                    <BoardList 
                        key={list._id} 
                        list={list} 
                        cards={cards.filter(c => c.listId === list._id)}
                        // Pass this function to update state when a card is created
                        onCardAdded={(newCard) => setCards([...cards, newCard])} 
                        onCardDelete={handleDeleteCard}
                        onCardClick={handleCardClick}
                    />
                ))}

                {/* Add New List Input */}
                <div className="w-72 flex-shrink-0">
                    <form onSubmit={handleAddList} className="bg-white/50 hover:bg-white p-2 rounded transition cursor-pointer">
                        <input 
                            type="text" 
                            placeholder="+ Add another list" 
                            className="w-full bg-transparent p-2 outline-none font-medium placeholder-gray-600"
                            value={newListTitle}
                            onChange={e => setNewListTitle(e.target.value)}
                        />
                    </form>
                </div>
            </div>

            {/* Drag Overlay (Visual effect while dragging) */}
            <DragOverlay>
                {activeId ? (
                    <div className="bg-white p-3 rounded shadow-lg border border-blue-500 rotate-2 opacity-90 w-64">
                       {cards.find(c => c._id === activeId)?.title}
                    </div>
                ) : null}
            </DragOverlay>

            <TaskDetailModal 
                isOpen={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                card={selectedCard}
                onUpdate={() => {
                    
                    window.location.reload(); 
                }}
            />

        </DndContext>
    );
};

export default BoardView;