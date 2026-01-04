import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';

function PlanHistoryPage() {
  const navigate = useNavigate();
  // MOCKING userData
  const [userData] = useState({ 
    first_name: 'Muhammad', 
    username: 'investor_pk' 
  }); 
  const [planHistory, setPlanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); 
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Real-time responsiveness & Data fetching
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    const fetchData = async () => {
      const token = sessionStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const historyResponse = await axios.get(`${BASE_URL}/transactions/plans/history/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setPlanHistory(historyResponse.data);

      } catch (error) {
        console.error('Plan History fetch failed:', error);
        if (error.response?.status === 401) {
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          navigate('/login');
        }
        setPlanHistory([]); 
      } finally {
        setAuthLoading(false);
        setLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const isMobile = windowWidth <= 768;
  const menuHeight = 85; // Height of the menu, used for padding

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    navigate('/login');
  };

  // Navigation handler
  const handleNavigation = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/dashboard');
    } else if (tab === 'invest') {
      navigate('/invest');
    } else if (tab === 'deposit') {
      navigate('/deposit');
    } else if (tab === 'history') {
      navigate('/plan-history'); 
    } else if (tab === 'profile') {
      navigate('/');
    } else if (tab === 'team') {
      navigate('/'); 
    }
  };

  // Status colors and icons (Kept original logic)
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return {
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          icon: '✅'
        };
      case 'expired':
        return {
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          icon: '❌'
        };
      case 'completed':
        return {
          color: '#8B5CF6',
          bgColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          icon: '🎯'
        };
      default:
        return {
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          icon: '⏳'
        };
    }
  };

  // Plan icons (Kept original logic)
  const getPlanIcon = (title) => {
    if (title?.includes('10 Marla')) return '🏡';
    if (title?.includes('20 Marla')) return '🏘️';
    if (title?.includes('1 Kanal')) return '🏢';
    if (title?.includes('10 Kanal')) return '🏰';
    return '📊';
  };

  // Format date (Kept original logic)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Calculate days remaining (Kept original logic)
  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    try {
      const end = new Date(endDate);
      const today = new Date();
      end.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  };

  // --- COLOR CONSTANTS ---
  const PURPLE_PRIMARY = '#8B5CF6'; 
  const PURPLE_LIGHT = '#A78BFA';
  const DARK_BG = '#0F0F23';       
  const FORM_CARD_BG = '#1A1B2F';   
  const TEXT_LIGHT = '#F8FAFC';     
  const TEXT_GRAY = '#94A3B8';
  const TEXT_DARK_GRAY = '#64748B';

  // --- STYLES ---
  const styles = {
    container: {
      minHeight: '100vh',
      background: DARK_BG,
      color: TEXT_LIGHT,
      fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
      position: 'relative',
      // Dynamic padding at the bottom based on whether the fixed menu is present
      paddingBottom: isMobile ? `${menuHeight}px` : `${menuHeight + 5}px` 
    },

    // Header 
    header: {
      padding: '20px 16px',
      background: 'rgba(26, 27, 47, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${TEXT_DARK_GRAY}30`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: 'slideDown 0.6s ease-out',
      position: 'sticky', 
      top: 0,
      zIndex: 100
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

    // --- UPDATED: Desktop Navigation Bar STYLES (Fixed at Bottom for Web) ---
    desktopNavContainer: {
        display: isMobile ? 'none' : 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(26, 27, 47, 0.98)', // Slightly darker background for fixed bar
        backdropFilter: 'blur(25px)',
        borderTop: `1px solid ${TEXT_DARK_GRAY}30`,
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.3)',
        position: 'fixed', // Fixed position at the bottom
        bottom: 0,
        left: 0,
        right: 0,
        height: `${menuHeight}px`,
        zIndex: 1000,
    },
    desktopNavItem: {
        textAlign: 'center',
        cursor: 'pointer',
        padding: '10px 20px',
        margin: '0 15px',
        width: '100px', // Fixed width for consistent spacing
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '16px',
        background: 'transparent',
    },
    desktopNavItemActive: {
        background: FORM_CARD_BG,
        border: `1px solid ${PURPLE_PRIMARY}40`,
        boxShadow: `0 0 15px ${PURPLE_PRIMARY}20`,
    },
    desktopNavIcon: {
        fontSize: '32px',
        marginBottom: '4px',
        transition: 'all 0.3s ease',
        color: TEXT_GRAY 
    },
    desktopNavIconActive: {
        color: PURPLE_LIGHT, 
        transform: 'scale(1.1)'
    },
    desktopNavLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: TEXT_GRAY,
        transition: 'all 0.3s ease'
    },
    desktopNavLabelActive: {
        color: PURPLE_PRIMARY, 
        fontWeight: '700'
    },
    // --- END UPDATED DESKTOP STYLES ---

    // Main Content 
    mainContent: {
      padding: isMobile ? '1.5rem 1rem' : '2rem',
      maxWidth: '1000px',
      margin: '0 auto',
      paddingTop: '2rem' // Keep content below the main header
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

    // All other component styles (stats, history, loading) remain the same...
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
    historySection: {
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

    historyList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },

    historyCard: {
      background: FORM_CARD_BG,
      borderRadius: '16px',
      padding: '1.5rem',
      border: `1px solid ${TEXT_DARK_GRAY}30`,
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    historyCardHover: {
      transform: 'translateY(-2px)',
      borderColor: PURPLE_PRIMARY,
      boxShadow: `0 8px 25px ${PURPLE_PRIMARY}20`
    },

    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '1rem' : '0'
    },

    planSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },

    planIcon: {
      fontSize: '2.5rem',
      background: 'rgba(139, 92, 246, 0.1)',
      width: '70px',
      height: '70px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${PURPLE_PRIMARY}30`
    },

    planInfo: {
      display: 'flex',
      flexDirection: 'column'
    },

    planTitle: {
      fontSize: '1.3rem',
      fontWeight: '700',
      color: TEXT_LIGHT,
      marginBottom: '0.25rem'
    },

    planAmount: {
      fontSize: '1.1rem',
      color: PURPLE_LIGHT,
      fontWeight: '600'
    },

    statusBadge: {
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      whiteSpace: 'nowrap'
    },

    cardDetails: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem'
    },

    detailItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 0',
      borderBottom: `1px solid ${TEXT_DARK_GRAY}20`
    },

    detailLabel: {
      fontSize: '0.85rem',
      color: TEXT_GRAY,
      fontWeight: '500'
    },

    detailValue: {
      fontSize: '0.85rem',
      color: TEXT_LIGHT,
      fontWeight: '600'
    },

    dateRange: {
      background: 'rgba(139, 92, 246, 0.1)',
      padding: '0.4rem 0.8rem',
      borderRadius: '8px',
      fontSize: '0.8rem',
      color: PURPLE_LIGHT,
      textAlign: 'center'
    },

    daysRemaining: {
      textAlign: 'center',
      fontSize: '0.8rem',
      color: TEXT_GRAY,
      marginTop: '0.5rem'
    },
    
    emptyState: {
      background: FORM_CARD_BG,
      borderRadius: '20px',
      padding: '4rem 2rem',
      textAlign: 'center',
      border: `1px solid ${TEXT_DARK_GRAY}30`,
      animation: 'slideUp 0.6s ease-out'
    },

    emptyIcon: {
      fontSize: '4rem',
      opacity: '0.3',
      marginBottom: '1rem'
    },

    emptyText: {
      fontSize: '1.1rem',
      color: TEXT_GRAY,
      marginBottom: '0.5rem',
      fontWeight: '500'
    },

    emptySubtext: {
      fontSize: '0.9rem',
      color: TEXT_DARK_GRAY
    },
    // Mobile Bottom Navigation Styles (Used for Mobile View Only)
    bottomNav: {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      height: `${menuHeight}px`,
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
      transition: 'all 0.3s ease'
    },

    navIconActive: {
      transform: 'scale(1.15)'
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

  const [hoveredCard, setHoveredCard] = useState(null);

  if (authLoading || loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={{color: TEXT_GRAY, fontSize: '16px', fontWeight: '500'}}>
          Loading your plan history...
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalPlans = planHistory.length;
  const activePlans = planHistory.filter(plan => plan.status?.toLowerCase() === 'active').length;
  const expiredPlans = planHistory.filter(plan => plan.status?.toLowerCase() === 'expired').length;
  const totalInvestment = planHistory.reduce((sum, plan) => sum + (parseFloat(plan.amount) || 0), 0);

  // Navigation items configuration, matching the requested layout
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home', route: '/dashboard', webIcon: '🏠' }, 
    { id: 'invest', icon: '💼', label: 'Invest', route: '/invest', webIcon: '💼' },
    { id: 'team', icon: '👥', label: 'Team', route: '/team', webIcon: '👥' }, // 'Team' from screenshot
    { id: 'history', icon: '📋', label: 'History', route: '/plan-history', webIcon: '📋' },
    { id: 'profile', icon: '👤', label: 'Profile', route: '/profile', webIcon: '👤' }
  ];

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            background: ${DARK_BG};
          }
        `}
      </style>

      {/* Header (Always visible) */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.welcomeText}>As-salamu alaykum,</div>
          <div style={styles.userName}>
            {userData ? (userData.first_name || userData.username || 'User') : 'User'}
          </div>
        </div>
        <div 
          style={styles.notificationBtn}
          onClick={handleLogout}
          title="Logout"
        >
          <span>🚪</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <h1 style={styles.pageTitle}>Plan History</h1>
        <p style={styles.pageSubtitle}>Track all your investment plans and their status</p>

        {/* Stats Section */}
        <div style={styles.statsSection}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>{totalPlans}</div>
              <div style={styles.statLabel}>Total Plans</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>₨{totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div style={styles.statLabel}>Total Investment</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>{activePlans}</div>
              <div style={styles.statLabel}>Active</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>{expiredPlans}</div>
              <div style={styles.statLabel}>Expired</div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div style={styles.historySection}>
          <div style={styles.sectionTitle}>
            <span>📋</span> Investment Plans
          </div>

          {planHistory.length > 0 ? (
            <div style={styles.historyList}>
              {planHistory.map((plan, index) => {
                const statusConfig = getStatusConfig(plan.status);
                const daysRemaining = getDaysRemaining(plan.end_date);
                
                return (
                  <div 
                    key={index}
                    style={
                      hoveredCard === index 
                        ? { ...styles.historyCard, ...styles.historyCardHover }
                        : styles.historyCard
                    }
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Card Header */}
                    <div style={styles.cardHeader}>
                      <div style={styles.planSection}>
                        <div style={styles.planIcon}>
                          {getPlanIcon(plan.title)}
                        </div>
                        <div style={styles.planInfo}>
                          <div style={styles.planTitle}>{plan.title}</div>
                          <div style={styles.planAmount}>₨{parseFloat(plan.amount).toLocaleString()}</div>
                        </div>
                      </div>
                      <div 
                        style={{
                          ...styles.statusBadge,
                          color: statusConfig.color,
                          backgroundColor: statusConfig.bgColor,
                          border: `1px solid ${statusConfig.borderColor}`
                        }}
                      >
                        {statusConfig.icon} {plan.status}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div style={styles.cardDetails}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Start Date:</span>
                        <span style={styles.detailValue}>{formatDate(plan.start_date)}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>End Date:</span>
                        <span style={styles.detailValue}>{formatDate(plan.end_date)}</span>
                      </div>
                    </div>

                    {/* Date Range & Days Remaining */}
                    <div style={styles.dateRange}>
                      {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                    </div>
                    
                    {plan.status?.toLowerCase() === 'active' && daysRemaining > 0 && (
                      <div style={styles.daysRemaining}>
                        {daysRemaining} days remaining
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <div style={styles.emptyText}>No Plan History Found</div>
              <div style={styles.emptySubtext}>
                You haven't invested in any plans yet. Start by choosing an investment plan.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIXED Bottom Navigation (Shared Styles, Dynamic Rendering) */}
      <div style={isMobile ? styles.bottomNav : styles.desktopNavContainer}>
          {navItems.filter(nav => nav.id !== 'deposit').map((nav) => ( 
            <div 
              key={nav.id}
              style={{
                // Use desktop styles for web, mobile styles for mobile
                ...(isMobile ? styles.navItem : styles.desktopNavItem),
                ...((isMobile ? activeTab === nav.id : activeTab === nav.id) ? 
                    (isMobile ? styles.navItemActive : styles.desktopNavItemActive) : {})
              }}
              onClick={() => handleNavigation(nav.id)}
            >
              <div 
                style={{
                  ...(isMobile ? styles.navIcon : styles.desktopNavIcon),
                  ...((isMobile ? activeTab === nav.id : activeTab === nav.id) ? 
                    (isMobile ? styles.navIconActive : styles.desktopNavIconActive) : {})
                }}
              >
                {nav.webIcon}
              </div>
              <div 
                style={{
                  ...(isMobile ? styles.navLabel : styles.desktopNavLabel),
                  ...((isMobile ? activeTab === nav.id : activeTab === nav.id) ? 
                    (isMobile ? styles.navLabelActive : styles.desktopNavLabelActive) : {})
                }}
              >
                {nav.label}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}

export default PlanHistoryPage;