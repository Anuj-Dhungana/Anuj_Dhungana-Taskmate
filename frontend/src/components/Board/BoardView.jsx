import { useState, useEffect, useMemo, useCallback } from 'react';
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
import TaskDetailModal from './TaskDetailModal';
import CreateTaskModal from './CreateTaskModal';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import useWorkspaceStore from '../../store/useWorkspaceStore';
import useAuthStore from '../../store/useAuthStore';
import { addProjectDataChangedListener, emitProjectDataChanged } from '../../utils/projectEvents';

const BoardView = ({ projectId, project, onBack }) => {
    const [lists, setLists] = useState([]);
    const [cards, setCards] = useState([]);
    const [newListTitle, setNewListTitle] = useState('');
    const [activeId, setActiveId] = useState(null); // For drag overlay
    const [selectedCard, setSelectedCard] = useState(null);
    const [filter, setFilter] = useState('All');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const { selectedWorkspace } = useWorkspaceStore();
    const { userInfo } = useAuthStore();

    const workspaceMembers = selectedWorkspace?.workspace?.members || [];
    const myRole = workspaceMembers.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';
    const myUserId = userInfo?._id;

    const canDragCard = (card) => {
        if (isAdminOrOwner) return true;
        if (!myUserId) return false;
        const assignees = card.assignees || [];
        return assignees.some((a) => (a?._id || a).toString() === myUserId);
    };

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
    const fetchBoard = useCallback(async () => {
        try {
            const res = await axios.get(`/api/board/${projectId}`);
            setLists(res.data.lists);
            setCards(res.data.cards);
        } catch (err) { console.error(err); }
    }, [projectId]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    useEffect(() => {
        const unsubscribe = addProjectDataChangedListener((detail) => {
            if (detail?.projectId && String(detail.projectId) !== String(projectId)) return;
            fetchBoard();
        });
        return unsubscribe;
    }, [fetchBoard, projectId]);

    // Create New List
    const handleAddList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;
        try {
            const res = await axios.post('/api/board/lists', { title: newListTitle, projectId });
            setLists((prev) => [...prev, res.data]);
            setNewListTitle('');
            emitProjectDataChanged({
                workspaceId: selectedWorkspace?.workspace?._id,
                projectId,
                source: 'board-add-list',
            });
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
                emitProjectDataChanged({
                    workspaceId: selectedWorkspace?.workspace?._id,
                    projectId,
                    source: 'board-reorder-card',
                });
            } catch (err) {
                console.error("Failed to save order", err);
                fetchBoard();
            }
        }
    };

    // Derived stats for header
    const listCounts = useMemo(() => {
        const map = {};
        lists.forEach((l) => {
            map[l._id] = 0;
        });
        cards.forEach((c) => {
            map[c.listId] = (map[c.listId] || 0) + 1;
        });
        return map;
    }, [lists, cards]);

    const totalTasks = cards.length;
    const doneList = lists.find((l) => l.title?.toLowerCase() === 'done');
    const doneCount = doneList ? listCounts[doneList._id] || 0 : 0;
    const progress = totalTasks === 0 ? 0 : Math.round((doneCount / totalTasks) * 100);

    const filteredLists = useMemo(() => {
        if (filter === 'All') return lists;
        return lists.filter((l) => l.title?.toLowerCase() === filter.toLowerCase());
    }, [filter, lists]);

    const handleAddTaskClick = () => {
        setFilter('All');
        setShowTaskModal(true);
    };

    const filters = ['All', 'To Do', 'In Progress', 'Done'];

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-2 pb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="text-sm text-gray-600 hover:text-blue-600 inline-flex items-center gap-1"
                                >
                                    <ArrowLeft size={14} /> Back
                                </button>
                            )}
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">{project?.name || 'Project Board'}</h2>
                        <p className="text-sm text-gray-500">{project?.description || 'Track tasks across lists'}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs">
                            {filters.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-full border text-gray-700 transition ${
                                        filter === f ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                            <span>Progress:</span>
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                <span className="text-gray-800 font-semibold text-xs">{progress}%</span>
                            </div>
                        </div>
                        <button
                            onClick={handleAddTaskClick}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition"
                        >
                            <Plus size={16} /> Add Task
                        </button>
                        <button className="w-9 h-9 rounded-md border flex items-center justify-center text-gray-500 hover:text-gray-700">
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-600 px-2 pb-4">
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">{totalTasks} Tasks</span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">{listCounts[lists.find(l => l.title?.toLowerCase() === 'to do')?._id] || 0} To Do</span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">{listCounts[lists.find(l => l.title?.toLowerCase() === 'in progress')?._id] || 0} In Progress</span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">{doneCount} Done</span>
                </div>

                <div className="flex-1 overflow-x-auto p-2 flex items-start space-x-4">
                    {/* Render Lists */}
                    {filteredLists.map(list => (
                        <BoardList 
                            key={list._id} 
                            list={list} 
                            cards={cards.filter(c => c.listId === list._id)}
                            // Pass this function to update state when a card is created
                            onCardAdded={(newCard) => setCards((prev) => [...prev, newCard])}
                            onCardDelete={handleDeleteCard}
                            onCardClick={handleCardClick}
                            canDragCard={canDragCard}
                        />
                    ))}

                    {/* Add New List Input */}
                    {isAdminOrOwner ? (
                        <div className="w-72 shrink-0">
                            <form onSubmit={handleAddList} className="bg-white/50 hover:bg-white p-2 rounded transition cursor-pointer border border-dashed border-gray-300">
                                <input 
                                    type="text" 
                                    placeholder="+ Add another list" 
                                    className="w-full bg-transparent p-2 outline-none font-medium placeholder-gray-600"
                                    value={newListTitle}
                                    onChange={e => setNewListTitle(e.target.value)}
                                />
                            </form>
                        </div>
                    ) : (
                        <div className="w-72 shrink-0">
                            <div
                                title="Only admins can create lists"
                                className="bg-gray-50 p-2 rounded border border-dashed border-gray-200 text-gray-400 text-sm font-medium"
                            >
                                + Add another list
                            </div>
                        </div>
                    )}
                </div>
            
            <CreateTaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                projectId={projectId}
                lists={lists}
                workspaceMembers={workspaceMembers}
                onCreated={(newCard) => {
                            setCards((prev) => [...prev, newCard]);
                            const targetList = lists.find((l) => l._id === newCard.listId);
                            if (targetList) {
                                const label = targetList.title;
                                if (['to do', 'in progress', 'done'].includes(label?.toLowerCase())) {
                                    setFilter(label);
                                }
                            }
                            setShowTaskModal(false);
                        }}
            />
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
                onUpdate={fetchBoard}
            />

        </DndContext>
    );
};

export default BoardView;
