// DepositPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
    FaMoneyBillWave, FaHistory, FaChevronLeft, FaLock, FaCopy, 
    FaCheckCircle, FaExclamationTriangle, FaHome, FaSpinner, 
    FaReceipt, FaClock, FaRegCalendarAlt, FaMoneyBillAlt, 
    FaMobileAlt, FaUniversity, FaCreditCard, FaCheck, 
    FaTimes, FaHourglassHalf, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import BASE_URL, { removeTokens } from '../api/baseURL';
import {
    decodeJwt,
    MIN_AMOUNT,
    AMOUNT_OPTIONS,
    METHOD_OPTIONS,
    ACCOUNT_DETAILS_ENDPOINT,
    DEPOSIT_SUBMIT_ENDPOINT,
    validateStep1,
    validateStep2,
    validateStep3,
    getMethodDetails,
    validateFile,
    handleApiError
} from './DepositPage.helpers';
import '../css/DepositPage.css';

// Initial form state
const initialFormData = {
    amount: '',
    method: '',
    transaction_id: '',
    bank_name: '',
    account_owner: '',
    screenshot: null
};

function DepositPage() {
    const navigate = useNavigate();
    
    // State Management
    const [step, setStep] = useState(1);
    const [authLoading, setAuthLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [accountDetails, setAccountDetails] = useState(null);
    
    // UI States
    const [formData, setFormData] = useState(initialFormData);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [previewImage, setPreviewImage] = useState('');
    const [showMethodDropdown, setShowMethodDropdown] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [hoveredFile, setHoveredFile] = useState(false);
    const [windowWidth] = useState(window.innerWidth);

    const isMobile = windowWidth <= 768;

    // API Functions
    const fetchAccountDetails = useCallback(async () => {
        const token = sessionStorage.getItem('accessToken');
        if (!token) return;

        try {
            const res = await axios.get(ACCOUNT_DETAILS_ENDPOINT(BASE_URL), { 
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
    }, []);

    // Effects
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
    }, [navigate, fetchAccountDetails]);

    // Event Handlers
    const handleFocus = (field) => setFocusedField(field);
    const handleBlur = () => setFocusedField(null);

    const handleAmountSelect = (amount) => {
        setFormData(prev => ({ ...prev, amount: amount.toString() }));
        setError('');
    };

    const handleMethodSelect = (method) => {
        setFormData(prev => ({ ...prev, method }));
        setShowMethodDropdown(false);
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setError('');
        
        const fileError = validateFile(file);
        if (fileError) {
            setError(fileError);
            return;
        }
        
        if (file) {
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
            const validationError = validateStep1(formData.amount);
            if (validationError) {
                setError(validationError);
                return;
            }
            setStep(2);
        } else if (step === 2) {
            const validationError = validateStep2(formData.method);
            if (validationError) {
                setError(validationError);
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        const validationError = validateStep3(formData);
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            const token = sessionStorage.getItem('accessToken');
            const submitData = new FormData();
            
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    submitData.append(key, formData[key]);
                }
            });

            await axios.post(
                DEPOSIT_SUBMIT_ENDPOINT(BASE_URL),
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
            
            // Reset form data but keep amount and method for success message
            setFormData(prev => ({
                ...prev,
                transaction_id: '',
                bank_name: '',
                account_owner: '',
                screenshot: null
            }));
            setPreviewImage('');
            
        } catch (err) {
            const { error: apiError, shouldLogout } = handleApiError(err, navigate);
            setError(apiError);
            
            if (shouldLogout) {
                removeTokens();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = () => {
        navigate('/deposit/history');
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setMessage('Copied to clipboard! ✅');
        setTimeout(() => setMessage(''), 2000);
    };

    // Render Functions
    const renderStep1 = () => (
        <div className="deposit-form-section">
            <div className="deposit-section-title">
                <span><FaMoneyBillWave style={{color: 'var(--green-primary)'}} /></span> Select Your Amount
            </div>
            
            <div className="deposit-amount-grid">
                {AMOUNT_OPTIONS.map(amount => (
                    <div
                        key={amount}
                        onClick={() => handleAmountSelect(amount)}
                        className={`deposit-amount-button ${formData.amount === amount.toString() ? 'deposit-amount-button-active' : ''}`}
                    >
                        {amount.toLocaleString('en-US')} PKR
                    </div>
                ))}
                <div
                    onClick={() => handleAmountSelect('')}
                    className={`deposit-amount-button ${!AMOUNT_OPTIONS.includes(Number(formData.amount)) && formData.amount !== '' ? 'deposit-amount-button-active' : ''}`}
                >
                    Other
                </div>
            </div>

            {(!AMOUNT_OPTIONS.includes(Number(formData.amount)) || formData.amount === '') && (
                <div className="deposit-form-group">
                    <label className="deposit-label">Enter Custom Amount (Min {MIN_AMOUNT} PKR)</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={(e) => handleInputChange({target: {name: 'amount', value: e.target.value}})}
                        className="deposit-other-amount-input"
                        style={focusedField === 'amount' ? {
                            borderColor: 'var(--green-primary)',
                            background: 'var(--input-bg-filled)',
                            boxShadow: '0 0 0 3px rgba(10, 82, 13, 0.2)'
                        } : {}}
                        placeholder={`Enter amount (Min ${MIN_AMOUNT})`}
                        onFocus={() => handleFocus('amount')}
                        onBlur={handleBlur}
                        min={MIN_AMOUNT}
                        step="1"
                    />
                </div>
            )}

            <div className="deposit-button-group">
                <button
                    type="button"
                    onClick={handleNext}
                    className="deposit-action-btn"
                    disabled={loading || !formData.amount || (parseFloat(formData.amount) < MIN_AMOUNT)}
                >
                    Next
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => {
        const selectedDetails = getMethodDetails(formData.method, accountDetails);
        const isDetailsLoading = !accountDetails;
        const methodIcon = formData.method === 'JazzCash' || formData.method === 'Easypaisa' 
            ? FaMobileAlt 
            : formData.method === 'BankTransfer' 
            ? FaUniversity 
            : FaCreditCard;

        return (
            <div className="deposit-form-section">
                <div className="deposit-section-title">
                    <span><FaLock style={{color: 'var(--green-primary)'}} /></span> Select Payment Method & Pay
                </div>

                <div className="deposit-form-group">
                    <label className="deposit-label">Select Payment Method</label>
                    {isMobile ? (
                        <div className="deposit-custom-dropdown-container">
                            <button
                                type="button"
                                onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                                className="deposit-custom-dropdown-button"
                                style={focusedField === 'method' ? {
                                    borderColor: 'var(--green-primary)',
                                    background: 'var(--input-bg-filled)',
                                    boxShadow: '0 0 0 3px rgba(10, 82, 13, 0.2)'
                                } : {}}
                                onFocus={() => handleFocus('method')}
                                onBlur={handleBlur}
                            >
                                <span>{formData.method || 'Choose Method'}</span>
                                <span>
                                    {showMethodDropdown ? <FaChevronUp /> : <FaChevronDown />}
                                </span>
                            </button>
                            
                            {showMethodDropdown && (
                                <div className="deposit-custom-dropdown-list">
                                    {METHOD_OPTIONS.map(method => (
                                        <div
                                            key={method}
                                            onClick={() => handleMethodSelect(method)}
                                            className="deposit-custom-dropdown-item"
                                            style={formData.method === method ? {
                                                background: 'var(--input-bg)',
                                                color: 'var(--green-primary)'
                                            } : {}}
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
                            className="deposit-custom-dropdown-button"
                            style={focusedField === 'method' ? {
                                borderColor: 'var(--green-primary)',
                                background: 'var(--input-bg-filled)',
                                boxShadow: '0 0 0 3px rgba(10, 82, 13, 0.2)'
                            } : {}}
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

                {formData.method && isDetailsLoading && (
                    <div style={{textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-gray)'}}>
                        <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: 'var(--green-primary)'}} />
                        <p>Fetching Account Details...</p>
                    </div>
                )}
                
                {selectedDetails && !isDetailsLoading && (
                    <div className="deposit-bank-method-card">
                        <div className="deposit-method-image-container">
                            {!selectedDetails.image || selectedDetails.image === 'N/A' ? (
                                <FaCreditCard style={{fontSize: '3rem', color: 'var(--green-primary)'}} />
                            ) : (
                                <img 
                                    src={selectedDetails.image} 
                                    alt={formData.method} 
                                    className="deposit-method-image"
                                    onError={(e) => { 
                                        e.target.style.display = 'none'; 
                                        const parent = e.target.parentElement;
                                        parent.innerHTML = `<FaCreditCard style="font-size: 3rem; color: var(--green-primary)" />`;
                                    }}
                                />
                            )}
                        </div>

                        <div className="deposit-method-name">{formData.method}</div>
                        <div className="deposit-method-detail">{selectedDetails.detail}</div>
                        
                        <div className="deposit-method-number">
                            {selectedDetails.number}
                            <button
                                onClick={() => handleCopy(selectedDetails.number)}
                                className="deposit-copy-btn"
                            >
                                <FaCopy /> Copy
                            </button>
                        </div>
                        
                        <div className="deposit-account-owner">
                            <div className="deposit-owner-text">
                                Account Owner: **{selectedDetails.owner}**
                            </div>
                        </div>

                        <div className="deposit-note">
                            <div className="deposit-note-title">
                                <FaExclamationTriangle /> Action Required: Pay Now
                            </div>
                            <div className="deposit-note-text">
                                Please **pay the amount** of **{parseFloat(formData.amount).toLocaleString('en-US')} PKR** to the details above *before* proceeding.
                                You must save the **Transaction ID** and **Screenshot** to submit in the next step.
                            </div>
                        </div>
                    </div>
                )}

                <div className="deposit-button-group">
                    <button type="button" onClick={handleBack} className="deposit-back-btn">
                        <FaChevronLeft /> Back
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="deposit-action-btn"
                        disabled={loading || !formData.method || isDetailsLoading}
                    >
                        Next (Enter Proof)
                    </button>
                </div>
            </div>
        );
    };

    const renderStep3 = () => (
        <div className="deposit-form-section">
            <div className="deposit-section-title">
                <span><FaCheckCircle style={{color: 'var(--green-primary)'}} /></span> Finalize Details
            </div>

            <form onSubmit={handleSubmit} className="deposit-form">
                <div className="deposit-note">
                    <div className="deposit-note-title">Deposit Summary</div>
                    <div className="deposit-note-text">
                        **Amount:** <span style={{color: 'var(--green-primary)', fontWeight: '700'}}>
                            {parseFloat(formData.amount).toLocaleString('en-US')} PKR
                        </span>
                        <br/>
                        **Method:** <span style={{color: 'var(--green-primary)', fontWeight: '700'}}>
                            {formData.method}
                        </span>
                    </div>
                </div>

                <div className="deposit-form-group">
                    <label className="deposit-label">Transaction ID / Reference Number *</label>
                    <input
                        type="text"
                        name="transaction_id"
                        value={formData.transaction_id}
                        onChange={handleInputChange}
                        className="deposit-input"
                        style={focusedField === 'transaction_id' ? {
                            borderColor: 'var(--green-primary)',
                            background: 'var(--input-bg-filled)',
                            boxShadow: '0 0 0 3px rgba(10, 82, 13, 0.2)'
                        } : {}}
                        placeholder="e.g., TPIN123456789"
                        onFocus={() => handleFocus('transaction_id')}
                        onBlur={handleBlur}
                        required
                    />
                </div>

                <div className="deposit-form-group">
                    <label className="deposit-label">Your Sending Bank/Method Name *</label>
                    <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        className="deposit-input"
                        style={focusedField === 'bank_name' ? {
                            borderColor: 'var(--green-primary)',
                            background: 'var(--input-bg-filled)',
                            boxShadow: '0 0 0 3px rgba(10, 82, 13, 0.2)'
                        } : {}}
                        placeholder="e.g., UBL, Personal JazzCash"
                        onFocus={() => handleFocus('bank_name')}
                        onBlur={handleBlur}
                        required
                    />
                </div>

                <div className="deposit-form-group">
                    <label className="deposit-label">Your Account Owner Name (Sender Name) *</label>
                    <input
                        type="text"
                        name="account_owner"
                        value={formData.account_owner}
                        onChange={handleInputChange}
                        className="deposit-input"
                        style={focusedField === 'account_owner' ? {
                            borderColor: 'var(--green-primary)',
                            background: 'var(--input-bg-filled)',
                            boxShadow: '0 0 0 3px rgba(10, 82, 13, 0.2)'
                        } : {}}
                        placeholder="Your Full Name on the account"
                        onFocus={() => handleFocus('account_owner')}
                        onBlur={handleBlur}
                        required
                    />
                </div>

                <div className="deposit-form-group">
                    <label className="deposit-label">Transaction Screenshot (Proof of Payment) *</label>
                    <input
                        type="file"
                        id="screenshot"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="deposit-file-input"
                        required={!formData.screenshot}
                    />
                    <label
                        htmlFor="screenshot"
                        className={`deposit-file-label ${formData.screenshot ? 'deposit-file-label-selected' : ''} ${hoveredFile ? 'deposit-file-label-hover' : ''}`}
                        onMouseEnter={() => setHoveredFile(true)}
                        onMouseLeave={() => setHoveredFile(false)}
                    >
                        {formData.screenshot ? `File Selected: ${formData.screenshot.name}` : 'Upload Screenshot (Max 5MB)'}
                    </label>

                    {previewImage && (
                        <div className="deposit-preview-container">
                            <img src={previewImage} alt="Preview" className="deposit-preview-image"/>
                        </div>
                    )}
                </div>

                <div className="deposit-button-group">
                    <button type="button" onClick={handleBack} className="deposit-back-btn" disabled={loading}>
                        <FaChevronLeft /> Back
                    </button>
                    <button
                        type="submit"
                        className="deposit-action-btn"
                        disabled={loading || !formData.transaction_id || !formData.screenshot}
                    >
                        {loading ? <FaSpinner className="animate-spin" style={{marginRight: '0.5rem'}} /> : null}
                        Submit Deposit Request
                    </button>
                </div>
            </form>
        </div>
    );

    const renderStep4 = () => (
        <div className="deposit-form-section">
            <div className="deposit-success-card">
                <div className="deposit-success-icon">🎉</div>
                <h3 className="deposit-success-title">Deposit Submitted Successfully!</h3>
                <p className="deposit-success-text">
                    **Thank you for depositing!** Your payment of **PKR {parseFloat(formData.amount).toLocaleString()}** has been successfully recorded. 
                    Your amount will be added to your balance soon after verification by our team.
                </p>
                
                <button
                    onClick={handleGoHome}
                    className="deposit-action-btn"
                    style={{ width: isMobile ? '100%' : '60%', marginTop: '0' }}
                >
                    <FaHome /> Go Home
                </button>
            </div>
        </div>
    );

    const renderStepIndicator = () => {
        const steps = [
            { number: 1, label: 'Amount' },
            { number: 2, label: 'Method' },
            { number: 3, label: 'Submit' }
        ];

        return (
            <div className="deposit-step-indicator">
                {steps.map((stepItem, index) => (
                    <React.Fragment key={stepItem.number}>
                        <div className={`deposit-step-item ${stepItem.number <= step ? 'deposit-step-item-active' : ''}`}>
                            <div className={`deposit-step-number ${stepItem.number <= step || step === 4 ? 'deposit-step-number-active' : ''}`}>
                                {stepItem.number}
                            </div>
                            <div className="deposit-step-label">{stepItem.label}</div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`deposit-step-line ${stepItem.number < step || step === 4 ? 'deposit-step-line-completed' : ''}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Main render logic
    if (authLoading) {
        return (
            <Layout>
                <div className="deposit-container">
                    <div className="deposit-loading-container">
                        <FaSpinner className="animate-spin" style={{fontSize: '2rem', color: 'var(--green-primary)'}} />
                        <div className="deposit-loading-text">Loading...</div>
                    </div>
                </div>
            </Layout>
        );
    }

    let content;
    let subtitle;

    if (step === 4) {
        content = renderStep4();
        subtitle = 'Your request is complete!';
    } else {
        switch (step) {
            case 1:
                content = renderStep1();
                subtitle = 'How much do you want to invest?';
                break;
            case 2:
                content = renderStep2();
                subtitle = `Complete your payment of PKR ${parseFloat(formData.amount || 0).toLocaleString()}.`;
                break;
            case 3:
                content = renderStep3();
                subtitle = 'Submit the transfer proof to finalize your deposit.';
                break;
            default:
                content = renderStep1();
                subtitle = 'How much do you want to invest?';
        }
    }

    return (
        <Layout>
            <main className="deposit-main-content"> 
                <h2 className="deposit-page-title">New Deposit Request</h2>
                <p className="deposit-page-subtitle">{subtitle}</p>

                {/* <button 
                    onClick={handleViewHistory} 
                    className="deposit-history-button"
                >
                    <FaHistory /> View Deposit History
                </button> */}
                
                {error && <div className="deposit-message deposit-error-message">{error}</div>}
                {message && !error && step !== 4 && (
                    <div className="deposit-message deposit-success-message">{message}</div>
                )}

                {step !== 4 && renderStepIndicator()}

                {content}
            </main>
        </Layout>
    );
}

export default DepositPage;