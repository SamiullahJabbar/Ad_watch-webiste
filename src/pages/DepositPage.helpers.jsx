// DepositPage.helpers.js

// ----------------------------------------------------------------
// JWT DECODE FUNCTION (Helper function)
// ----------------------------------------------------------------
export const decodeJwt = (token) => {
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

// --- Constants ---
export const MIN_AMOUNT = 3000;
export const AMOUNT_OPTIONS = [3000, 5000, 10000];
export const METHOD_OPTIONS = ['JazzCash', 'Easypaisa', 'BankTransfer'];

// --- API Endpoints ---
export const ACCOUNT_DETAILS_ENDPOINT = (BASE_URL) => `${BASE_URL}/wallet/admin/account-details/`;
export const DEPOSIT_SUBMIT_ENDPOINT = (BASE_URL) => `${BASE_URL}/transactions/deposit/`;
export const DEPOSIT_HISTORY_ENDPOINT = (BASE_URL) => `${BASE_URL}/transactions/deposit/history/`;

// --- Form Validation ---
export const validateStep1 = (amount) => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < MIN_AMOUNT) {
        return `Amount must be at least ${MIN_AMOUNT} PKR.`;
    }
    return null;
};

export const validateStep2 = (method) => {
    if (!method) {
        return 'Please select a payment method.';
    }
    return null;
};

export const validateStep3 = (formData) => {
    const { transaction_id, bank_name, account_owner, screenshot } = formData;
    if (!transaction_id || !bank_name || !account_owner || !screenshot) {
        return 'All fields are required.';
    }
    return null;
};

// --- Method Details Helper ---
export const getMethodDetails = (method, accountDetails) => {
    if (!accountDetails) return { 
        number: 'Loading...', 
        owner: 'Loading...', 
        image: null, 
        detail: 'Loading...',
        icon: null 
    };

    const baseDetails = {
        owner: accountDetails.owner_name || 'N/A',
        icon: null
    };

    switch (method) {
        case 'JazzCash':
            return {
                ...baseDetails,
                number: accountDetails.jazzcash_number || 'N/A',
                image: accountDetails.jazzcash_image,
                detail: 'Send to JazzCash Number',
            };
        case 'Easypaisa':
            return {
                ...baseDetails,
                number: accountDetails.easypaisa_number || 'N/A',
                image: accountDetails.easypaisa_image,
                detail: 'Send to EasyPaisa Number',
            };
        case 'BankTransfer':
            return {
                ...baseDetails,
                number: accountDetails.bank_account || 'N/A',
                image: accountDetails.bank_image,
                detail: `Bank: ${accountDetails.bank_name || 'N/A'}`,
            };
        default:
            return null;
    }
};

// --- File Validation ---
export const validateFile = (file) => {
    if (!file) return null;
    
    if (file.size > 5 * 1024 * 1024) {
        return 'Image size should be less than 5MB';
    }
    
    if (!file.type.startsWith('image/')) {
        return 'Please upload an image file';
    }
    
    return null;
};

// --- Error Handling ---
export const handleApiError = (error, navigate) => {
    if (error.response) {
        const errorData = error.response.data;
        const status = error.response.status;

        switch (status) {
            case 401:
                return {
                    error: 'Session expired. Please login again.',
                    shouldLogout: true
                };
            case 400:
                if (errorData.transaction_id) {
                    return { error: 'This transaction ID already exists or is invalid.' };
                } else if (errorData.error) {
                    return { error: errorData.error };
                } else if (errorData.bank_name || errorData.account_owner || errorData.amount) {
                    return { error: 'Please check all fields. Some input is invalid.' };
                } else {
                    return { error: 'API failed. Please check your data.' };
                }
            default:
                return { error: 'An unexpected error occurred. Please try again.' };
        }
    } else {
        return { error: 'Network error. Please check your connection.' };
    }
};