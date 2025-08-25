"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RightSideMenu } from "@/components/RightSideMenu";
import { ExchangeRate } from "@/components/ExchangeRate";

export function AppTopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [primaryCurrency, setPrimaryCurrency] = useState<'USD' | 'ILS'>('USD');

  const toggleCurrency = () => {
    setPrimaryCurrency(prev => prev === 'USD' ? 'ILS' : 'USD');
  };

  return (
    <>
      <div className="border-b bg-background sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 justify-between">
          {/* כפתור התפריט בצד ימין */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-accent"
              aria-label="פתח תפריט"
            >
              <div className="flex flex-col justify-center items-center w-5 h-5 space-y-1">
                <div className="w-5 h-0.5 bg-current"></div>
                <div className="w-5 h-0.5 bg-current"></div>
                <div className="w-5 h-0.5 bg-current"></div>
              </div>
            </Button>
          </div>
          
          {/* כפתור בחירת מטבע ראשי ושער החליפין בצד שמאל */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCurrency}
              className="px-3 py-1 hover:bg-blue-50 border-blue-200 text-blue-700 font-medium"
              title="החלף מטבע ראשי"
            >
              {primaryCurrency === 'USD' ? '$' : '₪'}
            </Button>
            <ExchangeRate />
          </div>
        </div>
      </div>
      <RightSideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}