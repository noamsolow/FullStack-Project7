import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { AppError } from "../utils/AppError.js";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: config.smtp.timeoutMs,
      greetingTimeout: config.smtp.timeoutMs,
      socketTimeout: config.smtp.timeoutMs,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!config.smtp.enabled) {
    return { skipped: true, reason: "smtp_disabled" };
  }

  try {
    const result = await getTransporter().sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
      text,
      ...(config.smtp.replyTo ? { replyTo: config.smtp.replyTo } : {}),
    });
    return {
      skipped: false,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    };
  } catch (error) {
    throw new AppError(
      502,
      "SMTP_SEND_FAILED",
      "The SMTP server could not send the order email",
      [{
        smtpCode: error.code ?? "SMTP_ERROR",
        smtpResponseCode: error.responseCode ?? null,
        smtpCommand: error.command ?? null,
      }],
    );
  }
}
