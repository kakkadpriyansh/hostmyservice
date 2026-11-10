import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Reset Your Password - HostMyService',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your HostMyService account.</p>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #7000ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>HostMyService Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

interface SiteLiveEmailParams {
  to: string;
  clientName: string;
  domain: string;
  serverIp: string;
  dbConnection?: string | null;
  dbType?: string | null;
}

export const sendSiteLiveEmail = async (params: SiteLiveEmailParams) => {
  const { to, clientName, domain, serverIp, dbConnection, dbType } = params;
  const siteUrl = `https://${domain}`;

  const dbSection = dbConnection
    ? `
        <div style="background-color: #1a1a2e; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #00f0ff; margin: 0 0 8px 0; font-size: 14px;">Database Connection (${dbType || 'Database'})</h3>
          <code style="color: #a0a0b0; font-size: 12px; word-break: break-all;">${dbConnection}</code>
          <p style="color: #888; font-size: 12px; margin: 8px 0 0 0;">Keep this connection string secure and do not share it publicly.</p>
        </div>
      `
    : '';

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to,
    subject: 'Your site is live! — HostMyService',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #e0e0e0; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #00f0ff; font-size: 28px; margin: 0;">Your site is live!</h1>
          <p style="color: #888; margin-top: 8px;">HostMyService Deployment Notification</p>
        </div>
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>Great news! Your website has been successfully deployed and is now live.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${siteUrl}" style="display: inline-block; background-color: #00f0ff; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 24px; font-weight: bold; font-size: 16px;">
            Visit Your Site
          </a>
        </div>
        <div style="background-color: #111; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #00f0ff; margin: 0 0 12px 0; font-size: 14px;">Site Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #888; padding: 4px 0; font-size: 13px; width: 40%;">Domain</td>
              <td style="color: #e0e0e0; padding: 4px 0; font-size: 13px;"><a href="${siteUrl}" style="color: #00f0ff;">${domain}</a></td>
            </tr>
            <tr>
              <td style="color: #888; padding: 4px 0; font-size: 13px;">Server IP</td>
              <td style="color: #e0e0e0; padding: 4px 0; font-size: 13px; font-family: monospace;">${serverIp}</td>
            </tr>
          </table>
        </div>
        ${dbSection}
        <div style="background-color: #111; border: 1px solid #f0a500; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #f0a500; margin: 0 0 8px 0; font-size: 14px;">Action Required: DNS Setup</h3>
          <p style="color: #ccc; font-size: 13px; margin: 0;">
            To make your site accessible, please add an A record in your domain DNS settings pointing to:
          </p>
          <code style="display: block; color: #00f0ff; font-size: 16px; margin-top: 8px; text-align: center;">${serverIp}</code>
          <p style="color: #888; font-size: 12px; margin: 8px 0 0 0;">DNS propagation can take up to 24-48 hours. SSL will activate automatically once DNS resolves.</p>
        </div>
        <hr style="border-color: #333; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">
          Thank you for using HostMyService. For support, contact us at ${process.env.SMTP_EMAIL}.
        </p>
        <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">HostMyService Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending site live email:', error);
    return { success: false, error };
  }
};
