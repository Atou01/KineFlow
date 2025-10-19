"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
  appointments: Array<{ id: string; date: string; duration_minutes: number; status: string }>;
};

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/clients/${params.id}`);
    const data = await res.json();
    setClient(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <p>Chargement…</p>;
  if (!client) return <p>Client introuvable</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{client.first_name} {client.last_name}</h1>
        <a className="underline" href="/app/clients">← Retour à la liste</a>
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold">Informations</h2>
        <p><strong>Email :</strong> {client.email || "—"}</p>
        <p><strong>Téléphone :</strong> {client.phone || "—"}</p>
        <p><strong>Notes :</strong> {client.notes || "—"}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold">Historique des rendez-vous</h2>
        {client.appointments.length === 0 ? (
          <p>Aucun rendez-vous</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Durée</th>
                <th className="p-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {client.appointments.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{new Date(a.date).toLocaleString("fr-FR")}</td>
                  <td className="p-2">{a.duration_minutes} min</td>
                  <td className="p-2">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
