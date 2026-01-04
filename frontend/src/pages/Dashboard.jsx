import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, PlusSquare, Hash, Kanban, Menu, Settings, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/userWorkspaceStore';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import InviteUserModal from '../components/InviteUserModal';
import MembersModal from '../components/MembersModal';
import CreateProjectModal from '../components/CreateProjectModal';
import BoardView from '../components/Board/BoardView'; 

const Dashboard = () => {
  const { userInfo, logout } = useAuthStore();
  const { workspaces, setWorkspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  // Local UI State
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeProject, setActiveProject] = useState(null); // Track which project (board) is open

  // 1. Fetch List of Workspaces on Load
  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get('/api/workspaces');
      setWorkspaces(res.data);
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // 2. Handle Clicking a Workspace
  const handleWorkspaceClick = async (workspaceId) => {
    setLoadingDetails(true);
    // Reset active project when switching workspaces
    setActiveProject(null); 
    try {
        const res = await axios.get(`/api/workspaces/${workspaceId}`);
        setSelectedWorkspace(res.data);
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
        
        <button 
            onClick={() => setShowWorkspaceModal(true)} 
            className="w-12 h-12 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center"
        >
            <PlusSquare size={24} />
        </button>

        <div className="mt-auto pb-4">
             <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                <LogOut size={24} />
             </button>
        </div>
      </div>

      
      {selectedWorkspace ? (
        <div className="w-64 bg-slate-800 text-slate-300 flex flex-col border-r border-slate-700">
            {/* Header: Workspace Name + Actions */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex justify-between items-center text-white mb-1">
                    <h2 className="font-bold truncate w-32">{selectedWorkspace.workspace.name}</h2>
                    <div className="flex space-x-1">
                        <button onClick={() => setShowInviteModal(true)} className="hover:text-green-400" title="Invite User">
                            <UserPlus size={16} />
                        </button>
                        <button onClick={() => setShowMembersModal(true)} className="hover:text-blue-400" title="Manage Members">
                            <Settings size={16} />
                        </button>
                    </div>
                </div>
                <div className="text-xs text-slate-500">
                    {selectedWorkspace.workspace.members.length} members
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                
                {/* PROJECTS LIST */}
                <div>
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Projects</span>
                        <button onClick={() => setShowProjectModal(true)} className="hover:text-white">+</button>
                    </div>
                    
                    <div className="space-y-1">
                        {selectedWorkspace.projects.length === 0 && <p className="text-xs italic px-2">No projects</p>}
                        
                        {/* HERE IS WHERE 'p' IS DEFINED */}
                        {selectedWorkspace.projects.map((p) => (
                            <button 
                                key={p._id} 
                                onClick={() => setActiveProject(p)}
                                className={`flex items-center space-x-2 w-full px-2 py-1 rounded transition-colors
                                ${activeProject?._id === p._id ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}
                            >
                                <Kanban size={16} /> 
                                <span className="truncate">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* CHANNELS LIST */}
                <div>
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Channels</span>
                        <button className="hover:text-white">+</button>
                    </div>
                    <div className="space-y-1">
                         {selectedWorkspace.channels.map((c) => (
                            <button key={c._id} className="flex items-center space-x-2 w-full px-2 py-1 rounded hover:bg-slate-700">
                                <Hash size={16} /> 
                                <span className="truncate">{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      ) : (
        // Empty State (No Workspace Selected)
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-center text-center">
            <h3 className="text-gray-500">Select a workspace</h3>
        </div>
      )}

      
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
          
          {/* Header */}
          <header className="bg-white h-14 border-b flex items-center px-6 shadow-sm justify-between">
             <h2 className="font-semibold text-gray-800">
                {activeProject ? activeProject.name : (selectedWorkspace ? 'Dashboard' : 'Welcome')}
             </h2>
             {userInfo && <span className="text-sm text-gray-500">{userInfo.fullname}</span>}
          </header>
          
          <main className="flex-1 overflow-hidden relative">
             {/* Case 1: No Workspace Selected */}
             {!selectedWorkspace && (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Menu size={64} className="mb-4 text-gray-300" />
                    <p className="text-lg">Welcome to TaskMate! Select a workspace on the left.</p>
                 </div>
             )}
             
             {/* Case 2: Workspace Selected, But No Project/Channel Open */}
             {selectedWorkspace && !activeProject && (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Kanban size={64} className="mb-4 text-gray-300" />
                    <p className="text-lg">Select a Project or Channel to start working.</p>
                 </div>
             )}

             {/* Case 3: Project Open (Show Board) */}
             {activeProject && (
                 <div className="h-full flex flex-col">
                     <header className="px-6 py-4 bg-white border-b flex justify-between items-center">
                         <h1 className="text-2xl font-bold text-gray-800">{activeProject.name}</h1>
                         
                         {/* DELETE PROJECT BUTTON */}
                         <button 
                             onClick={async () => {
                                 if(!confirm(`Delete project "${activeProject.name}"?`)) return;
                                 try {
                                     await axios.delete(`/api/projects/${activeProject._id}`);
                                     toast.success("Project deleted");
                                     handleWorkspaceClick(selectedWorkspace.workspace._id); // Refresh
                                     setActiveProject(null); // Close board
                                 } catch(err) {
                                     toast.error("Failed to delete project");
                                 }
                             }}
                             className="text-red-500 hover:bg-red-50 p-2 rounded flex items-center gap-2 text-sm font-medium"
                         >
                             <Trash2 size={16} /> Delete Project
                         </button>
                     </header>
                     
                     <div className="flex-1 overflow-auto">
                        <BoardView projectId={activeProject._id} />
                     </div>
                 </div>
             )}
          </main>
      </div>

    
      {showWorkspaceModal && (
        <CreateWorkspaceModal 
            onClose={() => setShowWorkspaceModal(false)} 
            onCreated={fetchWorkspaces} 
        />
      )}

      {showInviteModal && selectedWorkspace && (
        <InviteUserModal 
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            workspaceId={selectedWorkspace.workspace._id}
        />
      )}

      {showMembersModal && selectedWorkspace && (
        <MembersModal 
            isOpen={showMembersModal}
            onClose={() => setShowMembersModal(false)}
            workspace={selectedWorkspace.workspace}
            onUpdate={() => handleWorkspaceClick(selectedWorkspace.workspace._id)}
        />
      )}

      {showProjectModal && selectedWorkspace && (
        <CreateProjectModal 
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            workspaceId={selectedWorkspace.workspace._id}
            onCreated={() => handleWorkspaceClick(selectedWorkspace.workspace._id)}
        />
      )}

    </div>
  );
};

export default Dashboard;