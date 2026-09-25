// netlify/functions/utils/resend.js
//
// Small shared helper: sends one email via the Resend API.

async function sendViaResend({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in Netlify environment variables');
  }

  const FROM_EMAIL = process.env.FROM_EMAIL || 'Bam.szn <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || 'Resend request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

module.exports = { sendViaResend };
