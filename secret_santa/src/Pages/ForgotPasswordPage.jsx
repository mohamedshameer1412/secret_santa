import React, { useState } from 'react';
import './LoginPage.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');

    const handleForgotPassword = (e) => {
        e.preventDefault();
        alert('Password reset link sent to your email!');
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
                        Secret Santa                         <span className="d-block mt-3"></span>
                        Forgot Password
                    </h2>
                    <p className="text-muted mb-4">Enter your email to receive a reset link</p>

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

                        <button type="submit" className="btn glossy-btn w-100 fw-bold rounded-3 py-2">
                            <i className="fa-solid fa-paper-plane me-2"></i> Send Reset Link
                        </button>
                    </form>

                    <p className="mt-4 text-muted small">
                        Remembered your password? <a href="/login" className="custom-link">Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
