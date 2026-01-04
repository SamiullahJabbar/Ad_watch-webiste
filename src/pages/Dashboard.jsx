import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Layout from '../components/Layout'; 
import BASE_URL, { getAccessToken } from '../api/baseURL'; 
import { FaDollarSign, FaWallet, FaUsers, FaHistory } from 'react-icons/fa'; 
import { FiLoader } from 'react-icons/fi'; 
import InvestmentPlans from './InvestmentPlans';
import '../css/Dashboard.css';
import ReviewSlider from './ReviewSlider';

// --- Quick Action Components ---
const MobileQuickActionButton = ({ icon: Icon, label, color, path }) => (
    <a href={path} className="mobile-action-btn">
        <div className="mobile-icon-wrapper">
            <Icon style={{ fontSize: '1.1rem', color: color }} />
        </div>
        <span>{label}</span>
    </a>
);

const DesktopQuickActionButton = ({ icon: Icon, label, color, path }) => (
    <a href={path} className="desktop-action-btn">
        <Icon style={{ fontSize: '2rem', color: color, marginBottom: '0.5rem' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{label}</span>
    </a>
);

function Dashboard() {
    const [balance, setBalance] = useState('0.00');
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

    const isMobile = windowWidth <= 768;
    const balanceCardRef = useRef(null);

    // Initial Torch Position (Off-screen)
    useEffect(() => {
        if (balanceCardRef.current) {
            balanceCardRef.current.style.setProperty('--x', '-1000px');
            balanceCardRef.current.style.setProperty('--y', '-1000px');
        }
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Torch Effect Handlers
    const handleMouseMove = (e) => {
        if (balanceCardRef.current) {
            const rect = balanceCardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            balanceCardRef.current.style.setProperty('--x', `${x}px`);
            balanceCardRef.current.style.setProperty('--y', `${y}px`);
        }
    };

    const handleMouseLeave = () => {
        if (balanceCardRef.current) {
            balanceCardRef.current.style.setProperty('--x', '-1000px');
            balanceCardRef.current.style.setProperty('--y', '-1000px');
        }
    };

    const fetchAllData = async () => {
        const token = getAccessToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }
        try {
            const [walletRes, plansRes] = await Promise.all([
                axios.get(`${BASE_URL}/transactions/wallet/detail/`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_URL}/transactions/plans/`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setBalance(parseFloat(walletRes.data.balance || 0).toFixed(2));
            setPlans(plansRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []); 

    return (
        <Layout currentPath="/invest"> 
            <div className={`dashboard-container ${isMobile ? 'mobile' : ''}`}>
                {loading ? (
                    <div className="loader-container"><FiLoader className="animate-spin" /></div>
                ) : error ? (
                    <div className="error-container">{error}</div>
                ) : (
                    <>
                        {/* REVEAL GRID BALANCE CARD */}
                        <div 
                            className={`balance-card ${isMobile ? 'mobile' : ''}`}
                            ref={balanceCardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="balance-grid-overlay"></div>
                            
                            <div className="balance-content">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div className="balance-title">Total Balance</div>
                                    <div className="balance-value">PKR {balance}</div>
                                </div>

                                <div className="mobile-quick-actions">
                                    <MobileQuickActionButton icon={FaDollarSign} label="Deposit" color="#0a520d" path="/deposit" />
                                    <MobileQuickActionButton icon={FaWallet} label="Withdraw" color="#E53E3E" path="/withdraw" />
                                    <MobileQuickActionButton icon={FaHistory} label="History" color="#2563EB" path="/profit" />
                                    <MobileQuickActionButton icon={FaUsers} label="Profit" color="#388E3C" path="/profit" />
                                </div>
                            </div>
                        </div>

                        <div className="desktop-quick-actions-card">
                            <DesktopQuickActionButton icon={FaDollarSign} label="Deposit" color="#0a520d" path="/deposit" />
                            <DesktopQuickActionButton icon={FaWallet} label="Withdraw" color="#E53E3E" path="/withdraw" />
                            <DesktopQuickActionButton icon={FaHistory} label="History" color="#2563EB" path="" />
                            <DesktopQuickActionButton icon={FaUsers} label="Plan Profit" color="#388E3C" path="/profit" />
                        </div>

                        <h2 className="section-title">Plan Activation</h2>

                        <InvestmentPlans 
                            plans={plans} 
                            onInvestSuccess={fetchAllData} 
                            isMobile={isMobile} 
                        />
                    </>
                )}
                <ReviewSlider />
            </div>
        </Layout>
    );
}

export default Dashboard;