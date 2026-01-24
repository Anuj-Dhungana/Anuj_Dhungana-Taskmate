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
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgetPassword';
import ResetPassword from './pages/ResetPassword';
import useAuthStore from './store/useAuthStore';
import Profile from './pages/Profile';

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
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route 
          path="/workspaces" 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<WorkspaceList />} />
          <Route path=":workspaceId" element={<WorkspaceDetail />} />
        </Route>

        <Route 
          path="/projects" 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path=":projectId" element={<ProjectView />} />
        </Route>

        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Settings />} />
        </Route>

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;