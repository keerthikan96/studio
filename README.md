# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Firebase Backend Migration

The app now supports an opt-in Firebase backend path for authentication, Firestore-backed profile and permission reads, Firebase Storage uploads, and bootstrapping the initial admin account without removing the existing SQL and Azure implementations.

### Required environment variables

Switch the providers you want to use:

```env
AUTH_PROVIDER=firebase
DATA_BACKEND_PROVIDER=firebase
FILE_STORAGE_PROVIDER=firebase
```

Configure the client Firebase app:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Configure Firebase admin access using either `GOOGLE_APPLICATION_CREDENTIALS` or these variables:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
FIREBASE_ADMIN_EMAIL=admin@gmail.com
FIREBASE_ADMIN_INITIAL_PASSWORD=ChangeMe@123
```

### Bootstrap the initial admin

```bash
npm run seed:firebase-admin
```

This creates or updates the Firebase Auth user for `admin@gmail.com` and writes the matching Firestore member profile with Super Admin permissions while keeping the current login screen and routes unchanged.
