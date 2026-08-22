import { NextResponse } from "next/server";

export async function GET() {
  const script = `
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
        .then(() => self.registration.unregister())
      );
    });
  `;
  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
