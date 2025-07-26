
import { create } from 'zustand';
import { doc, onSnapshot, query, collection, where, addDoc, updateDoc, getDocs, orderBy } from 'firebase/firestore';
import { db, functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { Trip, Collaborator, DetailedTrip, ItineraryActivity, Expense, Coords } from '../types';
import { useUIStore } from './uiStore';
import { useAuthStore } from './authStore';
import { trackGenerateLead } from '../../services/analyticsEvents';

let tripListenerUnsubscribe: (() => void) | null = null;

const geocodeAddress = async (address: string): Promise<Coords | undefined> => {
    const apiKey = useAuthStore.getState().appSettings.googleMapsApiKey;
    if (!apiKey) {
        console.warn("Google Maps API Key not configured. Skipping geocoding.");
        return undefined;
    }
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await response.json();
        if (data.status === 'OK' && data.results[0]) {
            return data.results[0].geometry.location;
        }
    } catch (error) {
        console.error("Geocoding failed:", error);
    }
    return undefined;
};


interface TripState {
    trips: Trip[];
    guestTrip: DetailedTrip | null;
    isGuestMode: boolean;
    isLoadingTrips: boolean;
    detailedTrip: DetailedTrip | null; // For the "living dashboard"

    initGuestState: () => void;
    setGuestMode: (isGuest: boolean) => void;
    initTripListener: (userId: string) => void;
    clearTripListener: () => void;
    handleLogout: () => void;

    selectTrip: (trip: Trip) => void;
    unselectTrip: () => void;
    saveTrip: (tripData: Partial<Trip>) => Promise<void>;
    deleteTrip: (trip: Trip) => void;
    confirmDeleteTrip: (tripId: string) => Promise<void>;
    
    updateCollaborators: (tripId: string, collaborators: { [uid: string]: Collaborator }, memberIds: string[]) => Promise<void>;
    updateTripFolder: (tripId: string, folderId: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
    trips: [],
    guestTrip: null,
    isGuestMode: false,
    isLoadingTrips: false,
    detailedTrip: null,

    initGuestState: () => {
        const storedGuestTrip = localStorage.getItem('guestTrip');
        if (storedGuestTrip) {
            const parsed = JSON.parse(storedGuestTrip);
            const guestTripWithDetails: DetailedTrip = {
                ...parsed,
                itinerary: parsed.itinerary || [],
                expenses: parsed.expenses || [],
                checklist: parsed.checklist || [],
            };
            set({ guestTrip: guestTripWithDetails, isGuestMode: true });
        }
    },

    setGuestMode: (isGuest) => {
        if (!isGuest) {
            localStorage.removeItem('guestTrip');
            set({ guestTrip: null });
        }
        set({ isGuestMode: isGuest });
    },

    initTripListener: (userId) => {
        get().clearTripListener();
        set({ isLoadingTrips: true });
        const q = query(collection(db, "trips"), where("memberIds", "array-contains", userId), orderBy("startDate", "desc"));
        tripListenerUnsubscribe = onSnapshot(q, (snapshot) => {
            const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
            set({ trips, isLoadingTrips: false });
        }, (error) => {
            console.error("Error listening to trips:", error);
            set({ isLoadingTrips: false });
        });
    },

    clearTripListener: () => {
        if (tripListenerUnsubscribe) {
            tripListenerUnsubscribe();
            tripListenerUnsubscribe = null;
        }
    },

    handleLogout: () => {
        get().clearTripListener();
        get().unselectTrip();
        set({ trips: [], isGuestMode: false, guestTrip: null });
    },

    selectTrip: async (trip) => {
        set({ detailedTrip: null }); // Clear previous detailed trip while loading

        try {
            const itineraryRef = collection(db, 'trips', trip.id, 'itinerary');
            const expensesRef = collection(db, 'trips', trip.id, 'expenses');
            
            const [itinerarySnap, expensesSnap] = await Promise.all([
                getDocs(query(itineraryRef, orderBy('order'))),
                getDocs(query(expensesRef, orderBy('createdAt', 'desc')))
            ]);

            const itinerary = itinerarySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryActivity));
            const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            
            set({ detailedTrip: { ...trip, itinerary, expenses, checklist: trip.checklist || [] } });
        } catch (error) {
            console.error("Error fetching trip details:", error);
            // Fallback to the base trip object if details fail to load
            set({ detailedTrip: { ...trip, itinerary: [], expenses: [], checklist: trip.checklist || [] } });
        }
    },

    unselectTrip: () => {
        set({ detailedTrip: null });
    },

    saveTrip: async (tripData) => {
        const { user, appSettings } = useAuthStore.getState();
        const { isGuestMode, guestTrip } = get();

        // --- Geocoding Logic ---
        if (tripData.destination && (!tripData.id || tripData.destination !== get().detailedTrip?.destination)) {
            tripData.coords = await geocodeAddress(tripData.destination);
        }
        if (tripData.accommodations) {
            tripData.accommodations = await Promise.all(tripData.accommodations.map(async (acc) => {
                if (acc.address && !acc.coords) { // Only geocode if address exists and coords don't
                    acc.coords = await geocodeAddress(acc.address);
                }
                return acc;
            }));
        }
        // --- End Geocoding Logic ---


        if (isGuestMode) {
            const newGuestTrip: DetailedTrip = {
                // Defaults for required Trip fields
                destination: '',
                startDate: '',
                endDate: '',
                imageUrl: '',
                ownerId: 'guest',
                memberIds: ['guest'],
                collaborators: {},
                // Spread existing and new data, which will overwrite defaults
                ...guestTrip,
                ...tripData,
                id: 'guest-trip', // ensure id is correct
                // Ensure sub-collections are arrays, overwriting any spread values.
                // This is the source of truth for these properties.
                itinerary: guestTrip?.itinerary || [],
                expenses: guestTrip?.expenses || [],
                // `tripData.checklist` has priority over `guestTrip.checklist`.
                checklist: tripData.checklist || guestTrip?.checklist || [],
            };
            localStorage.setItem('guestTrip', JSON.stringify(newGuestTrip));
            set({ guestTrip: newGuestTrip });
            useUIStore.getState().closeModal();
            return;
        }

        if (!user) {
            useUIStore.getState().openModal('login');
            return;
        }

        if (tripData.id) { // Editing existing trip
            const tripRef = doc(db, 'trips', tripData.id);
            await updateDoc(tripRef, tripData);
        } else { // Creating new trip
            const { id, ...dataToSave } = tripData; // CRITICAL FIX: Remove undefined id before saving
            const newTripData = {
                ...dataToSave,
                ownerId: user.uid,
                memberIds: [user.uid],
                collaborators: {
                    [user.uid]: {
                        role: 'editor',
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        email: user.email,
                    }
                },
                createdAt: new Date().toISOString(),
                status: 'Novo' as const
            };
            const newTripRef = await addDoc(collection(db, "trips"), newTripData);
            const newTrip = { id: newTripRef.id, ...newTripData } as Trip;
            trackGenerateLead(appSettings, user, 'NewTrip', newTrip.id);
            useUIStore.getState().startOnboarding(newTrip);
            return; // Onboarding will close the modal
        }
        useUIStore.getState().closeModal();
    },

    deleteTrip: (trip) => {
        const { user } = useAuthStore.getState();
        if (!user) return;
        
        if (trip.ownerId === user.uid) {
            useUIStore.getState().openModal('deleteConfirmation', { 
                trip, 
                onConfirm: () => get().confirmDeleteTrip(trip.id) 
            });
        } else {
             // Logic for leaving a trip
            const newCollaborators = { ...trip.collaborators };
            delete newCollaborators[user.uid];
            const newMemberIds = trip.memberIds.filter(id => id !== user.uid);
            get().updateCollaborators(trip.id, newCollaborators, newMemberIds);
        }
    },

    confirmDeleteTrip: async (tripId) => {
        try {
            const deleteTripCascade = httpsCallable(functions, 'deleteTripCascade');
            await deleteTripCascade({ tripId });
            // The listener will automatically remove the trip from the UI.
            // If we are viewing the deleted trip, unselect it.
            if (get().detailedTrip?.id === tripId) {
                get().unselectTrip();
            }
        } catch (error) {
            console.error("Error deleting trip via cloud function:", error);
            useUIStore.getState().showInfoModal("Ocorreu um erro ao apagar a viagem. Tente novamente.");
            throw error; // Re-throw to let the UI know it failed
        }
    },

    updateCollaborators: async (tripId, collaborators, memberIds) => {
        const tripRef = doc(db, 'trips', tripId);
        await updateDoc(tripRef, { collaborators, memberIds });
    },

    updateTripFolder: async (tripId, folderId) => {
        const tripRef = doc(db, 'trips', tripId);
        await updateDoc(tripRef, { driveFolderId: folderId });
        set(state => ({
            trips: state.trips.map(t => t.id === tripId ? { ...t, driveFolderId: folderId } : t),
            detailedTrip: state.detailedTrip && state.detailedTrip.id === tripId ? { ...state.detailedTrip, driveFolderId: folderId } : state.detailedTrip,
            guestTrip: state.guestTrip && state.guestTrip.id === tripId ? { ...state.guestTrip, driveFolderId: folderId } : state.guestTrip
        }));
    },
}));