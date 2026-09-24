import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/history — últimas decisiones registradas.
 * Query params: ?limit=20
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "20")),
  );

  const rows = await db.decisionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      state: r.state,
      state_preview: r.state.slice(0, 160),
      questions: JSON.parse(r.questionsJson),
      answers: JSON.parse(r.answersJson),
      escalated: JSON.parse(r.escalatedJson) as string[],
      model: r.model,
      input_tokens: r.inputTokens,
      output_tokens: r.outputTokens,
      latency_ms: r.latencyMs,
      requires_escalation: r.requiresEscalation,
      threshold: r.threshold,
      created_at: r.createdAt,
    })),
  });
}

/**
 * DELETE /api/history — borra todo el historial.
 */
export async function DELETE() {
  await db.decisionLog.deleteMany({});
  return NextResponse.json({ ok: true });
}
