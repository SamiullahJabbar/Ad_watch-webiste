import React from 'react';
import { useCurrency } from './CurrencyContext';

const CurrencyDropdown = () => {
    const { currency, changeCurrency } = useCurrency();

    return (
        <div className="currency-selector">
            <select 
                value={currency} 
                onChange={(e) => changeCurrency(e.target.value)}
                style={{ 
                    padding: '8px', 
                    borderRadius: '6px', 
                    border: '1px solid #ccc',
                    cursor: 'pointer'
                }}
            >
                <option value="PKR">PKR (Rs)</option>
                <option value="USDT">USDT (₮)</option>
                <option value="TRX">TRX (TRX)</option>
            </select>
        </div>
    );
};

export default CurrencyDropdown;