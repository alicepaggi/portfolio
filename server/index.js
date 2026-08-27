import express from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const REPO = process.env.GITHUB_REPO || 'alicepaggi/portfolio';
const WORKFLOW = process.env.GITHUB_WORKFLOW || 'qa-lab.yml';
const TOKEN = process.env.GITHUB_ACTIONS_TOKEN;
const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://alicepaggi.github.io';
const API = 'https://api.github.com';

const TEST_GROUPS = [
  ['Run Homepage smoke tests [6]', 6],
  ['Run Main navigation [10]', 10],
  ['Run Case studies [7]', 7],
  ['Run External links [6]', 6],
  ['Run Interactive components [6]', 6],
  ['Run Responsive layout [8]', 8],
  ['Run Current sections [9]', 9],
];
const TOTAL_TESTS = TEST_GROUPS.reduce((total, [, count]) => total + count, 0);
const MOBILE_TEST_STEP = 'Run Mobile Safari responsive suite';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

app.use(cors({ origin: ORIGIN, methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

const headers = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

function assertConfig() {
  if (!TOKEN) {
    const error = new Error('GITHUB_ACTIONS_TOKEN is not configured.');
    error.status = 500;
    throw error;
  }
}

async function github(path, options = {}) {
  assertConfig();
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`GitHub API ${response.status}: ${body}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

async function latestRun() {
  const data = await github(
    `/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=10`,
  );
  return data.workflow_runs?.[0] || null;
}

async function getRun(runId) {
  return github(`/repos/${REPO}/actions/runs/${runId}`);
}

async function getJobs(runId) {
  const data = await github(`/repos/${REPO}/actions/runs/${runId}/jobs?per_page=20`);
  return (data.jobs || []).map(job => ({
    id: job.id,
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    steps: (job.steps || []).map(step => ({
      name: step.name,
      status: step.status,
      conclusion: step.conclusion,
    })),
  }));
}

function getQaProgress(jobs) {
  const chromium = jobs.find(job => job.name.toLowerCase().includes('chromium'));
  const steps = chromium?.steps || [];
  let passed = 0;
  let failed = 0;
  let completedGroups = 0;

  for (const [name, count] of TEST_GROUPS) {
    const step = steps.find(item => item.name === name);
    if (step?.conclusion === 'success') {
      passed += count;
      completedGroups += 1;
    } else if (step?.conclusion === 'failure' || step?.conclusion === 'timed_out') {
      failed += count;
      completedGroups += 1;
    }
  }

  const mobile = jobs.find(job => job.name.toLowerCase().includes('mobile safari'));
  const mobileStep = mobile?.steps?.find(step => step.name === MOBILE_TEST_STEP);
  const mobileCompleted = mobileStep?.status === 'completed';
  const allGroupsCompleted = completedGroups === TEST_GROUPS.length;
  const suiteFinished = allGroupsCompleted && mobileCompleted;
  const suitePassed = suiteFinished && failed === 0 && mobileStep?.conclusion === 'success';
  const suiteFailed = suiteFinished && !suitePassed;

  return {
    progress: { passed, failed, total: TOTAL_TESTS },
    suiteFinished,
    suitePassed,
    suiteFailed,
  };
}

async function runPayload(run) {
  if (!run) return { status: 'idle', jobs: [], progress: { passed: 0, failed: 0, total: TOTAL_TESTS } };
  const jobs = await getJobs(run.id);
  const qa = getQaProgress(jobs);

  return {
    id: run.id,
    status: qa.suiteFinished ? 'completed' : run.status,
    conclusion: qa.suitePassed ? 'success' : qa.suiteFailed ? 'failure' : run.conclusion,
    created_at: run.created_at,
    updated_at: run.updated_at,
    html_url: run.html_url,
    progress: qa.progress,
    jobs,
  };
}

async function waitForNewRun(startedAt) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const run = await latestRun();
    if (run && Date.parse(run.created_at) >= startedAt - 5000) return run;
    await sleep(500);
  }
  return null;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'portfolio-qa-api' });
});

app.post('/api/run-tests', async (_req, res) => {
  try {
    assertConfig();
    const startedAt = Date.now();
    await github(`/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' }),
    });
    const run = await waitForNewRun(startedAt);
    res.status(202).json({
      queued: true,
      run_id: run?.id || null,
      html_url: run?.html_url || null,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/test-status', async (req, res) => {
  try {
    const run = req.query.run_id ? await getRun(req.query.run_id) : await latestRun();
    res.json(await runPayload(run));
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/test-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let runId = req.query.run_id ? Number(req.query.run_id) : null;
  let closed = false;
  let timer;

  const send = payload => {
    if (!closed) res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const tick = async () => {
    try {
      const run = runId ? await getRun(runId) : await latestRun();
      if (!run) {
        send({ status: 'idle', jobs: [] });
        return;
      }
      runId = run.id;
      const payload = await runPayload(run);
      send(payload);
      if (payload.status === 'completed') {
        clearInterval(timer);
        res.end();
      }
    } catch (error) {
      send({ error: error.message });
    }
  };

  await tick();
  timer = setInterval(tick, 1500);
  req.on('close', () => {
    closed = true;
    clearInterval(timer);
  });
});

app.listen(PORT, () => {
  console.log(`QA Lab API listening on port ${PORT}`);
  console.log(`GitHub workflow: ${REPO} / ${WORKFLOW}`);
});
