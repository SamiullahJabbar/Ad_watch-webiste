import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BASE_URL from '../api/baseURL'; 
import Layout from '../components/Layout'; 
import { FaCopy, FaWhatsapp, FaTelegramPlane, FaUsers, FaGift, FaCheckCircle } from 'react-icons/fa';
import '../css/ReferralPage.css';

function ReferralPage() {
    const [data, setData] = useState({ referral_code: '', referrals: [] });
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            cardRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
            cardRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    };

    const handleMouseLeave = () => {
        if (cardRef.current) {
            cardRef.current.style.setProperty('--x', '-1000px');
            cardRef.current.style.setProperty('--y', '-1000px');
        }
    };

    useEffect(() => {
        const fetchReferrals = async () => {
            const token = sessionStorage.getItem('accessToken');
            try {
                const res = await axios.get(`${BASE_URL}/accounts/referrals/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error("Error fetching referrals", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReferrals();
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(data.referral_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareMessage = `Join this amazing platform and start earning! Use my referral code: ${data.referral_code}`;
    const waLink = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    const tgLink = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareMessage)}`;

    return (
        <Layout activeTab="referral">
            <div className="referral-container">
                <h1 style={{fontSize: '1.5rem', fontWeight: 800, color: '#1a0b24'}}>Refer & Earn</h1>
                <p style={{fontSize: '0.85rem', color: '#718096', marginBottom: '1.5rem'}}>Track your network and commissions</p>

                {/* MAIN SPOTLIGHT CARD */}
                <div 
                    className="referral-main-card" 
                    ref={cardRef} 
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="referral-grid-overlay"></div>
                    <div style={{position: 'relative', zIndex: 2}}>
                        <FaGift style={{fontSize: '2.5rem', color: '#FFD700', marginBottom: '10px'}} />
                        <div style={{fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px'}}>My Referral Code</div>
                        
                        <div className="code-box" onClick={copyToClipboard}>
                            {data.referral_code || '------'}
                            {copied ? <FaCheckCircle style={{color: '#2ECC71'}} /> : <FaCopy style={{fontSize: '0.9rem'}} />}
                        </div>
                        {copied && <div style={{fontSize: '0.7rem', color: '#2ECC71', fontWeight: '800', marginBottom: '10px'}}>LINK COPIED!</div>}

                        <div className="share-buttons">
                            <a href={waLink} target="_blank" rel="noreferrer" className="share-btn wa-btn">
                                <FaWhatsapp /> WhatsApp
                            </a>
                            <a href={tgLink} target="_blank" rel="noreferrer" className="share-btn tg-btn">
                                <FaTelegramPlane /> Telegram
                            </a>
                        </div>
                    </div>
                </div>

                {/* REFERRAL TABLE SECTION */}
                <div className="referral-list-section">
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
                        <FaUsers style={{color: '#1a0b24', fontSize: '1.2rem'}} />
                        <h2 style={{fontSize: '1.1rem', fontWeight: 800, margin: 0}}>Network Members ({data.referrals.length})</h2>
                    </div>

                    <div className="referral-table-container">
                        {loading ? (
                            <p style={{textAlign: 'center', padding: '20px', color: '#718096'}}>Fetching your network...</p>
                        ) : data.referrals.length > 0 ? (
                            <table className="referral-table">
                                <thead>
                                    <tr>
                                        <th>User Details</th>
                                        <th>Joined On</th>
                                        <th style={{textAlign: 'right'}}>Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.referrals.map((ref, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="user-cell">
                                                    <span className="username-text">@{ref.username}</span>
                                                    <span className="email-text">{ref.referred}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="date-text">
                                                    {new Date(ref.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </span>
                                            </td>
                                            <td style={{textAlign: 'right'}}>
                                                <span className="level-badge">L{ref.level}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{textAlign: 'center', padding: '3rem 1rem', color: '#A0AEC0'}}>
                                <FaUsers style={{fontSize: '2rem', opacity: 0.3, marginBottom: '10px'}} />
                                <p>Your network is empty. Invite friends to start earning!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default ReferralPage;