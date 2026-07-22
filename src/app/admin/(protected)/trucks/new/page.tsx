import Link from "next/link";
import TruckForm from "../truck-form";

export default function NewTruckPage() {
  return (
    <div>
      <Link href="/admin" className="text-sm text-stone-500 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">New food truck</h1>
      <p className="mt-1 text-stone-500">Set up your truck&apos;s page, branding, and details.</p>

      <div className="mt-6 max-w-3xl">
        <TruckForm />
      </div>
    </div>
  );
}
