const ALLOWED_ORIGIN = 'https://alicepaggi.github.io';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  if (req.headers.origin !== ALLOWED_ORIGIN) {
    return sendJson(res, 403, { error: 'This form is not available from this origin.' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL || !process.env.CONTACT_FROM_EMAIL) {
    return sendJson(res, 503, { error: 'The contact form is not configured yet.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const contactTrap = typeof body.contactTrap_b7f2 === 'string' ? body.contactTrap_b7f2.trim() : '';
  const formStartedAt = Number(body.formStartedAt);

  // Silently accept the request if the hidden honeypot is filled.
  if (contactTrap) return sendJson(res, 202, { ok: true });

  if (!Number.isFinite(formStartedAt) || Date.now() - formStartedAt < 2000) {
    return sendJson(res, 422, { error: 'Please wait a moment before sending the form.' });
  }

  if (!name || name.length > MAX_NAME) {
    return sendJson(res, 400, { error: 'Please enter a valid name.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > MAX_EMAIL) {
    return sendJson(res, 400, { error: 'Please enter a valid email address.' });
  }
  if (!message || message.length > MAX_MESSAGE) {
    return sendJson(res, 400, { error: 'Please enter a message of up to 5,000 characters.' });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: 'New message from the portfolio contact form',
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        html: `<p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p>${safeMessage}</p>`,
      }),
    });

    if (!response.ok) {
      console.error('Contact email provider rejected a message:', response.status);
      return sendJson(res, 502, { error: 'We could not send your message right now. Please try again later.' });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('Contact email delivery failed:', error?.name || 'Unknown error');
    return sendJson(res, 502, { error: 'We could not send your message right now. Please try again later.' });
  }
}
