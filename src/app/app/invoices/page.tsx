"use client";

import { useEffect, useState } from "react";

type Row = { id: string; number: string; issue_date: string; total_cents: number; paid: boolean };

export default function InvoicesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createSample() {
    setCreating(true);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: null,
        items: [
          { description: "Séance", qty: 1, unit_price_cents: 5000 }
        ],
        tax_rate: 0
      })
    });
    setCreating(false);
    load();
  }

  async function markPaid(id: string, paid: boolean) {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid })
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Factures</h1>
        <div className="flex gap-2">
          <a className="border px-3 py-2 rounded" href="/api/export/invoices.csv">Exporter CSV</a>
          <button
            onClick={createSample}
            disabled={creating}
            className="bg-black text-white px-3 py-2 rounded"
          >
            {creating ? "Création..." : "Nouvelle facture (exemple)"}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <table className="w-full bg-white rounded-xl shadow overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Numéro</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.number}</td>
                <td className="p-3">{new Date(r.issue_date).toLocaleDateString("fr-FR")}</td>
                <td className="p-3">{(r.total_cents/100).toFixed(2)} €</td>
                <td className="p-3">{r.paid ? "Payée" : "En attente"}</td>
                <td className="p-3 flex gap-2">
                  <a className="underline" href={`/api/invoices/${r.id}/pdf`} target="_blank">PDF</a>
                  {r.paid ? (
                    <button className="text-sm underline" onClick={() => markPaid(r.id, false)}>Marquer non-payé</button>
                  ) : (
                    <button className="text-sm underline" onClick={() => markPaid(r.id, true)}>Marquer payé</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-3" colSpan={5}>Aucune facture. Créez un exemple.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
