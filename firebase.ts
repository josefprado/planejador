
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithPopup, 
    signOut, 
    deleteUser, 
    GoogleAuthProvider,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Modular Services
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
const functions = getFunctions(app);

// Configure Google Provider with necessary scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Export the user type with an alias to avoid naming conflicts in the app
export type AuthUserType = User;

// Export modular services and functions for use throughout the app.
// The app can now import these directly.
export {
    app,
    auth,
    db,
    functions,
    googleProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    deleteUser,
    GoogleAuthProvider, // Exporting the class itself is useful for static methods like credentialFromResult
};