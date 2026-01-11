// WithdrawPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';
import Layout from '../components/Layout'; 
import { FaSpinner, FaUniversity, FaMobileAlt, FaWallet, FaArrowRight } from 'react-icons/fa';
import styles from '../css/WithdrawPage.module.css';

// Currency Context Import
import { useCurrency } from '../components/CurrencyContext';

const jwtDecode = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
};

const WITHDRAW_SUBMIT_ENDPOINT = `${BASE_URL}/transactions/withdraw/`;
const ACCOUNTS_API_ENDPOINT = `${BASE_URL}/wallet/admin/account-details/`; // Your New API
const MIN_WITHDRAW_PKR = 1000; 

function WithdrawPage() {
  const navigate = useNavigate();
  const { convert, symbol, currency, convertToPKR } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [step, setStep] = useState(1);
  
  // New state for API methods
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [form, setForm] = useState({
    amount: '',
    method: '', // Initially empty until API loads
    bank_name: '',
    account_owner: '',
    bank_account: ''
  });

  // Fetch Payment Methods from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('accessToken');
        const response = await axios.get(ACCOUNTS_API_ENDPOINT, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPaymentMethods(response.data);
        // Set default selection to the first item if available
        if (response.data.length > 0) {
          setForm(prev => ({ ...prev, method: response.data[0].account_name }));
        }
      } catch (error) {
        console.error("Error fetching payment methods", error);
      }
    };

    const token = sessionStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return; }
    const decodedPayload = jwtDecode(token);
    if (!decodedPayload) { navigate('/login'); return; }
    
    fetchData();
    setAuthLoading(false);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMethodChange = (methodName) => {
      setForm(prev => ({ 
        ...prev, 
        method: methodName, 
        bank_name: '', 
        account_owner: '', 
        bank_account: '' 
      }));
      setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const token = sessionStorage.getItem('accessToken');
    const visualInput = parseFloat(form.amount);
    
    if (isNaN(visualInput) || visualInput <= 0) {
        setMessage({ text: 'Please enter a valid amount.', type: 'error' });
        setLoading(false);
        return;
    }

    const amountInPKR = convertToPKR(form.amount);
    if (isNaN(parseFloat(amountInPKR)) || parseFloat(amountInPKR) <= 0) {
      setMessage({ text: 'Invalid amount conversion.', type: 'error' });
      setLoading(false);
      return;
    }

    const minAmountInSelectedCurrency = convert(MIN_WITHDRAW_PKR);
    if (parseFloat(form.amount) < parseFloat(minAmountInSelectedCurrency)) {
      setMessage({ 
        text: `Minimum withdrawal is ${symbol} ${minAmountInSelectedCurrency}.`, 
        type: 'error' 
      });
      setLoading(false); 
      return;
    }

    try {
        const payload = {
            amount: Number(amountInPKR),
            method: form.method,
            account_owner: form.account_owner.trim(),
            bank_account: form.bank_account.trim(),
            bank_name: form.method // Using the selected account name as bank_name
        };

        await axios.post(WITHDRAW_SUBMIT_ENDPOINT, payload, {
            headers: { 
              'Authorization': `Bearer ${token}`, 
              'Content-Type': 'application/json' 
            }
        });
        
        setStep(3);
    } catch (error) {
        let errorText = 'Withdrawal failed. Please try again.';
        if (error.response?.data?.error) errorText = error.response.data.error;
        setMessage({ text: errorText, type: 'error' });
    } finally { 
      setLoading(false); 
    }
  };

  const isFormValid = useMemo(() => {
    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) return false;
    const minAmountInSelectedCurrency = parseFloat(convert(MIN_WITHDRAW_PKR));
    if (amountNum < minAmountInSelectedCurrency) return false;
    return form.account_owner.trim() !== '' && form.bank_account.trim() !== '';
  }, [form, convert]);

  if (authLoading) return (
    <Layout>
      <div className={styles.authLoadingContainer}><div className={styles.loadingSpinner}></div></div>
    </Layout>
  );

  return (
    <Layout activeTab="withdraw"> 
      <main className={styles.mainContent}> 
            <h2 className={styles.pageTitle}>Withdraw Funds</h2>
            
            {step !== 3 && (
                <div className={styles.stepContainer}>
                    <div style={{width: '32px', height: '32px', borderRadius: '10px', background: step >= 1 ? '#1a0b24' : '#e2e8f0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'}}>1</div>
                    <div className={`${styles.stepLine} ${step > 1 ? styles.stepLineActive : ''}`}></div>
                    <div style={{width: '32px', height: '32px', borderRadius: '10px', background: step >= 2 ? '#1a0b24' : '#e2e8f0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'}}>2</div>
                </div>
            )}

            {step === 1 ? (
                <div className={styles.formCard}>
                    <h3 className={styles.stepTitle}>Select Method</h3>
                    {paymentMethods.map(method => (
                        <div 
                          key={method.id} 
                          className={styles.methodCard} 
                          style={{ 
                            border: form.method === method.account_name ? '2px solid #1a0b24' : '2px solid #f1f5f9', 
                            background: form.method === method.account_name ? '#f8fafc' : 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '1.2rem', 
                            borderRadius: '16px', 
                            marginBottom: '1rem', 
                            cursor: 'pointer' 
                          }}
                          onClick={() => handleMethodChange(method.account_name)}
                        >
                            <div style={{
                              width: '45px',
                              height: '45px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              marginRight: '15px',
                              border: '1px solid #eee',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                                <img 
                                  src={method.account_icon} 
                                  alt={method.account_name} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            </div>
                            <div>
                                <div className={styles.methodName} style={{ textTransform: 'capitalize' }}>{method.account_name}</div>
                                <div className={styles.methodDetails}>Transfer to your {method.account_name} account</div>
                            </div>
                        </div>
                    ))}
                    <button 
                      className={styles.primaryButton} 
                      onClick={() => setStep(2)}
                      disabled={paymentMethods.length === 0}
                    >
                      Next Step <FaArrowRight />
                    </button>
                </div>
            ) : step === 2 ? (
                <form onSubmit={handleSubmit} className={styles.formCard}>
                    <h3 className={styles.stepTitle}>{form.method} Details</h3>
                    {message.text && (
                        <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1rem', textAlign: 'center', background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', color: message.type === 'error' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                            {message.text}
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                          Amount ({symbol})
                          <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                            (Min {symbol} {convert(MIN_WITHDRAW_PKR)})
                          </span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800' }}>{symbol}</span>
                            <input type="number" name="amount" step="any" value={form.amount} onChange={handleChange} placeholder={`Enter amount in ${currency}`} required className={styles.input} style={{ paddingLeft: '45px' }} />
                        </div>
                        {/* <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', textAlign: 'right' }}>
                          ~{convertToPKR(form.amount || 0)} PKR
                        </div> */}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Account Owner Name</label>
                        <input type="text" name="account_owner" value={form.account_owner} onChange={handleChange} placeholder="Account Holder Name" required className={styles.input} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Account Number / ID</label>
                        <input type="text" name="bank_account" value={form.bank_account} onChange={handleChange} placeholder={`Enter your ${form.method} address/number`} required className={styles.input} />
                    </div>

                    <div className={styles.buttonGroup} style={{display: 'flex', gap: '10px', marginTop: '2rem'}}>
                        <button type="button" className={styles.backButton} onClick={() => setStep(1)}>Back</button>
                        <button type="submit" disabled={loading || !isFormValid} className={styles.primaryButton} style={{flex: 2}}>
                          {loading ? <><FaSpinner className="animate-spin" style={{marginRight: '0.5rem'}} />Processing...</> : `Withdraw Now`}
                        </button>
                    </div>
                </form>
            ) : (
                <div className={styles.successScreen}>
                    <div className={styles.successIcon}>🚀</div>
                    <h2 className={styles.successTitle}>Withdrawal Submitted!</h2>
                    <p className={styles.successMessage}>
                        Amount: <strong style={{color: '#1a0b24'}}>{symbol} {form.amount}</strong><br />
                        Method: <strong style={{color: '#1a0b24'}}>{form.method}</strong><br /><br />
                        Your withdrawal request has been submitted successfully. Expect funds within 24 hours.
                    </p>
                    <button className={styles.primaryButton} onClick={() => navigate('/')}>Go to Dashboard</button>
                </div>
            )}
      </main>
    </Layout>
  );
}

export default WithdrawPage;