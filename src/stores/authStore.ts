import { create } from 'zustand';
import { doc, getDoc, setDoc, addDoc, collection, writeBatch, getDocs, query, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { 
    auth, db, googleProvider, onAuthStateChanged, 
    signInWithPopup, signOut, deleteUser, GoogleAuthProvider,
    type AuthUserType
} from '../../firebase';
import { User, AppSettings, Trip } from '../types';
import { useUIStore } from './uiStore';
import { useTripStore } from './tripStore';
import { trackGenerateLead } from '../../services/analyticsEvents';

// --- Helper Functions ---
export const logUserIntent = async (action: string, details: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const intentLogEntry = {
        timestamp: new Date().toISOString(),
        action,
        details,
    };
    const userRef = doc(db, "users", user.uid);
    try {
        await updateDoc(userRef, {
            intentLog: arrayUnion(intentLogEntry)
        });
        // Optimistically update local state
        useAuthStore.setState(state => ({
            user: state.user ? { ...state.user, intentLog: [...(state.user.intentLog || []), intentLogEntry] } : null
        }));
    } catch (error) {
        console.error("Failed to log user intent:", error);
    }
};


interface AuthState {
    user: User | null;
    isLoading: boolean;
    authError: string | null;
    appSettings: AppSettings;
    consentData: User['termsAccepted'] | null;
    
    // Actions
    initAuthListener: () => () => void;
    fetchAppSettings: () => Promise<void>;
    login: () => Promise<void>;
    logout: () => void;
    saveProfile: (profileData: Partial<User>) => Promise<void>;
    deleteAccount: () => Promise<void>;
    acceptConsent: (termsVersion: string, privacyVersion: string) => Promise<void>;
    cancelAndLogout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    authError: null,
    appSettings: {},
    consentData: null,
    
    fetchAppSettings: async () => {
        try {
            const settingsRef = doc(db, "settings", "integrations");
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                set({ appSettings: docSnap.data() as AppSettings });
            } else {
                console.warn("No settings document found. Marketing integrations disabled.");
                set({ appSettings: {} });
            }
        } catch (error: any) {
            console.error("Error fetching app settings:", error);
            if (error.code === 'permission-denied') {
                console.warn("Could not fetch app settings due to Firestore security rules. Add `allow read: if true;` to `/settings/integrations`.");
            }
            set({ appSettings: {} });
        }
    },

    initAuthListener: () => {
        return onAuthStateChanged(auth, async (currentUser: AuthUserType | null) => {
            set({ authError: null });
            if (currentUser) {
                // When a user logs in, guest mode is disabled.
                useTripStore.getState().setGuestMode(false);
                
                const authUser: User = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                };
                
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(userRef);
                    
                    if (!docSnap.exists()) {
                        set({ user: authUser });
                        useUIStore.getState().openModal('consent', { persistent: true });
                    } else {
                        const fullUser = { ...authUser, ...docSnap.data() };
                        set({ user: fullUser });
                        useTripStore.getState().initTripListener(fullUser.uid);
                    }
                } catch (e: any) {
                    console.error("Error loading user profile:", e);
                    set({ user: authUser, authError: "Could not load your profile data, but you are logged in." });
                }
            } else { // No user logged in
                set({ user: null, authError: null });
                useTripStore.getState().handleLogout();
            }
            set({ isLoading: false });
        });
    },

    login: async () => {
        useUIStore.getState().closeModal();
        set({ authError: null });
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential) {
                sessionStorage.setItem('googleDriveToken', (credential as any).accessToken);
            } else {
                throw new Error("Google credential was not received after login.");
            }
        } catch (error: any) {
            console.error("Error during sign in with popup:", error);
            const errorMessage = error.code === 'auth/account-exists-with-different-credential'
              ? 'An account with this email already exists using a different login method.'
              : 'An error occurred during login. Please try again.';
            set({ authError: errorMessage });
        }
    },

    logout: () => {
        signOut(auth);
        sessionStorage.removeItem('googleDriveToken');
        useUIStore.getState().toggleMenu(false);
    },

    acceptConsent: async (termsVersion: string, privacyVersion: string) => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const geoData = await response.json();
            const data: User['termsAccepted'] = {
                timestamp: new Date().toISOString(),
                termsVersion, privacyVersion,
                ipAddress: geoData.ip,
                location: `${geoData.city}, ${geoData.region}, ${geoData.country_name}`,
                userAgent: navigator.userAgent
            };
            set({ consentData: data });
            useUIStore.getState().openModal('profile', { persistent: true });
        } catch (error) {
            console.error("Error fetching geo data, using fallback:", error);
            const data: User['termsAccepted'] = {
                timestamp: new Date().toISOString(),
                termsVersion, privacyVersion, ipAddress: 'N/A',
                location: 'N/A', userAgent: navigator.userAgent
            };
            set({ consentData: data });
            useUIStore.getState().openModal('profile', { persistent: true });
        }
    },

    saveProfile: async (profileData: Partial<User>) => {
        const { user, consentData, appSettings } = get();
        if (!user) return;
        
        const isNewUser = !user.firstName;
        
        const fullProfileData: User = {
            ...user, ...profileData,
            userAgent: navigator.userAgent,
            ...(isNewUser && { isAdmin: false, termsAccepted: consentData || undefined, intentLog: [] })
        };
        
        await setDoc(doc(db, "users", user.uid), fullProfileData, { merge: true });
        
        if (isNewUser && consentData) {
            await addDoc(collection(db, "consent_logs"), { userId: user.uid, ...consentData });
        }

        set({ user: fullProfileData });
        useUIStore.getState().closeModal();
        useTripStore.getState().initTripListener(fullProfileData.uid);
        
        if (isNewUser) {
            trackGenerateLead(appSettings, fullProfileData, 'CompleteRegistration');
        }
    },
    
    cancelAndLogout: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        try {
            // User chose not to complete profile, just log them out.
            // We don't delete the user object, just sign them out.
            await signOut(auth);
            useUIStore.getState().closeModal(); // Close the persistent modal
        } catch (e: any) {
             console.error("Error during cancel/logout:", e);
             useUIStore.getState().showInfoModal("An error occurred. Please try logging out from the menu.");
        }
    },

    deleteAccount: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
            const allTripsQuery = query(collection(db, "trips"), where("memberIds", "array-contains", user.uid));
            const allTripsSnapshot = await getDocs(allTripsQuery);
            const batch = writeBatch(db);

            allTripsSnapshot.forEach((tripDoc) => {
                const tripData = tripDoc.data() as Trip;
                if (tripData.ownerId === user.uid) {
                    batch.delete(tripDoc.ref);
                } else {
                    const newCollaborators = { ...tripData.collaborators };
                    delete newCollaborators[user.uid];
                    const newMemberIds = tripData.memberIds.filter(id => id !== user.uid);
                    batch.update(tripDoc.ref, { collaborators: newCollaborators, memberIds: newMemberIds });
                }
            });
    
            batch.delete(doc(db, "users", user.uid));
            await batch.commit();
            await deleteUser(auth.currentUser!);
            useUIStore.getState().showInfoModal("Your account and all data have been successfully deleted.");
        
        } catch (e: any) {
            console.error("Error deleting account:", e);
            if (e.code === 'auth/requires-recent-login') {
                useUIStore.getState().showInfoModal("For security, please sign out and sign back in before deleting your account.");
            } else {
                useUIStore.getState().showInfoModal("An error occurred while deleting your account. Please try again.");
            }
        } finally {
            useUIStore.getState().closeModal();
        }
    },
}));