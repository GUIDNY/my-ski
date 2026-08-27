import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const maxDuration = 60;

// Renders the existing /admin/proposals/[id]/print page (same component,
// same CSS a human sees when they click "save as PDF") headlessly, so the
// bot can attach a real PDF file instead of asking someone to click print.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = createServerClient();
  const { data: proposal, error } = await db.from("proposals").select("id").eq("id", id).single();
  if (error || !proposal) {
    return NextResponse.json({ error: "proposal not found" }, { status: 404 });
  }

  const origin = new URL(req.url).origin;
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${origin}/admin/proposals/${id}/print`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    // Buffer satisfies Node's actual runtime BodyInit; TS's DOM lib doesn't know that.
    return new NextResponse(Buffer.from(pdf) as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="proposal-${id}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
