"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type Overview = {
  total_revenue_cents: number;
  revenue_this_month_cents: number;
  clients_count: number;
  appointments_this_week: number;
  weekly_revenue: { week_start: string; total_eur: number }[];
};

function kpi(value: string, label: string) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/stats/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    })();
  }, []);

  if (!data) return <div className="p-6">Chargement…</div>;

  const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpi(eur(data.total_revenue_cents), "Revenu total (payé)")}
        {kpi(eur(data.revenue_this_month_cents), "Revenu ce mois-ci")}
        {kpi(String(data.clients_count), "Clients")}
        {kpi(String(data.appointments_this_week), "RDV cette semaine")}
      </div>

      {/* Chart revenus 8 semaines */}
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="mb-3 font-medium">Revenus par semaine (8 dernières)</div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={data.weekly_revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week_start" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total_eur" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
