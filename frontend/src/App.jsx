import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './pages/DashboardLayout';
import WorkspaceList from './pages/WorkspaceList';
import WorkspaceDetail from './pages/WorkspaceDetail';
import ProjectView from './pages/ProjectView';
import WorkspaceSettings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import useAuthStore from './store/useAuthStore';
import Profile from './pages/Profile';
import MyTasks from './pages/MyTasks';
import WorkspaceCalendar from './pages/WorkspaceCalendar';
import WorkspaceChat from './pages/WorkspaceChat';
import WorkspaceCalls from './pages/WorkspaceCalls';
import WorkspaceMembers from './pages/WorkspaceMembers';
import Analytics from './pages/Analytics';

// Helper Component: Protect Routes
const PrivateRoute = ({ children }) => {
  const { userInfo } = useAuthStore();
  return userInfo ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes with Shared Layout */}
        <Route 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/projects" element={<WorkspaceDetail />} />
          <Route path="/projects/:projectId" element={<ProjectView />} />
          <Route path="/tasks" element={<MyTasks />} />
          <Route path="/calendar" element={<WorkspaceCalendar />} />
          <Route path="/chat" element={<WorkspaceChat />} />
          <Route path="/calls" element={<WorkspaceCalls />} />
          <Route path="/members" element={<WorkspaceMembers />} />
          <Route path="/settings" element={<WorkspaceSettings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/workspaces" element={<WorkspaceList />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail />} />
        </Route>

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

      </Routes>
    </>
  );
}

export default App;
