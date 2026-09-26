// netlify/functions/submission-created.js
//
// Netlify automatically calls a function named "submission-created"
// every time ANY Netlify Form on this site is submitted successfully.
// Here it sends the "welcome" reply to whoever filled out the contact form.

const { sendViaResend } = require('./utils/resend');

const LOGO_URL = 'https://i.postimg.cc/SKyNPRh4/bzn-logo-(2).png';
const EMAIL_LOGO_HEADER = `<div style="background:#000000;padding:28px 20px;text-align:center;">
  <img src="${LOGO_URL}" alt="Bam.szn" width="150" style="display:inline-block;border:0;">
</div>`;

exports.handler = async function (event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const submission = body.payload || {};
  const data = submission.data || {};

  if (submission.form_name !== 'contact') {
    return { statusCode: 200, body: 'Ignored (not the contact form)' };
  }

  const name    = data.name || 'there';
  const email   = data.email;
  const subject = data.subject || 'General Inquiry';
  const message = data.message || '';

  if (!email) {
    return { statusCode: 200, body: 'No email on this submission, nothing to send' };
  }

  const html = `<div style="font-family:sans-serif;font-size:14px;color:#222;">
    ${EMAIL_LOGO_HEADER}
    <div style="padding:24px 20px;">
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">Your request has officially landed with us. 🖤</p>
      <p style="margin:0 0 16px;">Thank you for reaching out to Bam.szn. We've received your request and our team is currently looking into it.</p>
      <p style="margin:0 0 16px;">Someone from our team will get back to you shortly with the next steps.</p>
      <p style="margin:0 0 16px;">Until then, stay locked in.</p>
      <p style="margin:0 0 4px;font-weight:600;">No Off Szn.</p>
      <p style="margin:0;color:#888;">bam.szn</p>
    </div>
  </div>`;

  try {
    await sendViaResend({ to: email, subject: 'Your request has landed with us 🖤', html });
    return { statusCode: 200, body: 'Welcome email sent' };
  } catch (err) {
    console.error('Welcome email failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
