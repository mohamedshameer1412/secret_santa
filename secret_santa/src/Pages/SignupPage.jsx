import React, { useState } from 'react';
import './LoginPage.css';

const SignupPage = () => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSignup = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        alert('Signup Successful!');
    };

    return (
        <div className="login-page d-flex align-items-center justify-content-center p-2">
            <div className="row justify-content-center align-items-center shadow-lg rounded-4 p-0 p-md-2 overflow-hidden glossy glass-effect login-container">

                {/* Image Side */}
                <div className="col-md-5 p-0 h-100 image-container">
                    <img
                        src="src/assets/santa5.png"
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
                        Signup
                    </h2>
                    <p className="text-muted mb-4">Create your account and join the fun!</p>

                    <form onSubmit={handleSignup}>

                        <div className="row">
                            {/* Full Name */}
                            <div className="col-md-6 mb-3">
                                <label htmlFor="fullName" className="form-label text-success">
                                    <i className="fa-solid fa-user me-2"></i>Full Name
                                </label>
                                <input
                                    type="text"
                                    className="form-control border border-success rounded-3"
                                    id="fullName"
                                    placeholder="Santa Claus"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Username */}
                            <div className="col-md-6 mb-3">
                                <label htmlFor="username" className="form-label text-success">
                                    <i className="fa-solid fa-user-tag me-2"></i>Username
                                </label>
                                <input
                                    type="text"
                                    className="form-control border border-success rounded-3"
                                    id="username"
                                    placeholder="santa123"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
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

                        <div className="row">
                            {/* Password */}
                            <div className="col-md-6 mb-3 position-relative">
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
                                    src={showPassword ? 'src/assets/santa-show.png' : 'src/assets/santa-hide.png'}
                                    alt="Toggle Password"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide Password' : 'Show Password'}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="col-md-6 mb-4 position-relative">
                                <label htmlFor="confirmPassword" className="form-label text-success">
                                    <i className="fa-solid fa-lock me-2"></i>Confirm Password
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
                                    src={showConfirmPassword ? 'src/assets/santa-show.png' : 'src/assets/santa-hide.png'}
                                    alt="Toggle Password"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn glossy-btn w-100 fw-bold rounded-3 py-2">
                            <i className="fa-solid fa-gift me-2"></i>Sign Up
                        </button>
                    </form>

                    <p className="mt-4 text-muted small">
                        Already have an account? <a href="/login" className="custom-link">Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
