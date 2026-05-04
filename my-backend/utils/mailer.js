const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

function readEnv(key, fallback = "") {
  return String(process.env[key] ?? fallback)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const smtpUser = readEnv("SMTP_USER");
const smtpPassword = readEnv("SMTP_PASSWORD");
const smtpService = readEnv("SMTP_SERVICE");
const smtpHost = readEnv("SMTP_HOST");
const smtpPort = Number(readEnv("SMTP_PORT", "587"));

const transportOptions = smtpService
  ? {
      service: smtpService,
      auth: { user: smtpUser, pass: smtpPassword },
    }
  : smtpHost
    ? {
        host: smtpHost,
        port: Number.isFinite(smtpPort) ? smtpPort : 587,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPassword },
      }
    : {
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPassword },
      };

const transporter = nodemailer.createTransport(transportOptions);

module.exports = { transporter, readEnv };

