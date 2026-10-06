import { NextRequest, NextResponse } from "next/server";
import { engineFetch } from "@/lib/engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = {
      prompt: body.prompt ?? "",
      lyrics: body.lyrics ?? "",
      duration: Number(body.duration ?? 180),
      bpm: body.bpm ? Number(body.bpm) : undefined,
      keyscale: body.keyscale || undefined,
      timesignature: body.timesignature || "4",
      instrumental: Boolean(body.instrumental),
      batch_size: Math.min(Math.max(Number(body.batch_size ?? 1), 1), 4),
      seed: body.seed ? Number(body.seed) : -1,
      format: body.format || "wav",
    };

    const response = await engineFetch("/release_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || data?.detail || "El motor rechazó la generación.", raw: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar la generación." },
      { status: 500 }
    );
  }
}
