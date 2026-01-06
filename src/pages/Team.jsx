import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BASE_URL from '../api/baseURL'; 
import Layout from '../components/Layout'; 
import { FaUsers, FaUserCheck, FaUserTimes, FaCrown, FaCalendarAlt, FaIdBadge } from 'react-icons/fa';
import '../css/TeamPage.css';

function TeamPage() {
    const [teamData, setTeamData] = useState([]);
    const [loading, setLoading] = useState(true);
    const cardRef = useRef(null);

    // Spotlight Logic
    const handleMouseMove = (e) => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            cardRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
            cardRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    };

    useEffect(() => {
        const fetchTeam = async () => {
            const token = sessionStorage.getItem('accessToken');
            try {
                const res = await axios.get(`${BASE_URL}/accounts/referrals/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeamData(res.data.referrals || []);
            } catch (err) {
                console.error("Error fetching team data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    // Summary Stats Calculations
    const totalMembers = teamData.length;
    const verifiedMembers = teamData.filter(m => m.is_verified).length;

    return (
        <Layout activeTab="team">
            <div className="team-container">
                <h1 style={{fontSize: '1.5rem', fontWeight: 800, color: '#1a0b24', marginBottom: '0.2rem'}}>My Team</h1>
                <p style={{fontSize: '0.85rem', color: '#718096', marginBottom: '1.5rem'}}>Manage your network and direct downlines</p>

                {/* TEAM HEADER CARD (Spotlight) */}
                <div 
                    className="team-header-card" 
                    ref={cardRef} 
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => cardRef.current.style.setProperty('--x', '-1000px')}
                >
                    <div className="team-grid-overlay"></div>
                    <div style={{position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '20px'}}>
                        <div style={{background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px'}}>
                            <FaCrown style={{fontSize: '2rem', color: '#FFD700'}} />
                        </div>
                        <div>
                            <div style={{fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px'}}>Network Growth</div>
                            <div style={{fontSize: '1.8rem', fontWeight: 800}}>{totalMembers} <span style={{fontSize: '0.9rem', opacity: 0.6}}>Members</span></div>
                        </div>
                    </div>
                </div>

                {/* QUICK STATS */}
                <div className="team-stats-grid">
                    <div className="team-stat-card">
                        <FaUserCheck style={{color: '#2ECC71', fontSize: '1.2rem', marginBottom: '5px'}} />
                        <div style={{fontSize: '1.1rem', fontWeight: 800, color: '#1a0b24'}}>{verifiedMembers}</div>
                        <div style={{fontSize: '0.65rem', color: '#718096', fontWeight: 'bold'}}>VERIFIED</div>
                    </div>
                    <div className="team-stat-card">
                        <FaUserTimes style={{color: '#E53E3E', fontSize: '1.2rem', marginBottom: '5px'}} />
                        <div style={{fontSize: '1.1rem', fontWeight: 800, color: '#1a0b24'}}>{totalMembers - verifiedMembers}</div>
                        <div style={{fontSize: '0.65rem', color: '#718096', fontWeight: 'bold'}}>NOT VERIFIED</div>
                    </div>
                </div>

                {/* MEMBERS LIST */}
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem'}}>
                    <FaIdBadge style={{color: '#1a0b24'}} />
                    <h2 style={{fontSize: '1rem', fontWeight: 800, margin: 0}}>Member Directory</h2>
                </div>

                {loading ? (
                    <div style={{textAlign: 'center', padding: '2rem', color: '#718096'}}>Loading Team...</div>
                ) : teamData.length > 0 ? (
                    teamData.map((member, index) => (
                        <div key={index} className="member-card">
                            <div className="member-image-wrapper">
                                {member.image ? (
                                    <img src={member.image} alt={member.username} />
                                ) : (
                                    <FaUsers style={{fontSize: '1.5rem', color: '#A0AEC0'}} />
                                )}
                            </div>
                            
                            <div className="member-info">
                                <div className="member-username">
                                    @{member.username} 
                                    <span className={`status-badge ${member.is_verified ? 'verified' : 'not-verified'}`}>
                                        {member.is_verified ? 'Verified' : 'Unverified'}
                                    </span>
                                </div>
                                <div className="member-email">{member.referred}</div>
                                <div style={{display: 'flex', gap: '15px', marginTop: '5px'}}>
                                    <span style={{fontSize: '0.7rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <FaCalendarAlt /> {new Date(member.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="level-tag">LEVEL {member.level}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '20px', color: '#A0AEC0'}}>
                        <FaUsers style={{fontSize: '3rem', opacity: 0.2, marginBottom: '10px'}} />
                        <p>No members found in your team.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default TeamPage;