"use client";

import React, { createContext, useContext, useState } from 'react';

type Currency = 'USD' | 'ILS';

interface CurrencyContextType {
  primaryCurrency: Currency;
  setPrimaryCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [primaryCurrency, setPrimaryCurrency] = useState<Currency>('USD');

  const toggleCurrency = () => {
    setPrimaryCurrency(prev => prev === 'USD' ? 'ILS' : 'USD');
  };

  return (
    <CurrencyContext.Provider value={{ primaryCurrency, setPrimaryCurrency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}