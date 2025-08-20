"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings, Home, TrendingUp, BarChart3, Coins } from "lucide-react";

interface RightSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RightSideMenu({ isOpen, onClose }: RightSideMenuProps) {
  const mainLinks = [
    { href: "/", label: "דף הבית", icon: Home },
    { href: "/extrade", label: "Extrade", icon: TrendingUp },
    { href: "/ibkr", label: "IBKR", icon: BarChart3 },
    { href: "/kraken", label: "Kraken", icon: Coins },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-center text-3xl font-black tracking-wide text-primary">
            FINBAR
          </SheetTitle>
          <Separator className="mt-4" />
        </SheetHeader>
        
        <div className="flex flex-col h-full mt-2">
          <nav className="flex-1">
            <ul className="space-y-1">
              {mainLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="group flex items-center px-4 py-4 text-right hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium text-foreground/90 hover:text-foreground"
                    >
                      <span className="flex-1 text-right">{link.label}</span>
                      <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground transition-colors mr-3" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="mt-auto">
            <Separator className="my-4" />
            <Link
              href="/settings"
              onClick={onClose}
              className="group flex items-center px-4 py-4 text-right hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium text-foreground/90 hover:text-foreground"
            >
              <span className="flex-1 text-right">הגדרות</span>
              <Settings className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground transition-colors mr-3" />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}