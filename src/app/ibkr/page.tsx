"use client";

import { MetricCard } from "@/components/MetricCard";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Deposit {
  id: string;
  date: string;
  amount: number;
  currency: "ILS" | "USD";
}

interface Conversion {
  id: string;
  date: string;
  sourceAmount: number;
  sourceCurrency: "ILS" | "USD";
  exchangeRate: number;
  targetCurrency: "ILS" | "USD";
}

export default function IBKR() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);

  useEffect(() => {
    const savedDeposits = localStorage.getItem('ibkr-deposits');
    if (savedDeposits) {
      setDeposits(JSON.parse(savedDeposits));
    }
    const savedConversions = localStorage.getItem('ibkr-conversions');
    if (savedConversions) {
      setConversions(JSON.parse(savedConversions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ibkr-deposits', JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem('ibkr-conversions', JSON.stringify(conversions));
  }, [conversions]);

  const [showForm, setShowForm] = useState(false);
  const [showConversionForm, setShowConversionForm] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [editingConversion, setEditingConversion] = useState<Conversion | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    currency: "ILS" as "ILS" | "USD"
  });
  const [conversionFormData, setConversionFormData] = useState({
    date: "",
    sourceAmount: "",
    sourceCurrency: "ILS" as "ILS" | "USD",
    exchangeRate: "",
    targetCurrency: "USD" as "ILS" | "USD"
  });

  const addDeposit = () => {
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
    
    const newDeposit: Deposit = {
      id: Date.now().toString(),
      date: formData.date,
      amount: amount,
      currency: formData.currency
    };

    console.log("Adding new deposit:", newDeposit);
    setDeposits(prev => {
      const updated = [...prev, newDeposit];
      console.log("Updated deposits:", updated);
      return updated;
    });
    
    // Reset form
    setFormData({ date: "", amount: "", currency: "ILS" });
    setShowForm(false);
    console.log("Form reset and closed");
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

  const updateDeposit = () => {
    if (!editingDeposit || !formData.date || !formData.amount) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("אנא הזן סכום תקין");
      return;
    }

    setDeposits(deposits.map(d => 
      d.id === editingDeposit.id 
        ? { ...d, date: formData.date, amount: amount, currency: formData.currency }
        : d
    ));
    setEditingDeposit(null);
    setFormData({ date: "", amount: "", currency: "ILS" });
    setShowForm(false);
  };

  const deleteDeposit = (id: string) => {
    setDeposits(deposits.filter(d => d.id !== id));
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingDeposit(null);
    setFormData({ date: "", amount: "", currency: "ILS" });
  };

  const addConversion = () => {
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

    const newConversion: Conversion = {
      id: Date.now().toString(),
      date: conversionFormData.date,
      sourceAmount: sourceAmount,
      sourceCurrency: conversionFormData.sourceCurrency,
      exchangeRate: exchangeRate,
      targetCurrency: conversionFormData.targetCurrency
    };

    setConversions([...conversions, newConversion]);
    setConversionFormData({ 
      date: "", 
      sourceAmount: "", 
      sourceCurrency: "ILS", 
      exchangeRate: "", 
      targetCurrency: "USD" 
    });
    setShowConversionForm(false);
  };

  const editConversion = (conversion: Conversion) => {
    setEditingConversion(conversion);
    setConversionFormData({
      date: conversion.date,
      sourceAmount: conversion.sourceAmount.toString(),
      sourceCurrency: conversion.sourceCurrency,
      exchangeRate: conversion.exchangeRate.toString(),
      targetCurrency: conversion.targetCurrency
    });
    setShowConversionForm(true);
  };

  const updateConversion = () => {
    if (!editingConversion || !conversionFormData.date || !conversionFormData.sourceAmount || !conversionFormData.exchangeRate) return;

    const sourceAmount = parseFloat(conversionFormData.sourceAmount);
    const exchangeRate = parseFloat(conversionFormData.exchangeRate);

    if (isNaN(sourceAmount) || sourceAmount <= 0 || isNaN(exchangeRate) || exchangeRate <= 0) {
      alert("אנא הזן ערכים תקינים");
      return;
    }

    setConversions(conversions.map(c => 
      c.id === editingConversion.id 
        ? { 
            ...c, 
            date: conversionFormData.date, 
            sourceAmount: sourceAmount, 
            sourceCurrency: conversionFormData.sourceCurrency,
            exchangeRate: exchangeRate,
            targetCurrency: conversionFormData.targetCurrency
          }
        : c
    ));
    setEditingConversion(null);
    setConversionFormData({ 
      date: "", 
      sourceAmount: "", 
      sourceCurrency: "ILS", 
      exchangeRate: "", 
      targetCurrency: "USD" 
    });
    setShowConversionForm(false);
  };

  const deleteConversion = (id: string) => {
    setConversions(conversions.filter(c => c.id !== id));
  };

  const cancelConversionForm = () => {
    setShowConversionForm(false);
    setEditingConversion(null);
    setConversionFormData({ 
      date: "", 
      sourceAmount: "", 
      sourceCurrency: "ILS", 
      exchangeRate: "", 
      targetCurrency: "USD" 
    });
  };

  const totalILS = deposits.filter(d => d.currency === "ILS").reduce((sum, d) => sum + d.amount, 0);
  const totalUSD = deposits.filter(d => d.currency === "USD").reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-right mb-8">IBKR</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="שווי תיק כולל"
          value={`₪ ${totalILS.toLocaleString()} | $ ${totalUSD.toLocaleString()}`}
        />
        <MetricCard
          title="רווח/הפסד (באחוזים ובמטבע) על כל התקופה"
          value="—% / —"
          valueClassName="text-red-600"
        />
        <MetricCard
          title="מזומן בשקל ומזומן בדולר"
          value={`₪ ${totalILS.toLocaleString()} | $ ${totalUSD.toLocaleString()}`}
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
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  onClick={editingDeposit ? updateDeposit : addDeposit}
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
                    <td className="text-right p-3">{deposit.date}</td>
                    <td className="text-right p-3 font-medium">{deposit.amount.toLocaleString()}</td>
                    <td className="text-right p-3">{deposit.currency === "ILS" ? "שקל" : "דולר"}</td>
                    <td className="text-right p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editDeposit(deposit)}
                        className="ml-2"
                      >
                        ערוך
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDeposit(deposit.id)}
                      >
                        מחק
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
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <Button onClick={editingConversion ? updateConversion : addConversion}>
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
                      <td className="text-right p-3">{conversion.date}</td>
                      <td className="text-right p-3 font-medium">{conversion.sourceAmount.toLocaleString()}</td>
                      <td className="text-right p-3">{conversion.sourceCurrency === "ILS" ? "שקל" : "דולר"}</td>
                      <td className="text-right p-3">{conversion.exchangeRate}</td>
                      <td className="text-right p-3">{conversion.targetCurrency === "ILS" ? "שקל" : "דולר"}</td>
                      <td className="text-right p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editConversion(conversion)}
                          className="ml-2"
                        >
                          ערוך
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteConversion(conversion.id)}
                        >
                          מחק
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
    </div>
  );
}