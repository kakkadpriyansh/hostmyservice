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
