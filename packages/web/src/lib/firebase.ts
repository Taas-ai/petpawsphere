import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'petapp-38f4a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'petapp-38f4a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'petapp-38f4a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

if (!firebaseConfig.apiKey) {
  console.warn(
    '[PetPawSphere] Firebase not configured. Add VITE_FIREBASE_* to .env\n' +
    '  Firebase Console → Project petapp-38f4a → Project Settings → Your apps → SDK config',
  );
  // Create stub — UI will render; auth calls will surface errors per-action
  app = initializeApp({ ...firebaseConfig, apiKey: '__missing__' }, 'stub');
  auth = getAuth(app);
} else {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // App Check — protects backend from bot/script abuse
  // Requires VITE_RECAPTCHA_SITE_KEY from Google Cloud Console (reCAPTCHA Enterprise)
  // Firebase Console → App Check → Register app → reCAPTCHA Enterprise
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (recaptchaKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

/** Call once user accepts cookies — initializes Firebase Analytics */
export function initAnalytics() {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== '__missing__') {
    try {
      getAnalytics(app);
    } catch {
      // Analytics may already be initialized or blocked by browser
    }
  }
}

export { app, auth };
