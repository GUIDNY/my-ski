/*
 * Val Thorens Immobilier (Arkiane / locvacances) tour-operator area: a server-side
 * login with Idan's TO account (VTI_TO_USER / VTI_TO_PASS, set by Idan in Vercel,
 * never in the code or the chat), then pages fetched with the session cookies.
 */
export const VTI = "https://valthorensimmobilier.locvacances.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

export class Jar {
  c = new Map<string, string>();
  take(res: Response) {
    const list = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
    for (const raw of list) {
      const [kv] = raw.split(";");
      const i = kv.indexOf("=");
      if (i > 0) this.c.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
    }
  }
  header() { return [...this.c].map(([k, v]) => `${k}=${v}`).join("; "); }
}

/** GET/POST with cookies, following redirects by hand (so every Set-Cookie is kept) */
export async function vtiFetch(jar: Jar, url: string, init: RequestInit = {}): Promise<{ url: string; status: number; html: string }> {
  let u = url.startsWith("http") ? url : VTI + url;
  let opts: RequestInit = init;
  for (let hop = 0; hop < 8; hop++) {
    const res = await fetch(u, {
      ...opts, redirect: "manual", cache: "no-store",
      headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9", ...(opts.headers || {}), Cookie: jar.header() },
      signal: AbortSignal.timeout(25000),
    });
    jar.take(res);
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      u = new URL(loc, u).toString();
      opts = {}; // after a POST, the redirect is a GET
      continue;
    }
    return { url: u, status: res.status, html: await res.text() };
  }
  throw new Error("too many redirects");
}

export async function vtiLogin(): Promise<{ jar: Jar; ok: boolean; landing: { url: string; status: number; html: string } }> {
  const user = process.env.VTI_TO_USER, pass = process.env.VTI_TO_PASS;
  if (!user || !pass) throw new Error("VTI_TO_USER / VTI_TO_PASS missing");
  const jar = new Jar();
  const page = await vtiFetch(jar, "/?ReturnUrl=~%2Ffr-FR%2FTourOperator");
  const token = page.html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)?.[1] || "";
  const body = new URLSearchParams({ __RequestVerificationToken: token, UserName: user, Password: pass, RememberMe: "false", UserRole: "TOP" });
  const landing = await vtiFetch(jar, "/?ReturnUrl=~%2Ffr-FR%2FTourOperator", {
    method: "POST", body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: page.url },
  });
  const ok = !/name="Password"/.test(landing.html) && /TourOperator/i.test(landing.url + landing.html);
  return { jar, ok, landing };
}
