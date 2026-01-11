import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlayCircle, FaCheckCircle, FaLock, FaImage, FaTimesCircle, FaCalendarAlt, FaWallet, FaExclamationCircle } from 'react-icons/fa';
import BASE_URL, { getAccessToken } from '../api/baseURL';
import '../css/InvestmentPlans.css';

// Currency Context ko import kiya
import { useCurrency } from '../components/CurrencyContext'; 

// --- 1. PROFESSIONAL TOAST NOTIFICATION COMPONENT ---
const Toast = ({ show, message, type, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className={`toast-notification ${type}`}>
            <div className="toast-content">
                {type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                <span>{message}</span>
            </div>
            <div className="toast-progress-bar"></div>
        </div>
    );
};

// --- 2. CONFIRMATION MODAL ---
const ConfirmModal = ({ isOpen, onCancel, onConfirm, planName }) => {
    const [inputValue, setInputValue] = useState('');
    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content">
                <h3>Confirm Investment</h3>
                <p>To activate <strong>{planName}</strong>, please type <b>CONFIRM</b> below:</p>
                <input 
                    type="text" 
                    placeholder="Type CONFIRM here" 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                />
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => { setInputValue(''); onCancel(); }}>Cancel</button>
                    <button 
                        className="confirm-btn" 
                        disabled={inputValue !== 'CONFIRM'} 
                        onClick={() => { setInputValue(''); onConfirm(); }}
                    >
                        Activate Now
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 3. VIDEO MODAL WITH AUTO-REWARD LOGIC ---
const VideoModal = ({ url, onClose, day, investmentId, onRewardSuccess, showToast }) => {
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getEmbedUrl = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
    };

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
        }

        window.onYouTubeIframeAPIReady = () => {
            new window.YT.Player('task-video-player', {
                events: {
                    'onStateChange': (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            setIsVideoEnded(true);
                        }
                    }
                }
            });
        };
    }, []);

    const handleComplete = async () => {
        if (!isVideoEnded) return;
        setIsSubmitting(true);
        const token = getAccessToken();
        try {
            const res = await axios.post(`${BASE_URL}/transactions/videos/complete/`, {
                investment_id: investmentId,
                day_number: day
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            showToast(res.data.message || "Reward credited!", "success");
            onRewardSuccess(); 
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || "Task failed";
            showToast(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="video-overlay">
            <div className="video-container">
                <div className="video-header">
                    <span>Day {day} - Watch to Earn</span>
                    <FaTimesCircle onClick={onClose} className="close-icon" />
                </div>
                <div className="video-frame">
                    <iframe id="task-video-player" src={getEmbedUrl(url)} title="Task Video" frameBorder="0" allowFullScreen></iframe>
                </div>
                {!isVideoEnded && <p className="video-hint">Please watch the full video to unlock your reward.</p>}
                <button 
                    className={`complete-btn ${!isVideoEnded ? 'locked' : ''}`} 
                    onClick={handleComplete} 
                    disabled={!isVideoEnded || isSubmitting}
                >
                    {isSubmitting ? "Processing..." : (isVideoEnded ? "Claim Reward" : "Video Locked")}
                </button>
            </div>
        </div>
    );
};

// --- 4. MAIN COMPONENT ---
const InvestmentPlans = () => {
    // Currency context ko call kiya
    const { convert, symbol } = useCurrency();

    const [allPlans, setAllPlans] = useState([]);
    const [activePlanData, setActivePlanData] = useState(null);
    const [todayVideo, setTodayVideo] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, planId: null, planName: '' });

    const activeSectionRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        const token = getAccessToken();
        setIsLoading(true);
        try {
            const [plansRes, dashboardRes] = await Promise.all([
                axios.get(`${BASE_URL}/transactions/plans/`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_URL}/transactions/dashboard/`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            setAllPlans(plansRes.data);
            const active = dashboardRes.data.find(p => p.is_active === true);
            
            if (active) {
                setActivePlanData(active);
                const todayRes = await axios.get(`${BASE_URL}/transactions/today-video/`, { headers: { Authorization: `Bearer ${token}` } });
                setTodayVideo(todayRes.data);
            } else {
                setActivePlanData(null);
            }
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmInvestment = async () => {
        const { planId } = confirmModal;
        setConfirmModal({ show: false, planId: null, planName: '' });
        setIsSubmitting(true);
        const token = getAccessToken();
        
        try {
            const res = await axios.post(`${BASE_URL}/transactions/invest/`, { plan_id: planId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast(res.data.message || "Plan Activated!", "success");
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.error || "Error activating plan.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMouseMove = (e, ref) => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            ref.current.style.setProperty('--x', `${x}px`);
            ref.current.style.setProperty('--y', `${y}px`);
        }
    };

    if (isLoading) return <div className="loading-state">Loading your dashboard...</div>;

    return (
        <div className="investment-wrapper">
            <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />
            
            <ConfirmModal 
                isOpen={confirmModal.show} 
                planName={confirmModal.planName}
                onCancel={() => setConfirmModal({ show: false, planId: null, planName: '' })}
                onConfirm={handleConfirmInvestment}
            />

            <div 
                className={`active-task-section ${!activePlanData ? 'no-plan-active' : ''}`} 
                ref={activeSectionRef} 
                onMouseMove={(e) => handleMouseMove(e, activeSectionRef)}
            >
                <div className="reveal-grid-overlay"></div>
                <div className="active-content-z">
                    {activePlanData ? (
                        <>
                            <div className="active-header">
                                <div className="status-badge"><FaCheckCircle /> Active: {activePlanData.plan}</div>
                                {/* Updated: PKR replace with symbol & convert */}
                                <h2 className="active-plan-name">Daily Earning: {symbol} {convert(activePlanData.daily_profit)}</h2>
                                <p className="active-plan-name-date"> Remaining Days: {activePlanData.remaining_days}</p>
                            </div>
                            <div className="task-grid">
                                <div className="task-card-container">
                                    <div className="card-content-wrapper">
                                        <h3>Today's Task</h3>
                                        {todayVideo?.is_completed ? (
                                            <p className="task-completed-text"><FaCheckCircle /> Reward Received</p>
                                        ) : (
                                            <>
                                                <p>{todayVideo?.today_video ? `Day ${todayVideo.day_number} is Live` : "No task"}</p>
                                                {todayVideo?.today_video && (
                                                    <button className="watch-btn" onClick={() => setShowVideo(true)}>
                                                        <FaPlayCircle /> Watch Video
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="task-card-container">
                                    <div className="card-content-wrapper">
                                        <h3>Earned So Far</h3>
                                        {/* Updated: PKR replace with symbol & convert */}
                                        <h2 style={{color: '#4ade80'}}>{symbol} {convert(activePlanData.total_earned)}</h2>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-active-plan-msg">
                            <FaExclamationCircle className="warning-icon" />
                            <h2>No Plan Activation</h2>
                            <p>Please choose a plan below to start earning.</p>
                        </div>
                    )}
                </div>
            </div>

            <h2 className="section-title">Investment Plans</h2>
            <div className="plans-grid">
                {allPlans.map((plan) => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        onInvest={(id, name) => setConfirmModal({ show: true, planId: id, planName: name })} 
                        isSubmitting={isSubmitting}
                        handleMouseMove={handleMouseMove}
                        isUserAlreadyActive={activePlanData !== null}
                        activePlanName={activePlanData?.plan}
                        // Passing currency tools to child component
                        convert={convert}
                        symbol={symbol}
                    />
                ))}
            </div>

            {showVideo && (
                <VideoModal 
                    url={todayVideo.today_video} 
                    day={todayVideo.day_number} 
                    investmentId={activePlanData.id}
                    onClose={() => setShowVideo(false)} 
                    onRewardSuccess={fetchAllData}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

const PlanCard = ({ plan, onInvest, isSubmitting, handleMouseMove, isUserAlreadyActive, activePlanName, convert, symbol }) => {
    const cardRef = useRef(null);
    const isActive = isUserAlreadyActive && activePlanName === plan.title;

    return (
        <div className={`mindflow-card ${isActive ? 'current-active-plan' : ''}`} ref={cardRef} onMouseMove={(e) => handleMouseMove(e, cardRef)}>
            <div className="card-glow-reveal"></div>
            <div className="card-header-row">
                <div className="plan-icon-box">
                    {plan.image ? <img src={plan.image} alt="plan" className="plan-backend-img" /> : <FaImage className="p-icon" />}
                </div>
                <div className="plan-title-area">
                    <h3>{plan.title}</h3>
                    {isActive && <span className="popular-badge">Running</span>}
                </div>
            </div>
            <div className="price-box-animated">
                <div className="price-inner">
                    {/* Updated: PKR replace with symbol & convert */}
                    <span className="price-amount">{symbol} {convert(plan.amount)}</span>
                    <span className="price-period">{plan.duration_days} Days</span>
                </div>
            </div>
            <button className="plan-action-btn" disabled={isActive || isSubmitting} onClick={() => onInvest(plan.id, plan.title)}>
                {isActive ? 'Current Plan' : (isSubmitting ? 'Processing...' : 'Invest Now')}
            </button>
            <div className="whats-included">
                <ul>
                    {/* Updated: PKR replace with symbol & convert */}
                    <li><FaWallet /> Daily: <b>{symbol} {convert(plan.daily_profit)}</b></li>
                    <li><FaCheckCircle /> Total: <b>{symbol} {convert(plan.total_profit)}</b></li>
                </ul>
            </div>
        </div>
    );
};

export default InvestmentPlans;