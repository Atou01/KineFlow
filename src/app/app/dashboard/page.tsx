"use client";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        // Rafraîchir la session pour éviter le cache
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/signin");
          return;
        }

        // Récupérer workspace avec plan_status et grace_until
        const { data, error } = await supabase
          .from("workspaces")
          .select("id, name, plan, plan_status, grace_until, stripe_customer_id, stripe_subscription_id")
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Aucun workspace trouvé → création auto + redirection
        if (!data || data.length === 0) {
          const { data: newWs, error: createError } = await supabase
            .from("workspaces")
            .insert([{ name: `${user.email} workspace`, plan: "starter" }])
            .select()
            .single();

          if (createError) throw createError;
          setWorkspace(newWs);
          setLoading(false);
          return;
        }

        // Prend le premier workspace dispo
        setWorkspace(data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [supabase, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  if (!workspace) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Aucun workspace trouvé.
      </div>
    );
  }

  // Vérifier le statut d'abonnement
  const isActive = workspace.plan_status === 'active' || 
                   (workspace.plan_status === 'past_due' && workspace.grace_until && new Date(workspace.grace_until) > new Date());

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Bienvenue sur ton dashboard</h1>
      <p className="mt-2 text-gray-600">Espace : {workspace.name}</p>
      <p className="text-sm text-gray-400">Plan : {workspace.plan}</p>
      
      {/* Affichage du statut d'abonnement */}
      <div className="mt-4">
        <p className="text-sm">
          <strong>Statut :</strong> {workspace.plan_status || 'N/A'}
        </p>
        {workspace.grace_until && (
          <p className="text-sm text-orange-600">
            Période de grâce jusqu'au : {new Date(workspace.grace_until).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* Bandeau d'avertissement si inactif */}
      {!isActive && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">⚠️ Abonnement inactif</p>
          <p className="text-red-600 text-sm mt-1">
            Certaines actions sont bloquées. Veuillez mettre à jour votre abonnement.
          </p>
        </div>
      )}

      {/* Message de succès si actif */}
      {isActive && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">✅ Abonnement actif</p>
          <p className="text-green-600 text-sm mt-1">
            Votre abonnement est actif. Vous avez accès à toutes les fonctionnalités.
          </p>
        </div>
      )}
    </div>
  );
}
