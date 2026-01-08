import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
    FaHistory, FaCheckCircle, FaHourglassHalf, 
    FaTimesCircle, FaPlus, FaArrowLeft 
} from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';
import BASE_URL from '../api/baseURL';
import '../css/Dashboard.css'; 
import '../css/DepositHistoryPage.css';

function DepositHistoryPage() {
    const navigate = useNavigate();
    const spotlightRef = useRef(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ approved: 0, pending: 0 });

    const handleMouseMove = (e) => {
        if (spotlightRef.current) {
            const rect = spotlightRef.current.getBoundingClientRect();
            spotlightRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
            spotlightRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    };

    const fetchHistory = useCallback(async () => {
        const token = sessionStorage.getItem('accessToken');
        if (!token) { navigate('/login'); return; }
        try {
            const res = await axios.get(`${BASE_URL}/transactions/deposit/history/`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            const data = res.data;
            setHistory(data);
            const apprv = data.filter(d => d.status === 'Approved').reduce((s, i) => s + parseFloat(i.amount), 0);
            const pend = data.filter(d => d.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount), 0);
            setStats({ approved: apprv.toFixed(2), pending: pend.toFixed(2) });
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    return (
        <Layout currentPath="/DepositHistory">
            <div className="dashboard-container">
                {loading ? (
                    <div className="loader-container"><FiLoader className="animate-spin" /></div>
                ) : (
                    <>
                        {/* --- TOP PREMIUM STATS CARD --- */}
                        <div 
                            className="balance-card" 
                            ref={spotlightRef} 
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => spotlightRef.current && spotlightRef.current.style.setProperty('--x', '-1000px')}
                        >
                            <div className="balance-grid-overlay"></div>
                            <div className="balance-content">
                                <div className="balance-stats-grid">
                                    <div className="stat-item left">
                                        <div className="stat-label">Total Deposits</div>
                                        <div className="stat-value small">PKR {stats.approved}</div>
                                    </div>
                                    <div className="stat-item right">
                                        <div className="stat-label">Pending Amount</div>
                                        <div className="stat-value small highlight">PKR {stats.pending}</div>
                                    </div>
                                    <div className="stat-item left mt-4">
                                        <div className="stat-label">Total Requests</div>
                                        <div className="stat-value small" style={{fontSize: '0.9rem'}}>{history.length} </div>
                                    </div>
                                    <div className="stat-item right mt-4">
                                        <div className="stat-label">Success Rate</div>
                                        <div className="stat-value small" style={{fontSize: '0.9rem'}}>
                                            {history.length > 0 ? ((history.filter(h=>h.status==='Approved').length / history.length) * 100).toFixed(0) : 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- NAVIGATION SECTION (Updated to match Withdraw History) --- */}
                        <h2 className="section-title">Navigation</h2>
                        <div className="nav-grid-history">
                            <div onClick={() => navigate('/deposit')} className="nav-item-history">
                                <div className="nav-icon-wrapper"><FaPlus style={{color:'#059669'}}/></div>
                                <span className="nav-text-label">Deposit</span>
                            </div>
                            <div onClick={() => navigate('/')} className="nav-item-history">
                                <div className="nav-icon-wrapper"><FaArrowLeft style={{color:'#2563EB'}}/></div>
                                <span className="nav-text-label">Back</span>
                            </div>
                        </div>

                        {/* --- PREMIUM TRANSACTION LIST --- */}
                        <h2 className="section-title">Deposit Activity</h2>
                        <div className="premium-list-container">
                            {history.length > 0 ? (
                                [...history].reverse().map((item) => (
                                    <div key={item.id} className="premium-txn-card">
                                        <div className="txn-left-section">
                                            <div className={`status-icon-box ${item.status.toLowerCase()}`}>
                                                {item.status === 'Approved' ? <FaCheckCircle /> : item.status === 'Pending' ? <FaHourglassHalf /> : <FaTimesCircle />}
                                            </div>
                                            <div className="txn-details">
                                                <span className="txn-main-title">{item.bank_name || 'Bank Deposit'}</span>
                                                <span className="txn-sub-text">ID: {item.transaction_id ? item.transaction_id.substring(0, 12) : 'N/A'}...</span>
                                                <span className="txn-date-text" style={{fontSize:'0.65rem', color:'#94a3b8'}}>{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="txn-right-section">
                                            <div className="txn-amount-text">PKR {parseFloat(item.amount).toLocaleString()}</div>
                                            <div className={`txn-status-pill ${item.status.toLowerCase()}`}>
                                                {item.status}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="error-container">No transaction history found.</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}

export default DepositHistoryPage;