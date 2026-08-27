const REPO = 'alicepaggi/portfolio';
const WORKFLOW = 'qa-lab.yml';
const API_VERSION = '2022-11-28';
const ALLOWED_ORIGIN = 'https://alicepaggi.github.io';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimit = new Map();

function setCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const lastRequest = rateLimit.get(ip);

  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
    return Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequest)) / 1000);
  }

  rateLimit.set(ip, now);

  if (rateLimit.size > 500) {
    for (const [key, timestamp] of rateLimit) {
      if (now - timestamp >= RATE_LIMIT_WINDOW_MS) rateLimit.delete(key);
    }
  }

  return 0;
}

async function github(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': API_VERSION,
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json();
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function findDispatchedRun(token, dispatchedAt) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const data = await github(`/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=10`, token);
    const run = (data.workflow_runs || []).find(item => {
      const createdAt = new Date(item.created_at).getTime();
      return createdAt >= dispatchedAt - 1000;
    });

    if (run) return run;
    await wait(500);
  }
  return null;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setCors(res, origin);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const retryAfter = checkRateLimit(req);
  if (retryAfter) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: `Please wait ${retryAfter} seconds before starting another QA run.` });
  }

  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) return res.status(500).json({ error: 'Backend is not configured yet.' });

  try {
    const dispatchedAt = Date.now();
    const response = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('GitHub dispatch failed:', detail);
      return res.status(502).json({ error: 'Unable to start the QA workflow.' });
    }

    const run = await findDispatchedRun(token, dispatchedAt);

    return res.status(202).json({
      status: run?.status || 'queued',
      message: 'QA workflow queued successfully.',
      workflow: WORKFLOW,
      run_id: run?.id || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unexpected backend error.' });
  }
}
