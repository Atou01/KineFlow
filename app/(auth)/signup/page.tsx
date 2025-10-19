"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SignUpPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { workspace_name: "Mon Cabinet" },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      // 1) Cas idéal : session dispo de suite
      if (data?.session) {
        router.push("/app/dashboard");
        return;
      }

      // 2) Fallback universel : on se connecte explicitement
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setMessage(signInError.message || "Connexion impossible après inscription.");
        setLoading(false);
        return;
      }

      if (signInData?.session) {
        router.push("/app/dashboard");
        return;
      }

      // 3) Dernier recours : message explicite
      setMessage("Compte créé. Connecte-toi avec tes identifiants.");
    } catch (err: any) {
      setMessage(err?.message ?? "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form
        onSubmit={handleSignUp}
        className="bg-white p-8 rounded shadow-md w-80 space-y-4"
      >
        <h1 className="text-xl font-bold text-center">Créer un compte</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "Création..." : "S'inscrire"}
        </button>

        {message && <p className="text-center text-sm text-gray-700">{message}</p>}
      </form>
    </div>
  );
}
