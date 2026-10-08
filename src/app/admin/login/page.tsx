"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Incorrect password");
        setSubmitting(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-stone-50 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-stone-900">Truck owner login</h1>
        <p className="mt-1 text-sm text-stone-500">Manage your food truck, menu, and orders.</p>

        <label className="mt-6 block text-sm font-medium text-stone-900">Admin password</label>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-orange-600 px-5 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
