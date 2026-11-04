import { NextRequest, NextResponse } from "next/server";
import { isAdminUser, sessionUser } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { sellerIn } from "@/lib/sellers";
import { readSellerConfig, sellersOf } from "@/lib/seller-store";

/* who is signed in, for the header link and the seller area: { admin, seller } (never an error) */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ ok: true, admin: false, seller: null });
  const seller = sellerIn(sellersOf(await readSellerConfig(createServerClient())), user.email);
  return NextResponse.json({ ok: true, admin: isAdminUser(user), seller });
}
