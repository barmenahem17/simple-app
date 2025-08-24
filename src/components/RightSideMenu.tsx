"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings, Home, TrendingUp, BarChart3, Coins } from "lucide-react";
import { getAllPlatformSettings, type PlatformSettings } from "@/lib/database";

interface RightSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RightSideMenu({ isOpen, onClose }: RightSideMenuProps) {
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAllPlatformSettings();
        setPlatformSettings(settings);
      } catch (error) {
        console.error('Error loading platform settings:', error);
      }
    };
    loadSettings();
  }, []);

  const getDisplayName = (platform: string) => {
    const setting = platformSettings.find(s => s.platform === platform);
    return setting?.display_name || platform.toUpperCase();
  };

  const mainLinks = [
    { href: "/", label: "דף הבית", icon: Home },
    { href: "/extrade", label: getDisplayName('extrade'), icon: TrendingUp },
    { href: "/ibkr", label: getDisplayName('ibkr'), icon: BarChart3 },
    { href: "/kraken", label: getDisplayName('kraken'), icon: Coins },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] z-[60]">
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
                      className="group flex items-center px-4 py-4 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium text-foreground/90 hover:text-foreground"
                    >
                      <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground transition-colors ml-2" />
                      <span className="mr-2">{link.label}</span>
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
              className="group flex items-center px-4 py-4 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium text-foreground/90 hover:text-foreground"
            >
              <Settings className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground transition-colors ml-2" />
              <span className="mr-2">הגדרות</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}