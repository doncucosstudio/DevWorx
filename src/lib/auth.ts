import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ft_admin_session";
const SIGNED_PAYLOAD = "admin-authenticated";

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "changeme123";
}

function expectedToken(): string {
  return createHmac("sha256", getSecret()).update(SIGNED_PAYLOAD).digest("hex");
}

export function checkAdminPassword(password: string): boolean {
  return password === getSecret();
}

export function sessionCookieValue(): string {
  return expectedToken();
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = expectedToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function requireAdmin(): Promise<Response | null> {
  const ok = await isAdminAuthenticated();
  if (ok) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
