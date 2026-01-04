import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlayCircle, FaCheckCircle, FaLock, FaImage, FaTimesCircle, FaCalendarAlt, FaWallet, FaExclamationCircle } from 'react-icons/fa';
import BASE_URL, { getAccessToken } from '../api/baseURL';
import '../css/InvestmentPlans.css';

// 1. CONFIRMATION POPUP COMPONENT
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

const VideoModal = ({ url, onClose, day }) => {
    const getEmbedUrl = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    };
    return (
        <div className="video-overlay">
            <div className="video-container">
                <div className="video-header">
                    <span>Day {day} - Video Task</span>
                    <FaTimesCircle onClick={onClose} className="close-icon" />
                </div>
                <div className="video-frame">
                    <iframe src={getEmbedUrl(url)} title="Task Video" frameBorder="0" allowFullScreen></iframe>
                </div>
                <button className="complete-btn" onClick={onClose}>Complete Task</button>
            </div>
        </div>
    );
};

const InvestmentPlans = () => {
    const [allPlans, setAllPlans] = useState([]);
    const [activePlanData, setActivePlanData] = useState(null);
    const [todayVideo, setTodayVideo] = useState(null);
    const [prevVideos, setPrevVideos] = useState([]);
    const [showVideo, setShowVideo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // New States for UI Logic
    const [confirmModal, setConfirmModal] = useState({ show: false, planId: null, planName: '' });
    const [notification, setNotification] = useState({ show: false, message: '', planId: null, type: 'success' });

    const activeSectionRef = useRef(null);

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
            
            // Check if user has an active plan from the dashboard array
            const active = dashboardRes.data.find(p => p.is_active === true);
            
            if (active) {
                setActivePlanData(active);
                const [todayRes, prevRes] = await Promise.all([
                    axios.get(`${BASE_URL}/transactions/today-video/`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BASE_URL}/transactions/previous-videos/`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setTodayVideo(todayRes.data);
                setPrevVideos(prevRes.data.previous_videos || []);
            } else {
                setActivePlanData(null);
            }
        } catch (err) {
            console.error("Data fetching failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvestRequest = (planId, planName) => {
        setConfirmModal({ show: true, planId, planName });
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
            
            showInCardNotification(planId, res.data.message || "Plan Activated!", "success");
            fetchAllData();
        } catch (err) {
            showInCardNotification(planId, err.response?.data?.error || "Error activating plan.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const showInCardNotification = (planId, message, type) => {
        setNotification({ show: true, message, planId, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', planId: null, type: 'success' });
        }, 5000);
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
            <ConfirmModal 
                isOpen={confirmModal.show} 
                planName={confirmModal.planName}
                onCancel={() => setConfirmModal({ show: false, planId: null, planName: '' })}
                onConfirm={handleConfirmInvestment}
            />

            {/* 1. TOP SECTION */}
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
                                <h2 className="active-plan-name">Daily Earning: PKR {activePlanData.daily_profit}</h2>
                                <p className="active-plan-name-date"> Remaining Days: {activePlanData.remaining_days}</p>
                            </div>
                            <div className="task-grid">
                                <div className="task-card-container">
                                    <div className="card-content-wrapper">
                                        <h3>Today's Task</h3>
                                        <p>{todayVideo?.today_video ? `Day ${todayVideo.day_number} is Live` : "No task for today"}</p>
                                        {todayVideo?.today_video && (
                                            <button className="watch-btn" onClick={() => setShowVideo(true)}>
                                                <FaPlayCircle /> Watch Video
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="task-card-container">
                                    <div className="card-content-wrapper">
                                        <h3>Earned So Far</h3>
                                        <h2 style={{color: '#4ade80'}}>PKR {activePlanData.total_earned}</h2>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-active-plan-msg">
                            <FaExclamationCircle className="warning-icon" />
                            <h2>No Plan Activation</h2>
                            <p>You don't have an active investment. Please choose a plan below.</p>
                        </div>
                    )}
                </div>
            </div>

            <h2 className="section-title">Plans</h2>
            <div className="plans-grid">
                {allPlans.map((plan) => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        onInvest={handleInvestRequest} 
                        isSubmitting={isSubmitting}
                        handleMouseMove={handleMouseMove}
                        isUserAlreadyActive={activePlanData !== null}
                        activePlanName={activePlanData?.plan}
                        notification={notification.planId === plan.id ? notification : null}
                    />
                ))}
            </div>

            {showVideo && <VideoModal url={todayVideo.today_video} day={todayVideo.day_number} onClose={() => setShowVideo(false)} />}
        </div>
    );
};

const PlanCard = ({ plan, onInvest, isSubmitting, handleMouseMove, isUserAlreadyActive, activePlanName, notification }) => {
    const cardRef = useRef(null);
    const isActive = isUserAlreadyActive && activePlanName === plan.title;

    return (
        <div 
            className={`mindflow-card ${isActive ? 'current-active-plan' : ''}`} 
            ref={cardRef} 
            onMouseMove={(e) => handleMouseMove(e, cardRef)}
        >
            {/* IN-CARD NOTIFICATION BOX */}
            {notification && (
                <div className={`card-notif-box ${notification.type}`}>
                    {notification.message}
                </div>
            )}

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
                    <span className="price-amount">PKR {parseFloat(plan.amount).toLocaleString()}</span>
                    <span className="price-period">{plan.duration_days} Days</span>
                </div>
            </div>

            <button 
                className={`plan-action-btn ${isActive ? 'active-btn' : ''}`}
                disabled={isActive || isSubmitting}
                onClick={() => onInvest(plan.id, plan.title)}
            >
                {isActive ? 'Current Plan' : (isSubmitting ? 'Processing...' : 'Invest Now')}
            </button>

            <div className="whats-included">
                <ul>
                    <li><FaWallet /> Daily: <b>PKR {plan.daily_profit}</b></li>
                    <li><FaCheckCircle /> Total: <b>PKR {plan.total_profit}</b></li>
                </ul>
            </div>
        </div>
    );
};

export default InvestmentPlans;