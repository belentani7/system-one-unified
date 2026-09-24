import { NextResponse } from "next/server";
import { PRESETS } from "@/lib/systemone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/presets — lista de ejemplos predefinidos.
 */
export async function GET() {
  return NextResponse.json({ presets: PRESETS });
}
