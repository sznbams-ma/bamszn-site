// netlify/functions/submission-created.js
//
// This exact file name is a Netlify convention: Netlify automatically
// calls a function named "submission-created" every time ANY Netlify
// Form on this site is submitted successfully — right after Netlify
// finishes storing it. No dashboard webhook needs to be configured.
//
// Here it sends the "welcome to the team" reply to whoever filled out
// the "Let's Talk" contact form. Netlify Forms already gives you a
// free, code-free way to be notified yourself: turn it on under
// Site settings → Forms → Form notifications → Email notification.
// This function only needs to handle the customer-facing reply,
// since Netlify's own notification always goes to a fixed address
// (yours), not to whoever submitted the form.
//
// Setup: same RESEND_API_KEY (and optional FROM_EMAIL) environment
// variables as send-email.js — see that file for the walkthrough.

const { sendViaResend } = require('./utils/resend');

// Your logo, used in the header of this email. Must be a full public
// URL — upload bzn-logo.png (comes with this download) to your live
// site (e.g. its root, next to index.html), then put its live
// address here, e.g. 'https://yourdomain.com/bzn-logo.png'.
const LOGO_URL = 'https://https://www.bamszn.xyz//bzn-logo.png';
const EMAIL_LOGO_HEADER = `<div style="background:#000000;padding:28px 20px;text-align:center;">
  <img src="${LOGO_URL}" alt="Bams.szn" width="150" style="display:inline-block;border:0;">
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

  // Only react to the "contact" form — ignore any other Netlify form
  // you might add to the site later.
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
