import crypto from 'crypto';
import type { UserRecord } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ALL_PERMISSIONS } from './permissions';
import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  hasFirebaseAdminConfiguration,
  isFirebaseAuthEnabled,
  isFirebaseDataEnabled,
  shouldUseFirebaseBackend,
} from './firebase-admin';

type AuthFlowType = 'invitation' | 'reset';

export interface FirebaseMemberProfile {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  status: string;
  role: string;
  permissions: string[];
  employee_id?: string;
  domain?: string;
  authProvider: 'firebase';
  legacyId?: string;
  created_at: string;
  updated_at: string;
}

interface AuthFlowRecord {
  email: string;
  otp: string;
  type: AuthFlowType;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

function nowIso() {
  return new Date().toISOString();
}

function membersCollection() {
  return getFirebaseAdminDb().collection('members');
}

function authFlowsCollection() {
  return getFirebaseAdminDb().collection('auth_flows');
}

function mapFirebaseAuthError(message: string) {
  if (message.includes('EMAIL_NOT_FOUND')) {
    return 'No user found with this email.';
  }
  if (message.includes('INVALID_PASSWORD')) {
    return 'Invalid password.';
  }
  if (message.includes('USER_DISABLED')) {
    return 'This account is disabled and cannot be logged into.';
  }
  if (message.includes('INVALID_LOGIN_CREDENTIALS')) {
    return 'Invalid email or password.';
  }
  return 'An unexpected error occurred during login.';
}

function toProfile(user: UserRecord, overrides?: Partial<FirebaseMemberProfile>): FirebaseMemberProfile {
  const currentTime = nowIso();
  return {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || overrides?.name || user.email || 'Unknown User',
    first_name: overrides?.first_name,
    last_name: overrides?.last_name,
    status: overrides?.status || 'active',
    role: overrides?.role || 'Employee',
    permissions: overrides?.permissions || [],
    employee_id: overrides?.employee_id,
    domain: overrides?.domain,
    authProvider: 'firebase',
    legacyId: overrides?.legacyId,
    created_at: overrides?.created_at || currentTime,
    updated_at: currentTime,
  };
}

async function getMemberProfileByUid(uid: string) {
  const snapshot = await membersCollection().doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }
  return snapshot.data() as FirebaseMemberProfile;
}

export async function getFirebaseMemberProfileByAnyId(userId: string) {
  if (!shouldUseFirebaseBackend() || !hasFirebaseAdminConfiguration()) {
    return null;
  }

  const byUid = await getMemberProfileByUid(userId);
  if (byUid) {
    return byUid;
  }

  const byLegacyId = await membersCollection().where('legacyId', '==', userId).limit(1).get();
  if (byLegacyId.empty) {
    return null;
  }

  return byLegacyId.docs[0].data() as FirebaseMemberProfile;
}

export async function getFirebaseMemberProfileByEmail(email: string) {
  if (!shouldUseFirebaseBackend() || !hasFirebaseAdminConfiguration()) {
    return null;
  }

  const snapshot = await membersCollection().where('email', '==', email).limit(1).get();
  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as FirebaseMemberProfile;
}

export async function upsertFirebaseMemberProfile(profile: FirebaseMemberProfile) {
  const currentTime = nowIso();
  await membersCollection().doc(profile.id).set(
    {
      ...profile,
      updated_at: currentTime,
      created_at: profile.created_at || currentTime,
    },
    { merge: true }
  );
}

export async function ensureFirebaseAdminBootstrap() {
  if (!shouldUseFirebaseBackend() || !hasFirebaseAdminConfiguration()) {
    return null;
  }

  const auth = getFirebaseAdminAuth();
  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.FIREBASE_ADMIN_INITIAL_PASSWORD || 'ChangeMe@123';

  let user: UserRecord;
  try {
    user = await auth.getUserByEmail(adminEmail);
  } catch (error: any) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }

    user = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'People and Culture Office',
      emailVerified: true,
    });
  }

  const existing = await getMemberProfileByUid(user.uid);
  if (!existing) {
    await upsertFirebaseMemberProfile(
      toProfile(user, {
        name: 'People and Culture Office',
        first_name: 'People and Culture',
        last_name: 'Office',
        status: 'active',
        role: 'Super Admin',
        permissions: ALL_PERMISSIONS.map((permission) => permission.id),
        employee_id: 'ADMIN001',
        domain: 'HR',
      })
    );
  }

  return user;
}

export async function signInWithFirebaseEmailPassword(email: string, password: string) {
  if (!isFirebaseAuthEnabled()) {
    return { success: false as const, error: 'Firebase auth is not enabled.' };
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    return { success: false as const, error: 'Firebase API key is not configured.' };
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      cache: 'no-store',
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    return {
      success: false as const,
      error: mapFirebaseAuthError(payload?.error?.message || 'UNKNOWN_ERROR'),
    };
  }

  const userId = payload.localId as string;
  let profile = await getMemberProfileByUid(userId);

  if (!profile && hasFirebaseAdminConfiguration()) {
    const auth = getFirebaseAdminAuth();
    const user = await auth.getUser(userId);
    profile = toProfile(user);
    await upsertFirebaseMemberProfile(profile);
  }

  return {
    success: true as const,
    profile,
    userId,
  };
}

export async function createFirebaseAuthFlow(email: string, type: AuthFlowType) {
  if (!hasFirebaseAdminConfiguration()) {
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + (type === 'invitation' ? 7 * 24 * 60 : 15) * 60 * 1000);
  const currentTime = nowIso();

  const payload: AuthFlowRecord = {
    email,
    otp,
    type,
    expires_at: expiresAt.toISOString(),
    created_at: currentTime,
    updated_at: currentTime,
  };

  await authFlowsCollection().doc(token).set(payload);

  return {
    token,
    otp,
    expires_at: payload.expires_at,
  };
}

export async function getFirebaseAuthFlow(token: string, type: AuthFlowType) {
  if (!hasFirebaseAdminConfiguration()) {
    return null;
  }

  const snapshot = await authFlowsCollection().doc(token).get();
  if (!snapshot.exists) {
    return null;
  }

  const payload = snapshot.data() as AuthFlowRecord;
  if (payload.type !== type) {
    return null;
  }

  return payload;
}

export async function deleteFirebaseAuthFlow(token: string) {
  if (!hasFirebaseAdminConfiguration()) {
    return;
  }

  await authFlowsCollection().doc(token).delete();
}

export async function setFirebasePasswordForEmail(email: string, newPassword: string, profile?: Partial<FirebaseMemberProfile>) {
  if (!hasFirebaseAdminConfiguration()) {
    return null;
  }

  const auth = getFirebaseAdminAuth();
  let user: UserRecord;

  try {
    user = await auth.getUserByEmail(email);
    user = await auth.updateUser(user.uid, {
      password: newPassword,
      emailVerified: true,
      displayName: profile?.name || user.displayName || undefined,
    });
  } catch (error: any) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }

    user = await auth.createUser({
      email,
      password: newPassword,
      emailVerified: true,
      displayName: profile?.name,
    });
  }

  const existingProfile = (await getMemberProfileByUid(user.uid)) || (await getFirebaseMemberProfileByEmail(email));
  await upsertFirebaseMemberProfile(
    toProfile(user, {
      ...existingProfile,
      ...profile,
      id: user.uid,
      email,
      status: profile?.status || existingProfile?.status || 'active',
      role: profile?.role || existingProfile?.role || 'Employee',
      permissions: profile?.permissions || existingProfile?.permissions || [],
      created_at: existingProfile?.created_at,
      legacyId: profile?.legacyId || existingProfile?.legacyId,
    })
  );

  return user;
}

export async function syncSqlMemberToFirebaseProfile(member: {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  role?: string;
}) {
  if (!isFirebaseDataEnabled() || !hasFirebaseAdminConfiguration()) {
    return;
  }

  const existing = await getFirebaseMemberProfileByEmail(member.email);
  const docId = existing?.id || member.id;
  const currentTime = nowIso();

  await membersCollection().doc(docId).set(
    {
      id: docId,
      email: member.email,
      name: member.name,
      first_name: member.first_name,
      last_name: member.last_name,
      status: member.status || 'active',
      role: member.role || existing?.role || 'Employee',
      permissions: existing?.permissions || [],
      authProvider: existing?.authProvider || 'firebase',
      legacyId: member.id,
      created_at: existing?.created_at || currentTime,
      updated_at: currentTime,
    },
    { merge: true }
  );
}

export async function storeFirebaseAuditLog(action: string, details: Record<string, unknown>) {
  if (!isFirebaseDataEnabled() || !hasFirebaseAdminConfiguration()) {
    return;
  }

  await getFirebaseAdminDb().collection('audit_logs').add({
    action,
    details,
    created_at: Timestamp.fromDate(new Date()),
    created_at_iso: nowIso(),
    created_by: 'system',
    updated_at: FieldValue.serverTimestamp(),
  });
}