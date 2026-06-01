const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[EMAIL SKIPPED] No email config. Would send to ${to}: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from:    `"LMS Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
};

module.exports = { sendEmail };
