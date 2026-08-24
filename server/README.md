# Portfolio QA Lab API

Small Node/Express backend used by the public QA Lab on the portfolio.

## Architecture

`GitHub Pages → QA API → GitHub Actions → Playwright`

The browser never receives a GitHub token. The backend keeps the token secret,
starts the `qa-lab.yml` workflow and exposes read-only status for the UI.

## Local setup

```bash
cd server
npm install
cp .env.example .env
npm start
```

The backend expects a fine-grained GitHub token with permission to trigger
Actions workflows for `alicepaggi/portfolio`. Never commit `.env` or the token.

## Endpoints

- `GET /health` — health check
- `POST /api/run-tests` — dispatch the real Playwright workflow
- `GET /api/test-status` — latest workflow status
- `GET /api/test-status?run_id=123` — status for one run
- `GET /api/test-stream?run_id=123` — Server-Sent Events stream

The frontend currently polls status; the SSE endpoint is available for the
next UI iteration if we want the console to update with lower latency.
