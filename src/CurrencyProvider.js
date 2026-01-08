import React, { createContext, useContext, useEffect, useState } from "react";

// 1️⃣ Create Context
const CurrencyContext = createContext();

// 2️⃣ Provider component
export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("USD"); // default USD
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRates = async () => {
      // Safe read from localStorage
      const savedRates = localStorage.getItem("rates");

      if (savedRates && savedRates !== "undefined") {
        try {
          setRates(JSON.parse(savedRates));
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem("rates");
        }
      }

      // Fetch from free API
      try {
        const res = await fetch("https://api.exchangerate.host/latest?base=PKR");
        const data = await res.json();
        if (data && data.rates) {
          setRates(data.rates);
          localStorage.setItem("rates", JSON.stringify(data.rates));
        }
      } catch (e) {
        console.error("Currency API fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    loadRates();
  }, []);

  // Convert PKR price to selected currency
  const convertPrice = (pkrPrice) => {
    if (loading) return "..."; // show loading until rates ready
    if (currency === "PKR") return pkrPrice;
    if (!rates[currency]) return pkrPrice;
    return (pkrPrice * rates[currency]).toFixed(2);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// 3️⃣ Custom hook
export const useCurrency = () => useContext(CurrencyContext);
