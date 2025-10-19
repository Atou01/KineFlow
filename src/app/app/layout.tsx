import BillingBanner from "@/components/BillingBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="p-6">
      <BillingBanner />
      {children}
    </section>
  );
}
