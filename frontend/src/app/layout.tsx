import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "../components/shell/AppShell";

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
  themeColor: "#081310",
};

export const metadata: Metadata = {
  title: "ExamForge",
  description: "Secure examination infrastructure for trusted, large-scale assessments.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-icon.png",
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
      data-theme="dark"
      data-density="comfortable"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#081310] text-[#FFF4E2]`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#081310] text-[#FFF4E2]"
        suppressHydrationWarning
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
