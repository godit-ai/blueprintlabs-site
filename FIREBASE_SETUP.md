# Firebase Authentication Setup Guide

This guide walks you through setting up Firebase Authentication for the Blueprint Labs / Leanference site.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Name it `blueprintlabs`
4. Disable Google Analytics if you don't need it (optional)
5. Click **Create project** and wait for it to finish

## Step 2: Enable Authentication Providers

1. In your Firebase project, go to **Authentication** in the left sidebar (under "Build")
2. Click **"Get started"**
3. Go to the **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle the first switch ON
   - Click **Save**
5. Enable **Google**:
   - Click on "Google"
   - Toggle the switch ON
   - Enter a project support email (your email)
   - Click **Save**

## Step 3: Add Authorized Domains

1. Still in Authentication, go to the **Settings** tab
2. Under **Authorized domains**, make sure these are listed:
   - `localhost` (should be there by default)
   - `blueprintlabs.live` (add this)
   - `www.blueprintlabs.live` (add this if you use www)
   - Any other custom domains

## Step 4: Register a Web App and Get Config

1. Go to **Project Settings** (gear icon in sidebar, or click the gear next to "Project Overview")
2. Scroll down to **"Your apps"**
3. Click the **Web** icon (`</>`) to add a web app
4. Enter a nickname like `blueprintlabs-site`
5. You do NOT need Firebase Hosting (uncheck it)
6. Click **Register app**
7. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "blueprintlabs.firebaseapp.com",
  projectId: "blueprintlabs",
  storageBucket: "blueprintlabs.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## Step 5: Update firebase-config.js

1. Open `scripts/firebase-config.js`
2. Replace the placeholder values with the real ones from Step 4:
   - `YOUR_API_KEY` -> your actual apiKey
   - `YOUR_SENDER_ID` -> your actual messagingSenderId
   - `YOUR_APP_ID` -> your actual appId
   - Update `authDomain`, `projectId`, `storageBucket` if different
3. Save the file

## Step 6: Test Locally

Open the site locally in a browser and test:

1. **Sign up** with an email/password on `signup.html`
   - Verify the account appears in Firebase Console > Authentication > Users
2. **Sign out** and **sign in** on `login.html`
3. **Google sign-in** (may not work on `localhost` without HTTPS -- test on deployed site)
4. **Dashboard** should show your email and generated API keys
5. **Forgot password** should send a real password reset email

## Step 7: Deploy

Push the updated files to GitHub and your GitHub Pages site will update automatically:

```bash
cd /home/clay/.openclaw/workspace/blueprintlabs-site
git add -A
git commit -m "Add Firebase authentication"
git push
```

## Troubleshooting

- **"auth/operation-not-allowed"** -- The sign-in method isn't enabled in Firebase Console
- **"auth/unauthorized-domain"** -- Add your domain to Authorized Domains in Firebase Console > Authentication > Settings
- **Google popup blocked** -- The browser is blocking popups. Users need to allow popups for your domain
- **"auth/invalid-api-key"** -- Double-check the apiKey in firebase-config.js
- **CORS errors** -- Make sure your domain is in the authorized domains list

## Architecture Notes

- Auth is 100% client-side using Firebase Auth SDK (compat version 10.7.0)
- User profile data (plan, company, etc.) is stored in `localStorage` under key `lf_user_profile`
- API keys are deterministically generated from the user's Firebase UID (display only -- not real API keys)
- To upgrade to real API key management, you'd add Firestore or a backend service
- Session persistence respects the "Remember me" checkbox (LOCAL vs SESSION persistence)
