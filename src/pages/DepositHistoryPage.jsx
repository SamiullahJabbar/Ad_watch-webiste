import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';

// 🚨 Utility function to decode JWT token 🚨
// This assumes the token is a standard JWT (header.payload.signature)
// and the payload is Base64 URL-safe encoded.
const jwtDecode = (token) => {
    try {
        const base64Url = token.split('.')[1];
        // Replace base64 URL-safe characters
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Decode and parse the JSON payload
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null; // Return null on error
    }
};


function DepositHistoryPage() {
  const navigate = useNavigate();
  // Changed initial state to null
  const [userData, setUserData] = useState(null); 
  const [depositHistory, setDepositHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Real-time responsiveness & Data Fetching
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    // Check authentication and fetch data
    const fetchData = async () => {
      const token = sessionStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // *** FIX: Decode Token to get User Data ***
      const decodedPayload = jwtDecode(token);
      
      if (decodedPayload) {
          // Assuming the token contains 'first_name' and 'username'
          setUserData({ 
              first_name: decodedPayload.first_name || decodedPayload.name, 
              username: decodedPayload.username || decodedPayload.sub // 'sub' is standard JWT subject
          });
      } else {
          // Fallback if token is invalid or fails to decode
          setUserData({ first_name: 'Authenticated' }); 
      }
      // ********************************************

      try {
        // Fetch deposit history 
        const historyResponse = await axios.get(`${BASE_URL}/transactions/deposit/history/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDepositHistory(historyResponse.data);

      } catch (error) {
        console.error('Deposit history fetch failed:', error);
        // Handle 401 Unauthorized error (Token expired/invalid)
        if (error.response?.status === 401) {
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          navigate('/login');
        }
      } finally {
        setAuthLoading(false);
        setLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const isMobile = windowWidth <= 768;

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    navigate('/login');
  };

  // Status colors and icons
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return {
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          icon: ''
        };
      case 'rejected':
        return {
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          icon: '❌'
        };
      case 'pending':
      default:
        return {
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          icon: '⏳'
        };
    }
  };

  // Method icons
  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'jazzcash':
        return '📱';
      case 'easypaisa':
        return '📱';
      case 'bank transfer':
        return '🏦';
      default:
        return '💰';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
  const ERROR_RED = '#EF4444';
  const WARNING_AMBER = '#F59E0B';

  // --- STYLES ---
  const styles = {
    container: {
      minHeight: '100vh',
      background: DARK_BG,
      color: TEXT_LIGHT,
      fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
      position: 'relative',
      paddingBottom: '90px'
    },

    // Header (Same as Dashboard)
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

    // Main Content
    mainContent: {
      padding: isMobile ? '1.5rem 1rem' : '2rem',
      maxWidth: '1000px',
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

    // Stats Section
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

    // History Section
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

    amountSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },

    methodIcon: {
      fontSize: '2rem',
      background: 'rgba(139, 92, 246, 0.1)',
      width: '60px',
      height: '60px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${PURPLE_PRIMARY}30`
    },

    amountInfo: {
      display: 'flex',
      flexDirection: 'column'
    },

    amount: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: TEXT_LIGHT,
      marginBottom: '0.25rem'
    },

    method: {
      fontSize: '0.9rem',
      color: TEXT_GRAY,
      fontWeight: '500'
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

    transactionId: {
      background: 'rgba(139, 92, 246, 0.1)',
      padding: '0.4rem 0.8rem',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      color: PURPLE_LIGHT
    },

    dateSection: {
      textAlign: 'right',
      fontSize: '0.8rem',
      color: TEXT_GRAY
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

    // Bottom Navigation
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

    // Loading State
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

  // Navigation handler
  const handleNavigation = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/dashboard');
    } else if (tab === 'invest') {
      navigate('/invest');
    } else if (tab === 'deposit') {
      navigate('/deposit');
    } else if (tab === 'profile') {
      navigate('/');
    }
  };

  const [hoveredCard, setHoveredCard] = useState(null);

  if (authLoading || loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={{color: TEXT_GRAY, fontSize: '16px', fontWeight: '500'}}>
          Loading your deposit history...
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalDeposits = depositHistory.length;
  const totalAmount = depositHistory.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
  const approvedDeposits = depositHistory.filter(deposit => deposit.status?.toLowerCase() === 'approved').length;
  const pendingDeposits = depositHistory.filter(deposit => deposit.status?.toLowerCase() === 'pending').length;

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

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.welcomeText}>As-salamu alaykum,</div>
          <div style={styles.userName}>
            {/* Displaying name from the decoded token payload */}
            {userData ? (userData.first_name || userData.username || 'User') : 'User'}
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
        <h1 style={styles.pageTitle}>Deposit History</h1>
        <p style={styles.pageSubtitle}>Track all your deposit requests and their status</p>

        {/* Stats Section */}
        <div style={styles.statsSection}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>{totalDeposits}</div>
              <div style={styles.statLabel}>Total Deposits</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>₨{totalAmount.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Amount</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>{approvedDeposits}</div>
              <div style={styles.statLabel}>Approved</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}></div>
              <div style={styles.statValue}>{pendingDeposits}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div style={styles.historySection}>
          <div style={styles.sectionTitle}>
            <span>📋</span> Deposit Requests
          </div>

          {depositHistory.length > 0 ? (
            <div style={styles.historyList}>
              {depositHistory.map((deposit, index) => {
                const statusConfig = getStatusConfig(deposit.status);
                return (
                  <div 
                    key={deposit.id}
                    style={
                      hoveredCard === deposit.id 
                        ? { ...styles.historyCard, ...styles.historyCardHover }
                        : styles.historyCard
                    }
                    onMouseEnter={() => setHoveredCard(deposit.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Card Header */}
                    <div style={styles.cardHeader}>
                      <div style={styles.amountSection}>
                        <div style={styles.methodIcon}>
                          {getMethodIcon(deposit.method)}
                        </div>
                        <div style={styles.amountInfo}>
                          <div style={styles.amount}>₨{parseFloat(deposit.amount).toLocaleString()}</div>
                          <div style={styles.method}>{deposit.method}</div>
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
                        {statusConfig.icon} {deposit.status}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div style={styles.cardDetails}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Transaction ID:</span>
                        <span style={styles.transactionId}>{deposit.transaction_id}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Date & Time:</span>
                        <span style={styles.detailValue}>{formatDate(deposit.created_at)}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div style={styles.dateSection}>
                      Requested on {formatDate(deposit.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💸</div>
              <div style={styles.emptyText}>No Deposit History Found</div>
              <div style={styles.emptySubtext}>
                You haven't made any deposit requests yet. Start by making your first deposit.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        {[
          { id: 'home', icon: '🏠', label: 'Home' },
          { id: 'invest', icon: '💼', label: 'Invest' },
          { id: 'deposit', icon: '💰', label: 'Deposit' },
          { id: 'history', icon: '📋', label: 'History' }
        ].map((nav) => (
          <div 
            key={nav.id}
            style={activeTab === nav.id ? styles.navItemActive : styles.navItem}
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

export default DepositHistoryPage;