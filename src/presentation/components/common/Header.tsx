"use client";

import React, { useState } from "react";
import { useLocation } from "@/presentation/context/LocationContext";
import { useAQI } from "@/presentation/context/AQIContext";
import { useTheme } from "@/presentation/theme/ThemeProvider";
import { LocationSearchModal } from "./LocationSearchModal";
import { AQIBadge } from "./AQIBadge";
import {
  Wind,
  MapPin,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  Bell,
  RefreshCw,
} from "lucide-react";

export type NavigationTab =
  | "overview"
  | "live-aqi"
  | "ai-assistant"
  | "family-plan"
  | "recommendations"
  | "indoor-aq"
  | "sustainability"
  | "community"
  | "settings";

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { location, standard, setStandard } = useLocation();
  const { data, isLoading, refreshAQI, notificationsEnabled, requestNotificationPermission } = useAQI();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "live-aqi", label: "Live AQI" },
    { id: "ai-assistant", label: "AI Assistant" },
    { id: "family-plan", label: "My Family Plan" },
    { id: "recommendations", label: "Daily Recommendations" },
    { id: "indoor-aq", label: "Indoor Air Quality" },
    { id: "sustainability", label: "Sustainable Living" },
    { id: "community", label: "Community" },
    { id: "settings", label: "Settings" },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const cycleTheme = () => {
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onTabChange("overview")}
                className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                  <Wind className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 dark:from-brand-400 dark:via-cyan-300 dark:to-emerald-400 bg-clip-text text-transparent">
                    ClearSkies
                  </span>
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded-md font-bold bg-brand-100 dark:bg-brand-900/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    AI
                  </span>
                </div>
              </button>
            </div>

            {/* Location Selector Pill */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 max-w-[190px] sm:max-w-xs truncate"
                aria-label={`Current location: ${location.name}. Click to change location.`}
              >
                <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="truncate">{location.name}</span>
                {location.state && (
                  <span className="hidden md:inline text-slate-500 dark:text-slate-300 text-xs">
                    ({location.state})
                  </span>
                )}
              </button>

              {/* Live AQI Badge in Header */}
              {data && (
                <div className="hidden sm:block">
                  <AQIBadge category={data.category} aqi={data.aqi} size="sm" />
                </div>
              )}
            </div>

            {/* Right Controls: Refresh, Standard Toggle, Theme Toggle, Mobile Menu Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Refresh AQI */}
              <button
                onClick={refreshAQI}
                disabled={isLoading}
                title="Refresh Air Quality Data"
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Refresh air quality data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              {/* Standard Selector (Indian NAQI / US AQI) */}
              <div className="hidden md:flex items-center border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setStandard("INDIAN_NAQI")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    standard === "INDIAN_NAQI"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  aria-pressed={standard === "INDIAN_NAQI"}
                >
                  NAQI (IN)
                </button>
                <button
                  onClick={() => setStandard("US_AQI")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    standard === "US_AQI"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  aria-pressed={standard === "US_AQI"}
                >
                  US AQI
                </button>
              </div>

              {/* Notification Permission Bell */}
              <button
                onClick={requestNotificationPermission}
                title={notificationsEnabled ? "Browser Alerts Enabled" : "Enable Severe Smog Alerts"}
                className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  notificationsEnabled
                    ? "text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                    : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                aria-label="Toggle smog alert notifications"
                aria-pressed={notificationsEnabled}
              >
                <Bell className="w-4 h-4" />
              </button>

              {/* Theme Switcher */}
              <button
                onClick={cycleTheme}
                title={`Theme: ${theme}. Click to switch.`}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={`Current theme is ${theme}. Click to change theme.`}
              >
                {theme === "system" ? (
                  <Laptop className="w-4 h-4" />
                ) : resolvedTheme === "dark" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div
            role="group"
            aria-label="Location and air quality context"
            className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 py-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300"
          >
            <span>
              Current location: <strong className="text-slate-900 dark:text-white">{location.name}</strong>
              {location.state || location.country ? `, ${location.state || location.country}` : ""}
            </span>
            <span>
              AQI shown for: <strong className="text-slate-900 dark:text-white">{location.name}</strong>
              {location.state || location.country ? `, ${location.state || location.country}` : ""}
            </span>
            {data?.station?.name && (
              <span>
                Monitoring station: <strong className="text-slate-900 dark:text-white">{data.station.name}</strong>
              </span>
            )}
            <span>
              GPS place names ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-brand-700 dark:hover:text-brand-300"
              >
                OpenStreetMap contributors
              </a>
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center space-x-1 overflow-x-auto py-1 border-t border-slate-100 dark:border-slate-800/60 no-scrollbar"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`px-3 py-2 text-xs xl:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isActive
                      ? "bg-brand-50 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="lg:hidden px-4 pt-2 pb-4 space-y-1 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase">AQI Standard</span>
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setStandard("INDIAN_NAQI")}
                  className={`px-2.5 py-1 rounded font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                    standard === "INDIAN_NAQI"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                  aria-pressed={standard === "INDIAN_NAQI"}
                >
                  Indian NAQI
                </button>
                <button
                  onClick={() => setStandard("US_AQI")}
                  className={`px-2.5 py-1 rounded font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                    standard === "US_AQI"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                  aria-pressed={standard === "US_AQI"}
                >
                  US AQI
                </button>
              </div>
            </div>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isActive
                      ? "bg-brand-600 text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Location Search Modal */}
      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
}
