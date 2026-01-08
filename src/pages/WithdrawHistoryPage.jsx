import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';
import Layout from '../components/Layout'; 
import { 
    FaHistory, FaCheckCircle, FaClock, 
    FaTimesCircle, FaSearch, FaArrowLeft, FaFilter 
} from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';


import { 
    FiMenu, FiLogOut, FiBell, FiX, FiHome, 
    FiSettings, FiLayers, FiShare2, FiStar 
} from 'react-icons/fi';

// Spotlight Box Component for individual stats
const StatSpotlightBox = ({ label, value, colorClass }) => {
    const boxRef = useRef(null);
    const handleMouseMove = (e) => {
        if (boxRef.current) {
            const rect = boxRef.current.getBoundingClientRect();
            boxRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
            boxRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    };
    return (
        <div 
            className={`stat-spotlight-card ${colorClass}`} 
            ref={boxRef} 
            onMouseMove={handleMouseMove}
            onMouseLeave={() => boxRef.current && boxRef.current.style.setProperty('--x', '-1000px')}
        >
            <div className="stat-grid-overlay"></div>
            <div className="stat-card-content">
                <div className="stat-card-label">{label}</div>
                <div className="stat-card-value">{value}</div>
            </div>
        </div>
    );
};

function WithdrawHistoryPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchWithdrawHistory = useCallback(async () => {
        const token = sessionStorage.getItem('accessToken');
        if (!token) { navigate('/login'); return; }
        try {
            setLoading(true);
            const res = await axios.get(`${BASE_URL}/transactions/withdraw/history/`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setHistory(res.data);
        } catch (err) {
            console.error("History API Error:", err);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchWithdrawHistory(); }, [fetchWithdrawHistory]);

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesSearch = (item.method || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (item.bank_account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.amount.toString().includes(searchTerm);
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [history, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const successful = history.filter(item => item.status === 'Successful' || item.status === 'Approved');
        const pending = history.filter(item => item.status === 'Pending');
        const totalWithdrawn = successful.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        return {
            total: history.length,
            successCount: successful.length,
            pendingCount: pending.length,
            amount: totalWithdrawn.toLocaleString()
        };
    }, [history]);

    return (
        <Layout currentPath="/WithdrawHistory">
            <style>{`
                .withdraw-container { padding: 20px; max-width: 1200px; margin: auto; }
                .withdraw-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
                @media (min-width: 768px) { .withdraw-stats-grid { grid-template-columns: repeat(4, 1fr); } }
                
                .stat-spotlight-card { position: relative; border-radius: 20px; padding: 22px; overflow: hidden; color: white; --x: -1000px; --y: -1000px; transition: transform 0.2s; }
                .stat-spotlight-card:hover { transform: translateY(-5px); }
                .purple-theme { background: #1a0b24; }
                .green-theme { background: #059669; }
                .amber-theme { background: #d97706; }
                .dark-theme { background: #1e293b; }

                .stat-grid-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 15px 15px; mask-image: radial-gradient(120px circle at var(--x) var(--y), black 0%, transparent 100%); -webkit-mask-image: radial-gradient(120px circle at var(--x) var(--y), black 0%, transparent 100%); }
                .stat-card-content { position: relative; z-index: 2; }
                .stat-card-label { font-size: 0.7rem; opacity: 0.8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-card-value { font-size: 1.2rem; font-weight: 900; margin-top: 8px; }

                .section-title { font-size: 1.1rem; font-weight: 800; color: #1a0b24; margin: 25px 0 15px; }
                .premium-filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
                .p-search, .p-select { background: white; border: 1px solid #e2e8f0; border-radius: 15px; display: flex; align-items: center; padding: 0 15px; flex: 1; }
                .p-search input, .p-select select { border: none; padding: 12px; width: 100%; outline: none; font-weight: 600; font-size: 0.9rem; background: transparent; }
                
                .premium-list-container { display: flex; flex-direction: column; gap: 12px; }
                .premium-txn-card { background: white; padding: 18px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .txn-left { display: flex; align-items: center; gap: 15px; }
                .icon-box { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
                .icon-box.successful, .icon-box.approved { background: #ecfdf5; color: #059669; }
                .icon-box.pending { background: #fffbeb; color: #d97706; }
                .icon-box.failed, .icon-box.rejected { background: #fef2f2; color: #dc2626; }
                
                .txn-main-title { font-weight: 800; color: #1e293b; font-size: 0.95rem; display: block; }
                .txn-sub-text { font-size: 0.75rem; color: #64748b; font-weight: 600; }
                .txn-right { text-align: right; }
                .txn-amount { font-weight: 900; color: #1a0b24; font-size: 1.05rem; margin-bottom: 4px; }
                .status-pill { font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; color: white; }
                .status-pill.successful, .status-pill.approved { background: #10b981; }
                .status-pill.pending { background: #f59e0b; }
                .status-pill.failed, .status-pill.rejected { background: #ef4444; }

                .nav-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .nav-item { background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: 0.2s; }
                .nav-item:active { transform: scale(0.95); }
                .nav-icon { width: 40px; height: 40px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
            `}</style>

            <div className="withdraw-container">
                {loading ? (
                    <div className="loader-container" style={{display:'flex', justifyContent:'center', padding:'50px'}}><FiLoader className="animate-spin" size={30} /></div>
                ) : (
                    <>
                        {/* 1. SEPARATE STATS BOXES WITH SPOTLIGHT */}
                        <div className="withdraw-stats-grid">
                            <StatSpotlightBox label="Total Requests" value={stats.total} colorClass="purple-theme" />
                            <StatSpotlightBox label="Successful" value={stats.successCount} colorClass="green-theme" />
                            <StatSpotlightBox label="Pending" value={stats.pendingCount} colorClass="amber-theme" />
                            <StatSpotlightBox label="Total Withdrawn" value={`PKR ${stats.amount}`} colorClass="dark-theme" />
                        </div>

                        {/* 2. NAVIGATION SECTION */}
                        <h2 className="section-title">Navigation</h2>
                        <div className="nav-grid">
                            <div onClick={() => navigate('/withdraw')} className="nav-item">
                                <div className="nav-icon"><FaArrowLeft style={{color:'#ef4444'}}/></div>
                                <span style={{fontSize:'0.8rem', fontWeight:'700'}}>Back</span>
                            </div>
                            <div onClick={() => navigate('/')} className="nav-item">
                                <div className="nav-icon"><FiHome style={{color:'#2563eb'}}/></div>
                                <span style={{fontSize:'0.8rem', fontWeight:'700'}}>Dashboard</span>
                            </div>
                        </div>

                        {/* 3. SEARCH & FILTERS */}
                        <h2 className="section-title">Filters</h2>
                        <div className="premium-filter-bar">
                            <div className="p-search">
                                <FaSearch color="#94a3b8" />
                                <input type="text" placeholder="Search account or amount..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="p-select">
                                <FaFilter color="#94a3b8" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="All">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Failed">Failed</option>
                                </select>
                            </div>
                        </div>

                        {/* 4. PREMIUM ACTIVITY LIST */}
                        <h2 className="section-title">Withdrawal Activity</h2>
                        <div className="premium-list-container">
                            {filteredHistory.length > 0 ? (
                                [...filteredHistory].reverse().map((item) => (
                                    <div key={item.id} className="premium-txn-card">
                                        <div className="txn-left">
                                            <div className={`icon-box ${item.status.toLowerCase()}`}>
                                                {(item.status === 'Successful' || item.status === 'Approved') ? <FaCheckCircle /> : item.status === 'Pending' ? <FaClock /> : <FaTimesCircle />}
                                            </div>
                                            <div className="txn-info">
                                                <span className="txn-main-title">{item.method}</span>
                                                <span className="txn-sub-text">{item.bank_account}</span>
                                                <div style={{fontSize:'0.65rem', color:'#94a3b8', marginTop:'2px'}}>{new Date(item.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="txn-right">
                                            <div className="txn-amount">PKR {parseFloat(item.amount).toLocaleString()}</div>
                                            <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{textAlign:'center', padding:'40px', color:'#94a3b8', fontWeight:'700'}}>No history found.</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}

export default WithdrawHistoryPage;