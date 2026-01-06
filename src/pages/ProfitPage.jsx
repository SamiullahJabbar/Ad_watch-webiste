import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL'; 
import Layout from '../components/Layout'; 
import { FaCalendarAlt, FaSpinner, FaChartLine, FaExclamationCircle, FaMoneyBillWave, FaWallet } from 'react-icons/fa';
import '../css/ProfitPage.css';

const PLAN_PROFIT_HISTORY_ENDPOINT = `${BASE_URL}/transactions/profit/history/`;
const PLAN_HISTORY_ENDPOINT = `${BASE_URL}/transactions/plans/history/`;

const calculateProgress = (startDateStr, endDateStr) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const elapsedDurationMs = today.getTime() - startDate.getTime();
    return Math.min((elapsedDurationMs / totalDurationMs) * 100, 99.99); 
};

function ProfitPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activePlansData, setActivePlansData] = useState([]);
    const [totalProfit, setTotalProfit] = useState(0);
    const [totalInvestment, setTotalInvestment] = useState(0);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    // Spotlight Ref
    const spotlightCardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (spotlightCardRef.current) {
            const rect = spotlightCardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            spotlightCardRef.current.style.setProperty('--x', `${x}px`);
            spotlightCardRef.current.style.setProperty('--y', `${y}px`);
        }
    };

    const handleMouseLeave = () => {
        if (spotlightCardRef.current) {
            spotlightCardRef.current.style.setProperty('--x', '-1000px');
            spotlightCardRef.current.style.setProperty('--y', '-1000px');
        }
    };

    const fetchPlanData = useCallback(async () => {
        setLoading(true);
        const token = sessionStorage.getItem('accessToken');
        if (!token) { navigate('/login'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const profitRes = await axios.get(PLAN_PROFIT_HISTORY_ENDPOINT, { headers });
            const profitMap = new Map();
            let totalProfitSum = 0;
            profitRes.data.forEach(item => {
                profitMap.set(item.plan, item);
                if (item.is_active && item.total_earned) totalProfitSum += parseFloat(item.total_earned);
            });
            const plansRes = await axios.get(PLAN_HISTORY_ENDPOINT, { headers });
            let totalInvestmentSum = 0;
            const mergedActivePlans = plansRes.data
                .filter(plan => plan.status === 'Active')
                .map(plan => {
                    const profitInfo = profitMap.get(plan.title) || {};
                    totalInvestmentSum += parseFloat(plan.amount);
                    return { ...plan, ...profitInfo, progress: calculateProgress(plan.start_date, plan.end_date), key: plan.title + plan.start_date };
                });
            setActivePlansData(mergedActivePlans);
            setTotalProfit(totalProfitSum);
            setTotalInvestment(totalInvestmentSum);
        } catch (error) {
            setMessage({ text: 'Failed to load details.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchPlanData(); }, [fetchPlanData]);

    const renderPlanCard = (plan) => {
        const remainingDays = plan.remaining_days > 0 ? plan.remaining_days : 0;
        const progress = plan.progress || 0;
        return (
            <div key={plan.key} className="plan-card fade-in">
                <div style={{fontSize: '1.1rem', fontWeight: '800', color: '#1A202C', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
                    <div style={{width: '8px', height: '20px', background: '#1A202C', borderRadius: '4px'}}></div>
                    {plan.title} 
                    <span style={{fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px', background: '#E0E7FF', color: '#2563EB', marginLeft: 'auto'}}>ACTIVE</span>
                </div>
                <div className="info-row">
                    <span style={{color: '#718096', fontSize: '0.85rem'}}>Investment</span>
                    <span style={{fontWeight: '700'}}>{parseFloat(plan.amount).toLocaleString()} PKR</span>
                </div>
                <div className="info-row">
                    <span style={{color: '#718096', fontSize: '0.85rem'}}>Daily Profit</span>
                    <span style={{fontWeight: '700', color: '#ebbd25ff'}}>{parseFloat(plan.daily_profit || 0).toLocaleString()} PKR</span>
                </div>
                <div className="info-row">
                    <span style={{color: '#718096', fontSize: '0.85rem'}}>Total Earned</span>
                    <span style={{fontWeight: '700', color: '#1A202C'}}>{parseFloat(plan.total_earned || 0).toLocaleString()} PKR</span>
                </div>
                <div style={{marginTop: '1.2rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '5px'}}>
                        <span>Progress: {Math.round(progress)}%</span>
                        <span style={{color: '#718096'}}>{remainingDays} Days Left</span>
                    </div>
                    <div className="progress-bar-wrapper">
                        <div className="progress-fill" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <Layout activeTab="invest">
            <div className="profit-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                <FaSpinner className="animate-spin" style={{ fontSize: '2.5rem', color: '#1a0b24' }} />
            </div>
        </Layout>
    );

    return (
        <Layout activeTab="invest">
            <div className="profit-container">
                <h1 className="page-title">Profit Center</h1>
                <p className="page-subtitle">Manage and track your active investments</p>

                {activePlansData.length > 0 && (
                    <>
                        {/* DARK PURPLE SPOTLIGHT CARD */}
                        <div 
                            className="total-profit-card fade-in"
                            ref={spotlightCardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="balance-grid-overlay"></div>
                            <div className="total-profit-content">
                                <div className="total-profit-text">Active Plans Profit</div>
                                <div className="total-profit-amount">PKR {totalProfit.toLocaleString()}</div>
                                <div style={{marginTop: '10px', fontSize: '0.75rem', fontWeight: '700', color: '#ffffffff'}}>
                                    TRACKING {activePlansData.length} ACTIVE ASSETS
                                </div>
                                <FaMoneyBillWave className="total-profit-icon" />
                            </div>
                        </div>

                        {/* STATS BOXES */}
                        <div className="stats-grid fade-in">
                            <div className="stat-card">
                                <div className="stat-icon-box"><FaWallet style={{color: '#eb6425ff'}}/></div>
                                <div>
                                    <div style={{color: '#718096', fontSize: '0.65rem', fontWeight: '800'}}>TOTAL INVESTED</div>
                                    <div className="stat-val-text">{totalInvestment.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon-box"><FaChartLine style={{color: '#6366F1'}}/></div>
                                <div>
                                    <div style={{color: '#718096', fontSize: '0.65rem', fontWeight: '800'}}>ACTIVE PLANS</div>
                                    <div className="stat-val-text">{activePlansData.length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="plans-grid">
                            {activePlansData.map(plan => renderPlanCard(plan))}
                        </div>
                    </>
                )}

                {activePlansData.length === 0 && (
                    <div className="plan-card fade-in" style={{textAlign: 'center', padding: '3rem'}}>
                        <FaChartLine style={{fontSize: '3rem', color: '#CBD5E0', marginBottom: '1rem'}} />
                        <h3 style={{color: '#2D3748'}}>No Active Plans</h3>
                        <button onClick={() => navigate('/')} className="cta-button">Browse Plans</button>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default ProfitPage;