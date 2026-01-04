import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Custom Layout component for Header and Footer (Assuming this exists)
import Layout from '../components/Layout'; 
// Updated Icons for better visual appeal
import { 
    FaMoneyBillWave, FaHistory, FaChevronLeft, FaLock, FaCopy, FaCheckCircle, 
    FaExclamationTriangle, FaHome, FaSpinner, FaReceipt, FaClock, FaRegCalendarAlt, 
    FaMoneyBillAlt, FaMobileAlt, FaUniversity, FaCreditCard, FaCheck, FaTimes, FaHourglassHalf,
    FaChevronDown, FaChevronUp
} from 'react-icons/fa'; 
import BASE_URL, { removeTokens } from '../api/baseURL';

// ----------------------------------------------------------------
// JWT DECODE FUNCTION (Helper function)
// ----------------------------------------------------------------
const decodeJwt = (token) => {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        let base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64Url.length % 4) {
            base64Url += '=';
        }

        const jsonPayload = atob(base64Url);
        const fixedPayload = decodeURIComponent(jsonPayload.split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(fixedPayload);
    } catch (e) {
        console.error("JWT Decode Error:", e);
        return null;
    }
};

// --- API Endpoints ---
const ACCOUNT_DETAILS_ENDPOINT = `${BASE_URL}/wallet/admin/account-details/`;
const DEPOSIT_SUBMIT_ENDPOINT = `${BASE_URL}/transactions/deposit/`;
const DEPOSIT_HISTORY_ENDPOINT = `${BASE_URL}/transactions/deposit/history/`;


// --- COLOR CONSTANTS ---
const GREEN_PRIMARY = '#0a520d';
const GREEN_DARK = '#073c09';
const GREEN_LIGHT = '#388E3C';
const BG_LIGHT = '#F0F4F8'; // Light background
const FORM_CARD_BG = '#FFFFFF'; // White card background
const INPUT_BG = '#F8FAFC';
const INPUT_BG_FILLED = '#E2E8F0';
const TEXT_DARK = '#1E293B'; // Main text color
const TEXT_GRAY = '#64748B';
const TEXT_DARK_GRAY = '#94A3B8';
const SUCCESS_GREEN = '#10B981';
const ERROR_RED = '#EF4444';
const BORDER_COLOR = '#E2E8F0';
const PENDING_ORANGE = '#F59E0B';


function DepositPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // --- MAIN STATES ---
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('Deposit'); // Deposit or History
  const [accountDetails, setAccountDetails] = useState(null);
  const [history, setHistory] = useState([]);

  // FIX 1: Custom dropdown state for mobile
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    method: '', // JazzCash, Easypaisa, BankTransfer
    transaction_id: '',
    bank_name: '',
    account_owner: '',
    screenshot: null
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [windowWidth] = useState(window.innerWidth); 
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredFile, setHoveredFile] = useState(false);

  // Constants
  const MIN_AMOUNT = 3000;
  const AMOUNT_OPTIONS = [3000, 5000, 10000];
  const METHOD_OPTIONS = ['JazzCash', 'Easypaisa', 'BankTransfer'];


  // --- API FETCH FUNCTIONS ---
  const fetchAccountDetails = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    try {
        const res = await axios.get(ACCOUNT_DETAILS_ENDPOINT, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.data && res.data.length > 0) {
            setAccountDetails(res.data[0]);
        } else {
            setError('Admin account details not found.');
        }
    } catch (err) {
        console.error("Account Details API Error:", err.response || err);
        setError('Failed to fetch payment details.');
    }
  };

  const fetchDepositHistory = async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    try {
        setLoading(true);
        const res = await axios.get(DEPOSIT_HISTORY_ENDPOINT, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        setHistory(res.data);
    } catch (err) {
        console.error("History API Error:", err.response || err);
        setError('Failed to fetch deposit history.');
        setHistory([]);
    } finally {
        setLoading(false);
    }
  };


  // --- AUTH AND DATA FETCH EFFECTS ---
  useEffect(() => {
    const checkAuthAndSetUser = () => {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const decoded = decodeJwt(token);

      if (!decoded) {
        removeTokens();
        navigate('/login');
        return;
      }
      
      fetchAccountDetails(); 
      setAuthLoading(false);
    };

    checkAuthAndSetUser();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'History' && history.length === 0) {
        fetchDepositHistory();
    }
  }, [activeTab, history.length]);


  // --- HANDLERS ---
  const isMobile = windowWidth <= 768;

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  const handleAmountSelect = (amount) => {
    setFormData(prev => ({ ...prev, amount: amount }));
    setError('');
  };

  // FIX 1: Custom method selection handler
  const handleMethodSelect = (method) => {
    setFormData(prev => ({ ...prev, method: method }));
    setShowMethodDropdown(false); // Close dropdown after selection
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError('');
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setFormData(prev => ({ ...prev, screenshot: file }));
      const reader = new FileReader();
      reader.onload = (e) => { setPreviewImage(e.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    setMessage('');
    setError('');

    if (step === 1) {
      const amount = parseFloat(formData.amount);
      if (!amount || amount < MIN_AMOUNT) {
        setError(`Amount must be at least ${MIN_AMOUNT} PKR.`);
        return;
      }
      setStep(2);

    } else if (step === 2) {
      if (!formData.method) {
        setError('Please select a payment method.');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setMessage('');
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };
  
  const handleGoHome = () => {
      navigate('/'); 
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!formData.transaction_id || !formData.bank_name || !formData.account_owner || !formData.screenshot) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const token = sessionStorage.getItem('accessToken');

      const submitData = new FormData();
      submitData.append('amount', formData.amount);
      submitData.append('method', formData.method);
      submitData.append('transaction_id', formData.transaction_id);
      submitData.append('bank_name', formData.bank_name);
      submitData.append('account_owner', formData.account_owner);
      submitData.append('screenshot', formData.screenshot);

      await axios.post(
        DEPOSIT_SUBMIT_ENDPOINT,
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setStep(4);
      setMessage('Your deposit request is successfully submitted.');
      
      setFormData(prev => ({
        ...prev,
        transaction_id: '',
        bank_name: '',
        account_owner: '',
        screenshot: null
      }));
      setPreviewImage('');
      
    } catch (err) {
      if (err.response) {
        const errorData = err.response.data;
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          removeTokens();
          navigate('/login');
        } else if (errorData.error) {
          setError(errorData.error);
        } else if (errorData.transaction_id) {
          setError('This transaction ID already exists or is invalid.');
        } else if (errorData.bank_name || errorData.account_owner || errorData.amount) {
            setError('Please check all fields. Some input is invalid.');
        } else {
          setError('API failed. Please check your data.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleNavigation = (tab) => {
    setActiveTab(tab);
    if (tab === 'Deposit') {
        setStep(1); 
        setError(''); 
        setMessage('');
    }
  };
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('Copied to clipboard! ✅');
    setTimeout(() => setMessage(''), 2000);
  };
  
  const getMethodDetails = (method) => {
    if (!accountDetails) return { number: 'Loading...', owner: 'Loading...', image: null, icon: FaCreditCard };

    if (method === 'JazzCash') {
        return {
            number: accountDetails.jazzcash_number || 'N/A',
            owner: accountDetails.owner_name || 'N/A',
            image: accountDetails.jazzcash_image,
            detail: 'Send to JazzCash Number',
            icon: FaMobileAlt 
        };
    } else if (method === 'Easypaisa') {
        return {
            number: accountDetails.easypaisa_number || 'N/A',
            owner: accountDetails.owner_name || 'N/A',
            image: accountDetails.easypaisa_image,
            detail: 'Send to EasyPaisa Number',
            icon: FaMobileAlt
        };
    } else if (method === 'BankTransfer') {
        return {
            number: accountDetails.bank_account || 'N/A',
            owner: accountDetails.owner_name || 'N/A',
            image: accountDetails.bank_image,
            detail: `Bank: ${accountDetails.bank_name || 'N/A'}`,
            icon: FaUniversity
        };
    }
    return null;
  };


  // --- STYLES (With all responsiveness and enhancements) ---
  const styles = {
    container: {
      minHeight: '100vh',
      background: BG_LIGHT, 
      color: TEXT_DARK, 
      fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
      position: 'relative',
    },

    mainContent: {
      paddingTop: isMobile ? '0.5rem' : '1rem', 
      paddingBottom: '6rem', 
      paddingLeft: isMobile ? '1rem' : '2rem',
      paddingRight: isMobile ? '1rem' : '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: `calc(100vh - 2rem)` 
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
    
    // --- STEP INDICATOR STYLES ---
    stepIndicator: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '0 1rem',
        maxWidth: '450px',
        margin: '0 auto 2rem',
    },
    stepItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        opacity: 0.5,
        transition: 'opacity 0.3s ease'
    },
    stepItemActive: { opacity: 1 },
    stepNumber: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: TEXT_DARK_GRAY,
        color: FORM_CARD_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '14px',
        marginBottom: '4px',
        transition: 'background 0.3s ease',
    },
    stepNumberActive: {
        background: GREEN_PRIMARY,
        color: FORM_CARD_BG,
        boxShadow: `0 0 0 4px ${GREEN_PRIMARY}30`
    },
    stepLine: {
        height: '2px',
        background: TEXT_DARK_GRAY,
        flex: 1,
        margin: '0 8px',
        alignSelf: 'center',
        transition: 'background 0.3s ease'
    },
    stepLineCompleted: { background: SUCCESS_GREEN },
    stepLabel: {
        fontSize: '11px', 
        color: TEXT_GRAY,
        marginTop: '0.5rem',
        fontWeight: '500'
    },

    depositFormSection: {
      background: FORM_CARD_BG,
      borderRadius: '20px',
      padding: isMobile ? '1.5rem' : '2rem', 
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
      animation: 'slideUp 0.6s ease-out'
    },
    
    // --- SUCCESS SCREEN STYLE ---
    successCard: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: `2px solid ${SUCCESS_GREEN}50`,
      borderRadius: '20px',
      padding: '3rem 2rem',
      textAlign: 'center',
      marginTop: '2rem',
      animation: 'fadeIn 0.8s ease-out',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem'
    },
    successIcon: { fontSize: '4rem', color: SUCCESS_GREEN, animation: 'bounce 1s infinite alternate' },
    successTitle: { fontSize: '1.8rem', fontWeight: '800', color: SUCCESS_GREEN },
    successText: { fontSize: '1.1rem', color: TEXT_DARK, lineHeight: '1.6', maxWidth: '450px', margin: '0 auto' },

    sectionTitle: {
      fontSize: '1.3rem',
      fontWeight: '700',
      color: TEXT_DARK,
      marginBottom: '1.5rem',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },

    // Amount Grid & Input
    amountGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    amountButton: {
      background: INPUT_BG,
      color: TEXT_DARK,
      border: `2px solid ${INPUT_BG}`,
      padding: '1.2rem 0.5rem',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    amountButtonActive: {
      background: 'rgba(10, 82, 13, 0.1)', 
      borderColor: GREEN_PRIMARY,
      boxShadow: `0 0 0 4px ${GREEN_PRIMARY}20`
    },
    otherAmountInput: {
      padding: '1rem 1.2rem',
      borderRadius: '12px',
      fontSize: '0.95rem',
      background: INPUT_BG,
      color: TEXT_DARK,
      border: `2px solid ${INPUT_BG}`,
      outline: 'none',
      transition: 'all 0.3s ease',
      fontFamily: 'inherit',
      marginTop: '0.5rem',
      width: '100%', 
      boxSizing: 'border-box'
    },

    // FIX 1: Custom Dropdown Styles for Mobile
    customDropdownContainer: {
      position: 'relative',
      width: '100%'
    },
    customDropdownButton: {
      padding: '1rem 1.2rem',
      borderRadius: '12px',
      fontSize: '0.95rem',
      background: INPUT_BG,
      color: TEXT_DARK,
      border: `2px solid ${INPUT_BG}`,
      outline: 'none',
      fontFamily: 'inherit',
      width: '100%', 
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minHeight: '48px',
    },
    customDropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: FORM_CARD_BG,
      border: `1px solid ${BORDER_COLOR}`,
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      zIndex: 1000,
      marginTop: '5px',
      maxHeight: '200px',
      overflowY: 'auto'
    },
    customDropdownItem: {
      padding: '1rem 1.2rem',
      borderBottom: `1px solid ${BORDER_COLOR}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.95rem',
      color: TEXT_DARK
    },
    customDropdownItemHover: {
      background: INPUT_BG,
      color: GREEN_PRIMARY
    },

    // Method Card
    bankMethodCard: {
        background: 'rgba(10, 82, 13, 0.05)',
        border: `1px solid ${GREEN_PRIMARY}30`,
        borderRadius: '16px',
        padding: '1.5rem',
        textAlign: 'center',
        marginTop: '1.5rem',
    },
    methodImageContainer: {
        height: '80px', 
        width: '100%', 
        overflow: 'hidden', 
        borderRadius: '8px', 
        margin: '0 auto 1rem', 
        backgroundColor: FORM_CARD_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    methodImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
    },
    methodName: { fontSize: '1.4rem', fontWeight: '700', color: GREEN_PRIMARY, marginBottom: '0.5rem' },
    methodDetail: { fontSize: '1rem', color: TEXT_GRAY, marginBottom: '0.75rem', fontWeight: '500' },
    methodNumber: {
        fontSize: '1.1rem',
        color: TEXT_DARK,
        fontWeight: '700',
        background: INPUT_BG,
        padding: '0.75rem',
        borderRadius: '10px',
        marginTop: '1rem',
        wordBreak: 'break-word',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: `1px solid ${BORDER_COLOR}`
    },
    accountOwner: {
        background: 'rgba(16, 185, 129, 0.1)',
        border: `1px solid ${SUCCESS_GREEN}30`,
        borderRadius: '12px',
        padding: '0.75rem',
        marginTop: '1rem'
    },
    ownerText: { color: SUCCESS_GREEN, fontWeight: '600', fontSize: '0.9rem' },
    copyBtn: {
        background: 'rgba(10, 82, 13, 0.1)',
        border: `1px solid ${GREEN_PRIMARY}50`,
        color: GREEN_PRIMARY,
        fontSize: '14px',
        padding: '6px 10px',
        borderRadius: '8px',
        marginLeft: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        flexShrink: 0,
    },

    // Form Fields (Step 3) 
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { color: TEXT_DARK, fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' },
    input: {
      padding: '1rem 1.2rem',
      borderRadius: '12px',
      fontSize: '0.95rem',
      background: INPUT_BG,
      color: TEXT_DARK,
      border: `2px solid ${INPUT_BG}`,
      outline: 'none',
      transition: 'all 0.3s ease',
      fontFamily: 'inherit',
      width: '100%', 
      boxSizing: 'border-box'
    },
    inputFocus: { borderColor: GREEN_PRIMARY, background: INPUT_BG_FILLED, boxShadow: `0 0 0 3px ${GREEN_PRIMARY}20` },
    fileInput: { display: 'none' },
    fileLabel: {
      padding: '1rem 1.2rem',
      borderRadius: '12px',
      background: INPUT_BG,
      color: TEXT_GRAY,
      border: `2px dashed ${TEXT_DARK_GRAY}50`,
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: '500'
    },
    fileLabelHover: { borderColor: GREEN_PRIMARY, color: GREEN_PRIMARY, background: INPUT_BG_FILLED },
    previewContainer: { marginTop: '1rem', textAlign: 'center' },
    previewImage: { maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', border: `2px solid ${BORDER_COLOR}` },

    // Notes
    note: {
      background: 'rgba(245, 158, 11, 0.1)',
      border: `1px solid rgba(245, 158, 11, 0.3)`,
      borderRadius: '12px',
      padding: '1.5rem',
      margin: '1.5rem 0'
    },
    noteTitle: {
      color: PENDING_ORANGE,
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    noteText: {
      color: TEXT_GRAY,
      fontSize: '0.9rem',
      lineHeight: '1.5'
    },

    // Buttons
    actionBtn: {
      background: `linear-gradient(135deg, ${GREEN_PRIMARY} 0%, ${GREEN_DARK} 100%)`,
      color: 'white',
      border: 'none',
      padding: '1.2rem 2rem',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      width: '100%',
      flex: 1,
    },
    actionBtnHover: {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${GREEN_DARK}60`
    },
    actionBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    },
    backBtn: {
        background: INPUT_BG,
        color: TEXT_GRAY,
        border: `1px solid ${TEXT_DARK_GRAY}`,
        padding: '1.2rem 2rem',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        width: isMobile ? '100%' : 'auto',
        flex: 1,
    },
    buttonGroup: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem', 
        flexDirection: isMobile ? 'column' : 'row'
    },

    // Messages
    message: {
      padding: '1rem',
      borderRadius: '12px',
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: '1rem',
    },
    errorMessage: {
      background: 'rgba(239, 68, 68, 0.2)',
      color: ERROR_RED,
      border: `1px solid ${ERROR_RED}50`
    },
    successMessage: {
      background: 'rgba(16, 185, 129, 0.2)',
      color: SUCCESS_GREEN,
      border: `1px solid ${SUCCESS_GREEN}50`
    },

    // History Button
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
    
    // FIX 2: Enhanced History Card Styles - Modern Design
    historyCard: (status) => {
        let color = BORDER_COLOR;
        if (status === 'Approved') color = SUCCESS_GREEN;
        else if (status === 'Pending') color = PENDING_ORANGE;
        else if (status === 'Rejected') color = ERROR_RED;

        return {
            background: `linear-gradient(135deg, ${FORM_CARD_BG} 0%, ${INPUT_BG} 100%)`,
            borderRadius: '20px', 
            padding: isMobile ? '1.5rem' : '1.8rem',
            marginBottom: '1.2rem',
            border: `1px solid ${BORDER_COLOR}`,
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            ':before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                background: color
            }
        };
    },
    historyHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem'
    },
    historyAmount: {
        fontSize: '1.5rem',
        fontWeight: '800',
        color: TEXT_DARK,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flex: 1
    },
    historyStatusBadge: (status) => {
        let color = TEXT_DARK_GRAY;
        let background = INPUT_BG;
        if (status === 'Approved') { color = SUCCESS_GREEN; background = 'rgba(16, 185, 129, 0.15)'; }
        else if (status === 'Pending') { color = PENDING_ORANGE; background = 'rgba(245, 158, 11, 0.15)'; }
        else if (status === 'Rejected') { color = ERROR_RED; background = 'rgba(239, 68, 68, 0.15)'; }
        
        return {
            padding: '0.5rem 1rem',
            borderRadius: '20px', 
            fontWeight: '700',
            fontSize: '0.75rem',
            color: color,
            background: background,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        };
    },
    historyDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        padding: '0.5rem 0'
    },
    historyDetailRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        fontSize: '0.9rem',
        padding: '0.3rem 0'
    },
    historyDetailLabel: {
        fontWeight: '600',
        color: TEXT_DARK,
        minWidth: '70px',
        fontSize: '0.85rem'
    },
    historyDetailValue: {
        color: TEXT_GRAY,
        flex: 1,
        wordBreak: 'break-word'
    },
    historyFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.8rem',
        borderTop: `1px solid ${BORDER_COLOR}`,
        fontSize: '0.8rem',
        color: TEXT_DARK_GRAY
    },
    historyDateTime: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    }
  };

  // --- INLINE KEYFRAMES ---
  const keyframesStyle = `
    @keyframes slideDown {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    body {
        margin: 0;
        background: ${BG_LIGHT};
    }
    .animate-spin {
        animation: spin 1s linear infinite;
    }
  `;

  // --- RENDER FUNCTIONS ---
  const renderStep1 = () => (
    <div style={styles.depositFormSection}>
        <div style={styles.sectionTitle}>
            <span><FaMoneyBillWave style={{color: GREEN_PRIMARY}} /></span> Select Your Amount
        </div>
        
        <div style={styles.amountGrid}>
            {AMOUNT_OPTIONS.map(amount => (
                <div
                    key={amount}
                    onClick={() => handleAmountSelect(amount.toString())}
                    style={{
                        ...styles.amountButton,
                        ...(formData.amount === amount.toString() && styles.amountButtonActive)
                    }}
                >
                    {amount.toLocaleString('en-US')} PKR
                </div>
            ))}
            <div
                onClick={() => handleAmountSelect('')}
                style={{
                    ...styles.amountButton,
                    ...(formData.amount !== '' && !AMOUNT_OPTIONS.includes(Number(formData.amount)) && styles.amountButtonActive)
                }}
            >
                Other
            </div>
        </div>

        {(!AMOUNT_OPTIONS.includes(Number(formData.amount)) || (formData.amount === '' && AMOUNT_OPTIONS.includes(Number(formData.amount)) === false)) && (
            <div style={styles.formGroup}>
                <label style={styles.label}>Enter Custom Amount (Min {MIN_AMOUNT} PKR)</label>
                <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={(e) => handleInputChange({target: {name: 'amount', value: e.target.value}})}
                    style={{...styles.otherAmountInput, ...(focusedField === 'amount' && styles.inputFocus)}}
                    placeholder={`Enter amount (Min ${MIN_AMOUNT})`}
                    onFocus={() => handleFocus('amount')}
                    onBlur={handleBlur}
                    min={MIN_AMOUNT}
                    step="1"
                />
            </div>
        )}

        <div style={styles.buttonGroup}>
            <button
                type="button"
                onClick={handleNext}
                style={{
                    ...styles.actionBtn,
                    ...((loading || !formData.amount || (parseFloat(formData.amount) < MIN_AMOUNT)) && styles.actionBtnDisabled)
                }}
                disabled={loading || !formData.amount || (parseFloat(formData.amount) < MIN_AMOUNT)}
            >
                Next
            </button>
        </div>
    </div>
  );

  const renderStep2 = () => {
    const selectedDetails = getMethodDetails(formData.method);
    const isDetailsLoading = !accountDetails;
    const IconComponent = formData.method ? getMethodDetails(formData.method)?.icon : FaCreditCard;

    return (
      <div style={styles.depositFormSection}>
        <div style={styles.sectionTitle}>
            <span><FaLock style={{color: GREEN_PRIMARY}} /></span> Select Payment Method & Pay
        </div>

        {/* FIX 1: Custom Dropdown for Mobile */}
        <div style={styles.formGroup}>
            <label style={styles.label}>Select Payment Method</label>
            {isMobile ? (
                <div style={styles.customDropdownContainer}>
                    <button
                        type="button"
                        onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                        style={{
                            ...styles.customDropdownButton,
                            ...(focusedField === 'method' && styles.inputFocus)
                        }}
                        onFocus={() => handleFocus('method')}
                        onBlur={handleBlur}
                    >
                        <span>{formData.method || 'Choose Method'}</span>
                        <span>
                            {showMethodDropdown ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                    </button>
                    
                    {showMethodDropdown && (
                        <div style={styles.customDropdownList}>
                            {METHOD_OPTIONS.map(method => (
                                <div
                                    key={method}
                                    onClick={() => handleMethodSelect(method)}
                                    style={{
                                        ...styles.customDropdownItem,
                                        ...(formData.method === method && styles.customDropdownItemHover)
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = INPUT_BG}
                                    onMouseLeave={(e) => e.currentTarget.style.background = FORM_CARD_BG}
                                >
                                    {method}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <select
                    name="method"
                    value={formData.method}
                    onChange={(e) => handleMethodSelect(e.target.value)}
                    style={{
                        ...styles.customDropdownButton,
                        ...(focusedField === 'method' && styles.inputFocus)
                    }}
                    disabled={isDetailsLoading}
                    onFocus={() => handleFocus('method')}
                    onBlur={handleBlur}
                >
                    <option value="">{isDetailsLoading ? 'Loading Methods...' : 'Choose Method'}</option>
                    {!isDetailsLoading && METHOD_OPTIONS.map(method => (
                        <option key={method} value={method}>{method}</option>
                    ))}
                </select>
            )}
        </div>

        {/* Method Details Card */}
        {formData.method && isDetailsLoading && (
            <div style={{textAlign: 'center', marginTop: '1.5rem', color: TEXT_GRAY}}>
                <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: GREEN_PRIMARY}} />
                <p>Fetching Account Details...</p>
            </div>
        )}
        {selectedDetails && !isDetailsLoading && (
            <div style={styles.bankMethodCard}>
                
                <div style={styles.methodImageContainer}>
                    {!selectedDetails.image || selectedDetails.image === 'N/A' ? (
                        <IconComponent style={{fontSize: '3rem', color: GREEN_PRIMARY}} />
                    ) : (
                        <img 
                            src={selectedDetails.image} 
                            alt={formData.method} 
                            style={styles.methodImage} 
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = React.createElement(IconComponent, { style: { fontSize: '3rem', color: GREEN_PRIMARY } }); }}
                        />
                    )}
                </div>

                <div style={styles.methodName}>{formData.method}</div>
                <div style={styles.methodDetail}>{selectedDetails.detail}</div>
                
                <div style={styles.methodNumber}>
                    {selectedDetails.number}
                    <button
                        onClick={() => handleCopy(selectedDetails.number)}
                        style={styles.copyBtn}
                    >
                        <FaCopy /> Copy
                    </button>
                </div>
                
                <div style={styles.accountOwner}>
                    <div style={styles.ownerText}>
                        Account Owner: **{selectedDetails.owner}**
                    </div>
                </div>

                <div style={styles.note}>
                    <div style={styles.noteTitle}><FaExclamationTriangle /> Action Required: Pay Now</div>
                    <div style={styles.noteText}>
                        Please **pay the amount** of **{parseFloat(formData.amount).toLocaleString('en-US')} PKR** to the details above *before* proceeding.
                        You must save the **Transaction ID** and **Screenshot** to submit in the next step.
                    </div>
                </div>
            </div>
        )}

        <div style={styles.buttonGroup}>
            <button type="button" onClick={handleBack} style={styles.backBtn}>
                <FaChevronLeft /> Back
            </button>
            <button
                type="button"
                onClick={handleNext}
                style={{
                    ...styles.actionBtn,
                    ...((loading || !formData.method || isDetailsLoading) && styles.actionBtnDisabled)
                }}
                disabled={loading || !formData.method || isDetailsLoading}
            >
                Next (Enter Proof)
            </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div style={styles.depositFormSection}>
        <div style={styles.sectionTitle}>
            <span><FaCheckCircle style={{color: GREEN_PRIMARY}} /></span> Finalize Details
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.note}>
                <div style={styles.noteTitle}> Deposit Summary</div>
                <div style={styles.noteText}>
                    **Amount:** <span style={{color: GREEN_PRIMARY, fontWeight: '700'}}>{parseFloat(formData.amount).toLocaleString('en-US')} PKR</span>
                    <br/>
                    **Method:** <span style={{color: GREEN_PRIMARY, fontWeight: '700'}}>{formData.method}</span>
                </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction ID / Reference Number *</label>
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleInputChange}
                style={{...styles.input, ...(focusedField === 'transaction_id' && styles.inputFocus)}}
                placeholder="e.g., TPIN123456789"
                onFocus={() => handleFocus('transaction_id')}
                onBlur={handleBlur}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Sending Bank/Method Name *</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                style={{...styles.input, ...(focusedField === 'bank_name' && styles.inputFocus)}}
                placeholder="e.g., UBL, Personal JazzCash"
                onFocus={() => handleFocus('bank_name')}
                onBlur={handleBlur}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Account Owner Name (Sender Name) *</label>
              <input
                type="text"
                name="account_owner"
                value={formData.account_owner}
                onChange={handleInputChange}
                style={{...styles.input, ...(focusedField === 'account_owner' && styles.inputFocus)}}
                placeholder="Your Full Name on the account"
                onFocus={() => handleFocus('account_owner')}
                onBlur={handleBlur}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction Screenshot (Proof of Payment) *</label>
              <input
                type="file"
                id="screenshot"
                onChange={handleFileChange}
                accept="image/*"
                style={styles.fileInput}
                required={!formData.screenshot}
              />
              <label
                htmlFor="screenshot"
                style={{
                    ...styles.fileLabel,
                    ...(hoveredFile && styles.fileLabelHover),
                    ...(formData.screenshot && { borderColor: SUCCESS_GREEN, color: SUCCESS_GREEN, background: 'rgba(16, 185, 129, 0.1)' })
                }}
                onMouseEnter={() => setHoveredFile(true)}
                onMouseLeave={() => setHoveredFile(false)}
              >
                {formData.screenshot ? `File Selected: ${formData.screenshot.name}` : 'Upload Screenshot (Max 5MB)'}
              </label>

              {previewImage && (
                <div style={styles.previewContainer}>
                  <img src={previewImage} alt="Preview" style={styles.previewImage}/>
                </div>
              )}
            </div>

            <div style={styles.buttonGroup}>
                <button type="button" onClick={handleBack} style={styles.backBtn} disabled={loading}>
                    <FaChevronLeft /> Back
                </button>
                <button
                  type="submit"
                  style={{...styles.actionBtn, ...(loading && styles.actionBtnDisabled)}}
                  disabled={loading || !formData.transaction_id || !formData.screenshot}
                >
                  {loading ? <FaSpinner className="animate-spin" style={{marginRight: '0.5rem'}} /> : 'Submit Deposit Request'}
                </button>
            </div>
        </form>
    </div>
  );
  
  const renderStep4 = () => (
      <div style={styles.depositFormSection}>
          <div style={styles.successCard}>
              <div style={styles.successIcon}>🎉</div>
              <h3 style={styles.successTitle}>Deposit Submitted Successfully!</h3>
              <p style={styles.successText}>
                  **Thank you for depositing!** Your payment of **PKR {parseFloat(formData.amount).toLocaleString()}** has been successfully recorded. Your amount will be added to your balance soon after verification by our team.
              </p>
              
              <button
                  onClick={handleGoHome}
                  style={{
                    ...styles.actionBtn,
                    width: isMobile ? '100%' : '60%',
                    marginTop: '0' 
                  }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = styles.actionBtnHover.boxShadow}
                  onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
              >
                  <FaHome /> Go Home
              </button>
          </div>
      </div>
  );

  // FIX 2: Enhanced History Render Function
  const renderHistory = () => (
    <div style={{paddingBottom: '2rem'}}>
        <h2 style={{...styles.pageTitle, marginTop: '0'}}>Deposit History</h2>
        <p style={styles.pageSubtitle}>Review all your past deposit requests and their status.</p>

        <button 
            onClick={() => handleNavigation('Deposit')} 
            style={{...styles.backBtn, marginBottom: '1.5rem', width: isMobile ? '100%' : '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: isMobile ? '0 auto 1.5rem' : '0 auto 1.5rem'}}
        >
            <FaChevronLeft /> Back to Deposit
        </button>

        {loading ? (
             <div style={{textAlign: 'center', padding: '3rem', color: TEXT_GRAY}}>
                <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: GREEN_PRIMARY}} />
                <p>Loading Deposit History...</p>
             </div>
        ) : history.length === 0 ? (
            <div style={{...styles.depositFormSection, textAlign: 'center', padding: '3rem'}}>
                <FaHistory style={{fontSize: '3rem', color: TEXT_GRAY, marginBottom: '1rem'}} />
                <p style={{color: TEXT_DARK}}>No deposit history found.</p>
            </div>
        ) : (
            history.map((item) => {
                const statusIcon = item.status === 'Approved' ? FaCheck : item.status === 'Pending' ? FaHourglassHalf : FaTimes;
                const statusColor = item.status === 'Approved' ? SUCCESS_GREEN : item.status === 'Pending' ? PENDING_ORANGE : ERROR_RED;
                const methodIconComponent = getMethodDetails(item.method)?.icon || FaCreditCard;

                return (
                <div key={item.id} style={styles.historyCard(item.status)}>
                    
                    {/* Header: Amount and Status */}
                    <div style={styles.historyHeader}>
                        <div style={styles.historyAmount}>
                            <FaMoneyBillAlt style={{color: GREEN_PRIMARY, fontSize: '1.4rem'}} />
                            PKR {parseFloat(item.amount).toLocaleString()}
                        </div>
                        <span style={styles.historyStatusBadge(item.status)}>
                            {React.createElement(statusIcon, { style: { color: statusColor, fontSize: '0.8rem' } })}
                            {item.status}
                        </span>
                    </div>

                    {/* Details */}
                    <div style={styles.historyDetails}>
                        <div style={styles.historyDetailRow}>
                            {React.createElement(methodIconComponent, { style: { fontSize: '1rem', color: GREEN_LIGHT } })}
                            <span style={styles.historyDetailLabel}>Method:</span>
                            <span style={styles.historyDetailValue}>{item.method}</span>
                        </div>
                        <div style={styles.historyDetailRow}>
                            <FaReceipt style={{fontSize: '1rem', color: GREEN_LIGHT}} />
                            <span style={styles.historyDetailLabel}>TXN ID:</span>
                            <span style={styles.historyDetailValue}>{item.transaction_id}</span>
                        </div>
                        <div style={styles.historyDetailRow}>
                            <FaUniversity style={{fontSize: '1rem', color: GREEN_LIGHT}} />
                            <span style={styles.historyDetailLabel}>Bank:</span>
                            <span style={styles.historyDetailValue}>{item.bank_name}</span>
                        </div>
                    </div>

                    {/* Footer: Date and Time */}
                    <div style={styles.historyFooter}>
                        <div style={styles.historyDateTime}>
                            <FaRegCalendarAlt style={{fontSize: '0.8rem'}} />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={styles.historyDateTime}>
                            <FaClock style={{fontSize: '0.8rem'}} />
                            <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                        </div>
                    </div>

                </div>
            )}
            )
        )}
    </div>
  );


  const renderStepIndicator = () => {
    const stepsArray = [1, 2, 3];
    return (
      <div style={styles.stepIndicator}>
          {stepsArray.map((s) => (
              <React.Fragment key={s}>
                  <div style={{...styles.stepItem, ...(s <= step && styles.stepItemActive)}}>
                      <div style={{
                          ...styles.stepNumber,
                          ...(s <= step || step === 4 ? styles.stepNumberActive : {})
                      }}>
                          {s}
                      </div>
                      <div style={styles.stepLabel}>
                          {s === 1 ? 'Amount' : s === 2 ? 'Method' : 'Submit'}
                      </div>
                  </div>
                  {s < 3 && <div style={{...styles.stepLine, ...(s < step || step === 4 ? styles.stepLineCompleted : {})}}></div>}
              </React.Fragment>
          ))}
      </div>
    );
  };


  // --- MAIN RENDER LOGIC ---
  if (authLoading) {
    return (
      <div style={styles.container}>
        <style>{keyframesStyle}</style>
        <div style={{textAlign: 'center', paddingTop: '50vh', transform: 'translateY(-50%)'}}>
            <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: GREEN_PRIMARY}} />
            <div style={{color: TEXT_GRAY, fontSize: '16px', fontWeight: '500', marginTop: '10px'}}>
              Loading...
            </div>
        </div>
      </div>
    );
  }

  let content;
  let pageTitle;
  let subtitle;

  if (activeTab === 'History') {
      content = renderHistory();
      pageTitle = "Deposit History";
      subtitle = "";
  } else if (step === 4) {
      content = renderStep4();
      pageTitle = "New Deposit Request";
      subtitle = 'Your request is complete!';
  } else {
      switch (step) {
          case 1:
            content = renderStep1();
            pageTitle = "New Deposit Request";
            subtitle = 'How much do you want to invest?';
            break;
          case 2:
            content = renderStep2();
            pageTitle = "New Deposit Request";
            subtitle = `Complete your payment of PKR ${parseFloat(formData.amount || 0).toLocaleString()}.`;
            break;
          case 3:
            content = renderStep3();
            pageTitle = "New Deposit Request";
            subtitle = 'Submit the transfer proof to finalize your deposit.';
            break;
          default:
            content = renderStep1();
            pageTitle = "New Deposit Request";
            subtitle = 'How much do you want to invest?';
      }
  }


  // --- FINAL RETURN: WRAPPED IN LAYOUT ---
  return (
    <Layout>
      <style>{keyframesStyle}</style>
      
      <main style={styles.mainContent}> 
        <h2 style={styles.pageTitle}>{pageTitle}</h2>
        <p style={styles.pageSubtitle}>{subtitle}</p>

        {/* View History Button */}
        {activeTab === 'Deposit' && (
            <button 
                onClick={() => handleNavigation('History')} 
                style={styles.historyButton}
                onMouseEnter={e => e.currentTarget.style.background = INPUT_BG}
                onMouseLeave={e => e.currentTarget.style.background = FORM_CARD_BG}
            >
                <FaHistory /> View All Deposit History
            </button>
        )}
        
        {/* Messages */}
        {error && <div style={{ ...styles.message, ...styles.errorMessage }}>{error}</div>}
        {message && !error && activeTab === 'Deposit' && step !== 4 && <div style={{ ...styles.message, ...styles.successMessage }}>{message}</div>}
        {message && !error && activeTab === 'History' && !loading && <div style={{ ...styles.message, ...styles.successMessage }}>{message}</div>}


        {/* Step Indicator */}
        {activeTab === 'Deposit' && step !== 4 && renderStepIndicator()}

        {/* Main Content (Steps or History) */}
        {content}

      </main>

    </Layout>
  );
}

export default DepositPage;