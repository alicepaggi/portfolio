const ALLOWED_ORIGIN = 'https://alicepaggi.github.io';

export default function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    status: 'ok',
    service: 'portfolio-qa-api',
    githubTokenConfigured: Boolean(process.env.GITHUB_ACTIONS_TOKEN),
  });
}
