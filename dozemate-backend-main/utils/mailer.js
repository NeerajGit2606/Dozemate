// utils/mailer.js
const nodemailer = require('nodemailer');
const { logger } = require('./logger');

let transporterPromise = null;

async function createTransporter() {
  const { SMTP_HOST, SMTP_PORT = '587', SMTP_USER, SMTP_PASS, NODE_ENV, SMTP_SECURE } = process.env;

  if (SMTP_HOST) {
    const port = Number(SMTP_PORT);
    const secure = typeof SMTP_SECURE === 'string'
      ? SMTP_SECURE.toLowerCase() === 'true'
      : port === 465;

    const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false  // ✅ Ye add karo
  }
});

    await transporter.verify();
    logger.info('📧 SMTP transporter ready', { host: SMTP_HOST, port, secure });
    return transporter;
  }

  if (NODE_ENV === 'production') {
    throw new Error('SMTP not configured (SMTP_HOST missing) and NODE_ENV=production');
  }

  // Dev fallback only
  const test = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
  logger.info('📧 Using Ethereal test SMTP (DEV)');
  return transporter;
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = createTransporter().catch(err => {
      transporterPromise = null; // ✅ Failure pe cache reset karo
      (logger.err ? logger.err : logger.error)?.(err, { where: 'initMailer' });
      throw err;
    });
  }
  return transporterPromise;
}

async function verifySmtp() {
  const t = await getTransporter();
  return t.verify();
}

async function sendEmail({ to, subject, text, html, from }) {
  const t = await getTransporter();
  const mailFrom =
    from || process.env.FROM_EMAIL || process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost';

  const info = await t.sendMail({ from: mailFrom, to, subject, text, html });
  const ok = Array.isArray(info.accepted) && info.accepted.length > 0;

  logger.info('📨 MAIL_SENT', {
    to, subject, ok,
    accepted: info.accepted, rejected: info.rejected,
    response: info.response, messageId: info.messageId,
  });

  return {
    ok,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    response: info.response,
    messageId: info.messageId,
  };
}

async function sendNewUserCredentials(to, name, tempPassword) {
  const first = (name || '').split(' ')[0] || 'there';
  const subject = 'Your temporary Dozemate password';
  const text = `Hi ${first},\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and change it immediately.\n`;
  const html = `<p>Hi ${first},</p><p>Your temporary password is: <b>${tempPassword}</b></p><p>Please log in and change it immediately.</p>`;
  return sendEmail({ to, subject, text, html });
}

module.exports = { verifySmtp, sendEmail, sendNewUserCredentials };
