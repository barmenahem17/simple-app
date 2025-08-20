"use client";

import { MetricCard } from "@/components/MetricCard";
import { useEffect, useState } from "react";

interface Deposit {
  id: string;
  date: string;
  amount: number;
  currency: "ILS" | "USD";
}

export default function Home() {
  const [krakenDeposits, setKrakenDeposits] = useState<Deposit[]>([]);
  const [ibkrDeposits, setIbkrDeposits] = useState<Deposit[]>([]);
  const [extradeDeposits, setExtradeDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    const loadDeposits = () => {
      try {
        const krakenData = localStorage.getItem('kraken-deposits');
        const ibkrData = localStorage.getItem('ibkr-deposits');
        const extradeData = localStorage.getItem('extrade-deposits');
        
        setKrakenDeposits(krakenData ? JSON.parse(krakenData) : []);
        setIbkrDeposits(ibkrData ? JSON.parse(ibkrData) : []);
        setExtradeDeposits(extradeData ? JSON.parse(extradeData) : []);
      } catch (error) {
        console.error('Error loading deposits:', error);
      }
    };

    loadDeposits();
    const interval = setInterval(loadDeposits, 1000);
    return () => clearInterval(interval);
  }, []);

  const allDeposits = [...krakenDeposits, ...ibkrDeposits, ...extradeDeposits];
  const totalILS = allDeposits.filter(d => d.currency === "ILS").reduce((sum, d) => sum + d.amount, 0);
  const totalUSD = allDeposits.filter(d => d.currency === "USD").reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-right text-foreground">
          ברוך הבא, בר!
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="סה״כ שווי כל התיקים"
          value={`₪ ${totalILS.toLocaleString()} | $ ${totalUSD.toLocaleString()}`}
        />
        <MetricCard
          title="סה״כ רווח/הפסד על כל התיקים"
          value="—% / —"
          valueClassName="text-green-600"
        />
        <MetricCard
          title="סה״כ מזומן בשקל ומזומן בדולר"
          value={`₪ ${totalILS.toLocaleString()} | $ ${totalUSD.toLocaleString()}`}
        />
      </div>
    </div>
  );
}
