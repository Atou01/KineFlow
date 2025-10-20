"use client";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/KPICard";
import { Euro, Users, Calendar, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  monthlyRevenue: number;
  upcomingAppointments: number;
  newClients: number;
  totalClients: number;
  revenueData: { month: string; revenue: number }[];
}

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/signin");
          return;
        }

        // Récupérer les stats via l'API
        const res = await fetch("/api/stats/overview", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setStats({
            monthlyRevenue: data.revenue_this_month_cents / 100,
            upcomingAppointments: data.appointments_this_week || 0,
            newClients: 0, // À calculer
            totalClients: data.clients_count || 0,
            revenueData: data.weekly_revenue?.map((w: any) => ({
              month: w.week_start,
              revenue: w.total_eur
            })) || []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-red-600 p-8">
        Erreur lors du chargement des statistiques.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="CA du mois"
          value={`${stats.monthlyRevenue.toFixed(2)} €`}
          icon={Euro}
          subtitle="Factures payées"
        />
        <KPICard
          title="RDV à venir"
          value={stats.upcomingAppointments}
          icon={Calendar}
          subtitle="7 prochains jours"
        />
        <KPICard
          title="Total clients"
          value={stats.totalClients}
          icon={Users}
          subtitle="Clients actifs"
        />
        <KPICard
          title="Croissance"
          value="+12%"
          icon={TrendingUp}
          subtitle="vs mois dernier"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenus (8 dernières semaines)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
