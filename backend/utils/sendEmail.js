const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = ({ to, subject, html, text }) => {
  console.log(`Sending email to ${to} subject=${subject}`);
  return transporter.sendMail({
    from: `"AgroMart" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  })
    .then((info) => {
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    })
    .catch((error) => {
      console.error(`Email send failed to ${to}:`, error);
      throw error;
    });
};

module.exports = sendEmail;
