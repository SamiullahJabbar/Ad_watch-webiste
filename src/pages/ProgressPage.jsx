import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import BASE_URL, { getAccessToken } from '../api/baseURL';
import { FaPlayCircle, FaCheckCircle, FaLock, FaSpinner, FaGift, FaTimesCircle } from 'react-icons/fa';
import { useCurrency } from '../components/CurrencyContext';
import '../css/ProgressPage.css';

const VideoModal = ({ url, onClose, day, onComplete, isCompleting }) => {
    const [isVideoEnded, setIsVideoEnded] = useState(false);

    const getEmbedUrl = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&playsinline=1`;
    };

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
        }

        window.onYouTubeIframeAPIReady = () => {
            new window.YT.Player('progress-video-player', {
                events: {
                    'onStateChange': (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            setIsVideoEnded(true);
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            setTimeout(() => {
                try {
                    new window.YT.Player('progress-video-player', {
                        events: {
                            'onStateChange': (event) => {
                                if (event.data === window.YT.PlayerState.ENDED) {
                                    setIsVideoEnded(true);
                                }
                            }
                        }
                    });
                } catch (e) { }
            }, 500);
        }
    }, []);

    return (
        <div className="video-overlay">
            <div className="video-container-modal">
                <div className="modal-video-header">
                    <span>Day {day} - Watch to Earn</span>
                    <FaTimesCircle onClick={onClose} className="close-icon" />
                </div>
                <div className="modal-video-frame">
                    <iframe id="progress-video-player" src={getEmbedUrl(url)} title="Task Video" frameBorder="0"></iframe>
                </div>
                {!isVideoEnded && <p className="video-hint">Please watch the full video to unlock your reward.</p>}
                <button
                    className={`modal-complete-btn ${!isVideoEnded ? 'locked' : ''}`}
                    onClick={() => {
                        if (isVideoEnded) onComplete();
                    }}
                    disabled={!isVideoEnded || isCompleting}
                >
                    {isCompleting ? "Processing..." : (isVideoEnded ? "Claim Reward" : "Video Locked")}
                </button>
            </div>
        </div>
    );
};

function ProgressPage() {
    const navigate = useNavigate();
    const { convert, symbol } = useCurrency();

    const [loading, setLoading] = useState(true);
    const [videoData, setVideoData] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isCompleting, setIsCompleting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Timer calculate karne ka function
    const calculateTimeRemaining = (nextAvailableAt) => {
        if (!nextAvailableAt) return null;

        const now = new Date();
        const nextAvailable = new Date(nextAvailableAt);
        const diff = nextAvailable - now;

        if (diff <= 0) {
            return null; // Timer expire ho gaya
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { hours, minutes, seconds, totalMs: diff };
    };

    // Countdown timer update karne ka function
    const updateCountdown = useCallback(() => {
        if (timeRemaining) {
            const remaining = calculateTimeRemaining(videoData.next_video_available_at);
            if (remaining) {
                const h = String(remaining.hours).padStart(2, '0');
                const m = String(remaining.minutes).padStart(2, '0');
                const s = String(remaining.seconds).padStart(2, '0');
                setCountdown(`${h}:${m}:${s}`);
            } else {
                setCountdown('');
                setTimeRemaining(null);
                // Timer expire ho gaya, refresh kar lo
                fetchTodayVideo();
            }
        }
    }, [timeRemaining, videoData]);

    // Har second countdown update karo
    useEffect(() => {
        if (timeRemaining) {
            const interval = setInterval(updateCountdown, 1000);
            return () => clearInterval(interval);
        }
    }, [timeRemaining, updateCountdown]);

    // Today's video fetch karne ka function
    const fetchTodayVideo = async () => {
        const token = getAccessToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(`${BASE_URL}/transactions/today-video/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            setVideoData(data);

            if (data.video_locked && data.hours_remaining) {
                const remaining = calculateTimeRemaining(data.next_video_available_at);
                if (remaining) {
                    setTimeRemaining(remaining);
                    const h = String(remaining.hours).padStart(2, '0');
                    const m = String(remaining.minutes).padStart(2, '0');
                    const s = String(remaining.seconds).padStart(2, '0');
                    setCountdown(`${h}:${m}:${s}`);
                }
            }
        } catch (error) {
            console.error('Error fetching video:', error);
            setMessage({
                text: error.response?.data?.error || 'Failed to load video',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayVideo();
    }, []);

    // Video complete mark karne ka function
    const handleCompleteVideo = async () => {
        setIsCompleting(true);
        setMessage({ text: '', type: '' });

        const token = getAccessToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/transactions/videos/complete/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            setMessage({
                text: `🎉 ${data.message} Earned: ${symbol} ${convert(data.credited_amount)}`,
                type: 'success'
            });

            // Timer set karo
            if (data.next_video_available_at) {
                const remaining = calculateTimeRemaining(data.next_video_available_at);
                if (remaining) {
                    setTimeRemaining(remaining);
                    const h = String(remaining.hours).padStart(2, '0');
                    const m = String(remaining.minutes).padStart(2, '0');
                    const s = String(remaining.seconds).padStart(2, '0');
                    setCountdown(`${h}:${m}:${s}`);
                }
            }

            // Close modal
            setShowVideoModal(false);

            // Video data update karo
            setVideoData(prev => ({
                ...prev,
                video_locked: true,
                hours_remaining: data.timer_hours
            }));

        } catch (error) {
            console.error('Error completing video:', error);
            setMessage({
                text: error.response?.data?.message || error.response?.data?.error || 'Failed to complete video',
                type: 'error'
            });
        } finally {
            setIsCompleting(false);
        }
    };

    if (loading) {
        return (
            <Layout currentPath="/progress">
                <div className="video-loading-container">
                    <FaSpinner className="animate-spin" />
                    <p>Loading today's video...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPath="/progress">
            <div className="video-container">
                <h1 className="video-page-title">Daily Video Earnings</h1>
                <p className="video-page-subtitle">Watch video & earn daily profit</p>

                {/* Message Display */}
                {message.text && (
                    <div className={`message-box ${message.type}`}>
                        {message.type === 'success' && <FaCheckCircle />}
                        {message.type === 'error' && <FaLock />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Video Locked - Timer Show */}
                {videoData?.video_locked && countdown ? (
                    <div className="timer-card">
                        <div className="timer-icon-wrapper">
                            <FaLock className="timer-lock-icon" />
                        </div>
                        <h2 className="timer-title">Next Video Available In</h2>
                        <div className="countdown-timer">
                            <div className="time-segment">
                                <span className="time-value">{String(Math.floor(parseInt(countdown.split(':')[0]) || 0)).padStart(2, '0')}</span>
                                <span className="time-label">Hours</span>
                            </div>
                            <span className="time-separator">:</span>
                            <div className="time-segment">
                                <span className="time-value">{String(parseInt(countdown.split(':')[1]) || 0).padStart(2, '0')}</span>
                                <span className="time-label">Minutes</span>
                            </div>
                            <span className="time-separator">:</span>
                            <div className="time-segment">
                                <span className="time-value">{String(parseInt(countdown.split(':')[2]) || 0).padStart(2, '0')}</span>
                                <span className="time-label">Seconds</span>
                            </div>
                        </div>
                        <p className="timer-message">
                            🎯 You've already claimed today's reward!
                            Come back after the timer expires to watch your next video and earn more.
                        </p>
                        {/* <div className="reward-info">
                            <FaGift className="reward-icon" />
                            <span>Today's Reward: <strong>{symbol} {convert(videoData.daily_profit || 0)}</strong></span>
                        </div> */}
                    </div>
                ) : videoData?.today_video ? (
                    /* Video Available - Show Action Card */
                    <div className="video-card action-card">
                        <div className="video-header">
                            <h3 className="video-day-label">Day {videoData.day_number}</h3>
                            <span className="video-status available">
                                <FaPlayCircle /> Available
                            </span>
                        </div>

                        <div className="video-actions">
                            <div className="reward-display">
                                <FaGift className="reward-icon-large" />
                                <div>
                                    <div className="reward-label">Your Reward</div>
                                    <div className="reward-amount">{symbol} {convert(videoData.daily_profit || 0)}</div>
                                </div>
                            </div>

                            <button
                                className="complete-btn"
                                onClick={() => setShowVideoModal(true)}
                            >
                                <FaPlayCircle /> Watch Video to Claim Reward
                            </button>
                        </div>
                    </div>
                ) : (
                    /* No Video Available */
                    <div className="no-video-card">
                        <FaLock className="no-video-icon" />
                        <h3>No Video Available Today</h3>
                        <p>Please check back later or contact support if you think this is an error.</p>
                    </div>
                )}

                {/* Info Section */}
                <div className="video-info-section">
                    <h4>How It Works</h4>
                    <ul>
                        <li>📺 Watch your daily video to earn profit</li>
                        <li>⏰ After watching, a 24-hour timer starts</li>
                        <li>🎁 Reward is instantly credited to your wallet</li>
                        <li>🔄 Come back daily to maximize your earnings!</li>
                    </ul>
                </div>
            </div>

            {/* Video Modal Display */}
            {showVideoModal && videoData?.today_video && (
                <VideoModal
                    url={videoData.today_video}
                    day={videoData.day_number}
                    onClose={() => setShowVideoModal(false)}
                    onComplete={handleCompleteVideo}
                    isCompleting={isCompleting}
                />
            )}
        </Layout>
    );
}

export default ProgressPage;
