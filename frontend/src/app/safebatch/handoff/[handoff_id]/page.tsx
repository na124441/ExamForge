"use client";

import React from "react";
import { useParams } from "next/navigation";
import { SafeBatchHandoffDetail } from "@/components/safebatch/SafeBatchHandoffDetail";

export default function SafeBatchHandoffPage() {
  const params = useParams();
  const handoffId = (params?.handoff_id as string) || "HO-2026-0822-0034";

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto font-sans animate-fade-in">
      <SafeBatchHandoffDetail handoffId={handoffId} />
    </div>
  );
}
