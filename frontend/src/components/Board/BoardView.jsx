import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

const BoardView = ({ projectId }) => {
    const [lists, setLists] = useState([]);
    const [cards, setCards] = useState([]);
    const [newListTitle, setNewListTitle] = useState('');

    // Fetch Board Data
    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const res = await axios.get(`/api/board/${projectId}`);
                setLists(res.data.lists);
                setCards(res.data.cards);
            } catch (err) {
                console.error(err);
            }
        };
        fetchBoard();
    }, [projectId]);

    const handleAddList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;
        try {
            const res = await axios.post('/api/board/lists', { title: newListTitle, projectId });
            setLists([...lists, res.data]);
            setNewListTitle('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-full overflow-x-auto p-4 flex items-start space-x-4">
            {/* Render Lists */}
            {lists.map(list => (
                <div key={list._id} className="w-72 bg-gray-100 rounded-lg p-3 shadow-sm flex-shrink-0">
                    <h3 className="font-bold text-gray-700 mb-3 flex justify-between">
                        {list.title}
                        <span className="text-xs text-gray-400 font-normal">{cards.filter(c => c.listId === list._id).length} tasks</span>
                    </h3>
                    
                    {/* Cards Container */}
                    <div className="space-y-2 mb-3">
                        {cards
                            .filter(card => card.listId === list._id)
                            .map(card => (
                                <div key={card._id} className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-pointer hover:border-blue-400">
                                    <p className="text-sm text-gray-800">{card.title}</p>
                                </div>
                            ))
                        }
                    </div>

                    {/* Add Card Button (Placeholder) */}
                    <button className="w-full text-left text-gray-500 hover:bg-gray-200 p-1 rounded text-sm flex items-center">
                        <Plus size={16} className="mr-1"/> Add a card
                    </button>
                </div>
            ))}

            {/* Add New List Column */}
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
    );
};

export default BoardView;