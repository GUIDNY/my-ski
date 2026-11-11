import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { checkOverbooking } from "@/lib/overbooking";
import { reblockActiveOrders } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Admin button: verify no site order is left OPEN on Airbnb (overbooking risk).
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = createServerClient();
  // the button also closes again any night an active order lost
  await reblockActiveOrders(db);
  return NextResponse.json(await checkOverbooking(db));
}
