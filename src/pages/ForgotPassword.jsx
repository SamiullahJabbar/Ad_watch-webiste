import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../api/baseURL';
import { FiMail, FiLock, FiShield, FiLoader, FiArrowLeft } from 'react-icons/fi';
import '../css/PasswordReset.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP & New Pass
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    // STEP 1: Send OTP to Email
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.post(`${BASE_URL}/accounts/forgot-password/`, { email });
            setMessage({ type: 'success', text: response.data.message || "OTP sent to your email!" });
            setStep(2); // Move to Reset Step
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to send OTP. Please check your email.' 
            });
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Verify OTP and Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = { 
                email: email, 
                otp: otp, 
                new_password: newPassword 
            };
            const response = await axios.post(`${BASE_URL}/accounts/reset-password/`, payload);
            setMessage({ type: 'success', text: 'Password reset successful! Redirecting to login...' });
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Invalid OTP or details. Try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{step === 1 ? 'Forgot Password?' : 'Set New Password'}</h2>
                    <p>
                        {step === 1 
                            ? 'Enter your email to receive an OTP code.' 
                            : 'Enter the OTP and your new strong password.'}
                    </p>
                </div>

                {message.text && (
                    <div className={`alert-box ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleForgotPassword}>
                        <div className="input-group">
                            <FiMail className="input-icon" />
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? <FiLoader className="animate-spin" /> : 'Send OTP Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="input-group">
                            <FiShield className="input-icon" />
                            <input 
                                type="text" 
                                placeholder="Enter 6-digit OTP" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required 
                            />
                        </div>
                        <div className="input-group">
                            <FiLock className="input-icon" />
                            <input 
                                type="password" 
                                placeholder="New Password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required 
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? <FiLoader className="animate-spin" /> : 'Update Password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <button onClick={() => navigate('/login')} className="back-link-btn">
                        <FiArrowLeft /> Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;