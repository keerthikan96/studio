
'use server';

import { db, setupDatabase } from '@/lib/db';
import { Member } from '@/lib/mock-data';
import crypto from 'crypto';
import { sendInviteEmail, sendPasswordResetEmail } from '@/lib/email-service';
import {
    createFirebaseAuthFlow,
    deleteFirebaseAuthFlow,
    ensureFirebaseAdminBootstrap,
    getFirebaseAuthFlow,
    getFirebaseMemberProfileByEmail,
    setFirebasePasswordForEmail,
    signInWithFirebaseEmailPassword,
    syncSqlMemberToFirebaseProfile,
} from '@/lib/firebase-backend';
import { hasFirebaseAdminConfiguration, isFirebaseAuthEnabled, shouldUseFirebaseBackend } from '@/lib/firebase-admin';

// In a real app, you'd use a robust hashing library like bcrypt
async function hashPassword(password: string) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function verifyPassword(password: string, hash: string) {
    return (await hashPassword(password)) === hash;
}

async function updateSqlMemberPassword(email: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);
    await db.query(
        'UPDATE members SET password = $1, status = \'active\', updated_at = NOW() WHERE email = $2',
        [hashedPassword, email]
    );
}

export async function loginAction(credentials: { email: string, password: string }): Promise<{ user?: { id: string, name: string, email: string, role: string }, error?: string }> {
    await setupDatabase();
    const { email, password } = credentials;

    if (isFirebaseAuthEnabled() && hasFirebaseAdminConfiguration()) {
        try {
            await ensureFirebaseAdminBootstrap();
            const firebaseResult = await signInWithFirebaseEmailPassword(email, password);

            if (firebaseResult.success && firebaseResult.profile) {
                if (firebaseResult.profile.status !== 'active') {
                    return { error: `This account is ${firebaseResult.profile.status} and cannot be logged into.` };
                }

                return {
                    user: {
                        id: firebaseResult.profile.id,
                        name: firebaseResult.profile.name,
                        email: firebaseResult.profile.email,
                        role: firebaseResult.profile.role,
                    }
                };
            }

            if (firebaseResult.error && firebaseResult.error !== 'No user found with this email.') {
                return { error: firebaseResult.error };
            }
        } catch (firebaseError) {
            console.error('Firebase login failed, falling back to SQL login:', firebaseError);
        }
    }
    
    // Regular member login
    try {
        const result = await db.query(`
            SELECT m.*, r.name as role
            FROM members m
            LEFT JOIN role_members rm ON m.id = rm.member_id
            LEFT JOIN roles r ON rm.role_id = r.id
            WHERE m.email = $1
        `, [email]);
        const member = result.rows[0] as (Member & { password?: string | null; role?: string }) | undefined;

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
            if (shouldUseFirebaseBackend() && hasFirebaseAdminConfiguration()) {
                await syncSqlMemberToFirebaseProfile(member);
            }
            return { user: { id: member.id, name: member.name, email: member.email, role: member.role || 'Employee' } };
        } else {
            return { error: 'Invalid password.' };
        }

    } catch (error) {
        console.error('Login error:', error);
        return { error: 'An unexpected error occurred during login.' };
    }
}

export async function requestPasswordResetAction(email: string, isInvitation = false,baseUrlR?: string): Promise<{ success: boolean; error?: string; invitationLink?: string }> {
    await setupDatabase();
    try {
        let memberId: string | null = null;
        let memberName: string = '';

        const useFirebase = shouldUseFirebaseBackend() && hasFirebaseAdminConfiguration();
        if (useFirebase) {
            await ensureFirebaseAdminBootstrap();
        }
        
        if (email === 'admin@gmail.com') {
            memberId = 'admin-user-001';
            memberName = 'Administrator';
        } else {
            const memberResult = await db.query('SELECT id, name FROM members WHERE email = $1', [email]);
            if (memberResult.rows.length === 0) {
                 const firebaseMember = useFirebase ? await getFirebaseMemberProfileByEmail(email) : null;
                 if (firebaseMember) {
                    memberId = firebaseMember.id;
                    memberName = firebaseMember.name;
                 }
            }

            if (!memberId && memberResult.rows.length === 0) {
                 console.log(`Password reset/invitation requested for non-existent user: ${email}. Silently failing.`);
                 // Still return success to prevent user enumeration
                 return { success: true };
            }

            if (!memberId) {
                memberId = memberResult.rows[0].id;
                memberName = memberResult.rows[0].name;
            }
        }

        const baseUrl = baseUrlR || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';

        if (useFirebase) {
            const type = isInvitation ? 'invitation' : 'reset';
            const flow = await createFirebaseAuthFlow(email, type);

            if (flow) {
                const resetLink = `${baseUrl}/reset-password?token=${flow.token}`;
                const invitationLink = `${baseUrl}/set-password?token=${flow.token}&email=${encodeURIComponent(email)}`;

                if (isInvitation) {
                    console.log('--- FIREBASE INVITATION LINK ---');
                    console.log(`To: ${email}`);
                    console.log(invitationLink);
                    console.log('--------------------------------');
                    return { success: true, invitationLink };
                }

                console.log('--- FIREBASE PASSWORD RESET ---');
                console.log(`To: ${email}`);
                console.log(`Reset Link: ${resetLink}`);
                console.log(`OTP: ${flow.otp}`);
                console.log('-------------------------------');
                return { success: true };
            }
        }

        const token = crypto.randomBytes(32).toString('hex');
        const otp = crypto.randomInt(100000, 999999).toString();
        const expires_at = new Date(Date.now() + (isInvitation ? 7 * 24 * 60 : 15) * 60 * 1000); // 7 days for invite, 15 mins for reset
        const type = isInvitation ? 'invitation' : 'reset';

        await db.query(
            'INSERT INTO password_resets (email, token, otp, expires_at, type) VALUES ($1, $2, $3, $4, $5)',
            [email, token, otp, expires_at, type]
        );
        
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        const invitationLink = `${baseUrl}/set-password?token=${token}&email=${encodeURIComponent(email)}`;

        if (isInvitation) {
            // Send invitation email via MailerSend
            const emailResult = await sendInviteEmail({
                recipientEmail: email,
                recipientName: memberName,
                inviteLink: invitationLink,
                inviterName: process.env.EMAIL_SENDER_NAME || 'Your Company',
                organizationName: process.env.EMAIL_ORGANIZATION_NAME || 'Your Organization',
            });

            if (!emailResult.success) {
                console.error('Failed to send invitation email:', emailResult.error);
                // Log the link as fallback
                console.log('--- INVITATION LINK (for existing employee) ---');
                console.log(`To: ${email}`);
                console.log(invitationLink);
                console.log('-----------------------------------------------');
            }
            
            return { success: true, invitationLink };
        }

        // Send password reset email via MailerSend
        const emailResult = await sendPasswordResetEmail({
            recipientEmail: email,
            recipientName: memberName,
            resetLink: resetLink,
        });

        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            // Log the link as fallback
            console.log('--- PASSWORD RESET ---');
            console.log(`To: ${email}`);
            console.log(`Reset Link: ${resetLink}`);
            console.log(`OTP: ${otp}`);
            console.log('--------------------');
        }

        return { success: true };

    } catch (error) {
        console.error('Error requesting password reset:', error);
        return { error: 'Failed to request password reset.', success: false };
    }
}

export async function setNewPasswordAction(data: { token: string, newPassword: string }): Promise<{ success: boolean, email?: string, error?: string }> {
    await setupDatabase();
    try {
        const { token, newPassword } = data;

        if (shouldUseFirebaseBackend() && hasFirebaseAdminConfiguration()) {
            const firebaseFlow = await getFirebaseAuthFlow(token, 'invitation');

            if (firebaseFlow) {
                if (new Date() > new Date(firebaseFlow.expires_at)) {
                    await deleteFirebaseAuthFlow(token);
                    return { success: false, error: 'Invitation token has expired. Please request a new one.' };
                }

                const profile = await getFirebaseMemberProfileByEmail(firebaseFlow.email);
                await setFirebasePasswordForEmail(firebaseFlow.email, newPassword, {
                    id: profile?.id || '',
                    email: firebaseFlow.email,
                    name: profile?.name || firebaseFlow.email,
                    role: profile?.role || 'Employee',
                    status: 'active',
                    permissions: profile?.permissions || [],
                    legacyId: profile?.legacyId,
                });

                const memberResult = await db.query('SELECT id FROM members WHERE email = $1', [firebaseFlow.email]);
                if (memberResult.rows.length > 0) {
                    await updateSqlMemberPassword(firebaseFlow.email, newPassword);
                }

                await deleteFirebaseAuthFlow(token);
                return { success: true, email: firebaseFlow.email };
            }
        }
        
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
            await updateSqlMemberPassword(email, newPassword);
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

        if (shouldUseFirebaseBackend() && hasFirebaseAdminConfiguration()) {
            const firebaseFlow = await getFirebaseAuthFlow(token, 'reset');

            if (firebaseFlow) {
                if (new Date() > new Date(firebaseFlow.expires_at)) {
                    await deleteFirebaseAuthFlow(token);
                    return { success: false, error: 'Reset token has expired. Please request a new one.' };
                }

                if (otp !== firebaseFlow.otp) {
                    return { success: false, error: 'Invalid OTP.' };
                }

                const profile = await getFirebaseMemberProfileByEmail(firebaseFlow.email);
                await setFirebasePasswordForEmail(firebaseFlow.email, newPassword, {
                    id: profile?.id || '',
                    email: firebaseFlow.email,
                    name: profile?.name || firebaseFlow.email,
                    role: profile?.role || 'Employee',
                    status: 'active',
                    permissions: profile?.permissions || [],
                    legacyId: profile?.legacyId,
                });

                const memberResult = await db.query('SELECT id FROM members WHERE email = $1', [firebaseFlow.email]);
                if (memberResult.rows.length > 0) {
                    await updateSqlMemberPassword(firebaseFlow.email, newPassword);
                }

                await deleteFirebaseAuthFlow(token);
                return { success: true, email: firebaseFlow.email };
            }
        }

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
            await updateSqlMemberPassword(email, newPassword);
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
