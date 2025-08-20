"use client";

import { MetricCard } from "@/components/MetricCard";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";
import { 
  getDeposits, 
  addDeposit, 
  deleteDeposit, 
  updateDeposit,
  getConversions, 
  addConversion, 
  deleteConversion, 
  updateConversion,
  calculateActualCash,
  type Deposit,
  type Conversion
} from "@/lib/database";

export default function Extrade() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [depositsData, conversionsData] = await Promise.all([
          getDeposits('extrade'),
          getConversions('extrade')
        ]);
        setDeposits(depositsData);
        setConversions(conversionsData);
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
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [editingConversion, setEditingConversion] = useState<Conversion | null>(null);
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

  // Format date for display (dd/mm/yyyy)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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
      platform: 'extrade',
      date: formData.date,
      amount: amount,
      currency: formData.currency
    });

    if (newDeposit) {
      console.log("Adding new deposit:", newDeposit);
      setDeposits(prev => [newDeposit, ...prev]);
      
      // Reset form
      setFormData({ date: new Date().toISOString().split('T')[0], amount: "", currency: "ILS" });
      setShowForm(false);
      console.log("Form reset and closed");
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
        d.id === editingDeposit.id 
          ? { ...d, date: formData.date, amount: amount, currency: formData.currency }
          : d
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

  // פונקציה לחישוב מזומן אמיתי עם התחשבות בהמרות
  const actualCash = calculateActualCash(deposits, conversions);
  const totalILS = actualCash.ILS;
  const totalUSD = actualCash.USD;

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
    const currentCash = calculateActualCash(deposits, conversions);
    const availableBalance = currentCash[conversionFormData.sourceCurrency];
    
    if (sourceAmount > availableBalance) {
      alert(`אין מספיק יתרה זמינה. יתרה זמינה: ${availableBalance.toFixed(2)} ${conversionFormData.sourceCurrency}`);
      return;
    }

    const newConversion = await addConversion({
      platform: 'extrade',
      date: conversionFormData.date,
      source_amount: sourceAmount,
      source_currency: conversionFormData.sourceCurrency,
      exchange_rate: exchangeRate,
      target_currency: conversionFormData.targetCurrency
    });

    if (newConversion) {
      setConversions([newConversion, ...conversions]);
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

  return (
    <div className="container mx-auto p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">טוען נתונים...</p>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-right mb-8">Extrade</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="שווי תיק כולל"
              value={`₪ ${Math.round(totalILS)} | $ ${Math.round(totalUSD)}`}
            />
            <MetricCard
              title="רווח/הפסד (באחוזים ובמטבע) על כל התקופה"
              value="—% / —"
              valueClassName="text-green-600"
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
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ILS">שקל</option>
                        <option value="USD">דולר</option>
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
                        <td className="text-right p-3">{deposit.currency === "ILS" ? "שקל" : "דולר"}</td>
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
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="ILS">שקל</option>
                          <option value="USD">דולר</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-right">שער המרה</label>
                        <input
                          type="number"
                          placeholder="הזן שער"
                          value={conversionFormData.exchangeRate}
                          onChange={(e) => setConversionFormData({...conversionFormData, exchangeRate: e.target.value})}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            {conversionFormData.targetCurrency === "ILS" ? "שקל" : "דולר"}
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
                          <td className="text-right p-3">{conversion.source_currency === "ILS" ? "שקל" : "דולר"}</td>
                          <td className="text-right p-3">{conversion.exchange_rate}</td>
                          <td className="text-right p-3">{conversion.target_currency === "ILS" ? "שקל" : "דולר"}</td>
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
        </>
      )}
    </div>
  );
}