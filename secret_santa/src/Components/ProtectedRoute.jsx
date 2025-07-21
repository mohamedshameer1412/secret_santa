import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth'; // Update this import path

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Return a minimal loading indicator without changing layout
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;