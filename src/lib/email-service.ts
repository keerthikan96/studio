import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

// Initialize MailerSend
const mailerSend = new MailerSend({
  apiKey: process.env.EMAIL_API_TOKEN || '',
});

// Configure sender details
const SENDER_EMAIL = process.env.EMAIL_SENDER_ADDRESS || "info@yourdomain.com";
const SENDER_NAME = process.env.EMAIL_SENDER_NAME || "Your Company";
const INVITE_TEMPLATE_ID = process.env.EMAIL_INVITE_TEMPLATE_ID || "jy7zpl9dzzpg5vx6";
const RESET_TEMPLATE_ID = process.env.EMAIL_RESET_TEMPLATE_ID || "jy7zpl9dzzpg5vx6";

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
    const sentFrom = new Sender(SENDER_EMAIL, SENDER_NAME);
    const recipients = [new Recipient(recipientEmail, recipientName)];

    // Template logic commented out - using HTML content instead
    // const personalization = [
    //   {
    //     email: recipientEmail,
    //     data: {
    //       name: recipientName,
    //       action_url: inviteLink,
    //       account_name: recipientEmail,
    //       invite_sender_name: inviterName,
    //       invite_sender_organization_name: organizationName,
    //       support_email: SENDER_EMAIL,
    //       help_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000'}/help`,
    //       live_chat_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000'}/support`,
    //     },
    //   },
    // ];

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
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">You're Invited!</h1>
                  </td>
                </tr>
                
                <!-- Body -->
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
                      <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                        Accept Invitation
                      </a>
                    </p>
                    
                    <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 20px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 8px 0 0; color: #667eea; font-size: 14px; line-height: 20px; word-break: break-all;">
                      ${inviteLink}
                    </p>
                    
                    <p style="margin: 32px 0 0; color: #718096; font-size: 14px; line-height: 20px;">
                      Your account email: <strong style="color: #4a5568;">${recipientEmail}</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 12px; color: #718096; font-size: 13px; line-height: 18px; text-align: center;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 16px; text-align: center;">
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

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(`You've been invited to join ${organizationName}`)
      .setHtml(htmlContent);
      // .setTemplateId(INVITE_TEMPLATE_ID) // Template commented out
      // .setPersonalization(personalization);

    const response = await mailerSend.email.send(emailParams);
    
    console.log(`✅ Invitation email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send invitation email:', error);
    
    // Extract meaningful error message from MailerSend response
    let errorMessage = 'Unknown error sending email';
    if (error?.body?.message) {
      errorMessage = error.body.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Log detailed error for debugging
    console.error('Email error details:', {
      from: SENDER_EMAIL,
      to: recipientEmail,
      error: errorMessage,
      statusCode: error?.statusCode
    });
    
    return { 
      success: false, 
      error: errorMessage
    };
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
    const sentFrom = new Sender(SENDER_EMAIL, SENDER_NAME);
    const recipients = [new Recipient(recipientEmail, recipientName)];

    // Template logic commented out - using HTML content instead
    // const personalization = [
    //   {
    //     email: recipientEmail,
    //     data: {
    //       name: recipientName,
    //       action_url: resetLink,
    //       account_name: recipientEmail,
    //       support_email: SENDER_EMAIL,
    //       help_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000'}/help`,
    //     },
    //   },
    // ];

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
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Password Reset</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 16px; color: #1a202c; font-size: 16px; line-height: 24px;">
                      Hi <strong>${recipientName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 24px;">
                      We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    
                    <p style="margin: 24px 0; text-align: center;">
                      <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 87, 108, 0.3);">
                        Reset Password
                      </a>
                    </p>
                    
                    <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 20px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 8px 0 0; color: #f5576c; font-size: 14px; line-height: 20px; word-break: break-all;">
                      ${resetLink}
                    </p>
                    
                    <div style="margin: 32px 0; padding: 16px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 4px;">
                      <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 20px;">
                        <strong>⚠️ Important:</strong> This password reset link will expire in 1 hour for security reasons.
                      </p>
                    </div>
                    
                    <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 20px;">
                      Your account email: <strong style="color: #4a5568;">${recipientEmail}</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 12px; color: #718096; font-size: 13px; line-height: 18px; text-align: center;">
                      If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                    <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 16px; text-align: center;">
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

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject('Password Reset Request')
      .setHtml(htmlContent);
      // .setTemplateId(RESET_TEMPLATE_ID) // Template commented out
      // .setPersonalization(personalization);

    const response = await mailerSend.email.send(emailParams);
    
    console.log(`✅ Password reset email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send password reset email:', error);
    
    // Extract meaningful error message from MailerSend response
    let errorMessage = 'Unknown error sending email';
    if (error?.body?.message) {
      errorMessage = error.body.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Log detailed error for debugging
    console.error('Email error details:', {
      from: SENDER_EMAIL,
      to: recipientEmail,
      error: errorMessage,
      statusCode: error?.statusCode
    });
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

/**
 * Generic email sender for custom use cases
 */
export async function sendCustomEmail({
  recipientEmail,
  recipientName,
  subject,
  templateId,
  personalizationData,
}: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  templateId: string;
  personalizationData: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sentFrom = new Sender(SENDER_EMAIL, SENDER_NAME);
    const recipients = [new Recipient(recipientEmail, recipientName)];

    const personalization = [
      {
        email: recipientEmail,
        data: personalizationData,
      },
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setTemplateId(templateId)
      .setPersonalization(personalization);

    const response = await mailerSend.email.send(emailParams);
    
    console.log(`✅ Email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    
    // Extract meaningful error message from MailerSend response
    let errorMessage = 'Unknown error sending email';
    if (error?.body?.message) {
      errorMessage = error.body.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Log detailed error for debugging
    console.error('Email error details:', {
      from: SENDER_EMAIL,
      to: recipientEmail,
      error: errorMessage,
      statusCode: error?.statusCode
    });
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
}
