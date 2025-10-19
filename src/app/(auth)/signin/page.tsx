"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignIn() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else if (data?.session) {
        router.replace("/app/dashboard");
      } else {
        setMessage("Connexion impossible. Réessaie.");
      }
    } catch (err: any) {
      setMessage(err?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl shadow w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Se connecter</h1>
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          className="border rounded w-full p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Mot de passe"
          className="border rounded w-full p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        {message && <p className="text-center text-sm text-red-600">{message}</p>}
      </form>
    </div>
  );
}
