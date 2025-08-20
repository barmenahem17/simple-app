"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RightSideMenu } from "@/components/RightSideMenu";

export function AppTopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="border-b bg-background sticky top-0 z-50">
        <div className="flex h-16 items-center px-4">
          <div className="ml-auto">
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
        </div>
      </div>
      <RightSideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}