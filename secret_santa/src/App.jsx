import './App.css';
import { useAuth } from './context/useAuth';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from "./Components/ProtectedRoute";
import ForgotPasswordPage from './Pages/ForgotPasswordPage';
import LoginPage from './Pages/LoginPage';
import ResetPasswordPage from './Pages/ResetPasswordPage';
import SignupPage from './Pages/SignupPage';
import GroupChat from './Pages/GroupChat';
import Dashboard from './Pages/Dashboard';
import VillagePeople from './Pages/VillagePeople';
import MyWishlist from './Pages/MyWishlist';
import ChildProfile from './Pages/ChildProfile';
import JoinRoomPage from './Pages/JoinRoomPage';

const RootRedirect = () => {
	const { user, loading } = useAuth();

	if (loading) return <div>Loading...</div>; // optional

	if (user) return <Navigate to="/dashboard" replace />;
	return <Navigate to="/login" replace />;
};

function App() {
	return (
		<Routes>
			{/* Public Routes */}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/signup" element={<SignupPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />

			{/* Join Room via Invite Link - Public Route */}
			<Route path="/join/:inviteCode" element={<JoinRoomPage />} />

			{/* Protected Routes */}
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<Dashboard />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/child-profile"
				element={
					<ProtectedRoute>
						<ChildProfile />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/group-chat"
				element={
					<ProtectedRoute>
						<GroupChat />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/group-chat/:roomId"
				element={
					<ProtectedRoute>
						<GroupChat />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/village-people"
				element={
					<ProtectedRoute>
						<VillagePeople />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/wishlist"
				element={
					<ProtectedRoute>
						<MyWishlist />
					</ProtectedRoute>
				}
			/>

			{/* Root redirect */}
			<Route path="/" element={<RootRedirect />} />

			{/* Catch-all */}
			<Route path="*" element={<Navigate replace to="/login" />} />
		</Routes>
	);
}

export default App;
