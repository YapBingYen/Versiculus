import nodemailer from 'nodemailer';
import axios from 'axios';
import { resolve4 } from 'node:dns/promises';
import net from 'node:net';

let transporter: nodemailer.Transporter | null = null;
let mailerReady = false;
let initPromise: Promise<void> | null = null;

async function initTransporter() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const hasSmtp =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  if (hasSmtp) {
    const smtpPort = process.env.SMTP_PORT as string;
    const smtpHost = process.env.SMTP_HOST as string;
    let connectHost = smtpHost;
    let tlsServername: string | undefined;

    if (net.isIP(smtpHost) === 0) {
      try {
        const ipv4 = await resolve4(smtpHost);
        const firstIpv4 = ipv4[0];
        if (firstIpv4) {
          connectHost = firstIpv4;
          tlsServername = smtpHost;
        }
      } catch {}
    }

    transporter = nodemailer.createTransport({
      host: connectHost,
      port: parseInt(smtpPort, 10),
      secure: smtpPort === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      ...(tlsServername ? { tls: { servername: tlsServername } } : {}),
    });
    mailerReady = true;
    return;
  }

  if (!isProd) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    mailerReady = true;
    return;
  }

  transporter = null;
  mailerReady = false;
}

function ensureMailerReady() {
  if (!initPromise) {
    initPromise = initTransporter().catch(() => {});
  }
  return initPromise;
}

ensureMailerReady();

async function sendViaResendApi(to: string, title: string, body: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return null;

  try {
    const appUrl = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || '';
    const playUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/play` : '';
    const from = process.env.MAIL_FROM || 'onboarding@resend.dev';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #121213; color: white;">
        <h1 style="color: #C9A84C; font-family: Georgia, serif;">${title}</h1>
        <p style="font-size: 16px; line-height: 1.5;">${body}</p>
        ${playUrl ? `<a href="${playUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2C5F8A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Play Now</a>` : ''}
      </div>
    `;

    await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [to],
        subject: title,
        text: body,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return true;
  } catch (error) {
    const err = error as any;
    const status = err?.response?.status;
    const message = err?.response?.data?.message || err?.message;
    console.error('Error sending email (Resend API):', { status, message });
    return false;
  }
}

async function sendViaSendGridApi(to: string, title: string, body: string) {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) return null;

  try {
    const appUrl = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || '';
    const playUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/play` : '';
    const from = process.env.MAIL_FROM;
    if (!from) return false;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #121213; color: white;">
        <h1 style="color: #C9A84C; font-family: Georgia, serif;">${title}</h1>
        <p style="font-size: 16px; line-height: 1.5;">${body}</p>
        ${playUrl ? `<a href="${playUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2C5F8A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Play Now</a>` : ''}
      </div>
    `;

    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject: title,
        content: [
          { type: 'text/plain', value: body },
          { type: 'text/html', value: html },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return true;
  } catch (error) {
    const err = error as any;
    const status = err?.response?.status;
    const message = err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || err?.message;
    console.error('Error sending email (SendGrid API):', { status, message });
    return false;
  }
}

export async function sendEmailNotification(to: string, title: string, body: string) {
  const sendGridResult = await sendViaSendGridApi(to, title, body);
  if (sendGridResult !== null) return sendGridResult;

  const resendResult = await sendViaResendApi(to, title, body);
  if (resendResult !== null) return resendResult;

  await ensureMailerReady();
  if (!mailerReady || !transporter) {
    return false;
  }
  
  try {
    const appUrl = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || '';
    const playUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/play` : '';
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'hello@versiculus.app';
    const info = await transporter.sendMail({
      from: `"Versiculus" <${fromAddress}>`,
      to,
      subject: title,
      text: body,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #121213; color: white;">
          <h1 style="color: #C9A84C; font-family: Georgia, serif;">${title}</h1>
          <p style="font-size: 16px; line-height: 1.5;">${body}</p>
          ${playUrl ? `<a href="${playUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2C5F8A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Play Now</a>` : ''}
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
