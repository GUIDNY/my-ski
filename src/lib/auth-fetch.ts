import { supabase } from "@/lib/supabase-client";

/**
 * fetch() for our own API routes that check who is calling (admin screens,
 * the customer's own orders): adds the signed-in user's Supabase session as
 * `Authorization: Bearer …`. The token is only ever sent to this site's own
 * /api routes, never to another origin. Without a session it's a plain fetch.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const ownApi = input.startsWith("/api/");
  let token = "";
  if (ownApi) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token ?? "";
    } catch { /* no session */ }
  }
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
