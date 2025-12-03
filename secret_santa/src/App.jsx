import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

import ForgotPasswordPage from './Pages/ForgotPasswordPage';
import LoginPage from './Pages/LoginPage';
import ResetPasswordPage from './Pages/ResetPasswordPage';
import SignupPage from './Pages/SignupPage';
import GroupChat from './Pages/GroupChat';
import Dashboard from './Pages/Dashboard';
import VillagePeople from './Pages/VillagePeople';
import MyWishlist from './Pages/MyWishlist';
import ChildProfile from './Pages/ChildProfile';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/child-profile" element={<ChildProfile />} />
      <Route path="/group-chat" element={<GroupChat />} /> 
      <Route path="/group-chat/:roomId" element={<GroupChat />} />
      <Route path="/village-people" element={<VillagePeople />} />
      <Route path="/wishlist" element={<MyWishlist />} />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate replace to="/login" />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate replace to="/login" />} />
    </Routes>
  );
}

export default App;