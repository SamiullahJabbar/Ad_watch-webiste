import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../api/baseURL';
import sidebarImage from '../assets/images/sidebar.png';
import '../css/Register.css'; // Importing separate CSS

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    password: '',
    referral_input: ''
  });
  const [otpData, setOtpData] = useState({
    email: '',
    otp: ''
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (e) => {
    const { name, value } = e.target;
    const re = /^[0-9\b]+$/;
    if (value === '' || (re.test(value) && value.length <= 6)) {
        setOtpData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

   

    const payload = {
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        
        ...(formData.referral_input && { referral_input: formData.referral_input })
    };

    try {
        const response = await fetch(`${BASE_URL}/accounts/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
            setStep(2);
            setOtpData({ ...otpData, email: formData.email });
            setMessage(data.message || 'Registration successful. Please verify.');
        } else {
            setError(data.error || data.message || 'Registration failed.');
        }
    } catch (err) {
        setError('Network error. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
        const response = await fetch(`${BASE_URL}/accounts/verify-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: otpData.email, otp: otpData.otp }),
        });
        const data = await response.json();
        if (response.ok) {
            setMessage(data.message || 'Success! Redirecting...');
            setTimeout(() => navigate('/login'), 2000); 
        } else {
            setError(data.error || data.message || 'Verification failed.');
        }
    } catch (err) {
        setError('Network error. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={`reg-container ${isMobile ? 'mobile' : ''} register-body-style`}>
      <div className={`reg-main-card ${isMobile ? 'mobile' : ''}`}>
        
        {/* Left Panel - Image Section */}
        {!isMobile && (
          <div className="reg-left-panel">
            <div className="reg-image-overlay"></div>
            <img src={sidebarImage} alt="Welcome" className="reg-sidebar-img" />
            <div className="reg-left-content">
              <h2 className="reg-left-title">Start Your Success Story</h2>
              <p className="reg-left-subtitle">Join a platform built for the future. Experience seamless service and community growth.</p>
            </div>
          </div>
        )}
        
        {/* Right Panel - Form Section */}
        <div className={`reg-right-panel ${isMobile ? 'mobile' : ''}`}>
          <div className="reg-form-container">
            
            {isMobile && (
                <div className="reg-mobile-image-container">
                    <img src={sidebarImage} alt="Welcome" className="reg-mobile-circle-img" />
                </div>
            )}
            
            {step === 1 ? (
              <>
                <h1 className="reg-title">Create Your Account</h1>
                <p className="reg-login-link-text">
                  Already a member? <a href="/login" className="reg-link">Log in</a>
                </p>

                <form onSubmit={handleRegister} className="reg-form">
                  {message && <div className="reg-success-msg">{message}</div>}
                  {error && <div className="reg-error-msg">{error}</div>}

                  <div className="reg-form-group">
                    <label className="reg-label">Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="reg-input" placeholder="john_doe" required />
                  </div>

                  <div className="reg-form-group">
                    <label className="reg-label">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="reg-input" placeholder="you@example.com" required />
                  </div>
                   
                   <div className="reg-form-group"> <label className="reg-label">Phone Number</label> <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="reg-input" placeholder="03001234567" required /> </div>

                  <div className="reg-form-group">
                    <label className="reg-label">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="reg-input" placeholder="••••••••" required />
                  </div>

                 

                  <div className="reg-form-group">
                    <label className="reg-label">Referral Code (Optional)</label>
                    <input type="text" name="referral_input" value={formData.referral_input} onChange={handleInputChange} className="reg-input" placeholder="Enter code" />
                  </div>

                  <div className="reg-checkbox-group">
                    <input type="checkbox" id="terms" required style={{ accentColor: '#0a520d' }} />
                    <label htmlFor="terms" className="reg-checkbox-label">
                      I agree to the firm's <a href="#" className="reg-link">Terms & Conditions</a>
                    </label>
                  </div>

                  <button type="submit" className="reg-submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Get Started'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="reg-title">Verify Your Email</h1>
                <p className="reg-otp-instruction">
                  A 6-digit verification code has been sent to:<br />
                  <strong style={{color: '#1F2937'}}>{otpData.email}</strong>
                </p>

                <form onSubmit={handleVerifyOtp} className="reg-form">
                  {message && <div className="reg-success-msg">{message}</div>}
                  {error && <div className="reg-error-msg">{error}</div>}
                  
                  <div className="reg-form-group">
                    <label className="reg-label">Enter OTP Code</label>
                    <input type="text" name="otp" value={otpData.otp} onChange={handleOtpChange} className="reg-input" placeholder="6-digit OTP" required maxLength="6" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    <button type="submit" className="reg-submit-btn" disabled={loading}>
                      {loading ? 'Verifying...' : 'Complete Verification'}
                    </button>
                    <button type="button" className="reg-back-btn" onClick={() => { setStep(1); setError(''); setMessage(''); }}>
                      Back to Registration
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;