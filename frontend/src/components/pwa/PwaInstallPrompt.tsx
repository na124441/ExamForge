"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Smartphone, Share, PlusSquare, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already running as standalone PWA
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return; // Already installed!

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIos(isIosDevice && isSafari);

    // 4. Capture native beforeinstallprompt for Android / Chromium / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      const dismissedAt = localStorage.getItem("examforge_pwa_dismissed");
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > 86400000 * 3) {
        // Show after 2.5 seconds delay for non-intrusive presentation
        setTimeout(() => setShowPrompt(true), 2500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Handle app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setInstalledSuccessfully(true);
      setShowPrompt(false);
      console.log("[PWA] ExamForge installed to home screen successfully!");
    });

    // If iOS and not dismissed recently, offer iOS guide
    if (isIosDevice && isSafari) {
      const iosDismissed = localStorage.getItem("examforge_ios_pwa_dismissed");
      if (!iosDismissed || Date.now() - parseInt(iosDismissed, 10) > 86400000 * 5) {
        setTimeout(() => setShowPrompt(true), 4000);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback: If browser doesn't support prompt, open guide
      setShowIosGuide(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalledSuccessfully(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    if (isIos) {
      localStorage.setItem("examforge_ios_pwa_dismissed", Date.now().toString());
    } else {
      localStorage.setItem("examforge_pwa_dismissed", Date.now().toString());
    }
  };

  if (isStandalone || (!showPrompt && !showIosGuide && !installedSuccessfully)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      {showPrompt && !showIosGuide && (
        <aside
          aria-label="Install ExamForge Web App"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300 select-none print:hidden"
        >
          <div className="p-4 rounded-2xl bg-[var(--color-surface-raised)] border-2 border-[var(--color-accent)]/40 shadow-2xl backdrop-blur-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0D2520] border border-[var(--color-accent)]/40 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  <Image
                    src="/icon-192.png" 
                    alt="ExamForge Icon" 
                    width={44} 
                    height={44} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[var(--color-ink)] flex items-center gap-1.5">
                    Install ExamForge App
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-accent-surface)] text-[var(--color-accent)] font-bold">
                      PWA
                    </span>
                  </h4>
                  <p className="text-[11px] text-[var(--color-ink-secondary)] leading-snug mt-0.5">
                    Access scorecards, candidate portal &amp; verification offline on your home screen.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 rounded-lg hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer"
                aria-label="Close install prompt"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Smartphone size={14} />
                <span>{isIos ? "Add to Home Screen" : "Install App"}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] text-xs font-medium cursor-pointer transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS "Add to Home Screen" Visual Modal Guide */}
      {showIosGuide && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div 
            className="w-full max-w-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0D2520] border border-[var(--color-accent)]/40 flex items-center justify-center">
                  <Image src="/icon-192.png" alt="ExamForge" width={36} height={36} className="w-full h-full object-contain" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-ink)]">Install on iPhone / iPad</h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              Install ExamForge as a native app on your iOS home screen in two simple taps:
            </p>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-surface)] text-[var(--color-accent)] flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--color-ink)] flex items-center gap-1.5">
                    Tap the Share Button <Share size={14} className="text-[var(--color-accent)]" />
                  </div>
                  <div className="text-[11px] text-[var(--color-ink-secondary)]">
                    Located in Safari's bottom toolbar (or top right on iPad).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-surface)] text-[var(--color-accent)] flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--color-ink)] flex items-center gap-1.5">
                    Tap &quot;Add to Home Screen&quot; <PlusSquare size={14} className="text-[var(--color-accent)]" />
                  </div>
                  <div className="text-[11px] text-[var(--color-ink-secondary)]">
                    Scroll down the share sheet and select &quot;Add to Home Screen&quot;.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Installation Success Toast */}
      {installedSuccessfully && (
        <aside
          aria-label="Installation Confirmation"
          className="fixed bottom-4 right-4 z-50 p-4 rounded-2xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/40 text-[var(--color-success-text)] shadow-xl animate-in fade-in flex items-center gap-3 text-xs font-bold"
        >
          <Check size={18} className="text-[var(--color-success)] shrink-0" />
          <span>ExamForge is installed! You can now launch it from your home screen icon.</span>
          <button onClick={() => setInstalledSuccessfully(false)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            <X size={14} />
          </button>
        </aside>
      )}
    </>
  );
}
