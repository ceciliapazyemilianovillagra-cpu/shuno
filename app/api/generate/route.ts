import { NextRequest, NextResponse } from "next/server";
import { engineFetch } from "@/lib/engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const requestedPrompt = String(body.prompt ?? "").trim();
    const instrumental = Boolean(body.instrumental);
    const seedProvided = body.seed !== undefined && body.seed !== null && String(body.seed) !== "";

    const payload = {
      prompt: instrumental
        ? `${requestedPrompt}${requestedPrompt ? ", " : ""}instrumental, no vocals`
        : requestedPrompt,
      lyrics: instrumental ? "" : String(body.lyrics ?? ""),
      audio_duration: Number(body.duration ?? 180),
      bpm: body.bpm ? Number(body.bpm) : undefined,
      key_scale: body.keyscale || undefined,
      time_signature: body.timesignature || "4",
      batch_size: Math.min(Math.max(Number(body.batch_size ?? 1), 1), 4),
      seed: seedProvided ? Number(body.seed) : -1,
      use_random_seed: !seedProvided,
      audio_format: body.format || "wav",
      thinking: true,
      use_format: true,
      task_type: "text2music",
    };

    const response = await engineFetch("/release_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.code >= 400 || data?.error) {
      return NextResponse.json(
        { error: data?.error || data?.detail || "El motor rechazó la generación.", raw: data },
        { status: response.ok ? 502 : response.status }
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
