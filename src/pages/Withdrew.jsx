// WithdrawPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/baseURL';
import Layout from '../components/Layout'; 
import { 
    FaHistory, FaChevronLeft, FaSpinner, 
    FaUniversity, FaMobileAlt, FaWallet,
    FaCheckCircle, FaArrowRight
} from 'react-icons/fa';
import styles from '../css/WithdrawPage.module.css';

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

const removeTokens = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
};

const WITHDRAW_SUBMIT_ENDPOINT = `${BASE_URL}/transactions/withdraw/`;

function WithdrawPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [windowWidth] = useState(window.innerWidth);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    amount: '',
    method: 'BankTransfer', 
    bank_name: '',
    account_owner: '',
    bank_account: ''
  });

  const paymentMethods = useMemo(() => [
    { id: 'BankTransfer', name: 'Bank Transfer', icon: FaUniversity, details: 'Bank Name, IBAN/Acc' },
    { id: 'JazzCash', name: 'JazzCash', icon: FaMobileAlt, details: 'Phone Number' },
    { id: 'EasyPaisa', name: 'EasyPaisa', icon: FaWallet, details: 'Phone Number' },
  ], []);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return; }
    const decodedPayload = jwtDecode(token);
    if (!decodedPayload) { removeTokens(); navigate('/login'); return; }
    setAuthLoading(false);
  }, [navigate]);

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
  };

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
             setMessage({ text: 'Minimum amount is 100 PKR.', type: 'error' });
             setLoading(false); return;
        }

        const response = await axios.post(WITHDRAW_SUBMIT_ENDPOINT, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        setStep(3); 
    } catch (error) {
        let errorText = 'Withdrawal failed. Try again.';
        if (error.response?.data?.error) errorText = error.response.data.error;
        setMessage({ text: errorText, type: 'error' });
    } finally { setLoading(false); }
  };

  const renderStep1 = () => (
    <div className={styles.formCard}>
      <h3 className={styles.stepTitle}>Select Method</h3>
      {paymentMethods.map(method => {
        const IconComponent = method.icon;
        const isSelected = form.method === method.id;
        return (
            <div
              key={method.id}
              className={styles.methodCard}
              style={{
                  display: 'flex', alignItems: 'center', padding: '1.2rem', borderRadius: '16px', marginBottom: '1rem', cursor: 'pointer', transition: '0.3s',
                  border: isSelected ? '2px solid #1a0b24' : '2px solid #f1f5f9',
                  background: isSelected ? '#f8fafc' : 'white'
              }}
              onClick={() => handleMethodChange(method.id)}
            >
              <span className={styles.methodIcon}><IconComponent /></span>
              <div>
                <div className={styles.methodName}>{method.name}</div>
                <div className={styles.methodDetails}>{method.details}</div>
              </div>
            </div>
        );
      })}

      <button className={styles.primaryButton} onClick={() => setStep(2)} style={{marginTop: '1rem'}}>
        Next Step <FaArrowRight style={{marginLeft: '8px', fontSize: '14px'}} />
      </button>
    </div>
  );

  const renderStep2 = () => {
    const selectedMethod = paymentMethods.find(m => m.id === form.method);
    const amountNum = parseFloat(form.amount);
    const isAmountValid = amountNum >= 100 && !isNaN(amountNum);
    const isFormValid = isAmountValid && form.account_owner && form.bank_account && (form.method !== 'BankTransfer' || form.bank_name);

    return (
        <form onSubmit={handleSubmit} className={styles.formCard}>
            <h3 className={styles.stepTitle}>{selectedMethod?.name} Details</h3>

            {message.text && (
                <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'center', background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', color: message.type === 'error' ? '#ef4444' : '#10b981' }}>
                    {message.text}
                </div>
            )}

            <div className={styles.formGroup}>
                <label className={styles.label}>Withdrawal Amount</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="Min 100 PKR" required className={styles.input} />
            </div>

            {form.method === 'BankTransfer' && (
                <div className={styles.formGroup}>
                    <label className={styles.label}>Bank Name</label>
                    <input type="text" name="bank_name" value={form.bank_name} onChange={handleChange} placeholder="e.g., HBL, Meezan" required className={styles.input} />
                </div>
            )}

            <div className={styles.formGroup}>
                <label className={styles.label}>Account Holder Name</label>
                <input type="text" name="account_owner" value={form.account_owner} onChange={handleChange} placeholder="Full Name" required className={styles.input} />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>{form.method === 'BankTransfer' ? 'IBAN / Account Number' : 'Phone Number'}</label>
                <input type="text" name="bank_account" value={form.bank_account} onChange={handleChange} placeholder={form.method === 'BankTransfer' ? 'PK...' : '03...'} required className={styles.input} />
            </div>

            <div className={styles.buttonGroup} style={{display: 'flex', gap: '10px', marginTop: '2rem'}}>
                <button type="button" className={styles.backButton} onClick={() => setStep(1)}>Back</button>
                <button type="submit" disabled={loading || !isFormValid} className={`${styles.primaryButton} ${loading || !isFormValid ? styles.buttonDisabled : ''}`} style={{flex: 2}}>
                    {loading ? <FaSpinner className="animate-spin" /> : `Withdraw Now`}
                </button>
            </div>
        </form>
    );
  };

  const renderStep3 = () => (
    <div className={styles.successScreen}>
        <div className={styles.successIcon}>🚀</div>
        <h2 className={styles.successTitle}>Request Submitted!</h2>
        <p className={styles.successMessage}>
            We have received your withdrawal request for <strong>PKR {parseFloat(form.amount).toLocaleString()}</strong>.
            <br />Expect funds in your account within <strong>24 working hours</strong>.
        </p>
        <button className={styles.primaryButton} onClick={() => navigate('/')}>
            Back to Dashboard
        </button>
    </div>
  );

  if (authLoading) return (
    <div className={styles.authLoadingContainer}><div className={styles.loadingSpinner}></div></div>
  );

  return (
    <Layout activeTab="withdraw"> 
      <main className={styles.mainContent}> 
            <h2 className={styles.pageTitle}>Withdraw Funds</h2>
            <p className={styles.pageSubtitle}>
              {step === 3 ? "Process initiated successfully" : "Securely withdraw your earnings"}
            </p>
            
            {step !== 3 && (
                <div className={styles.stepContainer}>
                    <div style={{width: '32px', height: '32px', borderRadius: '10px', background: step >= 1 ? '#1a0b24' : '#e2e8f0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'}}>1</div>
                    <div className={`${styles.stepLine} ${step > 1 ? styles.stepLineActive : ''}`}></div>
                    <div style={{width: '32px', height: '32px', borderRadius: '10px', background: step >= 2 ? '#1a0b24' : '#e2e8f0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'}}>2</div>
                </div>
            )}

            {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
      </main>
    </Layout>
  );
}

export default WithdrawPage;