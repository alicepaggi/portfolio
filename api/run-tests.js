const REPO = 'alicepaggi/portfolio';
const WORKFLOW = 'qa-lab.yml';
const API_VERSION = '2022-11-28';
const ALLOWED_ORIGIN = 'https://alicepaggi.github.io';

function setCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setCors(res, origin);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) return res.status(500).json({ error: 'Backend is not configured yet.' });

  try {
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

    return res.status(202).json({
      status: 'queued',
      message: 'QA workflow queued successfully.',
      workflow: WORKFLOW,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unexpected backend error.' });
  }
}
