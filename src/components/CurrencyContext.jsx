import React, { createContext, useState, useEffect, useContext } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(localStorage.getItem('app_currency') || 'USDT');
    const [symbol, setSymbol] = useState(localStorage.getItem('app_symbol') || 'USDT');
    
    // Default rates (Starting rates)
    const [rates, setRates] = useState({ 
        PKR: 1, 
        USDT: 0.0036, 
        TRX: 0.018 
    });

    const symbols = { 
        PKR: 'Rs', 
        USDT: '₮', 
        TRX: 'TRX' 
    };

    useEffect(() => {
        const fetchAllRates = async () => {
            try {
                // 1. Fiat API (USD ke liye)
                const fiatRes = await fetch('https://open.er-api.com/v6/latest/PKR');
                const fiatData = await fiatRes.json();
                
                // 2. Crypto API (TRX ke liye)
                const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=pkr');
                const cryptoData = await cryptoRes.json();

                if (fiatData && fiatData.rates && cryptoData) {
                    const pkrToUsd = fiatData.rates.USD;
                    
                    // TRX rate conversion logic
                    const trxPriceInPkr = cryptoData.tron.pkr;
                    const pkrToTrx = 1 / trxPriceInPkr;

                    const newRates = {
                        PKR: 1,
                        USDT: pkrToUsd,
                        TRX: pkrToTrx
                    };

                    setRates(newRates);
                    console.log("✅ Live Rates Updated:", newRates);
                }
            } catch (error) {
                console.error("❌ API Fetch Error:", error);
            }
        };

        fetchAllRates();
    }, []);

    const changeCurrency = (newCurrency) => {
        setCurrency(newCurrency);
        const newSymbol = symbols[newCurrency] || '';
        setSymbol(newSymbol);
        localStorage.setItem('app_currency', newCurrency);
        localStorage.setItem('app_symbol', newSymbol);
    };

    const convert = (pkrAmount) => {
        if (!pkrAmount || isNaN(parseFloat(pkrAmount))) return '0.00';
        const amount = parseFloat(pkrAmount);
        const rate = rates[currency] || 1;
        return (amount * rate).toFixed(2);
    };

    const getRateToPKR = () => {
        const rate = rates[currency];
        return (!rate || rate === 0) ? 1 : 1 / rate;
    };

    const convertToPKR = (amountInSelectedCurrency) => {
        if (!amountInSelectedCurrency || isNaN(parseFloat(amountInSelectedCurrency))) return '0.00';
        const amount = parseFloat(amountInSelectedCurrency);
        if (currency === 'PKR') return amount.toFixed(2);
        const rateFromPKR = rates[currency];
        return (!rateFromPKR || rateFromPKR === 0) ? amount.toFixed(2) : (amount / rateFromPKR).toFixed(2);
    };

    const convertFromSelectedToPKR = (amount) => {
        return convertToPKR(amount);
    };

    return (
        <CurrencyContext.Provider value={{ 
            currency, symbol, changeCurrency, convert, getRateToPKR, convertToPKR, convertFromSelectedToPKR, rates 
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);