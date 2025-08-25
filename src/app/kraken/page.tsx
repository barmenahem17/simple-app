"use client";

import { MetricCard } from "@/components/MetricCard";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Eye } from "lucide-react";
import { 
  getDeposits, 
  addDeposit, 
  deleteDeposit, 
  updateDeposit,
  getConversions, 
  addConversion, 
  deleteConversion, 
  updateConversion,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  sellTransaction,
  calculateCurrentCash,
  calculateTotalPortfolioValue,
  calculateOverallProfitLoss,
  calculateInvestmentAmount,
  calculateProfitLoss,
  formatCurrency,
  getPlatformSettings,
  calculateBuyFee,
  calculateSellFee,
  type Deposit,
  type Conversion,
  type Transaction,
  type PlatformSettings
} from "@/lib/database";

export default function Kraken() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [depositsData, conversionsData, transactionsData, settingsData] = await Promise.all([
          getDeposits('kraken'),
          getConversions('kraken'),
          getTransactions('kraken'),
          getPlatformSettings('kraken')
        ]);
        setDeposits(depositsData);
        setConversions(conversionsData);
        setTransactions(transactionsData);
        setPlatformSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [showConversionForm, setShowConversionForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [editingConversion, setEditingConversion] = useState<Conversion | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [sellingTransaction, setSellingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    currency: "ILS" as "ILS" | "USD"
  });
  const [conversionFormData, setConversionFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sourceAmount: "",
    sourceCurrency: "ILS" as "ILS" | "USD",
    exchangeRate: "",
    targetCurrency: "USD" as "ILS" | "USD"
  });

  // Transaction form data
  const [transactionFormData, setTransactionFormData] = useState({
    symbol: "",
    buy_date: new Date().toISOString().split('T')[0],
    quantity: "",
    buy_price: ""
  });

  const [sellFormData, setSellFormData] = useState({
    sell_date: new Date().toISOString().split('T')[0],
    sell_quantity: "",
    sell_price_per_unit: ""
  });

  // New states for advanced functionality
  const [stockPrices, setStockPrices] = useState<{[symbol: string]: number}>({});
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<string | null>(null);
  const [actionDialogTransaction, setActionDialogTransaction] = useState<Transaction | null>(null);
  const [actionDialogMode, setActionDialogMode] = useState<'menu' | 'sell' | 'edit'>('menu');

  // Format date for display (dd/mm/yyyy)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  // פונקציה לרענון מחירים מה-API
  const refreshStockPrices = async () => {
    if (transactions.length === 0) {
      alert("אין עסקאות לרענון מחירים");
      return;
    }
    
    console.log('Refreshing stock prices...');
    setRefreshingPrices(true);
    const symbols = [...new Set(transactions.map(t => t.symbol))];
    console.log('Symbols to fetch:', symbols);
    const pricesData: {[symbol: string]: number} = {};
    
    for (const symbol of symbols) {
      try {
        console.log(`Fetching price for ${symbol}...`);
        const response = await fetch(`/api/stock-price?symbol=${symbol}`);
        console.log(`Response status for ${symbol}:`, response.status);
        if (response.ok) {
          const data = await response.json();
          console.log(`Price data for ${symbol}:`, data);
          pricesData[symbol] = data.price;
        } else {
          console.error(`Failed to fetch price for ${symbol}:`, response.status);
        }
      } catch (error) {
        console.error(`Error loading price for ${symbol}:`, error);
      }
    }
    
    console.log('Final prices data:', pricesData);
    setStockPrices(pricesData);
    setRefreshingPrices(false);
  };

  // Load stock data on component mount and when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      refreshStockPrices();
    }
  }, [transactions]);

  // Calculate actual cash for this platform
  const currentCash = calculateCurrentCash(deposits, conversions, transactions, platformSettings || undefined);
  const totalILS = currentCash.ILS;
  const totalUSD = currentCash.USD;

  // Calculate portfolio value and profit/loss
  const portfolioValue = calculateTotalPortfolioValue(deposits, conversions, transactions, platformSettings || undefined);
  const totalPortfolioILS = portfolioValue.totalILS;
  const totalPortfolioUSD = portfolioValue.totalUSD;
  const profitLoss = calculateOverallProfitLoss(deposits, conversions, transactions, platformSettings || undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const handleAddDeposit = async () => {
    console.log("addDeposit called with:", formData);
    
    // Validate required fields
    if (!formData.date || !formData.amount) {
      console.log("Validation failed - missing date or amount");
      alert("אנא מלא את כל השדות הנדרשים");
      return;
    }
    
    // Validate amount is a valid number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      console.log("Invalid amount:", formData.amount);
      alert("אנא הזן סכום תקין");
      return;
    }
    
    const newDeposit = await addDeposit({
      platform: 'kraken',
      date: formData.date,
      amount: amount,
      currency: formData.currency
    });

    if (newDeposit) {
      setDeposits(prev => [...prev, newDeposit]);
      // Reset form
      setFormData({ date: new Date().toISOString().split('T')[0], amount: "", currency: "ILS" });
      setShowForm(false);
      console.log("Deposit added successfully");
    } else {
      alert("שגיאה בהוספת ההפקדה");
    }
  };

  const editDeposit = (deposit: Deposit) => {
    setEditingDeposit(deposit);
    setFormData({
      date: deposit.date,
      amount: deposit.amount.toString(),
      currency: deposit.currency
    });
    setShowForm(true);
  };

  const handleUpdateDeposit = async () => {
    if (!editingDeposit || !formData.date || !formData.amount) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("אנא הזן סכום תקין");
      return;
    }

    const updatedDeposit = await updateDeposit(editingDeposit.id, {
      date: formData.date,
      amount: amount,
      currency: formData.currency
    });

    if (updatedDeposit) {
      setDeposits(deposits.map(d => 
        d.id === editingDeposit.id ? updatedDeposit : d
      ));
      setEditingDeposit(null);
      setFormData({ date: new Date().toISOString().split('T')[0], amount: "", currency: "ILS" });
      setShowForm(false);
    } else {
      alert("שגיאה בעדכון ההפקדה");
    }
  };

  const handleDeleteDeposit = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את ההפקדה זו?')) {
      await deleteDeposit(id);
      setDeposits(deposits.filter(d => d.id !== id));
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingDeposit(null);
    setFormData({ date: new Date().toISOString().split('T')[0], amount: "", currency: "ILS" });
  };

  const handleAddConversion = async () => {
    if (!conversionFormData.date || !conversionFormData.sourceAmount || !conversionFormData.exchangeRate) {
      alert("אנא מלא את כל השדות הנדרשים");
      return;
    }

    const sourceAmount = parseFloat(conversionFormData.sourceAmount);
    const exchangeRate = parseFloat(conversionFormData.exchangeRate);

    if (isNaN(sourceAmount) || sourceAmount <= 0 || isNaN(exchangeRate) || exchangeRate <= 0) {
      alert("אנא הזן ערכים תקינים");
      return;
    }

    // בדיקת יתרה זמינה
    const availableBalance = currentCash[conversionFormData.sourceCurrency];
    
    if (sourceAmount > availableBalance) {
      alert(`אין מספיק יתרה זמינה. יתרה זמינה: ${availableBalance.toFixed(2)} ${conversionFormData.sourceCurrency}`);
      return;
    }

    const newConversion = await addConversion({
      platform: 'kraken',
      date: conversionFormData.date,
      source_amount: sourceAmount,
      source_currency: conversionFormData.sourceCurrency,
      exchange_rate: exchangeRate,
      target_currency: conversionFormData.targetCurrency
    });

    if (newConversion) {
      setConversions(prev => [...prev, newConversion]);
      setConversionFormData({ 
        date: new Date().toISOString().split('T')[0], 
        sourceAmount: "", 
        sourceCurrency: "ILS", 
        exchangeRate: "", 
        targetCurrency: "USD" 
      });
      setShowConversionForm(false);
    } else {
      alert("שגיאה בהוספת ההמרה");
    }
  };

  const editConversion = (conversion: Conversion) => {
    setEditingConversion(conversion);
    setConversionFormData({
      date: conversion.date,
      sourceAmount: conversion.source_amount.toString(),
      sourceCurrency: conversion.source_currency,
      exchangeRate: conversion.exchange_rate.toString(),
      targetCurrency: conversion.target_currency
    });
    setShowConversionForm(true);
  };

  const handleUpdateConversion = async () => {
    if (!editingConversion || !conversionFormData.date || !conversionFormData.sourceAmount || !conversionFormData.exchangeRate) return;

    const sourceAmount = parseFloat(conversionFormData.sourceAmount);
    const exchangeRate = parseFloat(conversionFormData.exchangeRate);

    if (isNaN(sourceAmount) || sourceAmount <= 0 || isNaN(exchangeRate) || exchangeRate <= 0) {
      alert("אנא הזן ערכים תקינים");
      return;
    }

    const updatedConversion = await updateConversion(editingConversion.id, {
      date: conversionFormData.date,
      source_amount: sourceAmount,
      source_currency: conversionFormData.sourceCurrency,
      exchange_rate: exchangeRate,
      target_currency: conversionFormData.targetCurrency
    });

    if (updatedConversion) {
      setConversions(conversions.map(c => 
        c.id === editingConversion.id 
          ? { 
              ...c, 
              date: conversionFormData.date, 
              source_amount: sourceAmount, 
              source_currency: conversionFormData.sourceCurrency,
              exchange_rate: exchangeRate,
              target_currency: conversionFormData.targetCurrency
            }
          : c
      ));
      setEditingConversion(null);
      setConversionFormData({ 
        date: new Date().toISOString().split('T')[0], 
        sourceAmount: "", 
        sourceCurrency: "ILS", 
        exchangeRate: "", 
        targetCurrency: "USD" 
      });
      setShowConversionForm(false);
    } else {
      alert("שגיאה בעדכון ההמרה");
    }
  };

  const handleDeleteConversion = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את ההמרה זו?')) {
      await deleteConversion(id);
      setConversions(conversions.filter(c => c.id !== id));
    }
  };

  const cancelConversionForm = () => {
    setShowConversionForm(false);
    setEditingConversion(null);
    setConversionFormData({ 
      date: new Date().toISOString().split('T')[0], 
      sourceAmount: "", 
      sourceCurrency: "ILS", 
      exchangeRate: "", 
      targetCurrency: "USD" 
    });
  };

  // Transaction functions
  const handleAddTransaction = async () => {
    if (!transactionFormData.symbol || !transactionFormData.buy_date || 
        !transactionFormData.quantity || !transactionFormData.buy_price) return;

    const quantity = parseFloat(transactionFormData.quantity);
    const buy_price = parseFloat(transactionFormData.buy_price);
    const buy_fee = calculateBuyFee('kraken', platformSettings || undefined);

    if (isNaN(quantity) || quantity <= 0 || isNaN(buy_price) || buy_price <= 0) {
      alert("אנא הזן ערכים תקינים");
      return;
    }

    // בדיקת יתרה זמינה
    const totalTransactionCost = (quantity * buy_price) + buy_fee;
    const availableUSD = calculateCurrentCash(deposits, conversions, transactions, platformSettings || undefined).USD;
    
    if (totalTransactionCost > availableUSD) {
      alert(`אין מספיק מזומן זמין. נדרש: ${formatCurrency(totalTransactionCost, 'USD')}, זמין: ${formatCurrency(availableUSD, 'USD')}`);
      return;
    }

    const newTransaction = await addTransaction({
      platform: 'kraken',
      symbol: transactionFormData.symbol.toUpperCase(),
      buy_date: transactionFormData.buy_date,
      quantity: quantity,
      buy_price: buy_price,
      buy_fee: buy_fee,
      buy_fee_currency: 'USD'
    });

    if (newTransaction) {
      // עדכון מיידי של הטבלה
      setTransactions(await getTransactions('kraken'));
      
      // טעינת לוגו עבור העסקה החדשה
      try {
        const response = await fetch(`/api/stock-info?symbol=${newTransaction.symbol}`);
        if (response.ok) {
          const data = await response.json();
          if (data.logo_url) {
            setTransactions(prev => prev.map(t => 
              t.id === newTransaction.id ? { ...t, logo_url: data.logo_url } : t
            ));
          }
        }
      } catch (error) {
        console.error(`Failed to load logo for ${newTransaction.symbol}:`, error);
      }
      
      setTransactionFormData({
        symbol: "",
        buy_date: new Date().toISOString().split('T')[0],
        quantity: "",
        buy_price: ""
      });
      setShowTransactionForm(false);
    } else {
      alert("שגיאה בהוספת העסקה");
    }
  };

  const editTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormData({
      symbol: transaction.symbol,
      buy_date: transaction.buy_date,
      quantity: transaction.quantity.toString(),
      buy_price: transaction.buy_price.toString()
    });
    setShowTransactionForm(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !transactionFormData.symbol || !transactionFormData.buy_date || 
        !transactionFormData.quantity || !transactionFormData.buy_price) return;

    const quantity = parseFloat(transactionFormData.quantity);
    const buy_price = parseFloat(transactionFormData.buy_price);
    const buy_fee = calculateBuyFee('kraken', platformSettings || undefined);

    if (isNaN(quantity) || quantity <= 0 || isNaN(buy_price) || buy_price <= 0) {
      alert("אנא הזן ערכים תקינים");
      return;
    }

    const updatedTransaction = await updateTransaction(editingTransaction.id, {
      symbol: transactionFormData.symbol.toUpperCase(),
      buy_date: transactionFormData.buy_date,
      quantity: quantity,
      buy_price: buy_price,
      buy_fee: buy_fee,
      buy_fee_currency: 'USD'
    });

    if (updatedTransaction) {
      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id ? updatedTransaction : t
      ));
      setEditingTransaction(null);
      setTransactionFormData({
        symbol: "",
        buy_date: new Date().toISOString().split('T')[0],
        quantity: "",
        buy_price: ""
      });
      setShowTransactionForm(false);
    } else {
      alert("שגיאה בעדכון העסקה");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setDeletingTransaction(id);
  };

  const confirmDeleteTransaction = async () => {
    if (deletingTransaction) {
      await deleteTransaction(deletingTransaction);
      setTransactions(transactions.filter(t => t.id !== deletingTransaction));
      setDeletingTransaction(null);
    }
  };

  const startSellTransaction = (transaction: Transaction) => {
    setSellingTransaction(transaction);
    setSellFormData({
      sell_date: new Date().toISOString().split('T')[0],
      sell_quantity: transaction.quantity.toString(), // ברירת מחדל - כל הכמות
      sell_price_per_unit: ""
    });
    setShowSellForm(true);
  };

  const handleSellTransaction = async () => {
    if (!sellingTransaction || !sellFormData.sell_date || !sellFormData.sell_quantity || !sellFormData.sell_price_per_unit) {
      alert("אנא מלא את כל השדות הנדרשים");
      return;
    }

    const sell_quantity = parseFloat(sellFormData.sell_quantity);
    const sell_price_per_unit = parseFloat(sellFormData.sell_price_per_unit);
    const sell_fee = calculateSellFee('kraken', platformSettings || undefined);

    if (isNaN(sell_quantity) || sell_quantity <= 0 || isNaN(sell_price_per_unit) || sell_price_per_unit <= 0) {
      alert("אנא הזן ערכים תקינים");
      return;
    }

    // Check if selling more than owned
    if (sell_quantity > sellingTransaction.quantity) {
      alert(`לא ניתן למכור יותר מ-${sellingTransaction.quantity} יחידות`);
      return;
    }

    const soldTransaction = await sellTransaction(
      sellingTransaction.id,
      sellFormData.sell_date,
      sell_quantity,
      sell_price_per_unit,
      sell_fee
    );

    if (soldTransaction) {
      setTransactions(transactions.map(t => 
        t.id === sellingTransaction.id ? soldTransaction : t
      ));
      setSellingTransaction(null);
      setSellFormData({
        sell_date: new Date().toISOString().split('T')[0],
        sell_quantity: "",
        sell_price_per_unit: ""
      });
      setShowSellForm(false);
    } else {
      alert("שגיאה במכירת העסקה");
    }
  };

  const cancelTransactionForm = () => {
    setShowTransactionForm(false);
    setEditingTransaction(null);
    setTransactionFormData({
      symbol: "",
      buy_date: new Date().toISOString().split('T')[0],
      quantity: "",
      buy_price: ""
    });
  };

  const cancelSellForm = () => {
    setShowSellForm(false);
    setSellingTransaction(null);
    setSellFormData({
      sell_date: new Date().toISOString().split('T')[0],
      sell_quantity: "",
      sell_price_per_unit: ""
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-right">
          {platformSettings?.display_name || 'Kraken'}
        </h1>
        <Button 
          onClick={refreshStockPrices}
          disabled={refreshingPrices || transactions.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
          title={transactions.length === 0 ? "אין עסקאות לרענון" : "רענן מחירי מניות"}
        >
          {refreshingPrices ? 'מעדכן...' : 'רענן מחירים'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="שווי תיק כולל"
          value={`₪ ${Math.round(totalPortfolioILS)} | $ ${Math.round(totalPortfolioUSD)}`}
        />
        <MetricCard
          title="רווח/הפסד (באחוזים ובמטבע) על כל התקופה"
          value={`${profitLoss.percentage.toFixed(2)}% / ${formatCurrency(profitLoss.amount, 'USD')}`}
          valueClassName={profitLoss.amount >= 0 ? "text-green-600" : "text-red-600"}
        />
        <MetricCard
          title="מזומן בשקל ומזומן בדולר"
          value={`₪ ${Math.round(totalILS)} | $ ${Math.round(totalUSD)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-right">הפקדות</CardTitle>
            <Button 
              onClick={() => {
                console.log("Add deposit button clicked");
                setShowForm(true);
              }} 
              className="text-sm"
            >
              הוסף הפקדה
            </Button>
          </CardHeader>
          <CardContent>
            {showForm && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">תאריך</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => {
                        console.log("Date changed:", e.target.value);
                        setFormData({...formData, date: e.target.value});
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">סכום</label>
                    <input
                      type="number"
                      placeholder="הזן סכום"
                      value={formData.amount}
                      onChange={(e) => {
                        console.log("Amount changed:", e.target.value);
                        setFormData({...formData, amount: e.target.value});
                      }}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">מטבע</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => {
                        console.log("Currency changed:", e.target.value);
                        setFormData({...formData, currency: e.target.value as "ILS" | "USD"});
                      }}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="ILS">₪ שקל</option>
                      <option value="USD">$ דולר</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    onClick={editingDeposit ? handleUpdateDeposit : handleAddDeposit}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingDeposit ? "עדכן" : "הוסף"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={cancelForm}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right p-3 font-medium">תאריך</th>
                    <th className="text-right p-3 font-medium">סכום</th>
                    <th className="text-right p-3 font-medium">מטבע</th>
                    <th className="text-right p-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b hover:bg-gray-50">
                      <td className="text-right p-3 min-w-[100px] whitespace-nowrap">{formatDate(deposit.date)}</td>
                      <td className="text-right p-3 font-medium">{deposit.amount.toLocaleString()}</td>
                      <td className="text-right p-3">{deposit.currency === "ILS" ? "₪ שקל" : "$ דולר"}</td>
                      <td className="text-right p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editDeposit(deposit)}
                          className="ml-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDeposit(deposit.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-gray-500">
                        אין הפקדות להצגה
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-right">המרות</CardTitle>
            <Button 
              onClick={() => setShowConversionForm(true)} 
              className="text-sm"
            >
              הוסף המרה
            </Button>
          </CardHeader>
          <CardContent>
            {showConversionForm && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">תאריך</label>
                    <input
                      type="date"
                      value={conversionFormData.date}
                      onChange={(e) => setConversionFormData({...conversionFormData, date: e.target.value})}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">סכום מקור</label>
                    <input
                      type="number"
                      placeholder="הזן סכום"
                      value={conversionFormData.sourceAmount}
                      onChange={(e) => setConversionFormData({...conversionFormData, sourceAmount: e.target.value})}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">מטבע מקור</label>
                    <select
                      value={conversionFormData.sourceCurrency}
                      onChange={(e) => setConversionFormData({
                        ...conversionFormData, 
                        sourceCurrency: e.target.value as "ILS" | "USD",
                        targetCurrency: e.target.value === "ILS" ? "USD" : "ILS"
                      })}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="ILS">₪ שקל</option>
                      <option value="USD">$ דולר</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">שער המרה</label>
                    <input
                      type="number"
                      placeholder="הזן שער"
                      value={conversionFormData.exchangeRate}
                      onChange={(e) => setConversionFormData({...conversionFormData, exchangeRate: e.target.value})}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="0"
                      step="0.0001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">מטבע יעד</label>
                    <select
                      value={conversionFormData.targetCurrency}
                      disabled
                      className="w-full p-2 border rounded bg-gray-100"
                    >
                      <option value={conversionFormData.targetCurrency}>
                        {conversionFormData.targetCurrency === "ILS" ? "₪ שקל" : "$ דולר"}
                      </option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={editingConversion ? handleUpdateConversion : handleAddConversion}>
                    {editingConversion ? "עדכן" : "הוסף"}
                  </Button>
                  <Button variant="outline" onClick={cancelConversionForm}>
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right p-3 font-medium">תאריך</th>
                    <th className="text-right p-3 font-medium">סכום מקור</th>
                    <th className="text-right p-3 font-medium">מטבע מקור</th>
                    <th className="text-right p-3 font-medium">שער המרה</th>
                    <th className="text-right p-3 font-medium">מטבע יעד</th>
                    <th className="text-right p-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((conversion) => (
                    <tr key={conversion.id} className="border-b hover:bg-gray-50">
                      <td className="text-right p-3 min-w-[100px] whitespace-nowrap">{formatDate(conversion.date)}</td>
                      <td className="text-right p-3 font-medium">{conversion.source_amount.toLocaleString()}</td>
                      <td className="text-right p-3">{conversion.source_currency === "ILS" ? "₪ שקל" : "$ דולר"}</td>
                      <td className="text-right p-3">{conversion.exchange_rate}</td>
                      <td className="text-right p-3">{conversion.target_currency === "ILS" ? "₪ שקל" : "$ דולר"}</td>
                      <td className="text-right p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editConversion(conversion)}
                          className="ml-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteConversion(conversion.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {conversions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        אין המרות להצגה
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* טבלת עסקאות */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-right">עסקאות</CardTitle>
            <Button 
              onClick={() => setShowTransactionForm(true)} 
              className="text-sm"
            >
              הוסף עסקה
            </Button>
          </CardHeader>
          <CardContent>
            {/* טופס הוספת/עריכת עסקה */}
            {showTransactionForm && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">סימול</label>
                    <input
                      type="text"
                      placeholder="הזן סימול (AAPL, BTC וכו')"
                      value={transactionFormData.symbol}
                      onChange={(e) => setTransactionFormData({...transactionFormData, symbol: e.target.value})}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">תאריך קנייה</label>
                    <input
                      type="date"
                      value={transactionFormData.buy_date}
                      onChange={(e) => setTransactionFormData({...transactionFormData, buy_date: e.target.value})}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">כמות</label>
                    <input
                      type="number"
                      placeholder="הזן כמות"
                      value={transactionFormData.quantity}
                      onChange={(e) => setTransactionFormData({...transactionFormData, quantity: e.target.value})}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="0"
                      step="0.00001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">מחיר קנייה</label>
                    <input
                      type="number"
                      placeholder="הזן מחיר"
                      value={transactionFormData.buy_price}
                      onChange={(e) => setTransactionFormData({...transactionFormData, buy_price: e.target.value})}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    onClick={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingTransaction ? "עדכן" : "הוסף"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={cancelTransactionForm}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            {/* טופס מכירה */}
            {showSellForm && sellingTransaction && (
              <div className="mb-4 p-4 border rounded-lg bg-yellow-50">
                <h3 className="text-lg font-semibold mb-4 text-right">
                  מכירת {sellingTransaction.symbol} - זמין: {sellingTransaction.quantity} יחידות
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">תאריך מכירה</label>
                    <input
                      type="date"
                      value={sellFormData.sell_date}
                      onChange={(e) => setSellFormData({...sellFormData, sell_date: e.target.value})}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">כמות למכירה</label>
                    <input
                      type="number"
                      placeholder="הזן כמות"
                      value={sellFormData.sell_quantity}
                      onChange={(e) => setSellFormData({...sellFormData, sell_quantity: e.target.value})}
                      max={sellingTransaction.quantity}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="0"
                      step="0.00001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">מחיר ליחידה</label>
                    <input
                      type="number"
                      placeholder="הזן מחיר ליחידה"
                      value={sellFormData.sell_price_per_unit}
                      onChange={(e) => setSellFormData({...sellFormData, sell_price_per_unit: e.target.value})}
                      className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                </div>
                {sellFormData.sell_quantity && sellFormData.sell_price_per_unit && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-right text-blue-800">
                      <strong>סכום כולל מהמכירה: </strong>
                      {formatCurrency(
                        parseFloat(sellFormData.sell_quantity || "0") * parseFloat(sellFormData.sell_price_per_unit || "0"),
                        sellingTransaction.buy_fee_currency
                      )}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button 
                    onClick={handleSellTransaction}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    מכור
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={cancelSellForm}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            {/* טבלת עסקאות */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-center p-3 font-medium">סימול</th>
                    <th className="text-center p-3 font-medium">תאריכים</th>
                    <th className="text-center p-3 font-medium">כמות</th>
                    <th className="text-center p-3 font-medium">מחירים</th>
                    <th className="text-center p-3 font-medium">עמלות</th>
                    <th className="text-center p-3 font-medium">סכום השקעה</th>
                    <th className="text-center p-3 font-medium">רווח/הפסד</th>
                    <th className="text-center p-3 font-medium">סכום סופי</th>
                    <th className="text-center p-3 font-medium">סטטוס</th>
                    <th className="text-center p-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const buyFee = calculateBuyFee('kraken', platformSettings || undefined);
                    const sellFee = calculateSellFee('kraken', platformSettings || undefined);
                    const investmentAmount = calculateInvestmentAmount(transaction.quantity, transaction.buy_price, buyFee + (transaction.status === 'closed' ? sellFee : 0));
                    const profitLoss = transaction.status === 'closed' && transaction.sell_quantity && transaction.sell_price_per_unit
                      ? calculateProfitLoss(transaction.quantity, transaction.buy_price, buyFee, transaction.sell_quantity, transaction.sell_price_per_unit, sellFee)
                      : null;

                    return (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50 h-16">
                        {/* סימול */}
                        <td className="text-center p-3 font-medium">
                          <div className="flex flex-col justify-center h-full items-center">
                            <div className="flex items-center gap-2">
                              {transaction.logo_url && (
                                <img 
                                  src={transaction.logo_url} 
                                  alt={`${transaction.symbol} logo`}
                                  className="w-6 h-6 rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="font-semibold">{transaction.symbol}</span>
                            </div>
                          </div>
                        </td>
                        
                        {/* תאריכים */}
                        <td className="text-center p-3 min-w-[120px]">
                          <div className="flex flex-col justify-center h-full items-center">
                            <div className="text-sm leading-tight text-center">
                              <div className="font-medium">קנייה: {formatDate(transaction.buy_date)}</div>
                              {transaction.sell_date && (
                                <div className="font-medium">מכירה: {formatDate(transaction.sell_date)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* כמות */}
                        <td className="text-center p-3">
                          <div className="flex flex-col justify-center h-full items-center">
                            {transaction.quantity.toLocaleString()}
                          </div>
                        </td>
                        
                        {/* מחירים */}
                        <td className="text-center p-3">
                          <div className="flex flex-col justify-center h-full items-center">
                            <div className="text-sm leading-tight text-center">
                              <div className="font-medium">קנייה: {formatCurrency(transaction.buy_price, 'USD')}</div>
                              {transaction.status === 'closed' && transaction.sell_price_per_unit && (
                                <div className="font-medium">מכירה: {formatCurrency(transaction.sell_price_per_unit, 'USD')}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* עמלות */}
                        <td className="text-center p-3">
                          <div className="flex flex-col justify-center h-full items-center">
                            <div className="text-sm font-medium">
                              {formatCurrency(buyFee + (transaction.status === 'closed' ? sellFee : 0), 'USD')}
                            </div>
                          </div>
                        </td>
                        
                        {/* סכום השקעה */}
                        <td className="text-center p-3 font-medium">
                          <div className="flex flex-col justify-center h-full items-center">
                            {formatCurrency(investmentAmount, 'USD')}
                          </div>
                        </td>
                        
                        {/* רווח/הפסד */}
                        <td className="text-center p-3">
                          <div className="flex flex-col justify-center h-full items-center">
                            {transaction.status === 'closed' && transaction.sell_quantity && transaction.sell_price_per_unit ? (
                              // עסקה נמכרה - חישוב רווח/הפסד
                              <div className="text-center">
                                {(() => {
                                  const transactionProfitLoss = calculateProfitLoss(
                                    transaction.quantity,
                                    transaction.buy_price,
                                    buyFee,
                                    transaction.sell_quantity!,
                                    transaction.sell_price_per_unit!,
                                    sellFee
                                  );
                                  return (
                                    <>
                                      <div className={`font-medium text-sm ${transactionProfitLoss.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {transactionProfitLoss.percentage.toFixed(2)}%
                                      </div>
                                      <div className={`text-xs ${transactionProfitLoss.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(transactionProfitLoss.amount, 'USD')}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : transaction.status === 'open' && stockPrices[transaction.symbol] ? (
                              // עסקה פתוחה - רווח/הפסד נוכחי
                              <div className="text-center">
                                <div className={`font-medium text-sm ${(transaction.quantity * stockPrices[transaction.symbol]) >= investmentAmount ? 'text-green-600' : 'text-red-600'}`}>
                                  {(((transaction.quantity * stockPrices[transaction.symbol]) - investmentAmount) / investmentAmount * 100).toFixed(2)}%
                                </div>
                                <div className={`text-xs ${(transaction.quantity * stockPrices[transaction.symbol]) >= investmentAmount ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency((transaction.quantity * stockPrices[transaction.symbol]) - investmentAmount, 'USD')}
                                </div>
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </td>
                        
                        {/* סכום סופי */}
                        <td className="text-center p-3 font-medium">
                          <div className="flex flex-col justify-center h-full items-center">
                            {transaction.status === 'closed' && transaction.sell_quantity && transaction.sell_price_per_unit ? (
                              // עסקה נמכרה - מחיר מכירה * כמות - עמלות
                              <span className={`${profitLoss && profitLoss.amount >= 0 ? 'text-green-600' : profitLoss && profitLoss.amount < 0 ? 'text-red-600' : ''}`}>
                                {formatCurrency((transaction.sell_quantity * transaction.sell_price_per_unit) - buyFee - sellFee, 'USD')}
                              </span>
                            ) : transaction.status === 'open' && stockPrices[transaction.symbol] ? (
                              // עסקה פתוחה - מחיר נוכחי * כמות - עמלת קנייה (צבע שחור)
                              <span>
                                {(() => {
                                  console.log(`Stock price for ${transaction.symbol}:`, stockPrices[transaction.symbol]);
                                  return formatCurrency((transaction.quantity * stockPrices[transaction.symbol]) - buyFee, 'USD');
                                })()}
                              </span>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </td>
                        
                        {/* סטטוס */}
                        <td className="text-center p-3">
                          <div className="flex flex-col justify-center h-full items-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'open' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaction.status === 'open' ? 'פתוח' : 'נמכר'}
                            </span>
                          </div>
                        </td>
                        
                        {/* פעולות */}
                        <td className="text-center p-3">
                          <div className="flex flex-col justify-center h-full items-center space-y-1">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editTransaction(transaction)}
                                className="text-xs px-2 py-1"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {transaction.status === 'open' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startSellTransaction(transaction)}
                                  className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100"
                                >
                                  מכור
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-xs px-2 py-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-gray-500">
                        אין עסקאות להצגה
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת עסקה</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>האם אתה בטוח שברצונך למחוק את העסקה זו?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingTransaction(null)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTransaction}>
              מחק
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}