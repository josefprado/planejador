import { create } from 'zustand';
import { Trip, ModalType, ItineraryActivity, PanelType, MainView, TripSubView } from '../types';

interface ModalContext {
    trip?: Trip | null;
    activity?: ItineraryActivity | null;
    date?: string | null;
    activityCount?: number;
    message?: string;
    confirmText?: string;
    onConfirm?: (data?: any) => void;
    onSelect?: (data: any) => void;
    onClose?: () => void;
    persistent?: boolean;
    context?: 'suggestion' | 'planB' | string;
    activities?: ItineraryActivity[];
}

interface UIState {
    activeModal: ModalType | null;
    modalContext: ModalContext;
    isMenuOpen: boolean;
    
    // Main view state
    activeTab: MainView;
    tripSubView: TripSubView;
    selectedParkId: string | null;

    // Side panel state
    isPanelOpen: boolean;
    panelType: PanelType | null;
    panelContext: { trip: Trip | null; parkName?: string; parkId?: string; };
    
    // Onboarding state
    onboardingTrip: Trip | null;
    onboardingStep: number;
    
    // Actions
    openModal: (modal: ModalType, context?: ModalContext) => void;
    closeModal: () => void;
    toggleMenu: (force?: boolean) => void;
    setActiveTab: (tab: MainView) => void;
    setTripSubView: (view: TripSubView) => void;
    setSelectedParkId: (parkId: string | null) => void;
    showInfoModal: (message: string, confirmText?: string, onConfirm?: () => void) => void;
    openPanel: (type: PanelType, context: { trip: Trip, parkName?: string, parkId?: string }) => void;
    closePanel: () => void;
    startOnboarding: (trip: Trip) => void;
    nextOnboardingStep: () => void;
    closeOnboarding: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    activeModal: null,
    modalContext: {},
    isMenuOpen: false,
    
    activeTab: 'hoje',
    tripSubView: 'list', 
    selectedParkId: null,
    
    isPanelOpen: false,
    panelType: null,
    panelContext: { trip: null },
    
    onboardingTrip: null,
    onboardingStep: 1,
    
    openModal: (modal, context = {}) => {
        set({ activeModal: modal, modalContext: context, isMenuOpen: false });
    },
    
    closeModal: () => {
        const { activeModal, modalContext } = get();
        if ((activeModal === 'profile' || activeModal === 'onboarding') && modalContext.persistent) {
            return;
        }
        set({ activeModal: null, modalContext: {} });
    },
    
    toggleMenu: (force) => {
        set(state => ({ isMenuOpen: typeof force === 'boolean' ? force : !state.isMenuOpen }));
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setTripSubView: (view) => set({ tripSubView: view }),
    setSelectedParkId: (parkId) => set({ selectedParkId: parkId }),
    
    showInfoModal: (message, confirmText = 'OK', onConfirm) => {
        const performConfirm = () => {
            get().closeModal();
            if (onConfirm) onConfirm();
        };
        set({
            activeModal: 'info',
            modalContext: { message, confirmText, onConfirm: performConfirm }
        });
    },

    openPanel: (type, context) => {
        set({ isPanelOpen: true, panelType: type, panelContext: context });
    },
    
    closePanel: () => {
        set({ isPanelOpen: false, panelType: null, panelContext: { trip: null } });
    },
    
    startOnboarding: (trip) => {
        set({ activeModal: 'onboarding', modalContext: { persistent: true }, onboardingTrip: trip, onboardingStep: 1 });
    },

    nextOnboardingStep: () => {
        set(state => ({ onboardingStep: state.onboardingStep + 1 }));
    },
    
    closeOnboarding: () => {
        set({ activeModal: null, onboardingTrip: null, onboardingStep: 1 });
    }
}));
