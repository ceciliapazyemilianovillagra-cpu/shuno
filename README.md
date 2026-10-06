# SHUNO

SHUNO is a personal AI music studio built for original songwriting workflows.

## Architecture

- **Web app:** Next.js, deployed on Vercel
- **Music engine:** ACE-Step 1.5 behind an HTTP API on a GPU runtime
- **Storage:** none required for v1; generated files remain on the GPU backend unless downloaded
- **Database:** intentionally omitted in v1

## v1 goals

- Generate full songs from lyrics + style prompt
- Control BPM, key, duration and time signature
- Poll asynchronous ACE-Step tasks
- Play and download generated audio
- Keep the GPU endpoint configurable with environment variables

## Environment

Create these variables in Vercel:

```bash
SHUNO_ENGINE_URL=https://your-gpu-backend.example
SHUNO_ENGINE_API_KEY=
```

The backend must expose the ACE-Step 1.5 HTTP API endpoints used by SHUNO:
`POST /release_task`, `POST /query_result`, and `GET /v1/audio`.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000
