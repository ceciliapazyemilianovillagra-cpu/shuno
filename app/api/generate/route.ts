import { NextRequest, NextResponse } from "next/server";
import { engineFetch } from "@/lib/engine";
import { sunoFetch } from "@/lib/suno";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const engine = body.engine === "ace" ? "ace" : "suno";

    if (engine === "suno") {
      const instrumental = Boolean(body.instrumental);
      const title = String(body.title || "SHUNO Song").trim().slice(0, 80);
      const lyrics = String(body.lyrics ?? "").trim();
      const meter = body.timesignature === "6" ? "6/8" : `${body.timesignature || "4"}/4`;
      const styleParts = [
        String(body.prompt ?? "").trim(),
        body.bpm ? `${Number(body.bpm)} BPM` : "",
        body.keyscale ? String(body.keyscale) : "",
        meter,
      ].filter(Boolean);

      const payload: Record<string, unknown> = {
        customMode: true,
        instrumental,
        model: body.model || "V4_5PLUS",
        title,
        style: styleParts.join(", ").slice(0, 1000),
        callBackUrl: `${req.nextUrl.origin}/api/suno/callback`,
      };

      if (!instrumental) {
        if (!lyrics) {
          return NextResponse.json({ error: "Para generar con voz, agregá una letra." }, { status: 400 });
        }
        payload.prompt = lyrics.slice(0, 5000);
      }

      const response = await sunoFetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      const taskId = data?.data?.taskId;

      if (!response.ok || data?.code !== 200 || !taskId) {
        return NextResponse.json(
          { error: data?.msg || data?.message || "Suno API rechazó la generación.", raw: data },
          { status: response.ok ? 502 : response.status }
        );
      }

      return NextResponse.json({ data: { task_id: taskId, engine: "suno" } });
    }

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
        { error: data?.error || data?.detail || "El motor ACE-Step rechazó la generación.", raw: data },
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
