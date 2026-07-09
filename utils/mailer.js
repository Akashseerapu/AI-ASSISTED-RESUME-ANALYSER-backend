const nodemailer = require("nodemailer");

/**
 * Shared helper to send emails via Gmail API (OAuth2) or fallback SMTP.
 * @param {Object} options - Email sending options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.logLabel - Label for console logs (e.g. "OTP" or "verification")
 * @returns {Promise<{sent: boolean, method: string} | null>}
 */
const sendEmail = async ({ to, subject, text, html, logLabel }) => {
  // Check if Gmail OAuth2 variables are defined
  const hasGmailOauth =
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.EMAIL_USER;

  if (hasGmailOauth) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
      });

      await transporter.sendMail({
        from: `"ResumeAI Security" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      });

      console.log(`[Mailer] Transactional ${logLabel} email sent via Gmail API (OAuth2) to: ${to}`);
      return { sent: true, method: "gmail_api" };
    } catch (error) {
      console.error("[Mailer] Gmail API (OAuth2) delivery failed:", error.message);
      // Fall through to try SMTP if OAuth fails
    }
  }

  // Check if SMTP environment variables are defined
  const hasSMTPConfig =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS;

  if (hasSMTPConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"ResumeAI Security" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      });

      console.log(`[Mailer] Transactional ${logLabel} email sent via SMTP to: ${to}`);
      return { sent: true, method: "smtp" };
    } catch (error) {
      console.error("[Mailer] SMTP delivery failed, falling back to console log:", error.message);
    }
  }

  return null;
};

/**
 * Send password reset OTP email
 * @param {string} toEmail - User email
 * @param {string} otp - Six digit verification code
 */
const sendOTPEmail = async (toEmail, otp) => {
  const year = new Date().getFullYear();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Password Reset</title>
      <style>
        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .main-card { max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02); }
        .header { text-align: center; margin-bottom: 30px; }
        .brand { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; text-decoration: none; }
        .content { color: #334155; font-size: 15px; line-height: 1.6; }
        .otp-box { font-size: 32px; font-weight: 700; text-align: center; padding: 16px; margin: 24px 0; background-color: #f1f5f9; border-radius: 12px; letter-spacing: 6px; color: #0f172a; border: 1px dashed #cbd5e1; font-family: monospace; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 36px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        .footer a { color: #2563eb; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main-card">
          <div class="header">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="brand">ResumeAI</a>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Use the following One-Time Password (OTP) code to complete your password recovery. This code is valid for <strong>10 minutes</strong>:</p>
            <div class="otp-box">${otp}</div>
            <p>If you did not request a password reset, you can safely ignore this email. Your account security is safe and no changes have been made.</p>
          </div>
          <div class="footer">
            <p>This is an automated security transmission from ResumeAI.<br>Please do not reply directly to this email.</p>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">Tip: If you find this email in your spam folder, please mark it as <strong>"Not Spam"</strong> to receive future security emails in your inbox.</p>
            <p>&copy; ${year} ResumeAI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    ResumeAI Password Reset
    
    Hello,
    
    We received a request to reset your password. Use the following One-Time Password (OTP) code to complete your password recovery. This code is valid for 10 minutes:
    
    OTP Code: ${otp}
    
    If you did not request a password reset, you can safely ignore this email.
    
    © ${year} ResumeAI. All rights reserved.
  `;

  const mailResult = await sendEmail({
    to: toEmail,
    subject: `ResumeAI Verification Code: [${otp}]`,
    text: textContent,
    html: htmlContent,
    logLabel: "OTP"
  });

  if (mailResult) {
    return mailResult;
  }

  // Console Fallback with Professional Layout
  console.log(`\n+-------------------------------------------------------------+`);
  console.log(`|                     ResumeAI SECURITY                       |`);
  console.log(`+-------------------------------------------------------------+`);
  console.log(`| To: ${toEmail.padEnd(55)} |`);
  console.log(`| Subject: ${otp} is your verification code                 |`);
  console.log(`+-------------------------------------------------------------+`);
  console.log(`| Hello,                                                      |`);
  console.log(`|                                                             |`);
  console.log(`| We received a request to reset your password. Use the       |`);
  console.log(`| following verification One-Time Password (OTP) to proceed:  |`);
  console.log(`|                                                             |`);
  console.log(`|                 >>>  [  ${otp}  ]  <<<                     |`);
  console.log(`|                                                             |`);
  console.log(`| This code is valid for 10 minutes.                          |`);
  console.log(`| If you did not request this, please ignore this warning.    |`);
  console.log(`|                                                             |`);
  console.log(`| Regards,                                                    |`);
  console.log(`| ResumeAI Security Team                                      |`);
  console.log(`+-------------------------------------------------------------+\n`);

  return { sent: true, method: "console", otp, html: htmlContent };
};

/**
 * Send email verification OTP email
 * @param {string} toEmail - User email
 * @param {string} otp - Six digit verification code
 */
const sendVerificationEmail = async (toEmail, otp) => {
  const year = new Date().getFullYear();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - ResumeAI</title>
      <style>
        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .main-card { max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02); }
        .header { text-align: center; margin-bottom: 30px; }
        .brand { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; text-decoration: none; }
        .content { color: #334155; font-size: 15px; line-height: 1.6; }
        .otp-box { font-size: 32px; font-weight: 700; text-align: center; padding: 16px; margin: 24px 0; background-color: #f1f5f9; border-radius: 12px; letter-spacing: 6px; color: #0f172a; border: 1px dashed #cbd5e1; font-family: monospace; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 36px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        .footer a { color: #2563eb; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main-card">
          <div class="header">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="brand">ResumeAI</a>
          </div>
          <div class="content">
            <p>Welcome to ResumeAI,</p>
            <p>Thank you for registering! Please use the following One-Time Password (OTP) code to verify your email address and activate your account. This code is valid for <strong>10 minutes</strong>:</p>
            <div class="otp-box">${otp}</div>
            <p>If you did not request an account creation on ResumeAI, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated security transmission from ResumeAI.<br>Please do not reply directly to this email.</p>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">Tip: If you find this email in your spam folder, please mark it as <strong>"Not Spam"</strong> to receive future security emails in your inbox.</p>
            <p>&copy; ${year} ResumeAI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Welcome to ResumeAI!
    
    Hello,
    
    Thank you for registering. Use the following One-Time Password (OTP) code to verify your email address and activate your account. This code is valid for 10 minutes:
    
    OTP Code: ${otp}
    
    If you did not request this, you can safely ignore this email.
    
    © ${year} ResumeAI. All rights reserved.
  `;

  const mailResult = await sendEmail({
    to: toEmail,
    subject: `Verify Your ResumeAI Email: [${otp}]`,
    text: textContent,
    html: htmlContent,
    logLabel: "verification"
  });

  if (mailResult) {
    return mailResult;
  }

  // Console Fallback with Professional Layout
  console.log(`\n+-------------------------------------------------------------+`);
  console.log(`|                     ResumeAI SECURITY                       |`);
  console.log(`+-------------------------------------------------------------+`);
  console.log(`| To: ${toEmail.padEnd(55)} |`);
  console.log(`| Subject: ${otp} is your email verification code           |`);
  console.log(`+-------------------------------------------------------------+`);
  console.log(`| Hello,                                                      |`);
  console.log(`|                                                             |`);
  console.log(`| Thank you for registering! Use the following One-Time       |`);
  console.log(`| Password (OTP) to verify your email address:                |`);
  console.log(`|                                                             |`);
  console.log(`|                 >>>  [  ${otp}  ]  <<<                     |`);
  console.log(`|                                                             |`);
  console.log(`| This code is valid for 10 minutes.                          |`);
  console.log(`| If you did not register this, please ignore this warning.   |`);
  console.log(`|                                                             |`);
  console.log(`| Regards,                                                    |`);
  console.log(`| ResumeAI Security Team                                      |`);
  console.log(`+-------------------------------------------------------------+\n`);

  return { sent: true, method: "console", otp, html: htmlContent };
};

module.exports = {
  sendOTPEmail,
  sendVerificationEmail
};
