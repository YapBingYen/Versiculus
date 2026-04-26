import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

// Initialize a real Ethereal test account if no custom SMTP is provided
async function initTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Generate a test account on the fly for local development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('Local Development Mailer initialized with Ethereal test account.');
  }
}

// Call this immediately so it's ready when needed
initTransporter();

export async function sendEmailNotification(to: string, title: string, body: string) {
  if (!transporter) {
    console.error('Mailer not initialized yet.');
    return false;
  }
  
  try {
    const info = await transporter.sendMail({
      from: '"Versiculus App" <hello@versiculus.app>',
      to,
      subject: title,
      text: body,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #121213; color: white;">
          <h1 style="color: #C9A84C; font-family: Georgia, serif;">${title}</h1>
          <p style="font-size: 16px; line-height: 1.5;">${body}</p>
          <a href="http://localhost:3000" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2C5F8A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Play Now</a>
        </div>
      `
    });
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
