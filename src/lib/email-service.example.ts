/**
 * Example usage of the email service
 * 
 * This file demonstrates how to use the email service functions
 * in different scenarios across your application.
 */

import { 
  sendInviteEmail, 
  sendPasswordResetEmail, 
  sendCustomEmail 
} from './email-service';

// Example 1: Sending an invitation email
async function exampleInviteEmail() {
  const result = await sendInviteEmail({
    recipientEmail: 'newuser@example.com',
    recipientName: 'John Doe',
    inviteLink: 'https://yourapp.com/set-password?token=abc123',
    inviterName: 'Jane Admin',
    organizationName: 'Acme Corporation',
  });

  if (result.success) {
    console.log('Invitation sent successfully!');
  } else {
    console.error('Failed to send invitation:', result.error);
  }
}

// Example 2: Sending a password reset email
async function examplePasswordResetEmail() {
  const result = await sendPasswordResetEmail({
    recipientEmail: 'user@example.com',
    recipientName: 'Jane Smith',
    resetLink: 'https://yourapp.com/reset-password?token=xyz789',
  });

  if (result.success) {
    console.log('Password reset email sent successfully!');
  } else {
    console.error('Failed to send password reset:', result.error);
  }
}

// Example 3: Sending a custom email with a different template
async function exampleCustomEmail() {
  const result = await sendCustomEmail({
    recipientEmail: 'user@example.com',
    recipientName: 'Bob Johnson',
    subject: 'Welcome to Our Platform!',
    templateId: 'your-custom-template-id',
    personalizationData: {
      username: 'bobjohnson',
      account_type: 'Premium',
      activation_date: '2026-01-08',
      support_email: 'support@yourcompany.com',
    },
  });

  if (result.success) {
    console.log('Custom email sent successfully!');
  } else {
    console.error('Failed to send custom email:', result.error);
  }
}

// Example 4: Using in a server action (similar to your auth.ts)
async function exampleServerAction() {
  try {
    // Your business logic here
    const user = { email: 'user@example.com', name: 'Test User' };
    const inviteToken = 'generated-token-123';
    
    // Send the invite email
    const emailResult = await sendInviteEmail({
      recipientEmail: user.email,
      recipientName: user.name,
      inviteLink: `https://yourapp.com/set-password?token=${inviteToken}`,
    });

    if (!emailResult.success) {
      // Handle email failure (log, retry, etc.)
      console.error('Email failed:', emailResult.error);
      // You might want to still return success to the user
      // or implement a retry mechanism
    }

    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { success: false, error: 'Failed to process request' };
  }
}

/**
 * Configuration checklist:
 * 
 * 1. Add to .env file:
 *    - EMAIL_API_TOKEN=your_mailersend_api_token
 *    - EMAIL_SENDER_ADDRESS=noreply@yourdomain.com
 *    - EMAIL_SENDER_NAME=Your Company Name
 *    - EMAIL_ORGANIZATION_NAME=Your Organization
 *    - EMAIL_INVITE_TEMPLATE_ID=your_invite_template_id
 *    - EMAIL_RESET_TEMPLATE_ID=your_reset_template_id
 *    - NEXT_PUBLIC_APP_URL=https://yourapp.com
 * 
 * 2. Create email templates in MailerSend dashboard:
 *    - Invitation template with variables:
 *      {name}, {action_url}, {invite_sender_name}, 
 *      {invite_sender_organization_name}, {support_email}
 *    
 *    - Password reset template with variables:
 *      {name}, {action_url}, {support_email}
 * 
 * 3. Verify your domain in MailerSend
 * 
 * 4. Test with a real email address first
 */
