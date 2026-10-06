import { NextRequest, NextResponse } from "next/server";
import { engineFetch } from "@/lib/engine";
import { sunoFetch } from "@/lib/suno";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const taskId = body.task_id;
    const engine = body.engine === "ace" ? "ace" : "suno";

    if (!taskId) return NextResponse.json({ error: "Falta task_id." }, { status: 400 });

    if (engine === "suno") {
      const response = await sunoFetch(`/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.code !== 200) {
        return NextResponse.json(
          { error: data?.msg || data?.message || "No se pudo consultar Suno API.", raw: data },
          { status: response.ok ? 502 : response.status }
        );
      }

      const task = data?.data ?? {};
      const status = String(task?.status ?? "PENDING").toUpperCase();

      if (["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"].includes(status)) {
        return NextResponse.json({
          data: [{
            status: 2,
            error: task?.errorMessage || task?.errorCode || status,
          }],
        });
      }

      if (status !== "SUCCESS") {
        return NextResponse.json({ data: [{ status: 0, stage: status }] });
      }

      const sunoData = task?.response?.sunoData ?? task?.response?.suno_data ?? [];
      const tracks = Array.isArray(sunoData)
        ? sunoData.map((item: Record<string, unknown>) => ({
            file: item.audioUrl || item.audio_url || item.streamAudioUrl || item.stream_audio_url || "",
            image: item.imageUrl || item.image_url || "",
            title: item.title || "SHUNO",
            prompt: item.prompt || "",
            model: item.modelName || item.model_name || "Suno",
            tags: item.tags || "",
            duration: item.duration || 0,
            id: item.id || "",
            engine: "suno",
          }))
        : [];

      return NextResponse.json({
        data: [{
          status: 1,
          result: JSON.stringify(tracks),
        }],
      });
    }

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
