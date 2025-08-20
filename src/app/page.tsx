"use client";

import { MetricCard } from "@/components/MetricCard";
import { useEffect, useState } from "react";
import { 
  getDeposits, 
  getConversions, 
  calculateActualCash,
  type Deposit,
  type Conversion
} from "@/lib/database";

export default function Home() {
  const [krakenDeposits, setKrakenDeposits] = useState<Deposit[]>([]);
  const [ibkrDeposits, setIbkrDeposits] = useState<Deposit[]>([]);
  const [extradeDeposits, setExtradeDeposits] = useState<Deposit[]>([]);
  
  const [krakenConversions, setKrakenConversions] = useState<Conversion[]>([]);
  const [ibkrConversions, setIbkrConversions] = useState<Conversion[]>([]);
  const [extradeConversions, setExtradeConversions] = useState<Conversion[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading data from Supabase...');
        
        // Load deposits from all platforms
        const [krakenDepositsData, ibkrDepositsData, extradeDepositsData] = await Promise.all([
          getDeposits('kraken'),
          getDeposits('ibkr'),
          getDeposits('extrade')
        ]);
        
        console.log('Deposits loaded:', { krakenDepositsData, ibkrDepositsData, extradeDepositsData });
        
        setKrakenDeposits(krakenDepositsData);
        setIbkrDeposits(ibkrDepositsData);
        setExtradeDeposits(extradeDepositsData);

        // Load conversions from all platforms
        const [krakenConversionsData, ibkrConversionsData, extradeConversionsData] = await Promise.all([
          getConversions('kraken'),
          getConversions('ibkr'),
          getConversions('extrade')
        ]);
        
        console.log('Conversions loaded:', { krakenConversionsData, ibkrConversionsData, extradeConversionsData });
        
        setKrakenConversions(krakenConversionsData);
        setIbkrConversions(ibkrConversionsData);
        setExtradeConversions(extradeConversionsData);
        
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

  // Calculate actual cash for each platform
  const krakenCash = calculateActualCash(krakenDeposits, krakenConversions);
  const ibkrCash = calculateActualCash(ibkrDeposits, ibkrConversions);
  const extradeCash = calculateActualCash(extradeDeposits, extradeConversions);

  const totalILS = krakenCash.ILS + ibkrCash.ILS + extradeCash.ILS;
  const totalUSD = krakenCash.USD + ibkrCash.USD + extradeCash.USD;

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="סה״כ שווי כל התיקים"
          value={`₪ ${Math.round(totalILS)} | $ ${Math.round(totalUSD)}`}
        />
        <MetricCard
          title="סה״כ רווח/הפסד על כל התיקים"
          value="—% / —"
          valueClassName="text-green-600"
        />
        <MetricCard
          title="סה״כ מזומן בשקל ומזומן בדולר"
          value={`₪ ${Math.round(totalILS)} | $ ${Math.round(totalUSD)}`}
        />
      </div>
    </div>
  );
}
