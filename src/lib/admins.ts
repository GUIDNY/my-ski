// Emails allowed into admin areas. (Server-side hard protection can be added
// later via middleware; today /admin is gated only client-side.)
export const ADMIN_EMAILS = ["bd12123@gmail.com"];

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
