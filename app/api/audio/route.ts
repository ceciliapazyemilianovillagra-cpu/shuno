import { NextRequest, NextResponse } from "next/server";
import { engineFetch } from "@/lib/engine";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path) return NextResponse.json({ error: "Falta path." }, { status: 400 });

    const normalized = path.startsWith("/v1/audio")
      ? path
      : `/v1/audio?path=${encodeURIComponent(path)}`;

    const response = await engineFetch(normalized);
    if (!response.ok) {
      return NextResponse.json({ error: "No se pudo recuperar el audio." }, { status: response.status });
    }

    const bytes = await response.arrayBuffer();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "audio/wav",
        "Content-Disposition": response.headers.get("content-disposition") || 'inline; filename="shuno.wav"',
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo recuperar el audio." },
      { status: 500 }
    );
  }
}
