// netlify/functions/send-email.js
//
// Called directly from the front-end (index.html) for order invoices:
// when a Paystack payment succeeds, the page POSTs here so this
// function — running on Netlify's servers, not the visitor's browser —
// can send the invoice/receipt emails via Resend. Your RESEND_API_KEY
// never touches the browser.
//
// Setup:
//   1. Create a free Resend account and grab an API key.
//   2. In Netlify: Site settings → Environment variables → add
//        RESEND_API_KEY = <your key>
//      (Optional) FROM_EMAIL = "Bam.szn <orders@bamszn.xyz>"
//      — only works once that domain is verified in Resend; until
//      then, sends go from onboarding@resend.dev and can only reach
//      your own Resend account email (a Resend restriction, not
//      something this function controls).
//   3. Redeploy the site so Netlify picks up the new variables.
//
// Called as: POST /.netlify/functions/send-email
//   body: { "to": "someone@example.com", "subject": "...", "html": "<p>...</p>" }

const { sendViaResend } = require('./utils/resend');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { to, subject, html } = payload;
  if (!to || !subject || !html) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing to, subject or html' }) };
  }

  try {
    const data = await sendViaResend({ to, subject, html });
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: err.status || 500, body: JSON.stringify(err.data || { error: err.message }) };
  }
};