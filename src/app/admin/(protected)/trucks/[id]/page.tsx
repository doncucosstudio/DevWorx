import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TruckForm from "../truck-form";

export const dynamic = "force-dynamic";

export default async function EditTruckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const truck = await prisma.truck.findUnique({ where: { id } });
  if (!truck) notFound();

  return (
    <div>
      <Link href="/admin" className="text-sm text-stone-500 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{truck.name} settings</h1>
      <div className="mt-2 flex gap-4 text-sm">
        <Link href={`/admin/trucks/${truck.id}/menu`} className="font-medium text-orange-600 hover:underline">
          Manage menu →
        </Link>
        <Link href={`/admin/trucks/${truck.id}/orders`} className="font-medium text-orange-600 hover:underline">
          View orders →
        </Link>
      </div>

      <div className="mt-6 max-w-3xl">
        <TruckForm truck={truck} />
      </div>
    </div>
  );
}
