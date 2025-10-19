"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignUp() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { workspace_name: "Mon Cabinet" }
      }
    });

    if (error) setMessage(error.message);
    else setMessage("Vérifie ta boîte mail pour confirmer ton compte.");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSignUp} className="bg-white p-8 rounded-2xl shadow w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Créer un compte</h1>
        <input
          type="email"
          placeholder="Email"
          className="border rounded w-full p-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="border rounded w-full p-2 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Création..." : "S'inscrire"}
        </button>
        {message && <p className="text-center text-sm mt-4">{message}</p>}
      </form>
    </div>
  );
}
