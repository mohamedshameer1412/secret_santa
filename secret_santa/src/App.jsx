import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ForgotPasswordPage from './Pages/ForgotPasswordPage'
import LoginPage from './Pages/LoginPage'
import ResetPasswordPage from './Pages/ResetPasswordPage'
import SignupPage from './Pages/SignUpPage'
import Dashboard from './Pages/Dashboard'
import GroupChat from './Pages/GroupChat'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<GroupChat />} />
        <Route path="/" element={<Navigate replace to="/login" />} />
        {/* <Route path="*" element={<Navigate replace to="/login" />} /> */}
      </Routes>
    </Router>
  )
}

export default App
