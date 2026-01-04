import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Assuming the correct path to baseURL.js is this
import BASE_URL, { removeTokens } from '../api/baseURL'; 

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, plan, message }) => {
    // --- COLOR CONSTANTS (Local copy for Modal styling) ---
    const PURPLE_PRIMARY = '#8B5CF6'; 
    const DARK_BG = '#0F0F23';      
    const FORM_CARD_BG = '#1A1B2F';  
    const TEXT_LIGHT = '#F8FAFC';    
    const TEXT_GRAY = '#94A3B8';
    const SUCCESS_GREEN = '#10B981';
    const ERROR_RED = '#EF4444';
    const WARNING_AMBER = '#F59E0B';

    if (!isOpen) return null;

    // Determine content based on the presence of a 'message'
    const isConfirmation = !message;
    const isSuccess = message && (message.toLowerCase().includes('successfully') || message.toLowerCase().includes('activated'));
    const isError = message && (message.toLowerCase().includes('error') || message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('active plan'));
    const statusIcon = isSuccess ? '✅' : isError ? '❌' : '❓';
    const statusColor = isSuccess ? SUCCESS_GREEN : isError ? ERROR_RED : PURPLE_PRIMARY;
    
    let statusTitle = "Confirm Investment";
    if (message) {
        statusTitle = isSuccess ? "Success!" : "Action Failed";
    }

    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out'
        },
        modal: {
            background: FORM_CARD_BG,
            borderRadius: '20px',
            padding: '25px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: `0 10px 40px ${PURPLE_PRIMARY}50`,
            textAlign: 'center',
            position: 'relative',
            animation: 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: '700',
            color: TEXT_LIGHT,
            marginBottom: '15px'
        },
        icon: {
            fontSize: '3rem',
            marginBottom: '15px',
            color: statusColor,
            transition: 'transform 0.3s ease-out'
        },
        planDetail: {
            background: DARK_BG,
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '20px',
            border: `1px solid ${PURPLE_PRIMARY}30`
        },
        detailText: {
            fontSize: '1rem',
            color: TEXT_LIGHT,
            marginBottom: '5px'
        },
        highlight: {
            fontWeight: '700',
            color: PURPLE_PRIMARY
        },
        messageText: {
            fontSize: '1.1rem',
            color: statusColor,
            marginBottom: '20px',
            fontWeight: '500',
            whiteSpace: 'pre-wrap'
        },
        buttonContainer: {
            display: 'flex',
            gap: '10px',
            justifyContent: isConfirmation ? 'space-between' : 'center'
        },
        button: (bgColor, hoverColor) => ({
            flex: 1,
            background: bgColor,
            color: TEXT_LIGHT,
            border: 'none',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '120px'
        }),
        closeButton: {
            background: FORM_CARD_BG,
            border: `1px solid ${TEXT_GRAY}50`,
            color: TEXT_GRAY
        }
    };

    // CSS Animations for Modal
    const modalStyleTag = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes popIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;

    return (
        <div style={modalStyles.overlay}>
            <style>{modalStyleTag}</style>
            <div style={modalStyles.modal}>
                <div style={modalStyles.icon}>{statusIcon}</div>
                <div style={modalStyles.title}>{statusTitle}</div>

                {isConfirmation ? (
                    <>
                        <p style={{...modalStyles.messageText, color: TEXT_LIGHT}}>Are you sure you want to invest **₨{parseFloat(plan.investment).toLocaleString()}** in the **{plan.title}** plan?</p>
                        <div style={modalStyles.planDetail}>
                            <div style={modalStyles.detailText}>Daily Profit: <span style={modalStyles.highlight}>₨{parseFloat(plan.dailyProfit).toLocaleString()}</span></div>
                            <div style={modalStyles.detailText}>Duration: <span style={modalStyles.highlight}>{plan.duration}</span></div>
                            <div style={modalStyles.detailText}>Total Return: <span style={modalStyles.highlight}>₨{parseFloat(plan.totalProfit).toLocaleString()}</span></div>
                        </div>
                        <div style={modalStyles.buttonContainer}>
                            <button
                                style={modalStyles.button(PURPLE_PRIMARY)}
                                onClick={onConfirm}
                            >
                                Invest Now
                            </button>
                            <button
                                style={{ ...modalStyles.button(FORM_CARD_BG), ...modalStyles.closeButton }}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={modalStyles.messageText}>{message}</p>
                        <div style={modalStyles.buttonContainer}>
                            <button
                                style={modalStyles.button(isSuccess ? SUCCESS_GREEN : PURPLE_PRIMARY)}
                                onClick={onClose}
                            >
                                {isSuccess ? 'Great!' : 'Close'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
// --- END Confirmation Modal Component ---


function InvestmentPage({ userData }) { 
  const navigate = useNavigate();

  // --- STATES ---
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [selectedPlanForInvestment, setSelectedPlanForInvestment] = useState(null);
  const [activeTab] = useState('invest');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;
  const [hoveredPlan, setHoveredPlan] = useState(null);


  // --- COLOR CONSTANTS ---
  const PURPLE_PRIMARY = '#8B5CF6'; 
  const PURPLE_DARK = '#7C3AED';
  const PURPLE_LIGHT = '#A78BFA';
  const DARK_BG = '#0F0F23';      
  const FORM_CARD_BG = '#1A1B2F';  
  const TEXT_LIGHT = '#F8FAFC';    
  const TEXT_GRAY = '#94A3B8';
  const TEXT_DARK_GRAY = '#64748B';
  const SUCCESS_GREEN = '#10B981';
  const WARNING_AMBER = '#F59E0B';


  // --- STYLES (Consolidated and complete styles for correct rendering) ---
  const styles = {
    container: {
      minHeight: '100vh',
      background: DARK_BG,
      color: TEXT_LIGHT,
      fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
      position: 'relative',
      paddingBottom: '90px'
    },
    header: {
      padding: '20px 16px 16px',
      background: 'rgba(26, 27, 47, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${TEXT_DARK_GRAY}30`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: 'slideDown 0.6s ease-out'
    },
    headerLeft: {
      flex: 1
    },
    welcomeText: {
      fontSize: '14px',
      color: TEXT_GRAY,
      marginBottom: '4px'
    },
    userName: {
      fontSize: '20px',
      fontWeight: '700',
      background: `linear-gradient(135deg, ${TEXT_LIGHT}, ${PURPLE_LIGHT})`,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    notificationBtn: {
      background: 'rgba(139, 92, 246, 0.2)',
      border: `1px solid ${PURPLE_PRIMARY}30`,
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.3s ease'
    },
    mainContent: {
      padding: isMobile ? '1.5rem 1rem' : '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    pageTitle: {
      fontSize: isMobile ? '1.8rem' : '2.2rem',
      fontWeight: '800',
      color: TEXT_LIGHT,
      marginBottom: '0.5rem',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    pageSubtitle: {
      fontSize: '1rem',
      color: TEXT_GRAY,
      textAlign: 'center',
      marginBottom: '2.5rem',
      fontWeight: '400'
    },
    statsSection: {
      background: FORM_CARD_BG,
      borderRadius: '20px',
      padding: '2rem',
      marginBottom: '2rem',
      border: `1px solid ${TEXT_DARK_GRAY}30`,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      animation: 'slideUp 0.6s ease-out 0.2s both'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: '1rem',
      textAlign: 'center'
    },
    statCard: {
      padding: '1.5rem 1rem',
      background: 'rgba(139, 92, 246, 0.1)',
      border: `1px solid ${PURPLE_PRIMARY}30`,
      borderRadius: '16px',
      transition: 'all 0.3s ease'
    },
    statIcon: {
      fontSize: '2rem',
      marginBottom: '0.5rem'
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: TEXT_LIGHT,
      marginBottom: '0.25rem'
    },
    statLabel: {
      fontSize: '0.85rem',
      color: TEXT_GRAY,
      fontWeight: '500'
    },
    plansSection: {
      marginBottom: '2rem',
      animation: 'slideUp 0.6s ease-out 0.4s both'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: TEXT_LIGHT,
      marginBottom: '1.5rem',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    plansGrid: {
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : `repeat(auto-fit, minmax(250px, 1fr))`,
        justifyContent: 'center', 
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    planCard: {
      background: FORM_CARD_BG,
      borderRadius: '20px',
      padding: '2rem',
      border: `1px solid ${TEXT_DARK_GRAY}30`,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    },
    planCardHover: {
      transform: 'translateY(-8px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      borderColor: PURPLE_PRIMARY
    },
    planHeader: {
      textAlign: 'center',
      marginBottom: '1.5rem',
      position: 'relative'
    },
    planIcon: {
      fontSize: '3rem',
      marginBottom: '1rem'
    },
    planName: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: TEXT_LIGHT,
      marginBottom: '0.5rem'
    },
    planDuration: {
      fontSize: '0.9rem',
      color: TEXT_GRAY,
      background: 'rgba(139, 92, 246, 0.1)',
      padding: '0.4rem 1rem',
      borderRadius: '20px',
      display: 'inline-block'
    },
    investmentSection: {
      background: 'rgba(139, 92, 246, 0.05)',
      border: `1px solid ${PURPLE_PRIMARY}20`,
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      textAlign: 'center'
    },
    investmentAmount: {
      fontSize: '2rem',
      fontWeight: '800',
      color: PURPLE_LIGHT,
      marginBottom: '0.5rem'
    },
    investmentLabel: {
      fontSize: '0.9rem',
      color: TEXT_GRAY,
      fontWeight: '500'
    },
    profitGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    profitCard: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: `1px solid ${SUCCESS_GREEN}30`,
      borderRadius: '12px',
      padding: '1rem',
      textAlign: 'center'
    },
    profitAmount: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: SUCCESS_GREEN,
      marginBottom: '0.25rem'
    },
    profitLabel: {
      fontSize: '0.8rem',
      color: TEXT_GRAY
    },
    featuresList: {
      marginBottom: '1.5rem'
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      color: TEXT_LIGHT
    },
    featureIcon: {
      color: SUCCESS_GREEN,
      fontSize: '0.8rem'
    },
    investButton: {
      background: `linear-gradient(135deg, ${PURPLE_PRIMARY} 0%, ${PURPLE_DARK} 100%)`,
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    },
    investButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${PURPLE_PRIMARY}40`
    },
    bottomNav: {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      height: '85px',
      background: 'rgba(26, 27, 47, 0.95)',
      backdropFilter: 'blur(25px)',
      borderTop: `1px solid ${TEXT_DARK_GRAY}30`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '12px 0',
      boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.3)',
      zIndex: 1000
    },
    navItem: {
      textAlign: 'center',
      cursor: 'pointer',
      padding: '12px 14px',
      borderRadius: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      flex: 1,
      margin: '0 6px'
    },
    navItemActive: {
      background: 'rgba(139, 92, 246, 0.2)',
      border: `1px solid ${PURPLE_PRIMARY}40`,
      transform: 'translateY(-6px)'
    },
    navIcon: {
      fontSize: '24px',
      marginBottom: '6px',
      transition: 'all 0.3s ease',
      color: TEXT_GRAY
    },
    navIconActive: {
      transform: 'scale(1.15)',
      color: PURPLE_PRIMARY
    },
    navLabel: {
      fontSize: '11px',
      fontWeight: '500',
      color: TEXT_GRAY,
      transition: 'all 0.3s ease'
    },
    navLabelActive: {
      color: PURPLE_PRIMARY,
      fontWeight: '700'
    },
    loadingContainer: {
      minHeight: '100vh',
      background: DARK_BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: `3px solid ${TEXT_DARK_GRAY}30`,
      borderTop: `3px solid ${PURPLE_PRIMARY}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };
  // --- END STYLES ---


  // Helper to assign icon and custom color to each plan based on its index
  const getPlanStyle = (index) => {
    const defaultStyles = [
        { color: "#8B5CF6", icon: "🏡" }, // Purple
        { color: "#06b6d4", icon: "🏘️" }, // Cyan
        { color: "#10b981", icon: "🏢" }, // Green
        { color: "#f59e0b", icon: "🏰" }  // Amber
    ];
    return defaultStyles[index % defaultStyles.length];
  };

  // --- API CALL TO FETCH PLANS ---
  const fetchInvestmentPlans = async (token) => {
    try {
        const response = await axios.get(`${BASE_URL}/transactions/plans/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const formattedPlans = response.data.map((plan, index) => {
            const dailyProfit = parseFloat(plan.daily_profit || 0);
            const durationDays = parseInt(plan.duration_days || 0);
            const style = getPlanStyle(index);

            // Calculate Monthly/Annual Profit (used for presentation only, totalProfit is from API)
            const monthlyProfit = dailyProfit * 30;
            const annualProfit = dailyProfit * 365;
            
            return {
                id: plan.id,
                title: plan.title,
                investment: parseFloat(plan.amount),
                dailyProfit: dailyProfit,
                durationDays: durationDays,
                totalProfit: parseFloat(plan.total_profit),
                monthlyProfit: monthlyProfit,
                annualProfit: annualProfit,
                duration: `${durationDays} Days`,
                features: ["Daily Profit", "24/7 Support", "Secure Investment", "Flexible Withdrawal"], 
                color: style.color,
                icon: style.icon
            };
        });
        setPlans(formattedPlans);
    } catch (error) {
        console.error('Error fetching plans:', error.response ? error.response.data : error.message);
    } finally {
        setLoading(false);
    }
  };


  // --- API CALL FOR INVESTMENT ---
  const handleConfirmInvest = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token || !selectedPlanForInvestment) return;

    // Show loading state in modal while API call is made
    setModalMessage("Processing investment..."); 
    
    try {
        const response = await axios.post(`${BASE_URL}/transactions/invest/`, 
            { plan_id: selectedPlanForInvestment.id },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Success response
        setModalMessage(response.data.message || "Investment activated successfully. Congratulations!");

    } catch (error) {
        let errorMessage = "An unknown error occurred during investment.";
        
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        } else if (error.response && error.response.status === 401) {
             errorMessage = "Authentication failed. Please log in again.";
             removeTokens();
             navigate('/login');
             return;
        } else {
            errorMessage = error.message;
        }

        setModalMessage(`Error: ${errorMessage}`);

    }
  };


  // --- HANDLERS ---
  const handleInvestNow = (plan) => {
    setSelectedPlanForInvestment(plan);
    setModalMessage(null); // Set to null to show confirmation screen
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlanForInvestment(null);
    setModalMessage(null);
    // If successful, navigate back to dashboard to see active plan
    if (modalMessage && modalMessage.toLowerCase().includes('successfully')) {
      navigate('/'); 
    }
  };

  const handleLogout = () => {
    removeTokens(); // Use helper function
    navigate('/login');
  };

  // Navigation handler
  const handleNavigation = (tab) => {
    if (tab === 'home') {
      navigate('/');
    } else if (tab === 'deposit') {
      navigate('/deposit');
    } else if (tab === 'team') {
      navigate('/');
    } else if (tab === 'profile') {
      navigate('/');
    }
    // 'invest' stays here
  };


  // --- EFFECT HOOKS ---
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInvestmentPlans(token);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);


  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <style>
            {`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            body { margin: 0; background: ${DARK_BG}; }
            `}
        </style>
        <div style={styles.spinner}></div>
        <div style={{color: TEXT_GRAY, fontSize: '16px', fontWeight: '500'}}>
          Fetching investment plans...
        </div>
      </div>
    );
  }

  // Determine the display name using the PROP
  const displayName = userData 
    ? (userData.first_name || userData.username || 'User') 
    : 'User';

  return (
    <div style={styles.container}>
      {/* Global CSS Animations */}
      <style>
        {`
          @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          body { margin: 0; background: ${DARK_BG}; }
        `}
      </style>
      
      {/* --- CONFIRMATION MODAL --- */}
      {isModalOpen && selectedPlanForInvestment && (
        <ConfirmationModal 
            isOpen={isModalOpen} 
            onClose={closeModal}
            onConfirm={handleConfirmInvest}
            plan={selectedPlanForInvestment}
            message={modalMessage}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.welcomeText}>As-salamu alaykum,</div>
          <div style={styles.userName}>
            {displayName}
          </div>
        </div>
        <div 
          style={styles.notificationBtn}
          onClick={handleLogout}
        >
          <span>🚪</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <h1 style={styles.pageTitle}>Investment Plans</h1>
        <p style={styles.pageSubtitle}>Choose your plan and start earning daily profits</p>

        {/* Stats Section */}
        <div style={styles.statsSection}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>{plans.length}</div>
              <div style={styles.statLabel}>Plans Available</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>Varies</div>
              <div style={styles.statLabel}>Duration</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>Daily</div>
              <div style={styles.statLabel}>Profit Payment</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>Instant</div>
              <div style={styles.statLabel}>Withdrawal</div>
            </div>
          </div>
        </div>

        {/* Investment Plans */}
        <div style={styles.plansSection}>
          <div style={styles.sectionTitle}>
            <span>🏗️</span> Available Investment Plans
          </div>

          <div style={styles.plansGrid}>
            {plans.map((plan) => (
              <div 
                key={plan.id}
                style={
                  hoveredPlan === plan.id 
                    ? { ...styles.planCard, ...styles.planCardHover, borderColor: plan.color }
                    : { ...styles.planCard, border: `1px solid ${plan.color}30` }
                }
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {/* Plan Header */}
                <div style={styles.planHeader}>
                  <div style={{...styles.planIcon, color: plan.color}}>{plan.icon}</div>
                  <div style={styles.planName}>{plan.title}</div>
                  <div style={{...styles.planDuration, background: `${plan.color}15`, color: plan.color}}>{plan.duration}</div>
                </div>

                {/* Investment Amount */}
                <div style={{...styles.investmentSection, border: `1px solid ${plan.color}30`, background: `${plan.color}05`}}>
                  <div style={{...styles.investmentAmount, color: plan.color}}>
                    ₨{plan.investment.toLocaleString()}
                  </div>
                  <div style={styles.investmentLabel}>Investment Amount</div>
                </div>

                {/* Profit Details */}
                <div style={styles.profitGrid}>
                  {/* Daily Profit */}
                  <div style={{...styles.profitCard, background: `${SUCCESS_GREEN}10`, border: `1px solid ${SUCCESS_GREEN}30`}}>
                    <div style={styles.profitAmount}>₨{plan.dailyProfit.toLocaleString()}/day</div>
                    <div style={styles.profitLabel}>Daily Profit</div>
                  </div>
                  {/* Monthly Profit (Calculated for display) */}
                  
                </div>

                {/* Total Profit (From API) */}
                <div style={{
                  ...styles.profitCard,
                  gridColumn: '1 / -1',
                  background: `${WARNING_AMBER}10`,
                  border: `1px solid ${WARNING_AMBER}30`
                }}>
                  <div style={{...styles.profitAmount, color: WARNING_AMBER}}>
                    ₨{plan.totalProfit.toLocaleString()}
                  </div>
                  <div style={styles.profitLabel}>Total Return in {plan.duration}</div>
                </div>


                {/* Features (Static) */}
                <div style={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <div key={index} style={styles.featureItem}>
                      <span style={{...styles.featureIcon, color: plan.color}}>✓</span>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Invest Button */}
                <button
                  style={{...styles.investButton, background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color} 100%)`}}
                  onClick={() => handleInvestNow(plan)}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.investButtonHover, {background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color} 100%)`})}
                  onMouseLeave={(e) => Object.assign(e.target.style, { 
                    transform: 'translateY(0)', 
                    boxShadow: 'none',
                    background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color} 100%)`
                  })}
                >
                  Invest in {plan.title}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        {[
          { id: 'home', icon: '🏠', label: 'Home' },
          { id: 'invest', icon: '💼', label: 'Invest' },
          { id: 'deposit', icon: '💰', label: 'Deposit' },
          { id: 'profile', icon: '👤', label: 'Profile' }
        ].map((nav) => (
          <div 
            key={nav.id}
            style={activeTab === nav.id ? {...styles.navItem, ...styles.navItemActive} : styles.navItem}
            onClick={() => handleNavigation(nav.id)}
          >
            <div style={activeTab === nav.id ? styles.navIconActive : styles.navIcon}>
              {nav.icon}
            </div>
            <div style={activeTab === nav.id ? styles.navLabelActive : styles.navLabel}>
              {nav.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InvestmentPage;