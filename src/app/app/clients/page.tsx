"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState } from "react";

type Client = { id: string; first_name: string; last_name: string; email: string; phone: string };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createClient() {
    setCreating(true);
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setCreating(false);
    setShowForm(false);
    setForm({ first_name: "", last_name: "", email: "", phone: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-3 py-2 rounded"
        >
          {showForm ? "Annuler" : "+ Nouveau client"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-semibold">Ajouter un client</h2>
          <input
            type="text"
            placeholder="Prénom"
            className="border rounded w-full p-2"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Nom"
            className="border rounded w-full p-2"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="border rounded w-full p-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Téléphone"
            className="border rounded w-full p-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button
            onClick={createClient}
            disabled={creating || !form.first_name || !form.last_name}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Création..." : "Créer"}
          </button>
        </div>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <table className="w-full bg-white rounded-xl shadow overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Prénom</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.first_name}</td>
                <td className="p-3">{c.last_name}</td>
                <td className="p-3">{c.email || "—"}</td>
                <td className="p-3">{c.phone || "—"}</td>
                <td className="p-3">
                  <a className="underline" href={`/app/clients/${c.id}`}>Voir détails</a>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td className="p-3" colSpan={5}>Aucun client. Ajoutez-en un.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
