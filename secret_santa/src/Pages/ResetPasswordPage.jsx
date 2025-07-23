import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './LoginPage.css';


const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();
    const { resetPassword } = useAuth();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true); // Add this line - it was missing!
        
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match!');
            setIsLoading(false); // Add this line too
            return;
        }

        try {
            await resetPassword(token, newPassword);
            setError(''); 
            
            const successElement = document.createElement('div');
            successElement.className = 'alert alert-success';
            successElement.textContent = 'Password reset successful! Redirecting to login...';
            document.querySelector('form').prepend(successElement);
            
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password'); // Remove .response?.data?.message
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page d-flex align-items-center justify-content-center p-2">
            <div className="row justify-content-center align-items-center shadow-lg rounded-4 p-0 p-md-2 overflow-hidden glossy glass-effect login-container">

                {/* Image Side */}
                <div className="col-md-5 p-0 h-100  image-container">
                    <img
 
                        src="/assets/santa3.png"

 
                        alt="Santa Claus"
                        className="img-fluid h-100 w-100 rounded-4 m-3 border border-white border-5 shadow-lg"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

                {/* Form Side */}
                <div className="col-md-6 p-5 text-start glass-effect animate-slide m-4 border border-white border-5 shadow-lg">
                    <h2 className="fw-bold mb-4 text-danger">
 
                        <img src="/assets/logo.png" width={50} alt="Santa Icon" className="me-2 mt-md-0 mt-4" />
 
                        <span className="d-block d-md-none"><br /></span>
                        Secret Santa                         <span className="d-block mt-3"></span>                        
                        Reset Password
                    </h2>

                    <p className="text-muted mb-4">Enter your new password</p>

                    <form onSubmit={handleResetPassword}>
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}
                        <div className="mb-3 position-relative">
                            <label htmlFor="newPassword" className="form-label text-success">
                                <i className="fa-solid fa-lock me-2"></i> New Password
                            </label>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                className="form-control border border-success rounded-3"
                                id="newPassword"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <img
 
                                src={showNewPassword ? '/assets/santa-show.png' : '/assets/santa-hide.png'}
 
                                alt="Toggle Password"
                                className="password-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                title={showNewPassword ? 'Hide Password' : 'Show Password'}
                            />
                        </div>

                        <div className="mb-4 position-relative">
                            <label htmlFor="confirmPassword" className="form-label text-success">
                                <i className="fa-solid fa-lock me-2"></i> Confirm Password
                            </label>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="form-control border border-success rounded-3"
                                id="confirmPassword"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <img
 
                                src={showConfirmPassword ? '/assets/santa-show.png' : '/assets/santa-hide.png'}
 
                                alt="Toggle Password"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn glossy-btn w-100 fw-bold rounded-3 py-2"
                            disabled={isLoading}
                        >
                            <i className="fa-solid fa-key me-2"></i>
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>

                    <p className="mt-4 text-muted small">
                        Go back to <Link to="/login" className="custom-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
