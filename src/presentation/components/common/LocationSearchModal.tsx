"use client";

import React, { useState, useEffect, useRef } from "react";
import { GeoLocation } from "@/domain/family/types";
import { useLocation } from "@/presentation/context/LocationContext";
import { CPCB_PRESET_CITIES } from "@/infrastructure/aqi/CPCBReferenceProvider";
import { Search, MapPin, Navigation, X, Loader2 } from "lucide-react";

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationSearchModal({ isOpen, onClose }: LocationSearchModalProps) {
  const { setLocation, detectCurrentLocation, isDetectingLocation, locationError } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setResults([]);
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        return;
      }
      if (e.key === "Tab" && isOpen && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // Ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (loc: GeoLocation) => {
    setLocation(loc);
    onClose();
  };

  const handleDetect = async () => {
    const success = await detectCurrentLocation();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={dialogRef} className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <h2 id="location-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Select City or Area
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Close location selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400 dark:text-slate-300" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian city, locality, PIN or global metro..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Search city or area name"
              aria-describedby="location-search-status"
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-3 w-5 h-5 text-brand-500 animate-spin" aria-hidden="true" />
            )}
          </div>
          <p id="location-search-status" role="status" aria-live="polite" className="sr-only">
            {isSearching ? "Searching locations" : searchQuery.trim() ? `${results.length} locations found` : "Enter a city or area to search"}
          </p>

          {/* Detect Location Button */}
          <button
            onClick={handleDetect}
            disabled={isDetectingLocation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border border-brand-300 dark:border-brand-800 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/50 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {isDetectingLocation ? (
              <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Detecting GPS Coordinates...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Auto-Detect Current Location (GPS)</span>
              </>
            )}
          </button>

          {locationError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium" role="alert">
              {locationError}
            </p>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">
                Matching Search Results
              </p>
              {results.map((r, idx) => (
                <button
                  key={`${r.name}-${r.latitude}-${idx}`}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-start gap-3 p-2.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-brand-500 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {r.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-300">
                      {[r.locality, r.state, r.country].filter(Boolean).join(", ")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Popular Cities Preset */}
          {results.length === 0 && !searchQuery.trim() && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Popular Smog-Monitored Cities
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CPCB_PRESET_CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() =>
                      handleSelect({
                        name: city.name,
                        locality: city.stationName.split(",")[0],
                        state: city.state,
                        country: city.country,
                        latitude: city.latitude,
                        longitude: city.longitude,
                      })
                    }
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {city.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-300 truncate max-w-full">
                      {city.state}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
