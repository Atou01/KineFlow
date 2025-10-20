import { Sidebar } from "@/components/Sidebar";
import BillingBanner from "@/components/BillingBanner";

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-50 min-h-screen">
        <div className="p-6">
          <BillingBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
