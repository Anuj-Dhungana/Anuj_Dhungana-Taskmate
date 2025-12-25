import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, PlusSquare, Briefcase } from 'lucide-react';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import useAuthStore from '../store/useAuthStore';

const Dashboard = () => {
  const { userInfo, logout } = useAuthStore();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Function to fetch workspaces from API
  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get('/api/workspaces');
      setWorkspaces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-slate-700">TaskMate</div>
        
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 text-xs uppercase font-semibold">Workspaces</span>
                <button onClick={() => setShowModal(true)} className="text-slate-400 hover:text-white">
                    <PlusSquare size={18} />
                </button>
            </div>

            {/* List Workspaces */}
            <div className="space-y-2">
                {workspaces.map((ws) => (
                    <div key={ws._id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-800 cursor-pointer">
                        <Briefcase size={18} className="text-blue-400"/>
                        <span className="truncate">{ws.name}</span>
                    </div>
                ))}
                
                {workspaces.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No workspaces yet.</p>
                )}
            </div>
        </div>

        <div className="p-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate w-32">{userInfo?.fullname}</span>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4">
            <h1 className="text-xl font-semibold text-gray-800">Home</h1>
        </header>

        <main className="p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold mb-2">Welcome, {userInfo?.fullname}!</h2>
                <p className="text-gray-600">
                    Select a workspace from the sidebar or create a new one to get started.
                </p>
            </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <CreateWorkspaceModal 
            onClose={() => setShowModal(false)} 
            onCreated={fetchWorkspaces} 
        />
      )}

    </div>
  );
};

export default Dashboard;