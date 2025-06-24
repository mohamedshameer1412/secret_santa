import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import './LoginPage.css'; // Custom styles

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const confettiInterval = useRef(null);

    // Continuous Snowfall Animation
    const launchConfettiLoop = () => {
        if (confettiInterval.current) return;

        confettiInterval.current = setInterval(() => {
            confetti({
                particleCount: 5,
                spread: 360,
                startVelocity: 20,
                gravity: 0.5,
                ticks: 200,
                colors: ['#FFFFFF', '#DDE1E7', '#B3E5FC', '#81D4FA'],
                zIndex: 9999,
                origin: { x: Math.random(), y: Math.random() * 0.5 }
            });
        }, 200);
    };

    const stopConfetti = () => {
        if (confettiInterval.current) {
            clearInterval(confettiInterval.current);
            confettiInterval.current = null;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (email === 'santa@example.com' && password === 'secret123') {
            launchConfettiLoop();
        } else {
            alert('Invalid email or password!');
            stopConfetti();
        }
    };

    return (
        <div className="login-page d-flex align-items-center justify-content-center p-2">
            <div className="row justify-content-center align-items-center shadow-lg rounded-4 p-2 overflow-hidden glossy glass-effect login-container">

                {/* Image Side */}
                <div className="col-md-5 p-0 h-100">
                    <img
                        src="src/assets/santa-bg.png"
                        alt="Santa Claus"
                        className="img-fluid h-100 w-100"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

                {/* Form Side */}
                <div className="col-md-6 p-5 text-start glass-effect animate-slide m-4">
                    <h2 className="fw-bold mb-4 text-danger">
                        <img src="src/assets/logo.png" width={50} alt="Santa Icon" className="me-2" />
                        Secret Santa Login
                    </h2>
                    <p className="text-muted mb-4">Join the holiday fun and surprise your friend with a gift!</p>

                    <form onSubmit={handleSubmit}>
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
                                src={showPassword ? 'src/assets/santa-show.png' : 'src/assets/santa-hide.png'}
                                alt="Toggle Password"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Hide Password' : 'Show Password'}
                            />
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <a href="#" className="custom-link small">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn glossy-btn w-100 fw-bold rounded-3 py-2"
                        >
                            <i className="fa-solid fa-gift me-2"></i>Login to Secret Santa
                        </button>
                    </form>

                    <p className="mt-4 text-muted small">
                        Don't have an account? <a href="/signup" className="custom-link">Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
