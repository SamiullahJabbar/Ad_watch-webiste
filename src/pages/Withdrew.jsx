// WithdrawPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';
import Layout from '../components/Layout'; 
import { 
    FaHistory, FaChevronLeft, FaSpinner, 
    FaUniversity, FaMobileAlt, FaWallet,
    FaCheckCircle, FaArrowLeft
} from 'react-icons/fa';
import styles from '../css/WithdrawPage.module.css';

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

// --- COLOR CONSTANTS ---
const GREEN_PRIMARY = '#047857';
const BG_LIGHT = '#F8FAFC';
const FORM_CARD_BG = '#FFFFFF';
const INPUT_BG = '#F8FAFC';
const TEXT_DARK = '#1E293B';
const TEXT_GRAY = '#64748B';
const BORDER_COLOR = '#E2E8F0';
const SUCCESS_GREEN = '#10B981';
const ERROR_RED = '#EF4444';

function WithdrawPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [windowWidth] = useState(window.innerWidth);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [step, setStep] = useState(1);

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

  const isMobile = windowWidth <= 768;

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
  }, [navigate]);

  const handleViewHistory = () => {
    navigate('/withdraw/history');
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

  // --- STYLE FUNCTIONS ---
  const getMessageBoxStyle = (type) => {
    return {
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
    };
  };

  const getStepItemStyle = (isActive, isComplete) => {
    return {
      flex: 1,
      textAlign: 'center',
      padding: '0 5px',
      position: 'relative',
      cursor: isComplete ? 'pointer' : 'default',
      color: isActive ? GREEN_PRIMARY : isComplete ? TEXT_DARK : TEXT_GRAY,
      transition: 'color 0.3s ease',
      minWidth: '30%',
    };
  };

  const getStepCircleStyle = (isActive, isComplete) => {
    return {
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
    };
  };

  const getMethodCardStyle = (isSelected) => {
    return {
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
    };
  };

  const getInputStyle = (isValid) => {
    return {
      width: '100%',
      padding: '1rem 1.2rem',
      background: INPUT_BG,
      border: `2px solid ${INPUT_BG}`,
      borderRadius: '12px',
      color: TEXT_DARK,
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      outline: 'none',
      boxSizing: 'border-box',
      ...(!isValid && { borderColor: ERROR_RED, boxShadow: `0 0 0 3px ${ERROR_RED}20` })
    };
  };

  // --- STEP 1: Method Selection ---
  const renderStep1 = () => (
    <div className={styles.formCard}>
      <h3 className={styles.stepTitle}>
        Step 1: Choose Withdrawal Method
      </h3>
      {paymentMethods.map(method => {
        const IconComponent = method.icon;
        return (
            <div
              key={method.id}
              style={getMethodCardStyle(form.method === method.id)}
              onClick={() => handleMethodChange(method.id)}
            >
              <span className={styles.methodIcon}><IconComponent /></span>
              <div>
                <div className={styles.methodName}>{method.name}</div>
                <div className={styles.methodDetails}>Requires: {method.details}</div>
              </div>
            </div>
        );
      })}

      <button
        className={styles.primaryButton}
        onClick={() => setStep(2)}
      >
        Next: Enter Details <FaChevronLeft className={styles.nextIcon} />
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
        <form onSubmit={handleSubmit} className={styles.formCard}>
            <h3 className={styles.stepTitle}>
                Step 2: Enter {selectedMethod?.name} Details
            </h3>

            {message.text && (
                <div style={getMessageBoxStyle(message.type)}>
                {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            {/* Amount */}
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="amount">Withdrawal Amount (Min 100 PKR)</label>
                <input
                    id="amount"
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="e.g., 5000"
                    required
                    min="100"
                    style={getInputStyle(isAmountValid || !form.amount)}
                />
            </div>

            {/* Bank Name (Only for Bank Transfer) */}
            {form.method === 'BankTransfer' && (
                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="bank_name">Bank Name</label>
                    <input
                        id="bank_name"
                        type="text"
                        name="bank_name"
                        value={form.bank_name}
                        onChange={handleChange}
                        placeholder="e.g., HBL, Meezan Bank"
                        required
                        className={styles.input}
                    />
                </div>
            )}

            {/* Account Owner Name */}
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="account_owner">Account Holder Name (Full Name)</label>
                <input
                    id="account_owner"
                    type="text"
                    name="account_owner"
                    value={form.account_owner}
                    onChange={handleChange}
                    placeholder="Your Full Name on the Account"
                    required
                    className={styles.input}
                />
            </div>

            {/* Account/Phone Number */}
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="bank_account">
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
                    className={styles.input}
                />
            </div>

            <div className={`${styles.buttonGroup} ${isMobile ? styles.mobileButtonGroup : ''}`}>
                <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => setStep(1)}
                >
                    <FaChevronLeft /> Back
                </button>

                <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className={`${styles.primaryButton} ${loading || !isFormValid ? styles.buttonDisabled : ''} ${isMobile ? styles.mobileFullWidth : ''}`}
                    style={{ minWidth: '250px' }}
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
    <div className={styles.successScreen}>
        <div className={styles.successIcon}>🎉</div>
        <h2 className={styles.successTitle}>Withdrawal Submitted!</h2>
        <p className={styles.successMessage}>
            Your request for <strong>PKR {parseFloat(form.amount).toLocaleString()}</strong> via <strong>{form.method}</strong> has been recorded.
            <br />
            It will be processed within <strong>24 hours</strong>. Check history for updates.
        </p>
        <div className={styles.buttonGroup}>
            <button
                className={styles.historyButton}
                onClick={handleViewHistory}
            >
                <FaHistory /> View History
            </button>
            <button
                className={styles.primaryButton}
                onClick={() => { setStep(1); setForm({ amount: '', method: 'BankTransfer', bank_name: '', account_owner: '', bank_account: '' }); setMessage({ text: '', type: '' }); }}
            >
                Start New
            </button>
        </div>
    </div>
  );

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
    <Layout activeTab="withdraw"> 
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
        <>
            <h2 className={styles.pageTitle}>
              {step === 1 ? "New Withdrawal Request" : 
               step === 2 ? "Enter Withdrawal Details" : 
               "Withdrawal Complete"}
            </h2>
            <p className={styles.pageSubtitle}>
              {step === 1 ? "Choose a secure method to receive your funds." : 
               step === 2 ? "Enter the details and amount for withdrawal." : 
               "Your request is being processed."}
            </p>

            {/* History Button */}
            {/* {step !== 3 && (
                <button 
                    onClick={handleViewHistory} 
                    className={styles.historyToggleButton}
                >
                    <FaHistory /> View Withdrawal History
                </button>
            )} */}
            
            {/* Step Indicator */}
            {step !== 3 && (
                <div className={styles.stepContainer}>
                    <div style={getStepItemStyle(step === 1, step > 1)} onClick={() => step > 1 && setStep(1)}>
                        <div style={getStepCircleStyle(step === 1, step > 1)}>{step > 1 ? '✅' : '1'}</div>
                        Method
                        <div className={`${styles.stepLine} ${step > 1 ? styles.stepLineActive : ''}`}></div>
                    </div>

                    <div style={{...getStepItemStyle(step === 2, step > 2), cursor: step < 2 ? 'not-allowed' : 'pointer'}} onClick={() => step > 2 ? setStep(2) : (step === 2 ? null : setStep(1))}>
                        <div style={getStepCircleStyle(step === 2, step > 2)}>{step > 2 ? '✅' : '2'}</div>
                        Details
                    </div>
                </div>
            )}

            {/* Main Content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </>
      </main>
    </Layout>
  );
}

export default WithdrawPage;