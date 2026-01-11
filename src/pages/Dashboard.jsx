import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Layout from '../components/Layout'; 
import BASE_URL, { getAccessToken } from '../api/baseURL'; 
import { FaDollarSign, FaWallet, FaUsers, FaHistory, FaClipboardList, FaUserPlus, FaWhatsapp } from 'react-icons/fa'; 
import { FiLoader } from 'react-icons/fi'; 
import InvestmentPlans from './InvestmentPlans';
import '../css/Dashboard.css';
import ReviewSlider from './ReviewSlider';
import { FcPlanner } from "react-icons/fc";

// Currency Brain ko import kiya
import { useCurrency } from '../components/CurrencyContext'; 

const QuickActionButton = ({ icon: Icon, label, color, path }) => (
    <a href={path} className="action-btn-item" target={path.startsWith('http') ? "_blank" : "_self"} rel="noopener noreferrer">
        <div className="icon-box-wrapper">
            <Icon style={{ fontSize: '1.2rem', color: color }} />
        </div>
        <span>{label}</span>
    </a>
);

function Dashboard() {
    // Currency context se convert aur symbol nikaale
    const { convert, symbol } = useCurrency();

    const [balance, setBalance] = useState('0.00');
    const [totalDeposit, setTotalDeposit] = useState('0.00');
    const [totalWithdraw, setTotalWithdraw] = useState('0.00');
    const [pendingWithdraw, setPendingWithdraw] = useState('0.00');
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const [whatsappLink, setWhatsappLink] = useState(null);

    const isMobile = windowWidth <= 768;
    const balanceCardRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            const headers = { Authorization: `Bearer ${token}` };
            const [walletRes, plansRes, depositRes, withdrawRes, whatsappRes] = await Promise.all([
                axios.get(`${BASE_URL}/transactions/wallet/detail/`, { headers }),
                axios.get(`${BASE_URL}/transactions/plans/`, { headers }),
                axios.get(`${BASE_URL}/transactions/deposit/history/`, { headers }),
                axios.get(`${BASE_URL}/transactions/withdraw/history/`, { headers }),
                axios.get(`${BASE_URL}/accounts/whatsapp-link/`, { headers })
            ]);

            setBalance(parseFloat(walletRes.data.balance || 0).toFixed(2));
            setPlans(plansRes.data);
            setTotalDeposit(depositRes.data.filter(d => d.status === 'Approved').reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2));
            setTotalWithdraw(withdrawRes.data.filter(w => w.status === 'Approved').reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2));
            setPendingWithdraw(withdrawRes.data.filter(w => w.status === 'Pending').reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2));
            setWhatsappLink(whatsappRes.data.link);
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
                        {/* BALANCE CARD - Updated with Conversion */}
                        <div 
                            className={`balance-card ${isMobile ? 'mobile' : ''}`}
                            ref={balanceCardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="balance-grid-overlay"></div>
                            <div className="balance-content">
                                <div className="balance-stats-grid">
                                    <div className="stat-item left">
                                        <div className="stat-label">Current Balance</div>
                                        {/* PKR remove kar ke symbol aur convert function laga diya */}
                                        <div className="stat-value small">{symbol} {convert(balance)}</div>
                                    </div>
                                    <div className="stat-item right">
                                        <div className="stat-label">Total Deposit</div>
                                        <div className="stat-value small">{symbol} {convert(totalDeposit)}</div>
                                    </div>
                                    <div className="stat-item left mt-4">
                                        <div className="stat-label">Total Withdraw</div>
                                        <div className="stat-value small">{symbol} {convert(totalWithdraw)}</div>
                                    </div>
                                    <div className="stat-item right mt-4">
                                        <div className="stat-label">Pending Withdraw</div>
                                        <div className="stat-value small highlight">{symbol} {convert(pendingWithdraw)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* QUICK ACTIONS */}
                        <h2 className="section-title">Collections</h2>
                        <div className="actions-grid-container">
                            <QuickActionButton icon={FaDollarSign} label="Deposit" color="#0a520d" path="/deposit" />
                            <QuickActionButton icon={FaWallet} label="Withdraw" color="#E53E3E" path="/withdraw" />
                            <QuickActionButton icon={FaHistory} label="History" color="#2563EB" path="/DepositHistory" />
                            <QuickActionButton icon={FaUsers} label="Teams" color="#388E3C" path="/Teams" />
                            <QuickActionButton icon={FaClipboardList} label="Todo" color="#8E44AD" path="/" />
                            <QuickActionButton icon={FcPlanner} label="Plans" color="#F39C12" path="/myplan" />
                            <QuickActionButton icon={FaUserPlus} label="Referral" color="#2ECC71" path="/ReferralProgram" />
                            {whatsappLink && (
                                <QuickActionButton icon={FaWhatsapp} label="WhatsApp" color="#25D366" path={whatsappLink} />
                            )}
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