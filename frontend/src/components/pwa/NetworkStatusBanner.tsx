"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <aside
      aria-live="polite"
      aria-label="Network Connectivity Alert"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md",
        !isOnline
          ? "bg-amber-600 text-white animate-pulse"
          : "bg-emerald-600 text-white animate-in fade-in slide-in-from-top-1"
      )}
      style={{ paddingTop: "max(8px, env(safe-area-inset-top, 0px))" }}
    >
      {!isOnline ? (
        <>
          <WifiOff size={14} className="animate-bounce shrink-0" />
          <span>Offline Mode — Transactional examination actions require active internet connection.</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-800 text-white text-[10px] uppercase cursor-pointer flex items-center gap-1"
          >
            <RefreshCw size={10} />
            Retry
          </button>
        </>
      ) : (
        <>
          <Wifi size={14} className="shrink-0" />
          <span>Online — Internet connection restored.</span>
        </>
      )}
    </aside>
  );
}
