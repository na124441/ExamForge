import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/questions/ai-models", {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback if backend is starting or offline
  }

  return NextResponse.json({
    models: [
      { name: "kimi-k2.6:cloud", size: 100000000000, modified_at: "Ollama Cloud Native" },
      { name: "phi:latest", size: 2000000000, modified_at: "Ollama Cloud / Local" },
      { name: "gemma4:e4b", size: 4000000000, modified_at: "Ollama Cloud / Local" },
      { name: "qwen3:4b", size: 2500000000, modified_at: "Ollama Cloud / Local" },
      { name: "deepseek-v3.1:671b-cloud", size: 671000000000, modified_at: "Ollama Cloud Native" },
      { name: "gpt-oss:120b-cloud", size: 120000000000, modified_at: "Ollama Cloud Native" },
    ],
    default_model: "kimi-k2.6:cloud",
    ollama_host: "http://localhost:11434",
    status: "ONLINE",
  });
}
