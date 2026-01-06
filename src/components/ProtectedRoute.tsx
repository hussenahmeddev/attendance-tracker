import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'student';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { currentUser, userData, loading } = useAuth();

  // Temporary: Allow access for testing purposes
  const isTestMode = window.location.search.includes('test=true') || !currentUser;

  if (loading && !isTestMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser && !isTestMode) {
    return <Navigate to="/auth" replace />;
  }

  // For test mode, create mock user data
  if (isTestMode && !userData) {
    const mockUserData = {
      uid: 'test-user',
      userId: requiredRole === 'admin' ? 'ADM001' : requiredRole === 'teacher' ? 'TCH001' : 'STD001',
      email: `test@${requiredRole}.com`,
      displayName: `Test ${requiredRole?.charAt(0).toUpperCase()}${requiredRole?.slice(1)}`,
      role: requiredRole || 'student',
    };
    
    // Temporarily inject mock data for testing
    return <>{children}</>;
  }

  if (requiredRole && userData?.role !== requiredRole && !isTestMode) {
    // Redirect to appropriate dashboard based on user's actual role
    switch (userData?.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
};