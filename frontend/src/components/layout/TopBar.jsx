import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import NotificationMenu from '../notification/NotificationMenu';

const TopBar = ({ userInfo, onLogout }) => {
    const navigate = useNavigate();

    return (
        <header className="h-16 bg-white flex items-center justify-end px-8 shadow-sm">
            <div className="flex items-center gap-3">
                <NotificationMenu />

                <button
                    onClick={onLogout}
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 transition"
                    title="Logout"
                >
                    <LogOut size={16} />
                </button>

                <div
                    onClick={() => navigate('/profile')}
                    className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white text-sm cursor-pointer"
                    title="Profile"
                >
                    {userInfo?.fullname?.[0]?.toUpperCase() || 'A'}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
