import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import ForgotPasswordPage from './Pages/ForgotPasswordPage'
import LoginPage from './Pages/LoginPage'
import ResetPasswordPage from './Pages/ResetPasswordPage'
import SignupPage from './Pages/SignupPage'
import { useAuth } from './context/useAuth'

// Placeholder Dashboard
const DashboardPlaceholder = () => {
  const { logout } = useAuth();
  
  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      textAlign: 'center' 
    }}>
      <h1>Dashboard Coming Soon</h1>
      <p>Your Secret Santa dashboard is under construction.</p>
      <button 
        onClick={logout}
        style={{
          padding: '0.5rem 1rem',
          background: '#e53935',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Logout
      </button>
    </div>
  );
};

function App() {
  const { isAuthenticated } = useAuth(); 

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        !isAuthenticated ? <LoginPage /> : <Navigate replace to="/dashboard" />
      } />
      <Route path="/signup" element={
        !isAuthenticated ? <SignupPage /> : <Navigate replace to="/dashboard" />
      } />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      
      {/* Protected Routes - with placeholder */}
      <Route path="/dashboard" element={
        isAuthenticated ? <DashboardPlaceholder /> : <Navigate replace to="/login" />
      } />
      
      {/* Redirect root based on authentication */}
      <Route path="/" element={
        isAuthenticated ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />
      } />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={
        isAuthenticated ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />
      } />
    </Routes>
  )
}

export default App