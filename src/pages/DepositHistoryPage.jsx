import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
    FaHistory, FaChevronLeft, FaSpinner, FaReceipt, 
    FaClock, FaRegCalendarAlt, FaMoneyBillAlt, 
    FaUniversity, FaCheckCircle, FaHourglassHalf, 
    FaImage, FaUser
} from 'react-icons/fa';
import BASE_URL from '../api/baseURL';
import '../css/DepositHistoryPage.css';

function DepositHistoryPage() {
    const navigate = useNavigate();
    const spotlightRef = useRef(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleMouseMove = (e) => {
        if (spotlightRef.current) {
            const rect = spotlightRef.current.getBoundingClientRect();
            spotlightRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
            spotlightRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    };

    const fetchHistory = useCallback(async () => {
        const token = sessionStorage.getItem('accessToken');
        try {
            const res = await axios.get(`${BASE_URL}/transactions/deposit/history/`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setHistory(res.data);
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const getFullImageUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, "")}${path}`;
    };

    return (
        <Layout activeTab="deposit">
            <div className="history-container">
                <div className="history-header">
                    <h2 className="history-title">Deposit History</h2>
                    <p style={{color: '#718096', fontSize: '0.85rem'}}>View all your payment submissions</p>
                </div>

                {/* STATS SPOTLIGHT CARD */}
                <div 
                    className="history-stats-card" 
                    ref={spotlightRef} 
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => spotlightRef.current.style.setProperty('--x', '-1000px')}
                >
                    <div className="history-grid-overlay"></div>
                    <div style={{position: 'relative', zIndex: 2}}>
                        <div style={{fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase'}}>Payment Requests</div>
                        <div style={{fontSize: '1.8rem', fontWeight: 900}}>{history.length} <span style={{fontSize: '0.9rem'}}>Items</span></div>
                        <button onClick={() => navigate('/deposit')} className="deposit-back-btn" style={{marginTop:'10px', padding:'5px 15px', height:'auto', width:'auto'}}>
                            + New Deposit
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{textAlign: 'center', padding: '3rem'}}><FaSpinner className="animate-spin" style={{fontSize: '2rem', color: '#1a0b24'}} /></div>
                ) : history.length > 0 ? (
                    history.map((item) => (
                        <div key={item.id} className={`txn-card txn-${item.status.toLowerCase()}`}>
                            <div className="txn-top">
                                <div className="txn-amount">
                                    <span style={{fontSize: '0.8rem', color: '#718096'}}>PKR</span> {parseFloat(item.amount).toLocaleString()}
                                </div>
                                <span className={`txn-status-badge status-${item.status.toLowerCase()}`}>
                                    {item.status === 'Approved' ? <FaCheckCircle /> : <FaHourglassHalf />} {item.status}
                                </span>
                            </div>

                            <div className="txn-body">
                                <div className="txn-row">
                                    <span className="txn-label"><FaUniversity /> Method/Bank</span>
                                    <span className="txn-value">{item.method} ({item.bank_name})</span>
                                </div>
                                <div className="txn-row">
                                    <span className="txn-label"><FaReceipt /> TXN ID</span>
                                    <span className="txn-value" style={{fontSize:'0.7rem'}}>{item.transaction_id}</span>
                                </div>
                                <div className="txn-row">
                                    <span className="txn-label"><FaUser /> Owner</span>
                                    <span className="txn-value">{item.account_owner}</span>
                                </div>
                                <div className="txn-row" style={{marginTop: '5px'}}>
                                    <a href={getFullImageUrl(item.screenshot)} target="_blank" rel="noreferrer" className="screenshot-link">
                                        <FaImage /> View Screenshot
                                    </a>
                                    <span style={{fontSize: '0.7rem', color: '#94A3B8'}}>
                                        <FaClock /> {new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{marginTop:'10px', fontSize:'0.7rem', color:'#94A3B8', textAlign:'right', fontWeight:700}}>
                                <FaRegCalendarAlt /> {new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="deposit-empty-history">
                        <FaHistory style={{fontSize: '3rem', opacity: 0.2}} />
                        <p>No history found.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default DepositHistoryPage;