const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    });
  });
}

document.querySelectorAll('[data-slider]').forEach(slider=>{
  const track=slider.querySelector('.slider-track');
  const slides=[...slider.querySelectorAll('.slide')];
  const dots=slider.querySelector('.slider-dots');
  const prev=slider.querySelector('[data-prev]');
  const next=slider.querySelector('[data-next]');
  if(!track||slides.length<2||!dots)return;
  let index=0;
  slides.forEach((_,i)=>{
    const b=document.createElement('button');
    b.className='slider-dot'+(i===0?' active':'');
    b.setAttribute('aria-label',`Go to slide ${i+1}`);
    b.addEventListener('click',()=>go(i));
    dots.appendChild(b);
  });
  const update=()=>{track.style.transform=`translateX(-${index*100}%)`;dots.querySelectorAll('.slider-dot').forEach((d,i)=>d.classList.toggle('active',i===index));};
  const go=i=>{index=(i+slides.length)%slides.length;update();};
  prev?.addEventListener('click',()=>go(index-1));
  next?.addEventListener('click',()=>go(index+1));
});

/* QA LAB — real Playwright workflow integration */
(() => {
  const lab = document.querySelector('.qa-lab');
  const button = document.querySelector('.qa-run-button');
  const consoleScreen = document.querySelector('.qa-console-screen');
  const consoleBrowser = document.querySelector('.qa-console-browser');
  const actionHint = document.querySelector('.qa-lab-actions > span');
  const rows = [...document.querySelectorAll('.qa-test-row')];
  const metrics = [...document.querySelectorAll('.qa-lab-metrics strong')];
  if (!lab || !button || !consoleScreen) return;

  const API_BASE = window.QA_LAB_API_BASE || 'https://portfolio-psi-one-uitl02qr3a.vercel.app';
  let pollTimer = null;

  const style = document.createElement('style');
  style.textContent = `
    .qa-lab-section{background:var(--dark)!important;color:#fff}
    .qa-lab-section .section-index,.qa-lab-section .eyebrow{color:var(--accent)!important}
    .qa-lab-section .section-heading h2{color:#fff}
    .qa-lab-section .section-lead{color:#b9c4c4}
    .qa-lab.is-running{box-shadow:0 0 0 1px rgba(66,199,206,.25),0 24px 55px rgba(0,0,0,.25)}
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

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function setConsole(lines) {
    consoleScreen.innerHTML = lines.map(line => `<div class="qa-console-line ${line.muted ? 'qa-muted' : ''}" ${line.live ? 'data-live' : ''}>${line.text}</div>`).join('');
  }

  function setButtonState(running) {
    button.disabled = running;
    button.classList.toggle('is-running', running);
    button.innerHTML = running
      ? '<span class="qa-run-spinner" aria-hidden="true"></span><span>RUNNING…</span>'
      : 'RUN QA SUITE';
  }

  function statusIcon(status, conclusion) {
    if (status === 'in_progress' || status === 'queued') return '…';
    if (conclusion === 'success') return '✓';
    if (conclusion === 'failure' || conclusion === 'timed_out') return '×';
    return '–';
  }

  function updateRows(data) {
    const jobs = data.jobs || [];
    const chromium = jobs.find(job => job.name.toLowerCase().includes('chromium'));
    const safari = jobs.find(job => job.name.toLowerCase().includes('mobile safari'));
    const states = [chromium, safari];
    rows.forEach((row, index) => {
      const status = states[index < 5 ? 0 : 1];
      const icon = row.querySelector('.qa-status');
      if (!icon || !status) return;
      icon.textContent = statusIcon(status.status, status.conclusion);
      icon.classList.toggle('is-running', status.status === 'in_progress' || status.status === 'queued');
      icon.classList.toggle('is-failed', status.conclusion === 'failure');
      icon.classList.toggle('is-passed', status.conclusion === 'success');
    });
  }

  function renderStatus(data) {
    if (!data || data.status === 'idle') return;
    const running = data.status === 'queued' || data.status === 'in_progress';
    const passed = data.conclusion === 'success';
    const failed = data.conclusion === 'failure' || data.conclusion === 'timed_out';
    lab.classList.toggle('is-running', running);
    setButtonState(running);
    actionHint.textContent = running
      ? 'Tests are running. Please wait for the logs and final results.'
      : passed
        ? 'Latest run completed successfully. You can verify the logs below.'
        : failed
          ? 'Latest run finished with failures. Check the logs for details.'
          : 'Run the full Playwright regression suite.';
    consoleBrowser.textContent = running ? 'Live · GitHub Actions' : `Run #${data.id || '—'}`;
    updateRows(data);
    const completedJobs = (data.jobs || []).filter(job => job.status === 'completed').length;
    metrics[2].textContent = running ? `${completedJobs}/2` : (passed ? '100%' : failed ? 'FAILED' : '—');
    const lines = [{
      text: `<span class="qa-prompt">›</span> ${running ? 'Running the real Playwright E2E suite…' : passed ? 'Playwright E2E suite completed successfully.' : failed ? 'Playwright E2E suite finished with failures.' : 'QA workflow ready.'}`,
      live: running
    }];
    if (running) lines.push({ text: '<span class="qa-muted">Please wait for the live logs and final results.</span>', muted: true, live: true });
    (data.jobs || []).forEach(job => {
      const icon = statusIcon(job.status, job.conclusion);
      lines.push({ text: `<span class="qa-prompt">${icon}</span> ${job.name}`, live: job.status === 'in_progress' });
      const activeStep = (job.steps || []).find(step => step.status === 'in_progress');
      if (activeStep) lines.push({ text: `<span class="qa-muted">↳ ${activeStep.name}</span>`, muted: true, live: true });
    });
    if (data.html_url) {
      lines.push({ text: `<span class="qa-muted">↳ <a class="qa-live-run-link" href="${data.html_url}" target="_blank" rel="noopener">View the live GitHub Actions run</a></span>`, muted: true });
    }
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
      pollTimer = window.setTimeout(() => poll(runId), 2500);
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
    actionHint.textContent = 'Starting the workflow. Please wait for the logs and final results.';
    consoleBrowser.textContent = 'Connecting…';
    setConsole([
      { text: '<span class="qa-prompt">›</span> Starting the real Playwright run…', live: true },
      { text: '<span class="qa-muted">Please wait while GitHub Actions queues the workflow.</span>', muted: true, live: true },
      { text: '<span class="qa-muted">You will be able to verify the live logs and final result.</span>', muted: true },
    ]);
    try {
      const response = await fetch(`${API_BASE}/api/run-tests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      actionHint.textContent = 'Workflow queued. Waiting for the live run and logs…';
      await sleep(2500);
      const latest = await getStatus();
      renderStatus(latest);
      poll(latest.id);
    } catch (error) {
      console.error('QA Lab run error:', error);
      setButtonState(false);
      actionHint.textContent = 'Could not start the workflow. Please check the QA service configuration.';
      consoleBrowser.textContent = 'Offline';
      setConsole([
        { text: '<span class="qa-prompt">×</span> Could not start the QA workflow.', live: true },
        { text: `<span class="qa-muted">${error.message}</span>`, muted: true },
      ]);
    }
  });
})();
