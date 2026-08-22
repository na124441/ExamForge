import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ExamForge — Serious Examination Operating System',
    short_name: 'ExamForge',
    description: 'Zero-Trust Secure Examination Infrastructure, SafeBatch Bulk Operations, and Verifiable Scorecard Registry.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0B1A17',
    theme_color: '#132D28',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Candidate Scorecards',
        short_name: 'Results',
        description: 'Look up official examination scorecards and digital transcripts',
        url: '/result-portal',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Student Examination Portal',
        short_name: 'Student',
        description: 'Distraction-free CBT examination window and identity onboarding',
        url: '/candidate',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'SafeBatch Studio',
        short_name: 'SafeBatch',
        description: 'Safeguarded high-throughput candidate batch allocation',
        url: '/safebatch',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Public Verifier',
        short_name: 'Verifier',
        description: 'Verify cryptographic proof of marks on immutable ledger',
        url: '/verify-result',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
