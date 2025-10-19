"use client";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/signin");
          return;
        }

        const { data, error } = await supabase
          .from("workspaces")
          .select("id, name, plan")
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Bienvenue sur ton dashboard</h1>
      <p className="mt-2 text-gray-600">Espace : {workspace.name}</p>
      <p className="text-sm text-gray-400">Plan : {workspace.plan}</p>
    </div>
  );
}
