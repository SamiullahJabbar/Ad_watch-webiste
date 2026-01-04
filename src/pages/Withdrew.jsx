import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';
import Layout from '../components/Layout'; 
import { 
    FaHistory, FaChevronLeft, FaSpinner, 
    FaUniversity, FaMobileAlt, FaWallet,
    FaCheckCircle, FaClock, FaTimesCircle,
    FaSearch, FaCalendarAlt, FaMoneyBillWave,
    FaFilter, FaArrowLeft
} from 'react-icons/fa';

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
const WITHDRAW_SUBMIT_ENDPOINT = `${BASE_URL}/transactions/withdraw/`;
const WITHDRAW_HISTORY_ENDPOINT = `${BASE_URL}/transactions/withdraw/history/`;

// --- COLOR CONSTANTS ---
const GREEN_PRIMARY = '#047857';
const GREEN_DARK = '#065F46';
const GREEN_LIGHT = '#D1FAE5';
const BG_LIGHT = '#F8FAFC';
const FORM_CARD_BG = '#FFFFFF';
const INPUT_BG = '#F8FAFC';
const TEXT_DARK = '#1E293B';
const TEXT_GRAY = '#64748B';
const TEXT_DARK_GRAY = '#94A3B8';
const SUCCESS_GREEN = '#10B981';
const ERROR_RED = '#EF4444';
const WARNING_AMBER = '#F59E0B';
const BORDER_COLOR = '#E2E8F0';

function WithdrawPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Withdraw'); 
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State
  const [form, setForm] = useState({
    amount: '',
    method: 'BankTransfer', 
    bank_name: '',
    account_owner: '',
    bank_account: ''
  });

  // Available Methods for Step 1 UI
  const paymentMethods = useMemo(() => [
    { id: 'BankTransfer', name: 'Bank Transfer', icon: FaUniversity, details: 'Full name, Bank Name, Account/IBAN' },
    { id: 'JazzCash', name: 'JazzCash', icon: FaMobileAlt, details: 'Full name, Phone Number' },
    { id: 'EasyPaisa', name: 'EasyPaisa', icon: FaWallet, details: 'Full name, Phone Number' },
  ], []);

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
        setMessage({ text: 'Failed to fetch withdrawal history.', type: 'error' });
        setHistory([]);
    } finally {
        setLoading(false);
    }
  };

  // --- Authentication and Setup ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
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
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);
  
  useEffect(() => {
    if (activeTab === 'History' && history.length === 0) {
        fetchWithdrawHistory();
    }
  }, [activeTab, history.length]);

  const isMobile = windowWidth <= 768;

  const handleNavigation = (tab) => {
    if (tab === 'History' || tab === 'Withdraw') {
        setActiveTab(tab);
        if (tab === 'Withdraw') setStep(1);
        setMessage({ text: '', type: '' });
        return;
    }

    if (tab === 'home') navigate('/');
    else if (tab === 'invest') navigate('/invest');
    else if (tab === 'deposit') navigate('/deposit'); 
    else if (tab === 'profile') navigate('/profile');
    else if (tab === 'history') navigate('/DepositHistory'); 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMethodChange = (methodId) => {
      setForm(prev => ({ 
          ...prev, 
          method: methodId,
          bank_name: '',
          account_owner: '',
          bank_account: ''
      }));
      setMessage({ text: '', type: '' });
  }

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const token = sessionStorage.getItem('accessToken');

    try {
        const payload = {
            amount: parseFloat(form.amount),
            method: form.method,
            bank_name: form.method === 'BankTransfer' ? form.bank_name : undefined, 
            account_owner: form.account_owner,
            bank_account: form.bank_account
        };
        
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
        
        if (payload.amount < 100) {
             setMessage({ text: 'Minimum withdrawal amount is 100 PKR.', type: 'error' });
             setLoading(false);
             return;
        }

        const response = await axios.post(WITHDRAW_SUBMIT_ENDPOINT, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        setMessage({ 
            text: response.data.message || 'Withdrawal request submitted.', 
            type: 'success' 
        });
        setStep(3); 
        
    } catch (error) {
        console.error('Withdrawal failed:', error);

        let errorText = 'Withdrawal failed. Please try again.';
        if (error.response?.data?.error) {
            errorText = error.response.data.error;
        } else if (error.response?.status === 401) {
            errorText = 'Session expired. Redirecting to login.';
            removeTokens();
            setTimeout(() => navigate('/login'), 1500);
        } else if (error.response?.data) {
            errorText = Object.values(error.response.data).flat().join(' | ');
        }

        setMessage({ text: errorText, type: 'error' });
        setStep(2); 
    } finally {
        setLoading(false);
    }
  };

  // --- STYLES ---
  const styles = {
    container: {
      background: BG_LIGHT, 
      color: TEXT_DARK, 
      fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
      position: 'relative',
    },
    mainContent: {
      paddingTop: '1.5rem', 
      paddingBottom: '3rem', 
      paddingLeft: isMobile ? '1rem' : '2rem',
      paddingRight: isMobile ? '1rem' : '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    pageTitle: {
      fontSize: isMobile ? '1.8rem' : '2.2rem',
      fontWeight: '800',
      color: TEXT_DARK,
      marginBottom: '0.5rem',
      textAlign: 'center',
      marginTop: '1rem' 
    },
    pageSubtitle: {
      fontSize: '1rem',
      color: TEXT_GRAY,
      textAlign: 'center',
      marginBottom: '2.5rem',
      fontWeight: '400'
    },
    formCard: {
      background: FORM_CARD_BG,
      borderRadius: '20px',
      padding: isMobile ? '1.5rem' : '2.5rem', 
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
      animation: 'slideUp 0.6s ease-out',
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.95rem',
      fontWeight: '600',
      color: TEXT_DARK,
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '1rem 1.2rem',
      background: INPUT_BG,
      border: `2px solid ${INPUT_BG}`,
      borderRadius: '12px',
      color: TEXT_DARK,
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      outline: 'none',
      boxSizing: 'border-box'
    },
    messageBox: (type) => ({
      padding: '1rem',
      borderRadius: '10px',
      marginBottom: '1.5rem',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: '0.95rem',
      ...(type === 'success' && {
        backgroundColor: SUCCESS_GREEN + '1A',
        color: SUCCESS_GREEN,
        border: `1px solid ${SUCCESS_GREEN}50`
      }),
      ...(type === 'error' && {
        backgroundColor: ERROR_RED + '1A',
        color: ERROR_RED,
        border: `1px solid ${ERROR_RED}50`
      })
    }),
    button: {
      background: `linear-gradient(135deg, ${GREEN_PRIMARY} 0%, ${GREEN_DARK} 100%)`,
      color: 'white',
      border: 'none',
      padding: '1.2rem 2rem',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      width: 'auto',
      minWidth: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      boxShadow: `0 5px 15px ${GREEN_PRIMARY}30`,
      margin: '0 auto'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
      background: TEXT_DARK_GRAY 
    },
    backBtn: {
        background: INPUT_BG,
        color: TEXT_GRAY,
        border: `1px solid ${TEXT_DARK_GRAY}50`,
        padding: '1.2rem 2rem',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        flex: 1,
    },
    buttonGroup: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stepContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '0 10px',
        maxWidth: '350px',
        margin: '0 auto 2rem'
    },
    stepItem: (isActive, isComplete) => ({
        flex: 1,
        textAlign: 'center',
        padding: '0 5px',
        position: 'relative',
        cursor: isComplete ? 'pointer' : 'default',
        color: isActive ? GREEN_PRIMARY : isComplete ? TEXT_DARK : TEXT_GRAY,
        transition: 'color 0.3s ease',
        minWidth: '30%',
    }),
    stepLine: {
        position: 'absolute',
        top: '15px',
        left: '50%',
        right: '-50%',
        height: '3px',
        backgroundColor: TEXT_DARK_GRAY + '50',
        zIndex: 1,
        transition: 'background-color 0.4s ease'
    },
    stepLineActive: (isComplete) => ({
        backgroundColor: isComplete ? SUCCESS_GREEN : GREEN_PRIMARY,
    }),
    stepCircle: (isActive, isComplete) => ({
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: isActive ? GREEN_PRIMARY : isComplete ? SUCCESS_GREEN : INPUT_BG,
        border: `3px solid ${isActive ? GREEN_PRIMARY : isComplete ? SUCCESS_GREEN : BORDER_COLOR}`,
        color: isActive || isComplete ? 'white' : TEXT_DARK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 8px',
        position: 'relative',
        zIndex: 2,
        fontWeight: '700',
        fontSize: '15px',
        transition: 'all 0.3s ease'
    }),
    methodCard: (isSelected) => ({
        background: isSelected ? 'rgba(4, 120, 87, 0.1)' : FORM_CARD_BG,
        border: `2px solid ${isSelected ? GREEN_PRIMARY : BORDER_COLOR}`,
        borderRadius: '16px',
        padding: '1.2rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isSelected ? `0 0 10px ${GREEN_PRIMARY}20` : '0 1px 3px rgba(0,0,0,0.05)'
    }),
    methodIcon: {
        fontSize: '1.8rem',
        marginRight: '1rem',
        color: GREEN_PRIMARY
    },
    methodName: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: TEXT_DARK
    },
    methodDetails: {
        fontSize: '0.8rem',
        color: TEXT_GRAY
    },
    successScreen: {
        textAlign: 'center',
        padding: '3rem 1.5rem',
        background: FORM_CARD_BG,
        borderRadius: '20px',
        border: `1px solid ${SUCCESS_GREEN}50`,
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
        animation: 'slideUp 0.6s ease-out 0.4s both'
    },
    successIcon: {
        fontSize: '4rem',
        color: SUCCESS_GREEN,
        marginBottom: '1rem'
    },
    successTitle: {
        fontSize: '1.8rem',
        fontWeight: '800',
        color: GREEN_DARK,
        marginBottom: '0.75rem'
    },
    successMessage: {
        fontSize: '1rem',
        color: TEXT_GRAY,
        marginBottom: '1.5rem',
        lineHeight: '1.6'
    },
    historyButton: {
        background: FORM_CARD_BG,
        color: GREEN_PRIMARY,
        border: `1px solid ${GREEN_PRIMARY}50`,
        padding: '1rem',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        width: isMobile ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        margin: '1.5rem auto 0',
        maxWidth: '350px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
    },
    
    // New Professional History Styles
    historyContainer: {
      paddingBottom: '2rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '2rem'
    },
    statCard: {
      background: FORM_CARD_BG,
      borderRadius: '16px',
      padding: '1.5rem',
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '1.8rem',
      fontWeight: '800',
      color: GREEN_DARK,
      marginBottom: '0.5rem'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: TEXT_GRAY,
      fontWeight: '600'
    },
    filtersContainer: {
      background: FORM_CARD_BG,
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      border: `1px solid ${BORDER_COLOR}`
    },
    filterRow: {
      display: 'flex',
      gap: '1rem',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'center'
    },
    searchInput: {
      flex: 1,
      padding: '0.75rem 1rem',
      background: INPUT_BG,
      border: `1px solid ${BORDER_COLOR}`,
      borderRadius: '10px',
      fontSize: '0.9rem',
      width: '100%'
    },
    filterSelect: {
      padding: '0.75rem 1rem',
      background: INPUT_BG,
      border: `1px solid ${BORDER_COLOR}`,
      borderRadius: '10px',
      fontSize: '0.9rem',
      minWidth: '150px'
    },
    historyTable: {
      background: FORM_CARD_BG,
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
    },
    tableHeader: {
      background: '#F8FAFC',
      padding: '1rem 1.5rem',
      borderBottom: `1px solid ${BORDER_COLOR}`,
      display: isMobile ? 'none' : 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr 0.5fr',
      gap: '1rem',
      fontWeight: '600',
      color: TEXT_DARK,
      fontSize: '0.9rem'
    },
    tableRow: {
      padding: '1rem 1.5rem',
      borderBottom: `1px solid ${BORDER_COLOR}`,
      display: isMobile ? 'block' : 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr 0.5fr',
      gap: '1rem',
      alignItems: 'center',
      transition: 'background 0.2s ease'
    },
    mobileCard: {
      background: FORM_CARD_BG,
      borderRadius: '12px',
      padding: '1.2rem',
      marginBottom: '1rem',
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    statusBadge: (status) => {
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
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem 2rem',
      color: TEXT_GRAY
    },
  };

  // --- STEP 1: Method Selection ---
  const renderStep1 = () => (
    <div style={styles.formCard}>
      <h3 style={{ ...styles.label, fontSize: '1.1rem', textAlign: 'center', marginBottom: '1.5rem', color: GREEN_DARK }}>
        Step 1: Choose Withdrawal Method
      </h3>
      {paymentMethods.map(method => {
        const IconComponent = method.icon;
        return (
            <div
              key={method.id}
              style={styles.methodCard(form.method === method.id)}
              onClick={() => handleMethodChange(method.id)}
            >
              <span style={styles.methodIcon}><IconComponent /></span>
              <div>
                <div style={styles.methodName}>{method.name}</div>
                <div style={styles.methodDetails}>Requires: {method.details}</div>
              </div>
            </div>
        );
      })}

      <button
        style={styles.button}
        onClick={() => setStep(2)}
      >
        Next: Enter Details <FaChevronLeft style={{transform: 'rotate(180deg)', marginLeft: '0.5rem'}} />
      </button>
    </div>
  );

  // --- STEP 2: Details and Amount ---
  const renderStep2 = () => {
    const selectedMethod = paymentMethods.find(m => m.id === form.method);
    const amountNum = parseFloat(form.amount);
    const isAmountValid = amountNum >= 100 && !isNaN(amountNum);
    const isFormValid = isAmountValid && form.account_owner && form.bank_account && (form.method !== 'BankTransfer' || form.bank_name);

    return (
        <form onSubmit={handleSubmit} style={styles.formCard}>
            <h3 style={{ ...styles.label, fontSize: '1.1rem', textAlign: 'center', marginBottom: '1.5rem', color: GREEN_DARK }}>
                Step 2: Enter {selectedMethod?.name} Details
            </h3>

            {message.text && (
                <div style={styles.messageBox(message.type)}>
                {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            {/* Amount */}
            <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="amount">Withdrawal Amount (Min 100 PKR)</label>
                <input
                    id="amount"
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="e.g., 5000"
                    required
                    min="100"
                    style={{...styles.input, ...(!isAmountValid && form.amount ? { borderColor: ERROR_RED, boxShadow: `0 0 0 3px ${ERROR_RED}20` } : {})}}
                />
            </div>

            {/* Bank Name (Only for Bank Transfer) */}
            {form.method === 'BankTransfer' && (
                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="bank_name">Bank Name</label>
                    <input
                        id="bank_name"
                        type="text"
                        name="bank_name"
                        value={form.bank_name}
                        onChange={handleChange}
                        placeholder="e.g., HBL, Meezan Bank"
                        required
                        style={styles.input}
                    />
                </div>
            )}

            {/* Account Owner Name */}
            <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="account_owner">Account Holder Name (Full Name)</label>
                <input
                    id="account_owner"
                    type="text"
                    name="account_owner"
                    value={form.account_owner}
                    onChange={handleChange}
                    placeholder="Your Full Name on the Account"
                    required
                    style={styles.input}
                />
            </div>

            {/* Account/Phone Number */}
            <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="bank_account">
                    {form.method === 'BankTransfer' ? 'Bank Account / IBAN' : `${selectedMethod?.name} Phone Number`}
                </label>
                <input
                    id="bank_account"
                    type={form.method === 'BankTransfer' ? 'text' : 'tel'}
                    name="bank_account"
                    value={form.bank_account}
                    onChange={handleChange}
                    placeholder={form.method === 'BankTransfer' ? 'PKR1234567890' : '03XXXXXXXXX'}
                    required
                    style={styles.input}
                />
            </div>

            <div style={styles.buttonGroup}>
                <button
                    type="button"
                    style={styles.backBtn}
                    onClick={() => setStep(1)}
                >
                    <FaChevronLeft /> Back
                </button>

                <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    style={{
                        ...styles.button,
                        ...(loading || !isFormValid ? styles.buttonDisabled : {}),
                        width: isMobile ? '100%' : 'auto',
                        minWidth: '250px'
                    }}
                >
                    {loading ? (
                        <>
                            <FaSpinner className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        `Withdraw PKR ${parseFloat(form.amount || 0).toLocaleString()}`
                    )}
                </button>
            </div>
        </form>
    );
  };

  // --- STEP 3: Success Screen ---
  const renderStep3 = () => (
    <div style={styles.successScreen}>
        <div style={styles.successIcon}>🎉</div>
        <h2 style={styles.successTitle}>Withdrawal Submitted!</h2>
        <p style={styles.successMessage}>
            Your request for <strong>PKR {parseFloat(form.amount).toLocaleString()}</strong> via <strong>{form.method}</strong> has been recorded.
            <br />
            It will be processed within <strong>24 hours</strong>. Check history for updates.
        </p>
        <div style={styles.buttonGroup}>
            <button
                style={{...styles.button, background: INPUT_BG, color: GREEN_PRIMARY, border: `1px solid ${GREEN_PRIMARY}50`, boxShadow: 'none'}}
                onClick={() => handleNavigation('History')} 
            >
                <FaHistory /> View History
            </button>
            <button
                style={styles.button}
                onClick={() => { setStep(1); setForm({ amount: '', method: 'BankTransfer', bank_name: '', account_owner: '', bank_account: '' }); setMessage({ text: '', type: '' }); }}
            >
                Start New
            </button>
        </div>
    </div>
  );
  
  // --- HISTORY RENDER FUNCTION ---
  const renderHistory = () => (
    <div style={styles.historyContainer}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexDirection: isMobile ? 'column' : 'row', gap: '1rem'}}>
        <div>
          <h2 style={{...styles.pageTitle, marginTop: '0', textAlign: 'left', marginBottom: '0.5rem'}}>Withdrawal History</h2>
          <p style={{...styles.pageSubtitle, textAlign: 'left', marginBottom: '0'}}>Track and manage your withdrawal requests</p>
        </div>
        <button 
            onClick={() => handleNavigation('Withdraw')} 
            style={{...styles.button, margin: 0, background: FORM_CARD_BG, color: GREEN_PRIMARY, border: `2px solid ${GREEN_PRIMARY}`, boxShadow: 'none'}}
        >
            <FaArrowLeft style={{transform: 'rotate(0deg)'}} /> New Withdrawal
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Requests</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: SUCCESS_GREEN}}>{stats.successful}</div>
          <div style={styles.statLabel}>Successful</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: WARNING_AMBER}}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>PKR {stats.totalAmount.toLocaleString()}</div>
          <div style={styles.statLabel}>Total Withdrawn</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.filterRow}>
          <div style={{position: 'relative', flex: 1}}>
            <FaSearch style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: TEXT_GRAY}} />
            <input
              type="text"
              placeholder="Search by method, account, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{...styles.searchInput, paddingLeft: '2.5rem'}}
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Successful">Successful</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '3rem', color: TEXT_GRAY}}>
          <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: GREEN_PRIMARY}} />
          <p>Loading Withdrawal History...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div style={{...styles.formCard, ...styles.emptyState}}>
          <FaHistory style={{fontSize: '3rem', color: TEXT_DARK_GRAY, marginBottom: '1rem'}} />
          <h3 style={{color: TEXT_DARK, marginBottom: '0.5rem'}}>No Withdrawals Found</h3>
          <p style={{color: TEXT_GRAY, marginBottom: '1.5rem'}}>
            {history.length === 0 ? "You haven't made any withdrawals yet." : "No withdrawals match your search criteria."}
          </p>
          <button 
            onClick={() => handleNavigation('Withdraw')} 
            style={styles.button}
          >
            Make Your First Withdrawal
          </button>
        </div>
      ) : (
        <div style={styles.historyTable}>
          {/* Desktop Table Header */}
          {!isMobile && (
            <div style={styles.tableHeader}>
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
              <div key={item.id} style={styles.mobileCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                  <div style={{fontSize: '1.3rem', fontWeight: '800', color: TEXT_DARK}}>
                    PKR {parseFloat(item.amount).toLocaleString()}
                  </div>
                  <div style={styles.statusBadge(item.status)}>
                    <StatusIcon />
                    {item.status}
                  </div>
                </div>
                
                <div style={{marginBottom: '0.5rem'}}>
                  <strong>Method:</strong> {item.method}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <strong>Account:</strong> {item.bank_account}
                </div>
                {item.bank_name && (
                  <div style={{marginBottom: '0.5rem'}}>
                    <strong>Bank:</strong> {item.bank_name}
                  </div>
                )}
                <div style={{color: TEXT_GRAY, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <FaCalendarAlt />
                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              // Desktop Table Row
              <div key={item.id} style={styles.tableRow}>
                <div style={{fontSize: '1.1rem', fontWeight: '700', color: TEXT_DARK}}>
                  PKR {parseFloat(item.amount).toLocaleString()}
                </div>
                <div style={{color: TEXT_DARK, fontWeight: '500'}}>{item.method}</div>
                <div>
                  <div style={{fontWeight: '500'}}>{item.bank_account}</div>
                  {item.bank_name && (
                    <div style={{fontSize: '0.8rem', color: TEXT_GRAY}}>{item.bank_name}</div>
                  )}
                </div>
                <div style={{color: TEXT_GRAY, fontSize: '0.9rem'}}>
                  {new Date(item.created_at).toLocaleDateString()}
                  <br />
                  {new Date(item.created_at).toLocaleTimeString()}
                </div>
                <div style={styles.statusBadge(item.status)}>
                  <StatusIcon />
                  {item.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (authLoading) {
    return (
        <div style={styles.container}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } body { margin: 0; background: ${BG_LIGHT}; }`}</style>
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
                <div style={{ width: '50px', height: '50px', border: `3px solid ${TEXT_DARK_GRAY}30`, borderTop: `3px solid ${GREEN_PRIMARY}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <div style={{ color: TEXT_GRAY, fontSize: '16px', fontWeight: '500' }}>Authenticating...</div>
            </div>
        </div>
    );
  }

  return (
    <Layout activeTab={activeTab === 'Withdraw' ? 'deposit' : 'withdraw-history'}> 
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
          .plan-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(4, 120, 87, 0.15);
          }
        `}
      </style>
      
      <main style={styles.mainContent}> 
        {activeTab === 'History' ? (
          renderHistory()
        ) : (
          <>
            <h2 style={styles.pageTitle}>
              {step === 1 ? "New Withdrawal Request" : 
               step === 2 ? "Enter Withdrawal Details" : 
               "Withdrawal Complete"}
            </h2>
            <p style={styles.pageSubtitle}>
              {step === 1 ? "Choose a secure method to receive your funds." : 
               step === 2 ? "Enter the details and amount for withdrawal." : 
               "Your request is being processed."}
            </p>

            {/* History Button */}
            {activeTab === 'Withdraw' && step !== 3 && (
                <button 
                    onClick={() => handleNavigation('History')} 
                    style={styles.historyButton}
                >
                    <FaHistory /> View Withdrawal History
                </button>
            )}
            
            {/* Step Indicator */}
            {activeTab === 'Withdraw' && step !== 3 && (
                <div style={styles.stepContainer}>
                    <div style={styles.stepItem(step === 1, step > 1)} onClick={() => step > 1 && setStep(1)}>
                        <div style={styles.stepCircle(step === 1, step > 1)}>{step > 1 ? '✅' : '1'}</div>
                        Method
                        <div style={{ ...styles.stepLine, ...(step > 1 && styles.stepLineActive(step > 2)) }}></div>
                    </div>

                    <div style={{...styles.stepItem(step === 2, step > 2), cursor: step < 2 ? 'not-allowed' : 'pointer'}} onClick={() => step > 2 ? setStep(2) : (step === 2 ? null : setStep(1))}>
                        <div style={styles.stepCircle(step === 2, step > 2)}>{step > 2 ? '✅' : '2'}</div>
                        Details
                    </div>
                </div>
            )}

            {/* Main Content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </>
        )}
      </main>
    </Layout>
  );
}

export default WithdrawPage;