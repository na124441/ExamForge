"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Check, Smartphone, Share2, PlusSquare, ExternalLink, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA WebAPK capability
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA WebAPK] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already installed & running in standalone mode
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 3. Platform Detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/.test(ua);
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsAndroid(isAndroidDevice);
    setIsIos(isIosDevice);

    // 4. Capture native beforeinstallprompt (Triggers Chrome WebAPK minting on Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Auto-show prompt banner after 2.5 seconds if not dismissed recently
      const dismissedAt = localStorage.getItem("examforge_pwa_dismissed");
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > 86400000 * 3) {
        setTimeout(() => setShowBanner(true), 2500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Handle app installed event
    const handleAppInstalled = () => {
      setInstalledSuccessfully(true);
      setShowBanner(false);
      setShowGuideModal(false);
      setDeferredPrompt(null);
      console.log("[PWA WebAPK] ExamForge installed as a native Android app successfully!");
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // 6. Global trigger listener from Navbar / Hero buttons
    const handleManualInstallTrigger = () => {
      triggerInstallFlow();
    };
    window.addEventListener("open-pwa-install", handleManualInstallTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-pwa-install", handleManualInstallTrigger);
    };
  }, [deferredPrompt]);

  const triggerInstallFlow = async () => {
    // If native prompt is available (Android Chrome / Edge / Chromium)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setInstalledSuccessfully(true);
          setShowBanner(false);
          setShowGuideModal(false);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn("[PWA] Prompt trigger error:", err);
      }
    }

    // If native prompt not ready or on iOS/in-app browser, show native helper guide
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("examforge_pwa_dismissed", Date.now().toString());
  };

  if (isStandalone && !installedSuccessfully) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      {showBanner && !showGuideModal && (
        <aside
          aria-label="Install ExamForge Web App"
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
                  <h4 className="font-bold text-sm text-[var(--color-ink)] leading-tight flex items-center gap-1.5">
                    <span>Install ExamForge App</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">
                      PWA
                    </span>
                  </h4>
                  <p className="text-[11px] text-[var(--color-ink-secondary)] mt-0.5">
                    Install to home screen. Works fast, full-screen, and offline.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer"
                aria-label="Close install prompt"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={triggerInstallFlow}
                className="py-2.5 px-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all"
              >
                <Download size={14} className="animate-bounce" />
                <span>Install App</span>
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

      {/* Manual Install Guide Modal (When Browser hasn't fired auto-prompt or on iOS) */}
      {showGuideModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0D2520] border border-emerald-500/40 flex items-center justify-center overflow-hidden">
                  <Image src="/icon-192.png" alt="ExamForge" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-ink)]">Install ExamForge</h3>
                  <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">Android &amp; Web PWA</span>
                </div>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)} 
                className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {isAndroid ? (
              <div className="space-y-3 font-sans text-xs">
                <p className="text-[11px] text-[var(--color-ink-secondary)]">
                  To install ExamForge as a native Android app via Google Chrome:
                </p>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-accent-surface)] text-[var(--color-accent)] flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div className="text-[11px] text-[var(--color-ink)]">
                    Tap the <strong>Chrome menu (⋮)</strong> in the top-right corner of your browser.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-accent-surface)] text-[var(--color-accent)] flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <div className="text-[11px] text-[var(--color-ink)]">
                    Tap <strong>&quot;Install App&quot;</strong> (or <strong>&quot;Add to Home screen&quot;</strong>).
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  ✓ Chrome will automatically build and install the Android WebAPK with the ExamForge logo on your home screen.
                </p>
              </div>
            ) : isIos ? (
              <div className="space-y-3 font-sans text-xs">
                <p className="text-[11px] text-[var(--color-ink-secondary)]">
                  To install ExamForge on your iPhone / iPad:
                </p>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                  <Share2 size={16} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[var(--color-ink)]">
                    Tap the <strong>Share</strong> button at the bottom of Safari.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                  <PlusSquare size={16} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[var(--color-ink)]">
                    Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-sans text-xs">
                <p className="text-[11px] text-[var(--color-ink-secondary)]">
                  To install on Desktop / Laptop:
                </p>
                <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[11px] text-[var(--color-ink)]">
                  Click the <strong>Install icon (🖥️ ⬇️)</strong> in your Chrome / Edge address bar.
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {installedSuccessfully && (
        <aside
          aria-label="Installation Confirmation"
          className="fixed bottom-4 right-4 z-50 p-4 rounded-2xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/40 text-[var(--color-success-text)] shadow-xl animate-in fade-in flex items-center gap-3 text-xs font-bold"
        >
          <Check size={18} className="text-[var(--color-success)] shrink-0" />
          <span>ExamForge is installed! You can now launch it from your Android home screen or app drawer.</span>
          <button 
            onClick={() => setInstalledSuccessfully(false)} 
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
          >
            <X size={14} />
          </button>
        </aside>
      )}
    </>
  );
}
