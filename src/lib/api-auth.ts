import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { ADMIN_EMAILS } from "@/lib/admins";

/**
 * Server-side checks for the API routes. The browser sends the visitor's
 * Supabase session as `Authorization: Bearer <access token>` (lib/auth-fetch)
 * and the token is verified with Supabase Auth on every call.
 *
 * Admins are the emails in lib/admins.ts plus ADMIN_EMAILS (comma separated,
 * optional env), or a user whose app_metadata.role is "admin" (only the
 * service role can set app_metadata). user_metadata is NOT trusted here:
 * any signed-in user can edit their own user_metadata.
 */

function bearer(req: NextRequest): string {
  const h = req.headers.get("authorization") ?? "";
  return /^Bearer\s+/i.test(h) ? h.replace(/^Bearer\s+/i, "").trim() : "";
}

/** The signed-in user behind the request, or null. */
export async function sessionUser(req: NextRequest): Promise<User | null> {
  const token = bearer(req);
  if (!token) return null;
  try {
    const { data, error } = await createServerClient().auth.getUser(token);
    return error || !data?.user ? null : data.user;
  } catch {
    return null;
  }
}

export function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  const extra = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const email = (user.email ?? "").toLowerCase();
  return (!!email && (ADMIN_EMAILS.includes(email) || extra.includes(email))) || user.app_metadata?.role === "admin";
}

/**
 * Admin-only routes: `const denied = await requireAdmin(req); if (denied) return denied;`
 * null = a signed-in admin; otherwise the 401/403 response to send back.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "login required" }, { status: 401 });
  if (!isAdminUser(user)) return NextResponse.json({ error: "admins only" }, { status: 403 });
  return null;
}
