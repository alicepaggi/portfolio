const REPO = 'alicepaggi/portfolio';
const WORKFLOW = 'qa-lab.yml';
const API_VERSION = '2022-11-28';
const ALLOWED_ORIGIN = 'https://alicepaggi.github.io';
const TEST_STEPS = [
  ['Run Homepage smoke tests [6]', 6],
  ['Run Main navigation [10]', 10],
  ['Run Case studies [7]', 7],
  ['Run External links [6]', 6],
  ['Run Interactive components [6]', 6],
  ['Run Responsive layout [8]', 8],
  ['Run Current sections [9]', 9],
];
const TOTAL_TESTS = TEST_STEPS.reduce((total, [, count]) => total + count, 0);

function cors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

async function github(path) {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
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

function getProgress(jobs, runData) {
  const chromium = jobs.find(job => job.name.toLowerCase().includes('chromium'));
  const steps = chromium?.steps || [];
  let passed = 0;
  let failed = 0;

  for (const [name, count] of TEST_STEPS) {
    const step = steps.find(item => item.name === name);
    if (step?.conclusion === 'success') passed += count;
    if (step?.conclusion === 'failure' || step?.conclusion === 'timed_out') failed += count;
  }

  if (runData.status === 'completed' && runData.conclusion === 'success') passed = TOTAL_TESTS;

  return { passed, failed, total: TOTAL_TESTS };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  cors(res, origin);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GITHUB_ACTIONS_TOKEN) {
    return res.status(500).json({ error: 'Backend is not configured yet.' });
  }

  try {
    const runId = req.query.run_id;
    const runData = runId
      ? await github(`/repos/${REPO}/actions/runs/${runId}`)
      : (await github(`/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=1`)).workflow_runs?.[0];

    if (!runData) return res.status(404).json({ status: 'idle', progress: { passed: 0, failed: 0, total: TOTAL_TESTS } });

    const jobsData = await github(`/repos/${REPO}/actions/runs/${runData.id}/jobs?per_page=100`);
    const jobs = (jobsData.jobs || []).map(job => ({
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      started_at: job.started_at,
      completed_at: job.completed_at,
      steps: (job.steps || []).map(step => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
      })),
    }));

    return res.status(200).json({
      id: runData.id,
      status: runData.status,
      conclusion: runData.conclusion,
      created_at: runData.created_at,
      updated_at: runData.updated_at,
      html_url: runData.html_url,
      progress: getProgress(jobs, runData),
      jobs,
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'Unable to read QA workflow status.' });
  }
}
