# QA Lab API

These Vercel serverless functions power the interactive Playwright QA Lab on the portfolio.

## Deployment

Deploy the repository as a Vercel project. The `api/` directory is detected automatically.

Required environment variable:

- `GITHUB_ACTIONS_TOKEN` — a GitHub fine-grained token with Actions read/write access to `alicepaggi/portfolio`.

The token stays server-side and is never exposed to the portfolio frontend.

## Endpoints

- `GET /api/health` — confirms that the API is reachable and whether the GitHub token is configured.
- `POST /api/run-tests` — dispatches `.github/workflows/qa-lab.yml` on `main`.
- `GET /api/test-status` — returns the latest manually dispatched workflow and its jobs/steps.
- `GET /api/test-status?run_id=<id>` — returns a specific workflow run.

The current implementation streams execution state by polling GitHub Actions every 2.5 seconds from the portfolio UI. A true live browser viewport is a separate streaming layer; GitHub Actions itself does not expose the hosted browser as a live video stream.

## Contact form

- `POST /api/contact` sends a validated portfolio contact message through Resend.
- The recipient address and Resend key are server-only Vercel environment variables; neither is included in the static site.
- The endpoint accepts requests only from the portfolio origin, checks input lengths and uses a hidden honeypot plus a minimum form completion time.
- Replies go to the sender's email using the message's `reply_to` value.

Additional Vercel environment variables required:

- `RESEND_API_KEY` — a Resend API key with email sending access.
- `CONTACT_TO_EMAIL` — Alice's private inbox.
- `CONTACT_FROM_EMAIL` — an address allowed by the Resend account (use a verified sending domain for a branded sender).

Set these values in the Vercel project settings, never in repository files, then redeploy the production project.
