import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import ForgotPasswordPage from './Pages/ForgotPasswordPage'
import LoginPage from './Pages/LoginPage'
import ResetPasswordPage from './Pages/ResetPasswordPage'
import SignupPage from './Pages/SignUpPage'
import GroupChat from './Pages/GroupChat'
import Dashboard from './Pages/Dashboard'
import VillagePeople from './Pages/VillagePeople'

function App() {
  // const { isAuthenticated } = useAuth(); 

  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<GroupChat />} />
        <Route path="/contact" element={<VillagePeople />} />
        <Route path="/wish" element={<MyWishlist />} />
        
        {/* Redirect root to login page */}
        <Route path="/" element={<Navigate replace to="/login" />} />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
  )
}

export default App
