import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BASE_URL, { saveAccessToken } from '../api/baseURL'; 
import sidebarImage from '../assets/images/sidebar.png';
import '../css/LoginPage.css';

function LoginPage() {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // Mouse tracking for background effect
    const containerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mouse move handler for the glow effect
    const handleMouseMove = (e) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            containerRef.current.style.setProperty('--x', `${x}px`);
            containerRef.current.style.setProperty('--y', `${y}px`);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(''); 

        // ✅ Decide whether identifier is email or phone
        const payload = {
            email: formData.identifier.includes('@') ? formData.identifier : undefined,
            phone_number: !formData.identifier.includes('@') ? formData.identifier : undefined,
            password: formData.password
        };

        try {
            const res = await axios.post(`${BASE_URL}/accounts/login/`, payload);
            const { access, refresh } = res.data;
            sessionStorage.setItem('accessToken', access);
            sessionStorage.setItem('refreshToken', refresh);
            saveAccessToken(access); 

            setMessage('Login successful! Redirecting...');
            setTimeout(() => { window.location.href = '/'; }, 1500);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Login failed.';
            setMessage(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="login-container" 
            ref={containerRef} 
            onMouseMove={handleMouseMove}
        >
            {/* Background Glow Layer */}
            <div className="mouse-glow"></div>

            <div className="main-card">
                {/* Left Panel - Form */}
                <div className="left-panel">
                    <div className="form-container">
                        {isMobile && (
                            <div className="mobile-img-container">
                                <img src={sidebarImage} alt="Welcome" className="mobile-circle-img" />
                            </div>
                        )}

                        <h1 className="login-title">Welcome Back</h1>
                        <p className="login-subtitle">
                            Don't have an account?{' '}
                            <a href="/register" className="styled-link">Create Account</a>
                        </p>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label className="form-label">Email or Phone Number</label>
                                <input
                                    type="text"
                                    name="identifier"
                                    className="form-input"
                                    value={formData.identifier}
                                    onChange={handleChange}
                                    placeholder="you@example.com OR 03001234567"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            {message && (
                                <div className={message.includes('successful') ? 'success-msg' : 'error-msg'}>
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`login-btn btn-shine ${isLoading ? 'loading' : ''}`}
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="login-footer">
                            <a href="/forgot-password" className="styled-link">Forgot Password?</a>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Desktop Image */}
                {!isMobile && (
                    <div className="right-panel">
                        <img src={sidebarImage} alt="Investment" className="sidebar-img" />
                        <div className="right-content">
                            {/* <div className="company-name">Investment Accounting</div> */}
                            {/* <h2 className="right-title">Continue Your Journey</h2> */}
                            <p className="right-subtitle">
                                {/* Access your investment portfolio and continue growing your wealth. */}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoginPage;
