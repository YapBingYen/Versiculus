import nodemailer from 'nodemailer';

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
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(smtpPort, 10),
      secure: smtpPort === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
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

export async function sendEmailNotification(to: string, title: string, body: string) {
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
