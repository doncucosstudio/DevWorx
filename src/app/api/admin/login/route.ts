import { checkAdminPassword, sessionCookieValue, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkAdminPassword(password)) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const response = Response.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=${sessionCookieValue()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${secure}`
  );
  return response;
}
