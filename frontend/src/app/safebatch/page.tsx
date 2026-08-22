"use client";

import React from "react";
import { SafeBatchStudio } from "@/components/safebatch/SafeBatchStudio";

export default function SafeBatchPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto font-sans animate-fade-in">
      <SafeBatchStudio />
    </div>
  );
}
