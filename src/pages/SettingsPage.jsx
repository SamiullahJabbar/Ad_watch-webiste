import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BASE_URL from '../api/baseURL';
import Layout from '../components/Layout';
import { FaUser, FaCamera, FaEnvelope, FaCheckCircle, FaSpinner, FaShieldAlt, FaUserCircle } from 'react-icons/fa';
import '../css/SettingsPage.css';

function SettingsPage() {
    const [profile, setProfile] = useState({ email: '', username: '', is_verified: false, profile_image: '' });
    const [newUsername, setNewUsername] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const cardRef = useRef(null);

    // FIXED: Ye function ab /api ko remove karega media files ke liye
    const getFullImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        // Agar BASE_URL "http://127.0.0.1:8000/api" hai
        // Toh hum sirf root domain lenge "http://127.0.0.1:8000"
        const rootUrl = BASE_URL.split('/api')[0]; 
        
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${rootUrl}${cleanPath}`;
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = sessionStorage.getItem('accessToken');
        try {
            const res = await axios.get(`${BASE_URL}/accounts/profile/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setProfile(res.data);
            setNewUsername(res.data.username);
            
            if (res.data.profile_image) {
                setPreview(getFullImageUrl(res.data.profile_image));
            }
        } catch (err) { 
            console.error("Profile fetch error", err); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleMouseMove = (e) => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            cardRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
            cardRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file)); 
        }
    };

    const updateProfile = async () => {
        setUpdating(true);
        const token = sessionStorage.getItem('accessToken');
        
        const formData = new FormData();
        formData.append('username', newUsername);
        if (imageFile) {
            formData.append('profile_image', imageFile);
        }

        try {
            const res = await axios.put(`${BASE_URL}/accounts/profile/`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            alert("Profile updated successfully!");
            
            // Response handle karna (direct res.data)
            const updatedData = res.data; 
            setProfile(updatedData);
            setNewUsername(updatedData.username);
            setPreview(getFullImageUrl(updatedData.profile_image));
            setImageFile(null);
        } catch (err) {
            console.error("Update failed", err);
            alert("Update failed!");
        } finally { 
            setUpdating(false); 
        }
    };

    if (loading) return (
        <Layout activeTab="settings">
            <div className="settings-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height: '100vh'}}>
                <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: '#1a0b24'}} />
            </div>
        </Layout>
    );

    return (
        <Layout activeTab="settings">
            <div className="settings-container">
                <h1 style={{fontSize: '1.5rem', fontWeight: 800, color: '#1a0b24'}}>Settings</h1>
                <p style={{fontSize: '0.85rem', color: '#718096', marginBottom: '1.5rem'}}>Update your personal information</p>

                <div 
                    className="profile-header-card" 
                    ref={cardRef} 
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => cardRef.current && cardRef.current.style.setProperty('--x', '-1000px')}
                >
                    <div className="settings-grid-overlay"></div>
                    <div style={{position: 'relative', zIndex: 2}}>
                        <div className="avatar-wrapper">
                            {preview ? (
                                <img 
                                    src={preview} 
                                    alt="Profile" 
                                    className="main-avatar" 
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                                    }}
                                />
                            ) : (
                                <div className="main-avatar" style={{display:'flex', alignItems:'center', justifyContent:'center', background:'#2D3748'}}>
                                    <FaUserCircle style={{fontSize: '5rem', color: '#A0AEC0'}} />
                                </div>
                            )}
                            <label htmlFor="imgUpload" className="upload-icon-label">
                                <FaCamera />
                            </label>
                            <input type="file" id="imgUpload" hidden onChange={handleImageChange} accept="image/*" />
                        </div>
                        <h2 style={{margin: '0', fontSize: '1.4rem'}}>@{profile.username}</h2>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '5px'}}>
                            {profile.is_verified ? (
                                <span style={{color: '#2ECC71', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <FaCheckCircle /> VERIFIED ACCOUNT
                                </span>
                            ) : (
                                <span style={{color: '#E53E3E', fontSize: '0.75rem', fontWeight: 'bold'}}>UNVERIFIED</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-card">
                    <div className="input-group">
                        <label><FaEnvelope /> Email Address</label>
                        <input type="text" className="styled-input" value={profile.email} disabled />
                    </div>

                    <div className="input-group">
                        <label><FaUser /> Username</label>
                        <input 
                            type="text" 
                            className="styled-input" 
                            value={newUsername} 
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                    </div>

                    <div style={{background: '#F1F5F9', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <FaShieldAlt style={{color: '#64748B'}} />
                        <span style={{fontSize: '0.7rem', color: '#64748B', fontWeight: '600'}}>
                            Security Notice: Your email cannot be changed once verified.
                        </span>
                    </div>

                    <button className="save-btn" onClick={updateProfile} disabled={updating}>
                        {updating ? <FaSpinner className="animate-spin" /> : 'Update Profile'}
                    </button>
                </div>
            </div>
        </Layout>
    );
}

export default SettingsPage;