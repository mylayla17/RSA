/**
 * Sovereign Reserve Agent - Main Page Entry Point
 * Next.js 14 App Router Page Component
 */

import SovereignDashboard from '@/ui/SovereignDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <SovereignDashboard />
    </main>
  );
}
