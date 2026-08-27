const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    document.body.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    });
  });
}

document.querySelectorAll('[data-slider]').forEach(slider => {
  const track = slider.querySelector('.slider-track');
  const slides = [...slider.querySelectorAll('.slide')];
  const dots = slider.querySelector('.slider-dots');
  const prev = slider.querySelector('[data-prev]');
  const next = slider.querySelector('[data-next]');
  if (!track || slides.length < 2 || !dots) return;
  let index = 0;

  slides.forEach((_, i) => {
    const button = document.createElement('button');
    button.className = 'slider-dot' + (i === 0 ? ' active' : '');
    button.setAttribute('aria-label', `Go to slide ${i + 1}`);
    button.addEventListener('click', () => go(i));
    dots.appendChild(button);
  });

  const update = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.querySelectorAll('.slider-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
  };
  const go = i => { index = (i + slides.length) % slides.length; update(); };
  prev?.addEventListener('click', () => go(index - 1));
  next?.addEventListener('click', () => go(index + 1));
});

/* QA LAB — real Playwright workflow integration */
(() => {
  const GROUPS = [
    { title: 'Homepage smoke tests', count: 6, step: 'Run Homepage smoke tests [6]' },
    { title: 'Main navigation', count: 10, step: 'Run Main navigation [10]' },
    { title: 'Case studies', count: 7, step: 'Run Case studies [7]' },
    { title: 'External links', count: 6, step: 'Run External links [6]' },
    { title: 'Interactive components', count: 6, step: 'Run Interactive components [6]' },
    { title: 'Responsive layout', count: 8, step: 'Run Responsive layout [8]' },
    { title: 'Current sections', count: 9, step: 'Run Current sections [9]' },
  ];
  const TOTAL_TESTS = GROUPS.reduce((total, group) => total + group.count, 0);
  const lab = document.querySelector('.qa-lab');
  const button = document.querySelector('.qa-run-button');
  const consoleScreen = document.querySelector('.qa-console-screen');
  const consoleBrowser = document.querySelector('.qa-console-browser');
  const actionHint = document.querySelector('.qa-lab-actions > span');
  const footerSummary = document.querySelector('.qa-lab-footer > span');
  const metrics = [...document.querySelectorAll('.qa-lab-metrics strong')];
  const testMetricLabel = metrics[0]?.parentElement?.querySelector('span');
  const list = document.querySelector('.qa-test-list');
  if (!lab || !button || !consoleScreen || !list) return;

  function syncTestRows() {
    const existing = [...list.querySelectorAll('.qa-test-row')];
    GROUPS.forEach((group, index) => {
      let row = existing[index];
      if (!row) {
        row = document.createElement('div');
        row.className = 'qa-test-row is-passed';
        row.innerHTML = '<span class="qa-status">✓</span><span></span><small></small>';
        list.appendChild(row);
      }
      const spans = row.querySelectorAll('span');
      if (spans[1]) spans[1].textContent = group.title;
      const count = row.querySelector('small');
      if (count) count.textContent = `${String(group.count).padStart(2, '0')} tests`;
    });
    existing.slice(GROUPS.length).forEach(row => row.remove());
    return [...list.querySelectorAll('.qa-test-row')];
  }

  let rows = syncTestRows();
  const API_BASE = window.QA_LAB_API_BASE || 'https://portfolio-psi-one-uitl02qr3a.vercel.app';
  let pollTimer = null;

  if (metrics[0]) metrics[0].textContent = String(TOTAL_TESTS);
  if (testMetricLabel) testMetricLabel.textContent = 'TESTS';
  if (footerSummary) footerSummary.textContent = `FULL REGRESSION SUITE · ${TOTAL_TESTS} TESTS`;

  const style = document.createElement('style');
  style.textContent = `
    .qa-lab-section{background:var(--dark)!important;color:#fff}
    .qa-lab-section .section-index,.qa-lab-section .eyebrow{color:var(--accent)!important}
    .qa-lab-section .section-heading h2{color:#fff}
    .qa-lab-section .section-lead{color:#b9c4c4}
    .qa-lab.is-running{box-shadow:0 0 0 1px rgba(66,199,206,.25),0 24px 55px rgba(0,0,0,.25)}
    .qa-run-button{font-size:.72rem!important}
    .qa-run-button::before{content:none!important;display:none!important}
    .qa-run-button:not(:disabled){background:var(--accent);color:var(--text);cursor:pointer}
    .qa-run-button:not(:disabled):hover{background:#fff}
    .qa-run-button.is-running{display:inline-flex;align-items:center;justify-content:center;gap:8px}
    .qa-run-spinner{width:13px;height:13px;border:2px solid rgba(23,33,33,.28);border-top-color:var(--text);border-radius:50%;animation:qaSpin .75s linear infinite}
    .qa-status.is-running{background:rgba(66,199,206,.18);color:var(--accent);animation:qaPulse 1.4s infinite}
    .qa-status.is-failed{background:rgba(255,100,100,.14);color:#ff9a9a}
    .qa-status.is-passed{background:rgba(66,199,206,.14);color:var(--accent-dark)}
    .qa-console-line[data-live]{color:#dbe4e3}
    .qa-live-run-link{color:var(--accent);font-weight:700;text-decoration:underline;text-underline-offset:3px}
    @keyframes qaPulse{50%{transform:scale(.8);opacity:.55}}
    @keyframes qaSpin{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(style);

  function setConsole(lines) {
    consoleScreen.innerHTML = lines.map(line => `<div class="qa-console-line ${line.muted ? 'qa-muted' : ''}" ${line.live ? 'data-live' : ''}>${line.text}</div>`).join('');
  }

  function setButtonState(running) {
    button.disabled = running;
    button.classList.toggle('is-running', running);
    button.innerHTML = running ? '<span class="qa-run-spinner" aria-hidden="true"></span><span>RUNNING…</span>' : 'RUN QA SUITE';
  }

  function setProgress(progress, state = 'ready') {
    const total = Number(progress?.total) || TOTAL_TESTS;
    const passed = Math.max(0, Math.min(Number(progress?.passed) || 0, total));
    if (!metrics[0]) return;
    if (state === 'ready') {
      metrics[0].textContent = String(total);
      if (testMetricLabel) testMetricLabel.textContent = 'TESTS';
    } else {
      metrics[0].textContent = `${passed}/${total}`;
      if (testMetricLabel) testMetricLabel.textContent = 'TESTS PASSED';
    }
  }

  function statusIcon(status, conclusion) {
    if (status === 'in_progress' || status === 'queued') return '…';
    if (conclusion === 'success') return '✓';
    if (conclusion === 'failure' || conclusion === 'timed_out') return '×';
    return '–';
  }

  function applyIconState(icon, status, conclusion) {
    icon.textContent = statusIcon(status, conclusion);
    icon.classList.remove('is-running', 'is-failed', 'is-passed');
    icon.classList.toggle('is-running', status === 'in_progress' || status === 'queued');
    icon.classList.toggle('is-failed', conclusion === 'failure' || conclusion === 'timed_out');
    icon.classList.toggle('is-passed', conclusion === 'success');
  }

  function updateRows(data) {
    const chromium = (data.jobs || []).find(job => job.name.toLowerCase().includes('chromium'));
    const steps = chromium?.steps || [];

    rows.forEach((row, index) => {
      const icon = row.querySelector('.qa-status');
      const group = GROUPS[index];
      if (!icon || !group) return;
      const step = steps.find(item => item.name === group.step);

      if (step) {
        applyIconState(icon, step.status, step.conclusion);
      } else if (chromium?.status === 'queued' || chromium?.status === 'in_progress') {
        applyIconState(icon, 'queued', null);
      } else {
        applyIconState(icon, 'completed', null);
      }
    });
  }

  function renderStatus(data) {
    if (!data || data.status === 'idle') return;
    const running = data.status === 'queued' || data.status === 'in_progress';
    const passed = data.conclusion === 'success';
    const failed = data.conclusion === 'failure' || data.conclusion === 'timed_out';
    const progress = data.progress || { passed: 0, failed: 0, total: TOTAL_TESTS };

    lab.classList.toggle('is-running', running);
    setButtonState(running);
    setProgress(progress, running || passed || failed ? 'running' : 'ready');
    actionHint.textContent = running
      ? `Running: ${progress.passed || 0}/${progress.total || TOTAL_TESTS} tests passed so far.`
      : passed
        ? `All ${TOTAL_TESTS}/${TOTAL_TESTS} tests passed successfully.`
        : failed
          ? `${progress.passed || 0}/${progress.total || TOTAL_TESTS} tests passed. Check the logs for failures.`
          : 'Run the full Playwright regression suite.';

    consoleBrowser.textContent = running ? 'Live · GitHub Actions' : `Run #${data.id || '—'}`;
    updateRows(data);

    const completedJobs = (data.jobs || []).filter(job => job.status === 'completed').length;
    if (metrics[2]) metrics[2].textContent = running ? `${completedJobs}/2` : (passed ? '100%' : failed ? 'FAILED' : '—');

    const lines = [{
      text: `<span class="qa-prompt">›</span> ${running ? `Running the real Playwright E2E suite… ${progress.passed || 0}/${progress.total || TOTAL_TESTS} tests passed.` : passed ? `Playwright E2E suite completed successfully: ${TOTAL_TESTS}/${TOTAL_TESTS} passed.` : failed ? `Playwright E2E suite finished: ${progress.passed || 0}/${progress.total || TOTAL_TESTS} passed.` : 'QA workflow ready.'}`,
      live: running
    }];

    if (running) lines.push({ text: '<span class="qa-muted">Progress updates after each completed Playwright test group.</span>', muted: true, live: true });
    (data.jobs || []).forEach(job => {
      const icon = statusIcon(job.status, job.conclusion);
      lines.push({ text: `<span class="qa-prompt">${icon}</span> ${job.name}`, live: job.status === 'in_progress' });
      const activeStep = (job.steps || []).find(step => step.status === 'in_progress');
      if (activeStep) lines.push({ text: `<span class="qa-muted">↳ ${activeStep.name}</span>`, muted: true, live: true });
    });
    if (data.html_url) lines.push({ text: `<span class="qa-muted">↳ <a class="qa-live-run-link" href="${data.html_url}" target="_blank" rel="noopener">View the live GitHub Actions run</a></span>`, muted: true });
    setConsole(lines);
  }

  async function getStatus(runId) {
    const url = runId ? `${API_BASE}/api/test-status?run_id=${encodeURIComponent(runId)}` : `${API_BASE}/api/test-status`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return response.json();
  }

  async function poll(runId) {
    try {
      const data = await getStatus(runId);
      renderStatus(data);
      if (data.status === 'completed') return;
      pollTimer = window.setTimeout(() => poll(runId), 1500);
    } catch (error) {
      console.error('QA Lab status error:', error);
      actionHint.textContent = 'Unable to read the live status. Please check the GitHub Actions run.';
      setButtonState(false);
      pollTimer = window.setTimeout(() => poll(runId), 5000);
    }
  }

  setButtonState(false);
  button.title = 'Run the real Playwright E2E suite';

  button.addEventListener('click', async () => {
    if (pollTimer) window.clearTimeout(pollTimer);
    setButtonState(true);
    setProgress({ passed: 0, failed: 0, total: TOTAL_TESTS }, 'running');
    rows.forEach(row => applyIconState(row.querySelector('.qa-status'), 'queued', null));
    actionHint.textContent = `Starting the workflow: 0/${TOTAL_TESTS} tests passed.`;
    consoleBrowser.textContent = 'Connecting…';
    setConsole([
      { text: `<span class="qa-prompt">›</span> Starting the real Playwright run… 0/${TOTAL_TESTS} tests passed.`, live: true },
      { text: '<span class="qa-muted">Please wait while GitHub Actions queues the workflow.</span>', muted: true, live: true },
      { text: '<span class="qa-muted">The counter updates with real completed test groups.</span>', muted: true }
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/run-tests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      actionHint.textContent = `Workflow queued: 0/${TOTAL_TESTS} tests passed.`;
      const runId = result.run_id || null;
      if (runId) {
        const latest = await getStatus(runId);
        renderStatus(latest);
        poll(runId);
      } else {
        poll();
      }
    } catch (error) {
      console.error('QA Lab run error:', error);
      setButtonState(false);
      setProgress({ total: TOTAL_TESTS }, 'ready');
      actionHint.textContent = 'Could not start the workflow. Please check the QA service configuration.';
      consoleBrowser.textContent = 'Offline';
      setConsole([{ text: '<span class="qa-prompt">×</span> Could not start the QA workflow.', live: true }, { text: `<span class="qa-muted">${error.message}</span>`, muted: true }]);
    }
  });
})();

/* QA LAB — accessible test group accordions */
(() => {
  const list = document.querySelector('.qa-test-list');
  if (!list) return;

  const summaries = {
    'Homepage smoke tests': ['The homepage loads with the correct title and key content.','The hero and profile image are visible and the image loads correctly.','Core sections, experience information and the footer are present.'],
    'Main navigation': ['Each menu link takes you to the correct section.','The brand link returns to the top of the page.','The CV and LinkedIn links use the expected destinations and settings.'],
    'Case studies': ['Each case study opens from the homepage and shows its key information.','The back link returns to Selected Work.','The case study content includes the expected project details and cards.'],
    'External links': ['Email, LinkedIn and GitHub links point to the correct destinations.','Project links open safely in a new tab.','Main external project links are checked for a successful response.'],
    'Interactive components': ['Carousel arrows and dots move between slides correctly.','Slider images have alternative text and load successfully.','The mobile menu opens and closes as expected.'],
    'Responsive layout': ['Pages are checked for unwanted horizontal scrolling on smaller screens.','Navigation adapts to mobile layouts.','The homepage hero and main content stack correctly across viewports.'],
    'Current sections': ['The QA Lab, ownership, experience, work, personal projects, education and QA approach sections are validated.','The QA Lab controls and accordions expose the expected content and accessible states.','Current portfolio content and destinations are checked for the expected structure.']
  };

  const style = document.createElement('style');
  style.textContent = `
    .qa-test-row{padding:0!important;display:block!important;overflow:hidden}
    .qa-test-toggle{width:100%;border:0;background:transparent;display:grid;grid-template-columns:28px 1fr auto 18px;align-items:center;gap:10px;padding:16px 12px;text-align:left;font:inherit;cursor:pointer;color:inherit;transition:background .2s ease}
    .qa-test-toggle:hover{background:rgba(66,199,206,.07)}
    .qa-test-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
    .qa-test-toggle .qa-title{color:var(--text);font-weight:600}
    .qa-test-toggle .qa-count{color:var(--muted);font-size:.72rem;white-space:nowrap}
    .qa-test-chevron{color:var(--accent-dark);font-size:1rem;transition:transform .2s ease}
    .qa-test-row.is-open .qa-test-chevron{transform:rotate(180deg)}
    .qa-test-details{display:none;padding:0 24px 18px 50px;color:var(--muted);font-size:.82rem;line-height:1.55}
    .qa-test-row.is-open .qa-test-details{display:block}
    .qa-test-details ul{margin:0;padding-left:18px}.qa-test-details li{margin:7px 0}
    @media (max-width:620px){.qa-test-toggle{grid-template-columns:28px 1fr 18px;gap:8px}.qa-test-toggle .qa-count{grid-column:2;grid-row:2}.qa-test-details{padding:0 18px 16px 48px;font-size:.78rem}}
  `;
  document.head.appendChild(style);

  [...list.querySelectorAll('.qa-test-row')].forEach((row, index) => {
    const spans = row.querySelectorAll('span');
    const title = spans[1]?.textContent.trim();
    const status = row.querySelector('.qa-status');
    const count = row.querySelector('small')?.textContent.trim();
    const items = summaries[title];
    if (!title || !status || !count || !items) return;

    row.innerHTML = '';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'qa-test-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', `qa-test-details-${index}`);
    toggle.append(status);

    const titleEl = document.createElement('span');
    titleEl.className = 'qa-title';
    titleEl.textContent = title;
    const countEl = document.createElement('small');
    countEl.className = 'qa-count';
    countEl.textContent = count;
    const chevron = document.createElement('span');
    chevron.className = 'qa-test-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '⌄';
    toggle.append(titleEl, countEl, chevron);

    const panel = document.createElement('div');
    panel.className = 'qa-test-details';
    panel.id = `qa-test-details-${index}`;
    const detailList = document.createElement('ul');
    items.forEach(item => {
      const entry = document.createElement('li');
      entry.textContent = item;
      detailList.appendChild(entry);
    });
    panel.appendChild(detailList);

    toggle.addEventListener('click', () => {
      const isOpen = row.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    row.append(toggle, panel);
  });
})();
