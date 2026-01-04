import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogOut, PlusSquare, Hash, Kanban, Menu, Settings, UserPlus } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/userWorkspaceStore'; 
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import InviteUserModal from '../components/InviteUserModal';
import MembersModal from '../components/MembersModal';
import { Users } from 'lucide-react'; 
import CreateProjectModal from '../components/CreateProjectModal';


const Dashboard = () => {
  const { userInfo, logout } = useAuthStore();
  const { workspaces, setWorkspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
  
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // 1. Fetch List of Workspaces
  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get('/api/workspaces');
      setWorkspaces(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  // 2. Handle Clicking a Workspace
  const handleWorkspaceClick = async (workspaceId) => {
    setLoadingDetails(true);
    try {
        const res = await axios.get(`/api/workspaces/${workspaceId}`);
        setSelectedWorkspace(res.data); // Contains { workspace, projects, channels }
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingDetails(false);
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-white">
      
      {/* 1. Primary Sidebar (Workspaces List) */}
      <div className="w-20 bg-slate-900 text-white flex flex-col items-center py-4 space-y-4">
        {workspaces.map((ws) => (
            <button 
                key={ws._id} 
                onClick={() => handleWorkspaceClick(ws._id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all
                ${selectedWorkspace?.workspace._id === ws._id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                title={ws.name}
            >
                {ws.name.substring(0, 2).toUpperCase()}
            </button>
        ))}

        
        
        <button onClick={() => setShowModal(true)} className="w-12 h-12 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center">
            <PlusSquare size={24} />
        </button>

        <div className="mt-auto pb-4">
             <button onClick={handleLogout} className="text-red-400 hover:text-red-300"><LogOut size={24} /></button>
        </div>
      </div>

      {/* 2. Secondary Sidebar (Channels & Projects) */}
      {selectedWorkspace ? (
        <div className="w-64 bg-slate-800 text-slate-300 flex flex-col border-r border-slate-700">
            <div className="p-4 border-b border-slate-700 font-bold text-white truncate">
                {selectedWorkspace.workspace.name}
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                {/* Projects Section */}
                <div>
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Projects</span>
                        <button className="hover:text-white">+</button>
                    </div>
                    <div className="space-y-1">
                        {selectedWorkspace.projects.length === 0 && <p className="text-xs italic px-2">No projects yet</p>}
                        {selectedWorkspace.projects.map(p => (
                            <button key={p._id} className="flex items-center space-x-2 w-full px-2 py-1 rounded hover:bg-slate-700">
                                <Kanban size={16} /> <span>{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button 
    onClick={() => setShowMembersModal(true)}
    className="text-slate-400 hover:text-blue-400 ml-2"
    title="Manage Members"
>
    <Users size={18} />
</button>
<MembersModal 
    isOpen={showMembersModal} 
    onClose={() => setShowMembersModal(false)} 
    workspace={selectedWorkspace.workspace}
    onUpdate={() => handleWorkspaceClick(selectedWorkspace.workspace._id)}
/>  


         {/* Inside Secondary Sidebar */}
<div className="p-4 border-b border-slate-700">
    <div className="flex justify-between items-center text-white">
        <h2 className="font-bold truncate w-32">{selectedWorkspace.workspace.name}</h2>
        <button 
            onClick={() => setShowInviteModal(true)}
            className="text-slate-400 hover:text-green-400"
            title="Invite Member"
        >
            <UserPlus size={18} />
        </button>
    </div>
    <div className="text-xs text-slate-500 mt-1">
        {selectedWorkspace.workspace.members.length} members
    </div>
</div>

<div className="flex justify-between items-center mb-2 px-2">
    <span className="text-xs font-semibold uppercase tracking-wider">Projects</span>
    <button 
        onClick={() => setShowProjectModal(true)} 
        className="hover:text-white"
    >
        +
    </button>
</div>
<CreateProjectModal 
    isOpen={showProjectModal}
    onClose={() => setShowProjectModal(false)}
    workspaceId={selectedWorkspace?.workspace._id}
    onCreated={() => handleWorkspaceClick(selectedWorkspace.workspace._id)} 
/>

                {/* Channels Section */}
                <div>
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Channels</span>
                        <button className="hover:text-white">+</button>
                    </div>
                    <div className="space-y-1">
                         {selectedWorkspace.channels.map(c => (
                            <button key={c._id} className="flex items-center space-x-2 w-full px-2 py-1 rounded hover:bg-slate-700">
                                <Hash size={16} /> <span>{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                    <Link to="/profile" className="flex items-center space-x-2 hover:text-blue-300">
                        <span className="text-sm font-medium truncate w-24">{userInfo?.fullname}</span>
                        <Settings size={16} />
                    </Link>
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
      ) : (
        // Empty State if no workspace selected
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-center text-center">
            <h3 className="text-gray-500">Select a workspace to view details</h3>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 bg-gray-50 flex flex-col">
          <header className="bg-white h-14 border-b flex items-center px-6 shadow-sm">
             <h2 className="font-semibold text-gray-800">
                {selectedWorkspace ? 'Dashboard' : 'Welcome'}
             </h2>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
             {!selectedWorkspace && (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Menu size={64} className="mb-4 text-gray-300" />
                    <p className="text-lg">Welcome to TaskMate! Select a workspace on the left.</p>
                 </div>
             )}
             
             {selectedWorkspace && (
                 <div>
                    <h1 className="text-2xl font-bold mb-4">Activity</h1>
                    <p>Select a Channel or Project to start working.</p>
                 </div>
             )}
          </main>
      </div>

      {showModal && (
        <CreateWorkspaceModal onClose={() => setShowModal(false)} onCreated={fetchWorkspaces} />
      )}

      <InviteUserModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)}
        workspaceId={selectedWorkspace?.workspace._id}
      />
    </div>
  );
};

export default Dashboard;