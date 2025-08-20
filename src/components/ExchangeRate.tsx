"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ExchangeRateProps {
  className?: string;
}

export function ExchangeRate({ className = "" }: ExchangeRateProps) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string>("");

  const fetchExchangeRate = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Call our API route that handles the external API call
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      
      if (data.success) {
        setRate(data.rate);
        setLastUpdated(new Date().toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit'
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch rate');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setError('שגיאה בטעינת שער');
      // Fallback to approximate current rate
      setRate(3.41);
      setLastUpdated(new Date().toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      <div className="flex items-center gap-2">
        <span className="font-medium text-muted-foreground">USD/ILS:</span>
        {loading ? (
          <div className="animate-pulse text-blue-600 font-medium">טוען...</div>
        ) : error ? (
          <span className="text-red-500 text-xs">{error}</span>
        ) : (
          <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
            {rate ? `₪${rate.toFixed(4)}` : 'N/A'}
          </span>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={fetchExchangeRate}
        disabled={loading}
        className="h-7 w-7 p-0 hover:bg-blue-50 rounded-full"
        title="רענן שער חליפין"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-blue-600' : 'text-muted-foreground'}`} />
      </Button>
      
      {lastUpdated && !loading && (
        <span className="text-xs text-muted-foreground">
          עודכן: {lastUpdated}
        </span>
      )}
    </div>
  );
}