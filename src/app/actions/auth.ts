
'use server';

import { db, setupDatabase } from '@/lib/db';
import { Member } from '@/lib/mock-data';
import crypto from 'crypto';

// In a real app, you'd use a robust hashing library like bcrypt
async function hashPassword(password: string) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function verifyPassword(password: string, hash: string) {
    return (await hashPassword(password)) === hash;
}

export async function loginAction(credentials: { email: string, password: string }): Promise<{ user?: { id: string, name: string, email: string, role: 'staff' | 'HR' }, error?: string }> {
    await setupDatabase();
    const { email, password } = credentials;

    // Special case for admin user
    if (email === 'admin@gmail.com') {
        if (password === 'password') { // In a real app, this should also be a hashed password check
            return { user: { id: 'admin-user-001', name: 'People and Culture office', email, role: 'HR' } };
        } else {
            return { error: 'Invalid credentials for admin user.' };
        }
    }
    
    // Regular member login
    try {
        const result = await db.query('SELECT * FROM members WHERE email = $1', [email]);
        const member: Member = result.rows[0];

        if (!member) {
            return { error: 'No user found with this email.' };
        }

        if (member.status !== 'active') {
            return { error: `This account is ${member.status} and cannot be logged into.` };
        }
        
        // This is a simplified password check for the demo.
        // If the password field is null (e.g., for members created before this feature),
        // and they use the default password, let them in.
        const isPasswordCorrect = member.password 
            ? await verifyPassword(password, member.password)
            : password === 'password';

        if (isPasswordCorrect) {
            return { user: { id: member.id, name: member.name, email: member.email, role: 'staff' } };
        } else {
            return { error: 'Invalid password.' };
        }

    } catch (error) {
        console.error('Login error:', error);
        return { error: 'An unexpected error occurred during login.' };
    }
}

export async function requestPasswordResetAction(email: string, isInvitation = false): Promise<{ success: boolean; error?: string; invitationLink?: string }> {
    await setupDatabase();
    try {
        let memberId: string | null = null;
        if (email === 'admin@gmail.com') {
            memberId = 'admin-user-001';
        } else {
            const memberResult = await db.query('SELECT id FROM members WHERE email = $1', [email]);
            if (memberResult.rows.length === 0) {
                 console.log(`Password reset/invitation requested for non-existent user: ${email}. Silently failing.`);
                 return { success: true };
            }
            memberId = memberResult.rows[0].id;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const otp = crypto.randomInt(100000, 999999).toString();
        const expires_at = new Date(Date.now() + (isInvitation ? 7 * 24 * 60 : 15) * 60 * 1000); // 7 days for invite, 15 mins for reset
        const type = isInvitation ? 'invitation' : 'reset';

        await db.query(
            'INSERT INTO password_resets (email, token, otp, expires_at, type) VALUES ($1, $2, $3, $4, $5)',
            [email, token, otp, expires_at, type]
        );
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        const invitationLink = `${baseUrl}/set-password?token=${token}&email=${encodeURIComponent(email)}`;

        if (isInvitation) {
            console.log('--- INVITATION LINK (for new employee) ---');
            console.log(invitationLink);
            console.log('-------------------------------------------');
            return { success: true, invitationLink };
        }

        // In a real app, you would send an email here. For now, log to console.
        console.log('--- PASSWORD RESET ---');
        console.log(`To: ${email}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log(`OTP: ${otp}`);
        console.log('--------------------');

        return { success: true };

    } catch (error) {
        console.error('Error requesting password reset:', error);
        return { error: 'Failed to request password reset.' };
    }
}

export async function setNewPasswordAction(data: { token: string, newPassword: string }): Promise<{ success: boolean, email?: string, error?: string }> {
    await setupDatabase();
    try {
        const { token, newPassword } = data;
        
        const resetRecordResult = await db.query('SELECT * FROM password_resets WHERE token = $1 AND type = \'invitation\'', [token]);
        const resetRecord = resetRecordResult.rows[0];

        if (!resetRecord) {
            return { success: false, error: 'Invalid or expired invitation token.' };
        }

        if (new Date() > new Date(resetRecord.expires_at)) {
            await db.query('DELETE FROM password_resets WHERE id = $1', [resetRecord.id]);
            return { success: false, error: 'Invitation token has expired. Please request a new one.' };
        }
                
        const { email } = resetRecord;

        // The admin user is not in the 'members' table, so we handle it separately.
        if (email !== 'admin@gmail.com') {
            const hashedPassword = await hashPassword(newPassword);
            await db.query('UPDATE members SET password = $1, status = \'active\', updated_at = NOW() WHERE email = $2', [hashedPassword, email]);
        } else {
            console.log(`Admin password has been set. In a real application, you would store this securely.`);
        }
                
        // Clean up the reset token
        await db.query('DELETE FROM password_resets WHERE id = $1', [resetRecord.id]);

        return { success: true, email };
     
    } catch (error) {
        console.error('Error setting new password:', error);
        return { success: false, error: 'Failed to set password.' };
    }
}

export async function resetPasswordAction(data: { token: string, newPassword: string, otp: string }): Promise<{ success: boolean, email?: string, error?: string }> {
    await setupDatabase();
    try {
        const { token, otp, newPassword } = data;

        const resetRecordResult = await db.query('SELECT * FROM password_resets WHERE token = $1 AND type = \'reset\'', [token]);
        const resetRecord = resetRecordResult.rows[0];

        if (!resetRecord) {
            return { success: false, error: 'Invalid or expired reset token.' };
        }

        if (new Date() > new Date(resetRecord.expires_at)) {
            await db.query('DELETE FROM password_resets WHERE id = $1', [resetRecord.id]);
            return { success: false, error: 'Reset token has expired. Please request a new one.' };
        }

        if (otp !== resetRecord.otp) {
            return { success: false, error: 'Invalid OTP.' };
        }

        const { email } = resetRecord;

        // The admin user is not in the 'members' table, so we handle it separately.
        if (email !== 'admin@gmail.com') {
             const hashedPassword = await hashPassword(newPassword);
            await db.query('UPDATE members SET password = $1, status = \'active\', updated_at = NOW() WHERE email = $2', [hashedPassword, email]);
        } else {
            console.log(`Admin password has been reset. In a real application, you would store this securely.`);
        }
        
        // Clean up the reset token
        await db.query('DELETE FROM password_resets WHERE id = $1', [resetRecord.id]);

        return { success: true, email };

    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: 'Failed to reset password.' };
    }
}
