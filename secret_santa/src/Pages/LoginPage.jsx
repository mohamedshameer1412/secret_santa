import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Login and get response
            const response = await login(email, password);
            
            // Get token from response or localStorage
            const token = response?.token || localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Authentication failed - no token received');
            }

            // Try to fetch user's rooms
            try {
                const roomsRes = await axios.get('http://localhost:5000/api/chat/my-rooms', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const firstRoomId = roomsRes.data?.rooms?.[0]?._id;
                if (firstRoomId) {
                    // Navigate to chat with confetti flag
                    navigate(`/chat/${firstRoomId}`, { state: { showConfetti: true } });
                    return;
                }
            } catch (err) {
                console.warn('Could not fetch rooms:', err);
            }

            // Fallback - navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page d-flex align-items-center justify-content-center p-2">
            {/* ...rest of your JSX remains the same... */}
            <div className="row justify-content-center align-items-center shadow-lg rounded-4 p-0 p-md-2 overflow-hidden glossy glass-effect login-container">
                <div className="col-md-5 p-0 h-100 image-container">
                    <img
                        src="/assets/santa-bg.png"
                        alt="Santa Claus"
                        className="img-fluid h-100 w-100 rounded-4 m-3 border border-white border-5 shadow-lg"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

                <div className="col-md-6 p-5 text-start glass-effect animate-slide m-4 border border-white border-5 shadow-lg">
                    <h2 className="fw-bold mb-4 text-danger">
                        <img src="/assets/logo.png" width={50} alt="Santa Icon" className="me-2 mt-md-0 mt-4" />
                        <span className="d-block d-md-none"><br /></span>
                        Secret Santa
                        <span className="d-block mt-3"></span>
                        Login
                    </h2>
                    <p className="text-muted mb-4">Join the holiday fun and surprise your friend with a gift!</p>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label text-success">
                                <i className="fa-solid fa-envelope me-2"></i>Email address
                            </label>
                            <input
                                type="email"
                                className="form-control border border-success rounded-3"
                                id="email"
                                placeholder="santa@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4 position-relative">
                            <label htmlFor="password" className="form-label text-success">
                                <i className="fa-solid fa-lock me-2"></i>Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control border border-success rounded-3"
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <img
                                src={showPassword ? '/assets/santa-show.png' : '/assets/santa-hide.png'}
                                alt="Toggle Password"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Hide Password' : 'Show Password'}
                            />
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <Link to="/forgot-password" className="custom-link small">Forgot Password?</Link>
                        </div>

                        <button
                            type="submit"
                            className="btn glossy-btn w-100 fw-bold rounded-3 py-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-gift me-2"></i>Login to Secret Santa
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-4 text-muted small">
                        Don't have an account? <Link to="/signup" className="custom-link">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;