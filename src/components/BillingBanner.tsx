"use client";
import { useEffect, useState } from "react";

export default function BillingBanner() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      // Force no-cache pour toujours récupérer le statut à jour
      const res = await fetch("/api/me/billing", { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!res.ok) return;
      const b = await res.json();
      if (b.plan_status === "past_due") {
        const left = b.grace_until ? Math.max(0, Math.ceil((new Date(b.grace_until).getTime() - Date.now())/86400000)) : null;
        setMsg(`Paiement en échec — ${
          left !== null ? `grâce ${left}j restant` : "période de grâce"
        }. Veuillez mettre à jour votre paiement.`);
      } else if (b.plan_status === "inactive" || b.plan_status === "canceled") {
        setMsg("Abonnement inactif — certaines actions sont bloquées.");
      } else {
        setMsg(null);
      }
    })();
  }, []);
  if (!msg) return null;
  return (
    <div className="bg-yellow-100 text-yellow-900 px-4 py-3 rounded-xl mb-4">
      <div className="flex items-center justify-between">
        <span>{msg}</span>
        <a href="/app/billing" className="underline">Gérer mon abonnement</a>
      </div>
    </div>
  );
}
