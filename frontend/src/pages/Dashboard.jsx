import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';
import axios from 'axios';
import { LogOut, Layout, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - TaskMate Style */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-slate-700">
            TaskMate
        </div>
        
        <div className="flex-1 p-4 space-y-4">
            <div className="text-slate-400 text-xs uppercase font-semibold">Menu</div>
            
            <button className="flex items-center space-x-2 text-slate-300 hover:text-white w-full">
                <Layout size={20} />
                <span>Boards</span>
            </button>
            
            <button className="flex items-center space-x-2 text-slate-300 hover:text-white w-full">
                <MessageSquare size={20} />
                <span>Chat</span>
            </button>
        </div>

        <div className="p-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{userInfo?.fullname}</span>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4">
            <h1 className="text-xl font-semibold text-gray-800">My Workspace</h1>
        </header>

        <main className="p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold mb-2">Welcome to TaskMate!</h2>
                <p className="text-gray-600">
                    You are now logged in. Select a board or chat channel to get started.
                </p>
            </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;