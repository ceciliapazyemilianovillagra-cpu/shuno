import { NextRequest, NextResponse } from "next/server";
import { engineFetch } from "@/lib/engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const taskId = body.task_id;
    if (!taskId) return NextResponse.json({ error: "Falta task_id." }, { status: 400 });

    const response = await engineFetch("/query_result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id_list: [taskId] }),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo consultar el estado." },
      { status: 500 }
    );
  }
}
