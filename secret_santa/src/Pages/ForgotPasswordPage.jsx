import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './LoginPage.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { forgotPassword } = useAuth();

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setIsLoading(true);
        
        try {
            await forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page d-flex align-items-center justify-content-center p-2">
            <div className="row justify-content-center align-items-center shadow-lg rounded-4 p-0 p-md-2 overflow-hidden glossy glass-effect login-container">

                {/* Image Side */}
                <div className="col-md-5 p-0 h-100 image-container">
                    <img
                        src="src/assets/santa1.png"
                        alt="Santa Claus"
                        className="img-fluid h-100 w-100 rounded-4 m-3 border border-white border-5 shadow-lg"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

                {/* Form Side */}
                <div className="col-md-6 p-5 text-start glass-effect animate-slide m-4 border border-white border-5 shadow-lg">
                    <h2 className="fw-bold mb-4 text-danger">
                        <img src="src/assets/logo.png" width={50} alt="Santa Icon" className="me-2 mt-md-0 mt-4" />
                        <span className="d-block d-md-none"><br /></span>
                        Secret Santa <span className="d-block mt-3"></span>
                        Forgot Password
                    </h2>
                    <p className="text-muted mb-4">Enter your email to receive a reset link</p>

                    {success ? (
                        <div className="alert alert-success" role="alert">
                            <i className="fa-solid fa-check-circle me-2"></i>
                            Reset link sent! Please check your email inbox.
                            <p className="mt-2 mb-0 small">
                                If you don't see it, please check your spam folder.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPassword}>
                            <div className="mb-4">
                                <label htmlFor="email" className="form-label text-success">
                                    <i className="fa-solid fa-envelope me-2"></i> Email address
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

                            {error && (
                                <div className="alert alert-danger py-2 mb-3" role="alert">
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn glossy-btn w-100 fw-bold rounded-3 py-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane me-2"></i>
                                        Send Reset Link
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <p className="mt-4 text-muted small">
                        Remembered your password? <Link to="/login" className="custom-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;