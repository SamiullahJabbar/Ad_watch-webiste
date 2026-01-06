// WithdrawHistoryPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';
import Layout from '../components/Layout'; 
import { 
    FaHistory, FaSpinner, FaUniversity, 
    FaCheckCircle, FaClock, FaTimesCircle,
    FaSearch, FaCalendarAlt, FaMoneyBillWave,
    FaFilter, FaArrowLeft
} from 'react-icons/fa';
// بس یہ CSS import کریں
// بس یہ CSS import کریں
import styles from '../css/WithdrawHistoryPage.module.css';
// --- UTILITY FUNCTIONS ---
const jwtDecode = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const removeTokens = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
};

// --- API Endpoints ---
const WITHDRAW_HISTORY_ENDPOINT = `${BASE_URL}/transactions/withdraw/history/`;

// --- COLOR CONSTANTS ---
const GREEN_PRIMARY = '#047857';
const BG_LIGHT = '#F8FAFC';
const TEXT_DARK = '#1E293B';
const TEXT_GRAY = '#64748B';
const SUCCESS_GREEN = '#10B981';
const ERROR_RED = '#EF4444';
const WARNING_AMBER = '#F59E0B';

function WithdrawHistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [windowWidth] = useState(window.innerWidth);

  const isMobile = windowWidth <= 768;

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.bank_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.amount.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [history, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = history.length;
    const successful = history.filter(item => item.status === 'Successful').length;
    const pending = history.filter(item => item.status === 'Pending').length;
    const totalAmount = history.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    return { total, successful, pending, totalAmount };
  }, [history]);

  // --- API FETCH FUNCTIONS ---
  const fetchWithdrawHistory = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    try {
        setLoading(true);
        const res = await axios.get(WITHDRAW_HISTORY_ENDPOINT, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        setHistory(res.data);
    } catch (err) {
        console.error("History API Error:", err.response || err);
        setHistory([]);
    } finally {
        setLoading(false);
    }
  };

  // --- Authentication and Setup ---
  useEffect(() => {
    const checkAuth = () => {
        const token = sessionStorage.getItem('accessToken');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const decodedPayload = jwtDecode(token);
        
        if (!decodedPayload) {
             removeTokens();
             navigate('/login');
             return;
        }

        setAuthLoading(false);
    };

    checkAuth();
    fetchWithdrawHistory();
  }, [navigate]);

  const handleGoBack = () => {
    navigate('/withdraw');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getStatusBadgeStyle = (status) => {
    let color, bg, Icon;
    if (status === 'Successful') { 
        color = SUCCESS_GREEN; 
        bg = 'rgba(16, 185, 129, 0.1)'; 
        Icon = FaCheckCircle;
    }
    else if (status === 'Pending') { 
        color = WARNING_AMBER; 
        bg = 'rgba(245, 158, 11, 0.1)'; 
        Icon = FaClock;
    }
    else { 
        color = ERROR_RED; 
        bg = 'rgba(239, 68, 68, 0.1)'; 
        Icon = FaTimesCircle;
    }

    return {
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        fontWeight: '600',
        fontSize: '0.8rem',
        color: color,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        border: `1px solid ${color}30`,
        width: 'fit-content'
    };
  };

  // --- RENDER HISTORY ---
  if (authLoading) {
    return (
        <div className={styles.authLoadingContainer}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } body { margin: 0; background: ${BG_LIGHT}; }`}</style>
            <div className={styles.authLoadingContent}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingText}>Authenticating...</div>
            </div>
        </div>
    );
  }

  return (
    <Layout activeTab="withdraw-history"> 
      <style>
        {`
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
            background: ${BG_LIGHT};
            overflow-x: hidden; 
            max-width: 100vw;
          }
          .animate-spin {
             animation: spin 1s linear infinite;
          }
        `}
      </style>
      
      <main className={styles.mainContent}> 
        <div className={styles.historyContainer}>
          <div className={`${styles.historyHeader} ${isMobile ? styles.mobileHistoryHeader : ''}`}>
            <div>
              <h2 className={styles.historyTitle}>Withdrawal History</h2>
              <p className={styles.historySubtitle}>Track and manage your withdrawal requests</p>
            </div>
            <button 
                onClick={handleGoBack} 
                className={styles.newWithdrawalButton}
            >
                <FaArrowLeft className={styles.backArrowIcon} /> Back to Withdraw
            </button>
          </div>

          {/* Statistics Cards */}
          <div className={`${styles.statsGrid} ${isMobile ? styles.mobileStatsGrid : ''}`}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total Requests</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{color: SUCCESS_GREEN}}>{stats.successful}</div>
              <div className={styles.statLabel}>Successful</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{color: WARNING_AMBER}}>{stats.pending}</div>
              <div className={styles.statLabel}>Pending</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>PKR {stats.totalAmount.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Withdrawn</div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filtersContainer}>
            <div className={`${styles.filterRow} ${isMobile ? styles.mobileFilterRow : ''}`}>
              <div className={styles.searchContainer}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by method, account, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Successful">Successful</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: GREEN_PRIMARY}} />
              <p>Loading Withdrawal History...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <FaHistory className={styles.emptyStateIcon} />
              <h3>No Withdrawals Found</h3>
              <p>
                {history.length === 0 ? "You haven't made any withdrawals yet." : "No withdrawals match your search criteria."}
              </p>
              <button 
                onClick={handleGoBack} 
                className={styles.primaryButton}
              >
                Make Your First Withdrawal
              </button>
            </div>
          ) : (
            <div className={styles.historyTable}>
              {/* Desktop Table Header */}
              {!isMobile && (
                <div className={styles.tableHeader}>
                  <div>Amount</div>
                  <div>Method</div>
                  <div>Account Details</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>
              )}

              {/* History Items */}
              {filteredHistory.map((item) => {
                const StatusIcon = item.status === 'Successful' ? FaCheckCircle : 
                                 item.status === 'Pending' ? FaClock : FaTimesCircle;
                
                return isMobile ? (
                  // Mobile Card View
                  <div key={item.id} className={styles.mobileCard}>
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.mobileAmount}>
                        PKR {parseFloat(item.amount).toLocaleString()}
                      </div>
                      <div style={getStatusBadgeStyle(item.status)}>
                        <StatusIcon />
                        {item.status}
                      </div>
                    </div>
                    
                    <div className={styles.mobileDetail}>
                      <strong>Method:</strong> {item.method}
                    </div>
                    <div className={styles.mobileDetail}>
                      <strong>Account:</strong> {item.bank_account}
                    </div>
                    {item.bank_name && (
                      <div className={styles.mobileDetail}>
                        <strong>Bank:</strong> {item.bank_name}
                      </div>
                    )}
                    <div className={styles.mobileDate}>
                      <FaCalendarAlt />
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  // Desktop Table Row
                  <div key={item.id} className={styles.tableRow}>
                    <div className={styles.tableAmount}>
                      PKR {parseFloat(item.amount).toLocaleString()}
                    </div>
                    <div className={styles.tableMethod}>{item.method}</div>
                    <div className={styles.tableAccount}>
                      <div className={styles.accountNumber}>{item.bank_account}</div>
                      {item.bank_name && (
                        <div className={styles.bankName}>{item.bank_name}</div>
                      )}
                    </div>
                    <div className={styles.tableDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                      <br />
                      {new Date(item.created_at).toLocaleTimeString()}
                    </div>
                    <div style={getStatusBadgeStyle(item.status)}>
                      <StatusIcon />
                      {item.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}

export default WithdrawHistoryPage;