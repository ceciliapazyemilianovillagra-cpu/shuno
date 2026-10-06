"use client";

import { FormEvent, useMemo, useState } from "react";

type Track = {
  file?: string;
  prompt?: string;
  lyrics?: string;
  metas?: {
    bpm?: number;
    duration?: number;
    keyscale?: string;
    timesignature?: string;
  };
  seed_value?: string;
  lm_model?: string;
  dit_model?: string;
};

function audioProxyUrl(file: string) {
  if (!file) return "";
  if (file.startsWith("/v1/audio")) {
    const q = file.split("?")[1] ?? "";
    const params = new URLSearchParams(q);
    const path = params.get("path") ?? file;
    return `/api/audio?path=${encodeURIComponent(path)}`;
  }
  return `/api/audio?path=${encodeURIComponent(file)}`;
}

const SAMPLE_PROMPT = "Zamba argentina romántica y emotiva, guitarra criolla protagonista, bombo legüero suave, cuerdas cálidas, voz masculina expresiva, producción orgánica, tempo estable y estribillo memorable.";

const SAMPLE_LYRICS = `[Intro]

[Verse 1]
Vuelvo despacio por la misma huella,
donde tu risa se quedó a esperar,
traigo en el pecho una canción sencilla,
para encontrarte una vez más.

[Verse 2]
Cruza la tarde sobre los cerros,
la luna empieza despacio a alumbrar,
y en cada cuerda vuelve tu recuerdo,
como un camino hacia tu mirar.

[Chorus]
Volver a encontrarte,
volver a cantar,
que todo lo perdido
se pueda abrazar.
Volver a encontrarte,
sin miedo al final,
con esta zamba nueva
que te quiere alcanzar.`;

export default function Home() {
  const [prompt, setPrompt] = useState("Zamba argentina romántica, guitarra criolla, bombo legüero sutil, cuerdas cálidas, voz masculina emotiva, producción orgánica y moderna");
  const [lyrics, setLyrics] = useState("[Intro]\n\n[Verse 1]\n\n[Chorus]\n");
  const [bpm, setBpm] = useState("84");
  const [duration, setDuration] = useState("210");
  const [keyscale, setKeyscale] = useState("G Major");
  const [timesignature, setTimesignature] = useState("3");
  const [batchSize, setBatchSize] = useState("2");
  const [seed, setSeed] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [format, setFormat] = useState("wav");
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Listo para crear.");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState("");

  function loadSampleSong() {
    setPrompt(SAMPLE_PROMPT);
    setLyrics(SAMPLE_LYRICS);
    setBpm("84");
    setDuration("75");
    setKeyscale("G Major");
    setTimesignature("3");
    setBatchSize("1");
    setSeed("");
    setInstrumental(false);
    setFormat("wav");
    setTracks([]);
    setTaskId(null);
    setError("");
    setStatusText("Canción de muestra cargada. Tocá Generar canción.");
  }

  const summary = useMemo(
    () => `${duration}s · ${bpm || "auto"} BPM · ${keyscale || "tono auto"} · ${timesignature}/${timesignature === "6" ? "8" : "4"}`,
    [duration, bpm, keyscale, timesignature]
  );

  async function poll(id: string) {
    for (let attempt = 0; attempt < 180; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const response = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: id }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error || "No se pudo consultar la generación.");
      }

      const item = payload?.data?.[0];
      if (!item) continue;

      if (item.status === 0) {
        setStatusText(`Generando… intento ${attempt + 1}`);
        continue;
      }

      if (item.status === 2) {
        throw new Error(item?.error || "El motor informó un fallo en la generación.");
      }

      if (item.status === 1) {
        let parsed: Track[] = [];
        try {
          parsed = typeof item.result === "string" ? JSON.parse(item.result) : item.result;
        } catch {
          parsed = [];
        }
        setTracks(Array.isArray(parsed) ? parsed : []);
        setStatusText("¡Canción terminada!");
        return;
      }
    }
    throw new Error("La generación tardó demasiado. El trabajo puede seguir activo en el motor.");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setTracks([]);
    setTaskId(null);
    setLoading(true);
    setStatusText("Enviando la canción al motor…");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          lyrics,
          bpm: bpm ? Number(bpm) : undefined,
          duration: Number(duration),
          keyscale,
          timesignature,
          batch_size: Number(batchSize),
          seed: seed ? Number(seed) : undefined,
          instrumental,
          format,
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.error) {
        throw new Error(payload?.error || "No se pudo iniciar la generación.");
      }

      const id = payload?.data?.task_id;
      if (!id) throw new Error("El motor no devolvió un task_id.");

      setTaskId(id);
      setStatusText("En cola. SHUNO está componiendo…");
      await poll(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setStatusText("No se pudo completar la generación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">S</div>
          <span>SHUNO</span>
        </div>
        <span className="badge">AI MUSIC STUDIO · v0.1</span>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <button className="navbtn active">✦ Crear canción</button>
          <button className="navbtn" disabled>◉ Covers · próximamente</button>
          <button className="navbtn" disabled>↻ Variaciones · próximamente</button>
          <button className="navbtn" disabled>◫ Biblioteca · próximamente</button>
          <button className="navbtn" disabled>⚙ Modelos · próximamente</button>
        </aside>

        <section className="content">
          <div className="hero">
            <div>
              <h1>Tu canción,<br />a tu manera.</h1>
              <p>SHUNO transforma letra, estilo y parámetros musicales en una generación completa usando tu propio motor ACE-Step.</p>
            </div>
            <span className="pill">● Motor externo configurable</span>
          </div>

          <div className="grid">
            <form className="card" onSubmit={submit}>
              <div className="sectionTitle">Composición</div>

              <div className="sampleBox">
                <div>
                  <strong>♫ Canción de muestra</strong>
                  <div className="muted">Una zamba breve ya preparada para probar SHUNO de punta a punta.</div>
                </div>
                <button className="sampleBtn" type="button" onClick={loadSampleSong} disabled={loading}>
                  Cargar muestra
                </button>
              </div>

              <div className="field">
                <label>Descripción musical</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 112 }}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: zamba romántica argentina, guitarra criolla, voz masculina cálida..."
                  required
                />
              </div>

              <div className="field">
                <label>Letra</label>
                <textarea
                  className="textarea"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  disabled={instrumental}
                  placeholder="[Verse 1]..."
                />
              </div>

              <div className="row3">
                <div className="field">
                  <label>BPM</label>
                  <input className="input" type="number" min="30" max="300" value={bpm} onChange={(e) => setBpm(e.target.value)} />
                </div>
                <div className="field">
                  <label>Duración (seg.)</label>
                  <input className="input" type="number" min="10" max="600" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div className="field">
                  <label>Compás</label>
                  <select className="select" value={timesignature} onChange={(e) => setTimesignature(e.target.value)}>
                    <option value="2">2/4</option>
                    <option value="3">3/4</option>
                    <option value="4">4/4</option>
                    <option value="6">6/8</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Tonalidad</label>
                  <input className="input" value={keyscale} onChange={(e) => setKeyscale(e.target.value)} placeholder="G Major, Am..." />
                </div>
                <div className="field">
                  <label>Formato</label>
                  <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                    <option value="wav">WAV</option>
                    <option value="mp3">MP3</option>
                    <option value="flac">FLAC</option>
                    <option value="opus">OPUS</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Versiones</label>
                  <select className="select" value={batchSize} onChange={(e) => setBatchSize(e.target.value)}>
                    <option value="1">1 versión</option>
                    <option value="2">2 versiones</option>
                    <option value="3">3 versiones</option>
                    <option value="4">4 versiones</option>
                  </select>
                </div>
                <div className="field">
                  <label>Seed opcional</label>
                  <input className="input" type="number" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Aleatorio" />
                </div>
              </div>

              <label className="pill" style={{ marginBottom: 18, cursor: "pointer" }}>
                <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} />
                Instrumental
              </label>

              <button className="generate" disabled={loading} type="submit">
                {loading ? "SHUNO está creando…" : "✦ Generar canción"}
              </button>

              <p className="muted" style={{ marginBottom: 0 }}>{summary}</p>
            </form>

            <div className="card">
              <div className="sectionTitle">Resultados</div>

              {error ? <div className="error">{error}</div> : null}

              {!tracks.length ? (
                <div className="status">
                  <div>
                    <strong>{statusText}</strong>
                    {taskId ? <div className="muted" style={{ marginTop: 8 }}>Task: {taskId}</div> : null}
                  </div>
                </div>
              ) : (
                <div className="tracks">
                  {tracks.map((track, index) => {
                    const src = track.file ? audioProxyUrl(track.file) : "";
                    return (
                      <article className="track" key={`${track.file}-${index}`}>
                        <div className="trackTop">
                          <div>
                            <strong>Versión {index + 1}</strong>
                            <div><small>{track.metas?.bpm || bpm} BPM · {track.metas?.keyscale || keyscale}</small></div>
                          </div>
                          <span className="badge">{track.dit_model || "ACE-Step"}</span>
                        </div>
                        {src ? <audio controls preload="metadata" src={src} /> : null}
                        {src ? <a className="download" href={src} download>↓ Descargar audio</a> : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
