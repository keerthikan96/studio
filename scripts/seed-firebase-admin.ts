import 'dotenv/config';

import { ensureFirebaseAdminBootstrap } from '../src/lib/firebase-backend';

async function main() {
  const user = await ensureFirebaseAdminBootstrap();

  if (!user) {
    console.log('Firebase bootstrap skipped. Enable Firebase providers and configure admin credentials first.');
    return;
  }

  console.log('Firebase admin bootstrap complete.');
  console.log(`Email: ${user.email}`);
  console.log(`UID: ${user.uid}`);
}

main().catch((error) => {
  console.error('Failed to seed Firebase admin user:', error);
  process.exitCode = 1;
});