"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TruckRowActions({
  truckId,
  isOpen,
}: {
  truckId: string;
  isOpen: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleOpen() {
    setBusy(true);
    await fetch(`/api/trucks/${truckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen: !isOpen }),
    });
    router.refresh();
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this truck and all of its menu items and orders? This can't be undone.")) return;
    setBusy(true);
    await fetch(`/api/trucks/${truckId}`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={toggleOpen}
        disabled={busy}
        className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
      >
        {isOpen ? "Close truck" : "Open truck"}
      </button>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="rounded-full border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </>
  );
}
