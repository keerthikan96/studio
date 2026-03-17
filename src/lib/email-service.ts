import { getFirestoreForEmail } from './firebase-admin';

// Configure sender / org details (still used inside email templates)
const SENDER_EMAIL = process.env.EMAIL_SENDER_ADDRESS || "info@yourdomain.com";
const SENDER_NAME = process.env.EMAIL_SENDER_NAME || "Your Company";

/**
 * Enqueues an email via the Firebase Trigger Email Extension.
 * The extension watches the `mail` Firestore collection and delivers
 * emails through the configured SMTP provider (e.g. Gmail / Google Workspace SMTP).
 */
async function enqueueEmail(to: string, subject: string, html: string): Promise<void> {
  const db = getFirestoreForEmail();
  await db.collection('mail').add({
    to,
    message: { subject, html },
  });
}

interface SendInviteEmailParams {
  recipientEmail: string;
  recipientName: string;
  inviteLink: string;
  inviterName?: string;
  organizationName?: string;
}

interface SendPasswordResetEmailParams {
  recipientEmail: string;
  recipientName: string;
  resetLink: string;
}

/**
 * Send invitation email to a new user
 */
export async function sendInviteEmail({
  recipientEmail,
  recipientName,
  inviteLink,
  inviterName = SENDER_NAME,
  organizationName = "Your Organization",
}: SendInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">You're Invited!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 16px; color: #1a202c; font-size: 16px; line-height: 24px;">
                      Hi <strong>${recipientName}</strong>,
                    </p>
                    <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 24px;">
                      <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong>. 
                      Click the button below to set up your account and get started.
                    </p>
                    <p style="margin: 24px 0; text-align: center;">
                      <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                        Accept Invitation
                      </a>
                    </p>
                    <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 20px;">
                      Or copy and paste this link into your browser:<br/>
                      <span style="color: #667eea; word-break: break-all;">${inviteLink}</span>
                    </p>
                    <p style="margin: 32px 0 0; color: #718096; font-size: 14px;">
                      Your account email: <strong style="color: #4a5568;">${recipientEmail}</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 12px; color: #718096; font-size: 13px; text-align: center;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                      Need help? Contact us at <a href="mailto:${SENDER_EMAIL}" style="color: #667eea; text-decoration: none;">${SENDER_EMAIL}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await enqueueEmail(
      recipientEmail,
      `You've been invited to join ${organizationName}`,
      htmlContent,
    );

    console.log(`✅ Invitation email queued for ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to queue invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error sending email' };
  }
}

/**
 * Send password reset email to a user
 */
export async function sendPasswordResetEmail({
  recipientEmail,
  recipientName,
  resetLink,
}: SendPasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Password Reset</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 16px; color: #1a202c; font-size: 16px; line-height: 24px;">
                      Hi <strong>${recipientName}</strong>,
                    </p>
                    <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 24px;">
                      We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    <p style="margin: 24px 0; text-align: center;">
                      <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                        Reset Password
                      </a>
                    </p>
                    <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 20px;">
                      Or copy and paste this link into your browser:<br/>
                      <span style="color: #f5576c; word-break: break-all;">${resetLink}</span>
                    </p>
                    <div style="margin: 32px 0; padding: 16px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 4px;">
                      <p style="margin: 0; color: #742a2a; font-size: 14px;">
                        <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                      </p>
                    </div>
                    <p style="margin: 24px 0 0; color: #718096; font-size: 14px;">
                      Your account email: <strong style="color: #4a5568;">${recipientEmail}</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 12px; color: #718096; font-size: 13px; text-align: center;">
                      If you didn't request a password reset, please ignore this email or contact support.
                    </p>
                    <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                      Need help? Contact us at <a href="mailto:${SENDER_EMAIL}" style="color: #f5576c; text-decoration: none;">${SENDER_EMAIL}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await enqueueEmail(recipientEmail, 'Password Reset Request', htmlContent);

    console.log(`✅ Password reset email queued for ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to queue password reset email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error sending email' };
  }
}

/**
 * Generic email sender for custom use cases
 */
export async function sendCustomEmail({
  recipientEmail,
  recipientName,
  subject,
  htmlContent,
}: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  htmlContent: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await enqueueEmail(recipientEmail, subject, htmlContent);
    console.log(`✅ Custom email queued for ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to queue custom email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error sending email' };
  }
}
