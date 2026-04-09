import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';
import { Layout } from './components/Layout/Layout';
import { Role } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageLoader } from './components/common/PageLoader';

// --- LAZY LOADED PAGES ---
// This splits the code into smaller chunks, loading them only when needed.
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Attendance = React.lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Employees = React.lazy(() => import('./pages/Employees').then(m => ({ default: m.Employees })));
const EmployeeModule = React.lazy(() => import('./pages/EmployeeModule').then(m => ({ default: m.EmployeeModule })));
const Projects = React.lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const Leaves = React.lazy(() => import('./pages/Leaves').then(m => ({ default: m.Leaves })));
const Payroll = React.lazy(() => import('./pages/Payroll').then(m => ({ default: m.Payroll })));
const Departments = React.lazy(() => import('./pages/Departments').then(m => ({ default: m.Departments })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Reports = React.lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Chat = React.lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const SystemSettings = React.lazy(() => import('./pages/SystemSettings'));
const UserManagement = React.lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));
const Recruitment = React.lazy(() => import('./pages/Recruitment').then(m => ({ default: m.Recruitment })));
const PermissionManagement = React.lazy(() =>
  import('./components/permissions/PermissionManagement').then(m => ({ default: m.PermissionManagement }))
);

// Protected Route Component
interface ProtectedRouteProps {
  children?: React.ReactNode;
  roles?: Role[];
  permission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles, permission }) => {
  const { isAuthenticated, hasRole, isLoading, hasPermission } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (roles && !hasRole(roles)) {
      return <Navigate to="/dashboard" replace />; 
  }

  if (permission && !hasPermission(permission)) {
      return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ErrorBoundary>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><PageLoader /></div>}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<Login />} />
                        
                        {/* App Routes */}
                        <Route path="/app" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                        
                        <Route element={<Layout />}>
                            {/* Common Routes */}
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                            <Route path="/leaves" element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
                            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            
                            {/* Feature Specific Routes */}
                            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

                             <Route path="/employees/*" element={
                                <ProtectedRoute permission="hr.employee.view">
                                    <EmployeeModule />
                                </ProtectedRoute>
                              } />

                             <Route path="/payroll" element={<ProtectedRoute permission="payroll.view"><Payroll /></ProtectedRoute>} />
                             <Route path="/recruitment" element={<ProtectedRoute permission="recruitment.view"><Recruitment /></ProtectedRoute>} />
                             <Route path="/departments" element={<ProtectedRoute permission="hr.departments.view"><Departments /></ProtectedRoute>} />
                             <Route path="/reports" element={<ProtectedRoute permission="system.settings.view"><Reports /></ProtectedRoute>} />

                             {/* Administration Routes */}
                             <Route path="/settings" element={<ProtectedRoute permission="system.settings.edit"><SystemSettings /></ProtectedRoute>} />
                             <Route path="/users" element={<ProtectedRoute permission="system.users.view"><UserManagement /></ProtectedRoute>} />
                             <Route path="/permissions" element={<ProtectedRoute permission="system.roles.edit"><PermissionManagement /></ProtectedRoute>} />
                         </Route>
                      </Routes>
                    </Suspense>
                  </ChatProvider>
                </NotificationProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </HashRouter>
  );
};

export default App;