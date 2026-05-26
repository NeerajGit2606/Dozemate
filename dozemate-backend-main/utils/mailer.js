// utils/mailer.js
const { Resend } = require('resend');
const { logger } = require('./logger');

const resend = new Resend(process.env.RESEND_API_KEY);

async function verifySmtp() {
  return true;
}

async function sendEmail({ to, subject, text, html, from }) {
  const mailFrom = from || 'Dozemate <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: mailFrom,
    to,
    subject,
    html: html || `<p>${text}</p>`,
  });

  if (error) {
    logger.info('📨 MAIL_FAILED', { to, subject, error });
    throw new Error(error.message);
  }

  logger.info('📨 MAIL_SENT', {
    to, subject,
    messageId: data?.id,
  });

  return {
    ok: true,
    messageId: data?.id,
    accepted: [to],
    rejected: [],
  };
}

async function sendNewUserCredentials(to, name, tempPassword) {
  const first = (name || '').split(' ')[0] || 'there';
  return sendEmail({
    to,
    subject: 'Your temporary Dozemate password',
    text: `Hi ${first},\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and change it immediately.`,
    html: `<p>Hi ${first},</p><p>Your temporary password is: <b>${tempPassword}</b></p><p>Please log in and change it immediately.</p>`,
  });
}

module.exports = { verifySmtp, sendEmail, sendNewUserCredentials };