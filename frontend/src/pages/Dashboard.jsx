import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, PlusSquare, Briefcase, Settings, User, Search } from 'lucide-react';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { userInfo, logout } = useAuthStore();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/workspaces');
      setWorkspaces(res.data);
    } catch (err) {
      toast.error('Failed to fetch workspaces');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xl font-bold">TaskMate</span>
          </div>
        </div>
        
        {/* Workspaces Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400 text-xs uppercase font-semibold tracking-wider">Workspaces</span>
            <button 
              onClick={() => setShowModal(true)} 
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
              title="Create Workspace"
            >
              <PlusSquare size={16} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search workspaces..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 text-white placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* List Workspaces */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((ws) => (
                <div 
                  key={ws._id} 
                  className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 cursor-pointer transition-all duration-200 border border-transparent hover:border-indigo-500"
                >
                  <div className="p-2 bg-slate-700 group-hover:bg-indigo-600 rounded-lg transition-colors duration-200">
                    <Briefcase size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{ws.name}</p>
                    {ws.description && (
                      <p className="text-xs text-slate-400 truncate">{ws.description}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mb-3 opacity-50">
                  <Briefcase size={48} className="mx-auto text-slate-600" />
                </div>
                <p className="text-sm text-slate-400">
                  {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
                </p>
                {!searchQuery && (
                  <button 
                    onClick={() => setShowModal(true)}
                    className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Create your first workspace
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                {userInfo?.fullname?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userInfo?.fullname}</p>
              <p className="text-xs text-slate-400 truncate">{userInfo?.email}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors duration-200"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200">
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your workspaces and tasks</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Settings">
              <Settings size={22} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Welcome back, {userInfo?.fullname?.split(' ')[0]}! 👋</h2>
                  <p className="text-indigo-100 text-lg">
                    {workspaces.length > 0 
                      ? `You have ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`
                      : 'Get started by creating your first workspace'
                    }
                  </p>
                </div>
                <div className="hidden md:block">
                  <svg className="w-24 h-24 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button 
                onClick={() => setShowModal(true)}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-indigo-500 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 group-hover:bg-indigo-600 rounded-lg transition-colors duration-200">
                    <PlusSquare size={24} className="text-indigo-600 group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">New Workspace</h3>
                    <p className="text-sm text-gray-600">Create a workspace</p>
                  </div>
                </div>
              </button>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Briefcase size={24} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{workspaces.length}</h3>
                    <p className="text-sm text-gray-600">Total Workspaces</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <User size={24} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Active</h3>
                    <p className="text-sm text-gray-600">Account Status</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Create your first workspace</p>
                    <p className="text-sm text-gray-600">Organize your projects and tasks in dedicated workspaces</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Invite team members</p>
                    <p className="text-sm text-gray-600">Collaborate with your team in real-time</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Start creating tasks</p>
                    <p className="text-sm text-gray-600">Break down your work into manageable tasks</p>
                  </div>
                </div>
              </div>
            </div>
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