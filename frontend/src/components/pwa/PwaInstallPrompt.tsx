"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => console.warn("[PWA] Service Worker:", err));
      });
    }

    // 2. Check standalone mode
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 3. Capture native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissedAt = localStorage.getItem("examforge_pwa_dismissed");
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > 86400000 * 3) {
        setTimeout(() => setShowBanner(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Handle completed app installation
    window.addEventListener("appinstalled", () => {
      setInstalledSuccessfully(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    // 5. Global 1-click trigger from buttons across the app
    const handleDirectInstallTrigger = () => {
      triggerDirectDownloadOrInstall();
    };
    window.addEventListener("open-pwa-install", handleDirectInstallTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-install", handleDirectInstallTrigger);
    };
  }, [deferredPrompt]);

  const triggerDirectDownloadOrInstall = async () => {
    // A. Direct Native 1-Tap Install Prompt (Android / Chrome / Edge / Desktop)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setInstalledSuccessfully(true);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn("Direct install prompt error:", err);
      }
    }

    // B. Direct iOS 1-Tap WebClip Profile Download
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (isIos) {
      window.location.href = "/api/download-app?type=mobileconfig";
      setShowBanner(false);
      return;
    }

    // C. Direct Desktop / General Launcher Download
    window.location.href = "/api/download-app";
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("examforge_pwa_dismissed", Date.now().toString());
  };

  if (isStandalone || (!showBanner && !installedSuccessfully)) {
    return null;
  }

  return (
    <>
      {/* 1-Click Floating Bottom Download / Install Banner (NO instruction dialogs) */}
      {showBanner && (
        <aside
          aria-label="Download ExamForge App"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300 select-none print:hidden"
        >
          <div className="p-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl backdrop-blur-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0D2520] border border-emerald-500/40 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  <Image
                    src="/icon-192.png" 
                    alt="ExamForge Icon" 
                    width={44} 
                    height={44} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-ink)] leading-tight">
                    Download ExamForge App
                  </h4>
                  <p className="text-[11px] text-[var(--color-ink-secondary)] mt-0.5">
                    Fast, standalone examination client with zero latency.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer"
                aria-label="Close download prompt"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={triggerDirectDownloadOrInstall}
                className="py-2.5 px-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all"
              >
                <Download size={14} className="animate-bounce" />
                <span>Download App</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] text-xs font-medium cursor-pointer transition-colors text-center"
              >
                Not Now
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Success Notification */}
      {installedSuccessfully && (
        <aside
          aria-label="Installation Confirmation"
          className="fixed bottom-4 right-4 z-50 p-4 rounded-2xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/40 text-[var(--color-success-text)] shadow-xl animate-in fade-in flex items-center gap-3 text-xs font-bold"
        >
          <Check size={18} className="text-[var(--color-success)] shrink-0" />
          <span>ExamForge is ready on your device home screen!</span>
          <button onClick={() => setInstalledSuccessfully(false)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            <X size={14} />
          </button>
        </aside>
      )}
    </>
  );
}
