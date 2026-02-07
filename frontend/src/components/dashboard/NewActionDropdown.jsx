import { useState, useRef, useEffect } from 'react';
import { Plus, FolderKanban, CheckSquare, UserPlus } from 'lucide-react';

const NewActionDropdown = ({ canInvite, onCreateProject, onCreateTask, onInviteMember }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const actions = [
        { label: 'Create Project', icon: FolderKanban, onClick: onCreateProject },
        { label: 'Create Task', icon: CheckSquare, onClick: onCreateTask },
    ];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
                <Plus size={16} />
                New
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg z-30 py-1.5">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => {
                                setIsOpen(false);
                                action.onClick();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                            <action.icon size={16} className="text-gray-400" />
                            {action.label}
                        </button>
                    ))}

                    <div className="border-t border-gray-100 my-1" />

                    <button
                        onClick={() => {
                            if (canInvite) {
                                setIsOpen(false);
                                onInviteMember();
                            }
                        }}
                        disabled={!canInvite}
                        title={!canInvite ? 'Only admins can invite members' : undefined}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                            canInvite
                                ? 'text-gray-700 hover:bg-gray-50'
                                : 'text-gray-300 cursor-not-allowed'
                        }`}
                    >
                        <UserPlus size={16} className={canInvite ? 'text-gray-400' : 'text-gray-300'} />
                        Invite Member
                    </button>
                </div>
            )}
        </div>
    );
};

export default NewActionDropdown;
