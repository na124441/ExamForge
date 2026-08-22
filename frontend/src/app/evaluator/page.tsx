"use client";

import React from "react";
import { ForgeEvaluationWorkbench } from "@/components/forge/ForgeEvaluationWorkbench";

export default function EvaluatorPage() {
  return (
    <div className="p-6 max-w-[var(--content-max-width)] mx-auto animate-in fade-in duration-200">
      <ForgeEvaluationWorkbench />
    </div>
  );
}
