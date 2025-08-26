"use client";

import { MetricCard } from "@/components/MetricCard";
import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  getDeposits, 
  getConversions, 
  getTransactions,
  calculateCurrentCash,
  calculateTotalPortfolioValue,
  calculateOverallProfitLoss,
  getPlatformSettings,
  type Deposit,
  type Conversion,
  type Transaction,
  type PlatformSettings
} from "@/lib/database";

export default function Home() {
  const { primaryCurrency } = useCurrency();
  const [krakenDeposits, setKrakenDeposits] = useState<Deposit[]>([]);
  const [ibkrDeposits, setIbkrDeposits] = useState<Deposit[]>([]);
  const [extradeDeposits, setExtradeDeposits] = useState<Deposit[]>([]);
  
  const [krakenConversions, setKrakenConversions] = useState<Conversion[]>([]);
  const [ibkrConversions, setIbkrConversions] = useState<Conversion[]>([]);
  const [extradeConversions, setExtradeConversions] = useState<Conversion[]>([]);
  
  const [krakenTransactions, setKrakenTransactions] = useState<Transaction[]>([]);
  const [ibkrTransactions, setIbkrTransactions] = useState<Transaction[]>([]);
  const [extradeTransactions, setExtradeTransactions] = useState<Transaction[]>([]);
  
  const [krakenSettings, setKrakenSettings] = useState<PlatformSettings | null>(null);
  const [ibkrSettings, setIbkrSettings] = useState<PlatformSettings | null>(null);
  const [extradeSettings, setExtradeSettings] = useState<PlatformSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<number>(3.5);

  // Fetch exchange rate
  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      if (data.rate) {
        setExchangeRate(data.rate);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  // Currency conversion helpers
  const convertToUSD = (amount: number, currency: 'ILS' | 'USD'): number => {
    if (currency === 'USD') return amount;
    return amount / exchangeRate;
  };

  const convertToILS = (amount: number, currency: 'ILS' | 'USD'): number => {
    if (currency === 'ILS') return amount;
    return amount * exchangeRate;
  };

  const convertToPrimaryCurrency = (amount: number, currency: 'ILS' | 'USD'): number => {
    if (primaryCurrency === 'USD') {
      return convertToUSD(amount, currency);
    } else {
      return convertToILS(amount, currency);
    }
  };

  const formatCurrencyInPrimary = (amount: number, originalCurrency: 'ILS' | 'USD' = 'USD'): string => {
    const convertedAmount = convertToPrimaryCurrency(amount, originalCurrency);
    const symbol = primaryCurrency === 'USD' ? '$' : '₪';
    
    if (!isFinite(convertedAmount) || isNaN(convertedAmount)) {
      return `${symbol}0.00`;
    }
    
    return `${symbol}${convertedAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading data from Supabase...');
        
        // Fetch exchange rate first
        await fetchExchangeRate();
        
        // Load all data from all platforms
        const [
          krakenDepositsData, ibkrDepositsData, extradeDepositsData,
          krakenConversionsData, ibkrConversionsData, extradeConversionsData,
          krakenTransactionsData, ibkrTransactionsData, extradeTransactionsData,
          krakenSettingsData, ibkrSettingsData, extradeSettingsData
        ] = await Promise.all([
          getDeposits('kraken'),
          getDeposits('ibkr'),
          getDeposits('extrade'),
          getConversions('kraken'),
          getConversions('ibkr'),
          getConversions('extrade'),
          getTransactions('kraken'),
          getTransactions('ibkr'),
          getTransactions('extrade'),
          getPlatformSettings('kraken'),
          getPlatformSettings('ibkr'),
          getPlatformSettings('extrade')
        ]);
        
        console.log('All data loaded:', { 
          deposits: { krakenDepositsData, ibkrDepositsData, extradeDepositsData },
          conversions: { krakenConversionsData, ibkrConversionsData, extradeConversionsData },
          transactions: { krakenTransactionsData, ibkrTransactionsData, extradeTransactionsData }
        });
        
        setKrakenDeposits(krakenDepositsData);
        setIbkrDeposits(ibkrDepositsData);
        setExtradeDeposits(extradeDepositsData);
        
        setKrakenConversions(krakenConversionsData);
        setIbkrConversions(ibkrConversionsData);
        setExtradeConversions(extradeConversionsData);
        
        setKrakenTransactions(krakenTransactionsData);
        setIbkrTransactions(ibkrTransactionsData);
        setExtradeTransactions(extradeTransactionsData);
        
        setKrakenSettings(krakenSettingsData);
        setIbkrSettings(ibkrSettingsData);
        setExtradeSettings(extradeSettingsData);
        
        console.log('All data loaded successfully');
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty arrays on error to prevent infinite loading
        setKrakenDeposits([]);
        setIbkrDeposits([]);
        setExtradeDeposits([]);
        setKrakenConversions([]);
        setIbkrConversions([]);
        setExtradeConversions([]);
        setKrakenTransactions([]);
        setIbkrTransactions([]);
        setExtradeTransactions([]);
        setKrakenSettings(null);
        setIbkrSettings(null);
        setExtradeSettings(null);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout

    loadData();

    return () => clearTimeout(timeoutId);
  }, []);

  // Calculate portfolio data for each platform using new functions
  const krakenPortfolio = calculateTotalPortfolioValue(krakenDeposits, krakenConversions, krakenTransactions, krakenSettings || undefined, exchangeRate, undefined);
  const ibkrPortfolio = calculateTotalPortfolioValue(ibkrDeposits, ibkrConversions, ibkrTransactions, ibkrSettings || undefined, exchangeRate, undefined);
  const extradePortfolio = calculateTotalPortfolioValue(extradeDeposits, extradeConversions, extradeTransactions, extradeSettings || undefined, exchangeRate, undefined);

  // Calculate cash for each platform
  const krakenCash = calculateCurrentCash(krakenDeposits, krakenConversions, krakenTransactions, krakenSettings || undefined);
  const ibkrCash = calculateCurrentCash(ibkrDeposits, ibkrConversions, ibkrTransactions, ibkrSettings || undefined);
  const extradeCash = calculateCurrentCash(extradeDeposits, extradeConversions, extradeTransactions, extradeSettings || undefined);

  // Calculate profit/loss for each platform
  const krakenProfitLoss = calculateOverallProfitLoss(krakenDeposits, krakenConversions, krakenTransactions, krakenSettings || undefined, exchangeRate, undefined);
  const ibkrProfitLoss = calculateOverallProfitLoss(ibkrDeposits, ibkrConversions, ibkrTransactions, ibkrSettings || undefined, exchangeRate, undefined);
  const extradeProfitLoss = calculateOverallProfitLoss(extradeDeposits, extradeConversions, extradeTransactions, extradeSettings || undefined, exchangeRate, undefined);

  // Calculate totals
  const totalPortfolioILS = krakenPortfolio.totalILS + ibkrPortfolio.totalILS + extradePortfolio.totalILS;
  const totalPortfolioUSD = krakenPortfolio.totalUSD + ibkrPortfolio.totalUSD + extradePortfolio.totalUSD;
  
  const totalCashILS = krakenCash.ILS + ibkrCash.ILS + extradeCash.ILS;
  const totalCashUSD = krakenCash.USD + ibkrCash.USD + extradeCash.USD;
  
  const totalProfitLoss = krakenProfitLoss.amount + ibkrProfitLoss.amount + extradeProfitLoss.amount;
  const totalInvestment = (krakenProfitLoss.amount !== 0 ? krakenProfitLoss.amount : 0) + 
                         (ibkrProfitLoss.amount !== 0 ? ibkrProfitLoss.amount : 0) + 
                         (extradeProfitLoss.amount !== 0 ? extradeProfitLoss.amount : 0);
  const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / Math.abs(totalInvestment)) * 100 : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">טוען נתונים...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-right text-foreground">
          ברוך הבא, בר!
        </h1>
      </div>
      
      {/* כרטיסיות סיכום כללי */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="סה״כ שווי כל התיקים"
          value={formatCurrencyInPrimary(primaryCurrency === 'USD' ? totalPortfolioUSD : totalPortfolioILS, primaryCurrency)}
        />
        <MetricCard
          title="סה״כ רווח/הפסד על כל התיקים"
          value={`${totalProfitLoss >= 0 ? '+' : ''}${totalProfitLossPercentage.toFixed(1)}% | ${formatCurrencyInPrimary(totalProfitLoss, 'USD')}`}
          valueClassName={totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}
        />
        <MetricCard
          title="סה״כ מזומן בשקל ומזומן בדולר"
          value={formatCurrencyInPrimary(primaryCurrency === 'USD' ? totalCashUSD : totalCashILS, primaryCurrency)}
        />
      </div>

      {/* תמצית לכל תיק */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-right mb-4">תמצית תיקים</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Extrade */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-xl font-bold text-right mb-3 text-blue-600">
              {extradeSettings?.display_name || 'Extrade'}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">שווי תיק כולל:</span>
                <span className="font-medium">{formatCurrencyInPrimary(primaryCurrency === 'USD' ? extradePortfolio.totalUSD : extradePortfolio.totalILS, primaryCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">מזומן:</span>
                <span className="font-medium">{formatCurrencyInPrimary(primaryCurrency === 'USD' ? extradeCash.USD : extradeCash.ILS, primaryCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">השקעות:</span>
                <span className="font-medium">{formatCurrencyInPrimary(extradePortfolio.investmentsUSD, 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">רווח/הפסד:</span>
                <span className={`font-medium ${extradeProfitLoss.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {extradeProfitLoss.percentage.toFixed(1)}% | {formatCurrencyInPrimary(extradeProfitLoss.amount, 'USD')}
                </span>
              </div>
            </div>
          </div>

          {/* IBKR */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-xl font-bold text-right mb-3 text-green-600">
              {ibkrSettings?.display_name || 'IBKR'}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">שווי תיק כולל:</span>
                <span className="font-medium">{formatCurrencyInPrimary(primaryCurrency === 'USD' ? ibkrPortfolio.totalUSD : ibkrPortfolio.totalILS, primaryCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">מזומן:</span>
                <span className="font-medium">{formatCurrencyInPrimary(primaryCurrency === 'USD' ? ibkrCash.USD : ibkrCash.ILS, primaryCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">השקעות:</span>
                <span className="font-medium">{formatCurrencyInPrimary(ibkrPortfolio.investmentsUSD, 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">רווח/הפסד:</span>
                <span className={`font-medium ${ibkrProfitLoss.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ibkrProfitLoss.percentage.toFixed(1)}% | {formatCurrencyInPrimary(ibkrProfitLoss.amount, 'USD')}
                </span>
              </div>
            </div>
          </div>

          {/* Kraken */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-xl font-bold text-right mb-3 text-purple-600">
              {krakenSettings?.display_name || 'Kraken'}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">שווי תיק כולל:</span>
                <span className="font-medium">{formatCurrencyInPrimary(primaryCurrency === 'USD' ? krakenPortfolio.totalUSD : krakenPortfolio.totalILS, primaryCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">מזומן:</span>
                <span className="font-medium">{formatCurrencyInPrimary(primaryCurrency === 'USD' ? krakenCash.USD : krakenCash.ILS, primaryCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">השקעות:</span>
                <span className="font-medium">{formatCurrencyInPrimary(krakenPortfolio.investmentsUSD, 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">רווח/הפסד:</span>
                <span className={`font-medium ${krakenProfitLoss.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {krakenProfitLoss.percentage.toFixed(1)}% | {formatCurrencyInPrimary(krakenProfitLoss.amount, 'USD')}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
