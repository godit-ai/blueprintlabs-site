// Firebase configuration for Blueprint Labs / Leanference
// =======================================================
// UPDATE THESE VALUES with your real Firebase project config.
// See FIREBASE_SETUP.md for step-by-step instructions.
//
// Go to https://console.firebase.google.com
//   -> Create project "blueprintlabs"
//   -> Authentication -> Enable Email/Password and Google sign-in
//   -> Project Settings -> Your apps -> Web app -> Copy config

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "blueprintlabs.firebaseapp.com",
  projectId: "blueprintlabs",
  storageBucket: "blueprintlabs.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Helper: generate a deterministic API key from user UID
function generateApiKey(uid, prefix) {
  // Simple hash-based key (NOT cryptographically secure - just for display)
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return prefix + '_' + hex + uid.substring(0, 8);
}
