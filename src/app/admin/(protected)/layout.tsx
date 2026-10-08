import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import LogoutButton from "./logout-button";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  return (
    <div className="flex flex-1 flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="font-bold text-stone-900">
            🚚 Admin dashboard
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-stone-500 hover:underline">
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
