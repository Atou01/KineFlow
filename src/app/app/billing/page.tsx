"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function BillingPage() {
  async function openPortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url;
  }

  async function goCheckout(plan: "starter" | "pro" | "premium") {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Abonnement</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: "starter", title: "Starter", price: "19€/mois" },
          { key: "pro", title: "Pro", price: "49€/mois" },
          { key: "premium", title: "Premium", price: "99€/mois" },
        ].map((p) => (
          <div key={p.key} className="bg-white rounded-2xl shadow p-5">
            <div className="text-xl font-semibold">{p.title}</div>
            <div className="text-gray-500 mt-1">{p.price}</div>
            <button
              onClick={() => goCheckout(p.key as any)}
              className="mt-4 bg-black text-white px-3 py-2 rounded"
            >
              Choisir {p.title}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <div className="font-medium mb-2">Gérer mon abonnement</div>
        <button onClick={openPortal} className="border px-3 py-2 rounded">
          Ouvrir le portail Stripe
        </button>
      </div>
    </div>
  );
}
