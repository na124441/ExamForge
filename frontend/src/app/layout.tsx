import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "../components/shell/AppShell";
import { PwaInstallPrompt } from "../components/pwa/PwaInstallPrompt";
import { NetworkStatusBanner } from "../components/pwa/NetworkStatusBanner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B1A17" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" }
  ],
};

export const metadata: Metadata = {
  title: "ExamForge — Examination Operating System",
  description: "Zero-Trust Secure Examination Infrastructure, SafeBatch Bulk Operations, and Verifiable Scorecard Registry.",
  applicationName: "ExamForge",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ExamForge",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icon-maskable-512.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ExamForge" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="min-h-full flex flex-col bg-[var(--color-surface)] text-[var(--color-ink)]"
        suppressHydrationWarning
      >
        <NetworkStatusBanner />
        <AppShell>{children}</AppShell>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
