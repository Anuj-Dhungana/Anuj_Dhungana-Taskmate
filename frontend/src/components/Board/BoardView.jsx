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
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import useWorkspaceStore from '../../store/useWorkspaceStore';
import useAuthStore from '../../store/useAuthStore';
import { addProjectDataChangedListener, emitProjectDataChanged } from '../../utils/projectEvents';

const BoardView = ({ projectId, project, onStatsChange }) => {
    const [lists, setLists] = useState([]);
    const [cards, setCards] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [assigneeFilter, setAssigneeFilter] = useState('Everyone');
    const [hideCompleted, setHideCompleted] = useState(false);
    const { selectedWorkspace } = useWorkspaceStore();
    const { userInfo } = useAuthStore();

    const workspaceMembers = selectedWorkspace?.workspace?.members || [];
    const projectMembers = useMemo(() => {
        if (!Array.isArray(project?.members)) return [];
        return project.members
            .map((m) => m?.user)
            .filter(Boolean);
    }, [project]);
    const myRole = workspaceMembers.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';
    const myUserId = userInfo?._id;

    const canDragCard = (card) => {
        if (isAdminOrOwner) return true;
        if (!myUserId) return false;
        const assignees = card.assignees || [];
        return assignees.some((a) => (a?._id || a).toString() === myUserId);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
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

    // Report stats to parent (ProjectView KPI cards)
    useEffect(() => {
        if (!onStatsChange) return;
        const doneList = lists.find((l) => l.title?.toLowerCase() === 'done' || l.title?.toLowerCase() === 'completed');
        const doneCount = doneList ? cards.filter((c) => c.listId === doneList._id).length : 0;
        onStatsChange({ total: cards.length, done: doneCount });
    }, [lists, cards, onStatsChange]);

    const handleDeleteCard = (cardId) => {
        setCards(cards.filter(c => c._id !== cardId));
    };

    // DRAG AND DROP
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeCardId = active.id;
        const overId = over.id;
        const activeCard = cards.find(c => c._id === activeCardId);
        
        let newListId = null;
        const overCard = cards.find(c => c._id === overId);
        if (overCard) {
            newListId = overCard.listId;
        } else {
            const overList = lists.find(l => l._id === overId);
            if (overList) newListId = overList._id;
        }
        if (!newListId) return;

        if (activeCard.listId !== newListId || activeCardId !== overId) {
            setCards((prevCards) => {
                const oldIndex = prevCards.findIndex(c => c._id === activeCardId);
                let newIndex = overCard
                    ? prevCards.findIndex(c => c._id === overId)
                    : prevCards.length;
                const updatedCards = [...prevCards];
                updatedCards[oldIndex] = { ...updatedCards[oldIndex], listId: newListId };
                return arrayMove(updatedCards, oldIndex, newIndex);
            });

            try {
                await axios.put('/api/board/cards/reorder', {
                    cardId: activeCardId,
                    newListId: newListId,
                    newOrder: 0
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

    // Filtered cards
    const filteredCards = useMemo(() => {
        let result = cards;

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((c) =>
                c.title?.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q)
            );
        }

        // Priority filter
        if (priorityFilter !== 'All') {
            result = result.filter((c) => c.priority === priorityFilter);
        }

        // Assignee filter
        if (assigneeFilter === 'Me' && myUserId) {
            result = result.filter((c) =>
                (c.assignees || []).some((a) => (a?._id || a).toString() === myUserId)
            );
        }

        // Hide completed
        if (hideCompleted) {
            const doneListId = lists.find((l) =>
                l.title?.toLowerCase() === 'done' || l.title?.toLowerCase() === 'completed'
            )?._id;
            if (doneListId) {
                result = result.filter((c) => c.listId !== doneListId);
            }
        }

        return result;
    }, [cards, searchQuery, priorityFilter, assigneeFilter, hideCompleted, lists, myUserId]);

    // Visible lists (hide completed column if toggled)
    const visibleLists = useMemo(() => {
        if (!hideCompleted) return lists;
        return lists.filter((l) =>
            l.title?.toLowerCase() !== 'done' && l.title?.toLowerCase() !== 'completed'
        );
    }, [lists, hideCompleted]);

    const handleAddTaskClick = () => {
        setShowTaskModal(true);
    };

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col">
                {/* ─── Filters Bar ─── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-56 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition">
                            <Search size={14} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder-gray-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Priority Filter */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                            {['All', 'High', 'Medium', 'Low'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriorityFilter(p)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                                        priorityFilter === p
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Assignee Filter */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                            {['Everyone', 'Me'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setAssigneeFilter(f)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                                        assigneeFilter === f
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Hide Completed Toggle */}
                        <button
                            onClick={() => setHideCompleted((v) => !v)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                                hideCompleted
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            Hide completed
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{cards.length} tasks</span>
                        <button
                            onClick={handleAddTaskClick}
                            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                        >
                            <Plus size={15} /> Add Task
                        </button>
                    </div>
                </div>

                {/* ─── Task label ─── */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Tasks</h3>
                    <span className="text-xs text-gray-400">Board</span>
                </div>

                {/* ─── Kanban Columns ─── */}
                <div className="w-full flex items-start gap-4 overflow-x-auto pb-4">
                    {visibleLists.map(list => (
                        <BoardList 
                            key={list._id} 
                            list={list} 
                            cards={filteredCards.filter(c => c.listId === list._id)}
                            onCardAdded={(newCard) => setCards((prev) => [...prev, newCard])}
                            onCardDelete={handleDeleteCard}
                            onCardClick={handleCardClick}
                            canDragCard={canDragCard}
                            isAdminOrOwner={isAdminOrOwner}
                        />
                    ))}
                </div>
            
                <CreateTaskModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    projectId={projectId}
                    lists={lists}
                    workspaceMembers={workspaceMembers}
                    projectMembers={projectMembers}
                    onCreated={(newCard) => {
                        setCards((prev) => [...prev, newCard]);
                        setShowTaskModal(false);
                    }}
                />
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeId ? (
                    <div className="bg-white p-3 rounded-xl shadow-2xl border border-blue-400 rotate-2 opacity-90 w-72">
                       <span className="text-sm font-semibold text-gray-800">{cards.find(c => c._id === activeId)?.title}</span>
                    </div>
                ) : null}
            </DragOverlay>

            <TaskDetailModal 
                isOpen={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                card={selectedCard}
                projectMembers={projectMembers}
                onUpdate={fetchBoard}
            />

        </DndContext>
    );
};

export default BoardView;
