import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL'; 
import Layout from '../components/Layout'; 
import { FaCalendarAlt, FaSpinner, FaChartLine, FaExclamationCircle, FaMoneyBillWave, FaWallet } from 'react-icons/fa';

// --- API Endpoints ---
const PLAN_PROFIT_HISTORY_ENDPOINT = `${BASE_URL}/transactions/profit/history/`;
const PLAN_HISTORY_ENDPOINT = `${BASE_URL}/transactions/plans/history/`;

// --- 🎨 COLOR CONSTANTS 🎨 ---
const GREEN_PRIMARY = '#047857'; // Tailwind green-700
const GREEN_DARK = '#065F46'; // Tailwind green-800
const GREEN_LIGHT = '#D1FAE5'; // Tailwind green-100
const BG_LIGHT = '#F8FAFC'; // Light background
const FORM_CARD_BG = '#FFFFFF'; // White card background
const INPUT_BG = '#F8FAFC';
const TEXT_DARK = '#1E293B'; // Main text color
const TEXT_GRAY = '#64748B';
const TEXT_DARK_GRAY = '#94A3B8';
const SUCCESS_GREEN = '#10B981';
const ERROR_RED = '#EF4444';
const BORDER_COLOR = '#E2E8F0';
const ACCENT_BLUE = '#3B82F6';
const ACCENT_PURPLE = '#8B5CF6';

// Utility function to remove tokens 
const removeTokens = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
};

// --- Progress Bar Utility ---
const calculateProgress = (startDateStr, endDateStr) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const today = new Date();

    // Set time to 00:00:00 for accurate day comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // If plan hasn't started or is already over
    if (today < startDate) return 0;
    if (today > endDate) return 100;

    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const elapsedDurationMs = today.getTime() - startDate.getTime();

    // Prevent division by zero if duration is too short (less than 1 day)
    if (totalDurationMs <= 0) return 100;

    let progress = (elapsedDurationMs / totalDurationMs) * 100;
    
    // Cap progress at 99.99% if still active, just for visual realism before end date
    return Math.min(progress, 99.99); 
};

function ProfitPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activePlansData, setActivePlansData] = useState([]);
    const [totalProfit, setTotalProfit] = useState(0);
    const [totalInvestment, setTotalInvestment] = useState(0);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const isMobile = windowWidth <= 768;
    const isTablet = windowWidth <= 1024;

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- API Fetch Logic ---
    const fetchPlanData = useCallback(async () => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        const token = sessionStorage.getItem('accessToken');
        
        if (!token) {
            navigate('/login');
            return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // 1. Fetch Profit History (Daily profits, remaining days)
            const profitRes = await axios.get(PLAN_PROFIT_HISTORY_ENDPOINT, { headers });
            const profitMap = new Map();
            let totalProfitSum = 0;
            
            profitRes.data.forEach(item => {
                // Key is the plan title/name
                profitMap.set(item.plan, {
                    daily_profit: item.daily_profit,
                    total_earned: item.total_earned,
                    remaining_days: item.remaining_days,
                    is_active_profit: item.is_active,
                });
                
                // Calculate total profit from all active plans
                if (item.is_active && item.total_earned) {
                    totalProfitSum += parseFloat(item.total_earned);
                }
            });

            // 2. Fetch Plans History (Amount, title, dates, status)
            const plansRes = await axios.get(PLAN_HISTORY_ENDPOINT, { headers });

            // 3. Merge data for Active Plans and calculate total investment
            let totalInvestmentSum = 0;
            const mergedActivePlans = plansRes.data
                .filter(plan => plan.status === 'Active')
                .map(plan => {
                    const profitInfo = profitMap.get(plan.title) || {};
                    const progress = calculateProgress(plan.start_date, plan.end_date);
                    
                    // Add to total investment
                    totalInvestmentSum += parseFloat(plan.amount);

                    return {
                        ...plan, // title, amount, start_date, end_date, status
                        ...profitInfo, // daily_profit, total_earned, remaining_days
                        progress,
                        key: plan.title + plan.start_date, // Simple unique key
                    };
                });
            
            setActivePlansData(mergedActivePlans);
            setTotalProfit(totalProfitSum);
            setTotalInvestment(totalInvestmentSum);
            
        } catch (error) {
            console.error('Failed to fetch plan data:', error.response || error);
            
            let errorText = 'Failed to load plan details.';
            if (error.response?.status === 401) {
                errorText = 'Session expired. Redirecting to login.';
                removeTokens();
                setTimeout(() => navigate('/login'), 1500);
            } else if (error.response?.data?.detail) {
                errorText = error.response.data.detail;
            }

            setMessage({ text: errorText, type: 'error' });
            setActivePlansData([]);
            setTotalProfit(0);
            setTotalInvestment(0);

        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchPlanData();
    }, [fetchPlanData]);

    // --- STYLES ---
    const styles = {
        container: {
            background: BG_LIGHT, 
            color: TEXT_DARK, 
            fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
            paddingTop: '1.5rem', 
            paddingBottom: '3rem', 
            paddingLeft: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
            paddingRight: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
            maxWidth: '1200px', 
            margin: '0 auto',
            minHeight: '100vh',
            boxSizing: 'border-box',
            overflowY: 'auto', 
            overflowX: 'hidden', 
        },
        pageTitle: {
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            fontWeight: '800',
            color: GREEN_DARK,
            marginBottom: '0.5rem',
            textAlign: 'center',
            marginTop: '1rem' 
        },
        pageSubtitle: {
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: TEXT_GRAY,
            textAlign: 'center',
            marginBottom: '2.5rem',
            fontWeight: '400',
            lineHeight: '1.5'
        },
        // Total Profit Card Styles
        totalProfitCard: {
            background: `linear-gradient(135deg, ${GREEN_PRIMARY}, ${GREEN_DARK})`,
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(4, 120, 87, 0.3)',
            position: 'relative',
            overflow: 'hidden'
        },
        totalProfitCardContent: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2
        },
        totalProfitText: {
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            opacity: 0.9,
            marginBottom: '0.5rem'
        },
        totalProfitAmount: {
            fontSize: isMobile ? '2rem' : '2.8rem',
            fontWeight: '800',
            marginBottom: '0.5rem'
        },
        totalProfitSubtext: {
            fontSize: '0.9rem',
            opacity: 0.8,
            fontWeight: '500'
        },
        totalProfitIcon: {
            fontSize: isMobile ? '3rem' : '4rem',
            opacity: 0.2,
            position: 'absolute',
            right: isMobile ? '1rem' : '2rem',
            top: '50%',
            transform: 'translateY(-50%)'
        },
        statsContainer: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
        },
        statCard: {
            background: FORM_CARD_BG,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${BORDER_COLOR}`,
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        },
        statIcon: {
            fontSize: '2rem',
            borderRadius: '12px',
            padding: '0.75rem',
            background: GREEN_LIGHT,
            color: GREEN_DARK
        },
        statContent: {
            flex: 1
        },
        statLabel: {
            fontSize: '0.9rem',
            color: TEXT_GRAY,
            fontWeight: '500',
            marginBottom: '0.25rem'
        },
        statValue: {
            fontSize: '1.5rem',
            fontWeight: '700',
            color: TEXT_DARK
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
        },
        card: {
            background: FORM_CARD_BG,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${BORDER_COLOR}`,
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease-out',
            height: 'fit-content'
        },
        planTitle: {
            fontSize: '1.3rem',
            fontWeight: '800',
            color: GREEN_DARK,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1rem',
            flexWrap: 'wrap'
        },
        infoRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: `1px dashed ${BORDER_COLOR}`
        },
        infoLabel: {
            fontSize: '0.9rem',
            color: TEXT_GRAY,
            fontWeight: '500'
        },
        infoValue: (color = TEXT_DARK) => ({
            fontSize: '1rem',
            color: color,
            fontWeight: '700'
        }),
        // Progress Bar Styles
        progressBarContainer: {
            marginTop: '1.5rem',
            marginBottom: '1rem'
        },
        progressBarLabel: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: TEXT_DARK,
            marginBottom: '0.4rem'
        },
        progressBarWrapper: {
            height: '10px',
            background: INPUT_BG,
            borderRadius: '5px',
            overflow: 'hidden',
        },
        progressBarFill: (progress) => ({
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${SUCCESS_GREEN}, ${GREEN_PRIMARY})`,
            borderRadius: '5px',
            transition: 'width 1s ease-out'
        }),
        messageBox: (type) => ({
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            ...(type === 'error' && {
              backgroundColor: ERROR_RED + '1A',
              color: ERROR_RED,
              border: `1px solid ${ERROR_RED}50`
            }),
            ...(type === 'success' && {
              backgroundColor: SUCCESS_GREEN + '1A',
              color: SUCCESS_GREEN,
              border: `1px solid ${SUCCESS_GREEN}50`
            })
        }),
        ctaButton: {
            background: GREEN_PRIMARY, 
            color: 'white', 
            border: 'none', 
            padding: '1rem 2rem', 
            borderRadius: '12px', 
            marginTop: '1.5rem',
            cursor: 'pointer',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            fontSize: '1rem',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
            boxShadow: `0 4px 15px ${GREEN_PRIMARY}40`,
            ':hover': {
                background: GREEN_DARK,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${GREEN_PRIMARY}60`,
            }
        }
    };

    // --- Component Rendering ---
    const renderPlanCard = (plan) => {
        const remainingDays = plan.remaining_days > 0 ? plan.remaining_days : 0;
        const totalDays = Math.ceil((new Date(plan.end_date).getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.max(0, totalDays - remainingDays);
        const progress = plan.progress || 0;

        return (
            <div 
                key={plan.key} 
                className="plan-card"
                style={styles.card}
            >
                <div style={styles.planTitle}>
                    <FaChartLine style={{color: GREEN_PRIMARY}} />
                    {plan.title} 
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        padding: '0.2rem 0.75rem',
                        borderRadius: '20px',
                        background: SUCCESS_GREEN + '1A',
                        color: SUCCESS_GREEN,
                        marginLeft: 'auto'
                    }}>
                        Active
                    </span>
                </div>

                {/* Investment Amount */}
                <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Initial Investment</span>
                    <span style={styles.infoValue()}>{parseFloat(plan.amount).toLocaleString()} PKR</span>
                </div>

                {/* Daily Profit */}
                <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Daily Profit</span>
                    <span style={styles.infoValue(SUCCESS_GREEN)}>{parseFloat(plan.daily_profit || 0).toLocaleString()} PKR</span>
                </div>

                {/* Total Earned */}
                <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Total Earned (Current)</span>
                    <span style={styles.infoValue(GREEN_DARK)}>{parseFloat(plan.total_earned || 0).toLocaleString()} PKR</span>
                </div>

                {/* Dates */}
                <div style={styles.infoRow}>
                    <span style={styles.infoLabel}><FaCalendarAlt style={{marginRight: '5px'}}/> Duration</span>
                    <span style={styles.infoValue(TEXT_GRAY)}>
                        {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                    </span>
                </div>

                {/* Progress Bar */}
                <div style={styles.progressBarContainer}>
                    <div style={styles.progressBarLabel}>
                        <span>Progress: {Math.round(progress)}%</span>
                        <span>{remainingDays} Days Left</span>
                    </div>
                    <div style={styles.progressBarWrapper}>
                        <div style={styles.progressBarFill(progress)}></div>
                    </div>
                </div>
                
                <p style={{fontSize: '0.8rem', color: TEXT_GRAY, textAlign: 'center', marginTop: '1rem'}}>
                    Elapsed: {elapsedDays} / {totalDays} Days
                </p>
            </div>
        );
    };

    if (loading) {
        return (
            <Layout activeTab="invest">
                <div style={styles.container}>
                    <style>{`
                        @keyframes spin { 
                            0% { transform: rotate(0deg); } 
                            100% { transform: rotate(360deg); } 
                        } 
                        .animate-spin { 
                            animation: spin 1s linear infinite; 
                        }
                        .plan-card:hover {
                            transform: translateY(-5px);
                            box-shadow: 0 10px 25px rgba(4, 120, 87, 0.15);
                        }
                    `}</style>
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <FaSpinner className="animate-spin" style={{ fontSize: '3rem', color: GREEN_PRIMARY }} />
                        <p style={{ color: TEXT_GRAY, marginTop: '1rem' }}>Loading Active Plans and Profits...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout activeTab="invest">
            <div style={styles.container}>
                <style>{`
                    .plan-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 25px rgba(4, 120, 87, 0.15);
                    }
                    @keyframes spin { 
                        0% { transform: rotate(0deg); } 
                        100% { transform: rotate(360deg); } 
                    } 
                    .animate-spin { 
                        animation: spin 1s linear infinite; 
                    }
                    .fade-in {
                        animation: fadeIn 0.5s ease-in;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
                
                <h1 style={styles.pageTitle}> Total Plan Profit</h1>
                <p style={styles.pageSubtitle}>
                    Overview of your currently active investment plans, daily profits, and progress
                </p>

                {message.text && (
                    <div style={styles.messageBox(message.type)} className="fade-in">
                        <FaExclamationCircle /> {message.text}
                    </div>
                )}

                {/* Total Profit Card */}
                {activePlansData.length > 0 && (
                    <div style={styles.totalProfitCard} className="fade-in">
                        <div style={styles.totalProfitCardContent}>
                            <div>
                                <div style={styles.totalProfitText}>Total Profit From Active Plans</div>
                                <div style={styles.totalProfitAmount}>{totalProfit.toLocaleString()} PKR</div>
                                <div style={styles.totalProfitSubtext}>
                                    From {activePlansData.length} active investment plan{activePlansData.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                        <FaMoneyBillWave style={styles.totalProfitIcon} />
                    </div>
                )}

                {/* Stats Cards */}
                {activePlansData.length > 0 && (
                    <div style={styles.statsContainer} className="fade-in">
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>
                                <FaWallet />
                            </div>
                            <div style={styles.statContent}>
                                <div style={styles.statLabel}>Total Investment</div>
                                <div style={styles.statValue}>{totalInvestment.toLocaleString()} PKR</div>
                            </div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{...styles.statIcon, background: '#DBEAFE', color: ACCENT_BLUE}}>
                                <FaChartLine />
                            </div>
                            <div style={styles.statContent}>
                                <div style={styles.statLabel}>Active Plans</div>
                                <div style={styles.statValue}>{activePlansData.length}</div>
                            </div>
                        </div>
                    </div>
                )}

                {activePlansData.length === 0 ? (
                    <div style={{...styles.card, textAlign: 'center', padding: '3rem'}} className="fade-in">
                        <FaChartLine style={{fontSize: '3rem', color: TEXT_DARK_GRAY, marginBottom: '1rem'}} />
                        <h3 style={{color: TEXT_DARK, marginBottom: '0.5rem'}}>No Active Investment Plans Found</h3>
                        <p style={{color: TEXT_GRAY, marginTop: '10px', lineHeight: '1.5'}}>
                            You don't have any active investment plans at the moment. 
                            Start investing to see your profits and progress here.
                        </p>
                        <button 
                            onClick={() => navigate('/invest')} 
                            style={styles.ctaButton}
                            onMouseOver={(e) => {
                                e.target.style.background = GREEN_DARK;
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = `0 6px 20px ${GREEN_PRIMARY}60`;
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = GREEN_PRIMARY;
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = `0 4px 15px ${GREEN_PRIMARY}40`;
                            }}
                        >
                            Start Investing Now
                        </button>
                    </div>
                ) : (
                    <div style={styles.gridContainer}>
                        {activePlansData.map(plan => (
                            <div className="plan-card" key={plan.key} style={styles.card}>
                                {renderPlanCard(plan)}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Information for Other History */}
                {activePlansData.length > 0 && (
                    <p style={{
                        textAlign: 'center', 
                        fontSize: '0.9rem', 
                        color: TEXT_GRAY, 
                        marginTop: '2rem',
                        padding: '1rem',
                        background: FORM_CARD_BG,
                        borderRadius: '10px',
                        border: `1px solid ${BORDER_COLOR}`
                    }}>
                        💡 <strong>Note:</strong> This page only shows <strong>Active</strong> plans. 
                        Completed or cancelled plans are available in the main History section.
                    </p>
                )}

            </div>
        </Layout>
    );
}

export default ProfitPage;