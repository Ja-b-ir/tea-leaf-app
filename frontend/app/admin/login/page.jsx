"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../../lib/auth.js";
import { API_BASE } from "../../../lib/api.js";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      if (!res.ok) throw new Error("Incorrect username or password.");
      const data = await res.json();
      setToken(data.access_token);
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <form onSubmit={submit} className="bg-cream rounded-2xl p-8 w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber mb-2">
          Tea Leaf Clinic
        </p>
        <h1 className="font-display text-2xl text-ink mb-6">Admin sign in</h1>

        <label className="block text-sm text-ink/70 mb-1">Username</label>
        <input
          className="w-full border border-ink/15 rounded-lg px-3 py-2 mb-4 bg-white/70 focus:border-amber outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <label className="block text-sm text-ink/70 mb-1">Password</label>
        <input
          type="password"
          className="w-full border border-ink/15 rounded-lg px-3 py-2 mb-5 bg-white/70 focus:border-amber outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-alert text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-tea text-cream rounded-lg py-2.5 font-medium hover:bg-tea-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-ink/40 mt-4">
          Default demo credentials: admin / admin123
        </p>
      </form>
    </div>
  );
}
