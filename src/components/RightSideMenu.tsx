"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";

interface RightSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RightSideMenu({ isOpen, onClose }: RightSideMenuProps) {
  const mainLinks = [
    { href: "/", label: "דף הבית" },
    { href: "/extrade", label: "Extrade" },
    { href: "/ibkr", label: "IBKR" },
    { href: "/kraken", label: "Kraken" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-right text-2xl font-bold pr-8">
            FINBAR
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full mt-4">
          <nav className="flex-1">
            <ul className="space-y-1">
              {mainLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block px-4 py-4 text-right hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium text-foreground/90 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="mt-auto">
            <Separator className="my-4" />
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center justify-start px-4 py-4 text-right hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors gap-3 font-medium text-foreground/90 hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
              הגדרות
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}