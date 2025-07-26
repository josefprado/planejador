import { lazy, Suspense, useState } from 'react';
import { useUIStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';
import { useTripStore } from './stores/tripStore';
import { SpinnerIcon } from './components';
import { ItineraryActivity } from './types';
import { trackGenerateLead } from '../services/analyticsEvents';

// Lazy-loaded components for optimal code-splitting
const TripModal = lazy(() => import('./lazy-components/TripModal'));
const UpgradeModal = lazy(() => import('./lazy-components/UpgradeModal'));
const ProfileModal = lazy(() => import('./lazy-components/ProfileModal'));
const TicketChoiceModal = lazy(() => import('./lazy-components/TicketChoiceModal'));
const HotelModal = lazy(() => import('./lazy-components/HotelModal'));
const CarModal = lazy(() => import('./lazy-components/CarModal'));
const InsuranceModal = lazy(() => import('./lazy-components/InsuranceModal'));
const VirtualGuidingModal = lazy(() => import('./lazy-components/VirtualGuidingModal'));
const OtherServicesModal = lazy(() => import('./lazy-components/OtherServicesModal'));
const InfoModal = lazy(() => import('./lazy-components/InfoModal'));
const DeleteConfirmationModal = lazy(() => import('./lazy-components/DeleteConfirmationModal'));
const DeleteAccountModal = lazy(() => import('./lazy-components/DeleteAccountModal'));
const FollowUsModal = lazy(() => import('./lazy-components/FollowUsModal'));
const ChecklistModal = lazy(() => import('./lazy-components/ChecklistModal'));
const ThemeModal = lazy(() => import('./lazy-components/ThemeModal'));
const DocumentsModal = lazy(() => import('./lazy-components/DocumentsModal'));
const ActivityModal = lazy(() => import('./lazy-components/ActivityModal'));
const CollaborationModal = lazy(() => import('./lazy-components/CollaborationModal'));
const SelectDocumentModal = lazy(() => import('./lazy-components/SelectDocumentModal'));
const CouponsModal = lazy(() => import('./lazy-components/CouponsModal'));
const CurrencyConverterModal = lazy(() => import('./lazy-components/CurrencyConverterModal'));
const TermsOfUseModal = lazy(() => import('./lazy-components/TermsOfUseModal'));
const PrivacyPolicyModal = lazy(() => import('./lazy-components/PrivacyPolicyModal'));
const ConsentModal = lazy(() => import('./lazy-components/ConsentModal'));
const JournalModal = lazy(() => import('./lazy-components/JournalModal'));
const AssistantModal = lazy(() => import('./lazy-components/AssistantModal'));
const OnboardingModal = lazy(() => import('./lazy-components/OnboardingModal'));
const UpgradeToOptimizerModal = lazy(() => import('./lazy-components/UpgradeToOptimizerModal'));


const ModalManager = () => {
    // UI Store
    const { activeModal, modalContext, closeModal, openModal } = useUIStore();
    
    // Auth Store
    const { user, appSettings, login, logout, saveProfile, deleteAccount, acceptConsent, cancelAndLogout } = useAuthStore.getState();
    
    // Trip Store
    const { detailedTrip, guestTrip, saveTrip, updateCollaborators, updateTripFolder } = useTripStore.getState();

    // State for async operations in modals
    const [isConfirming, setIsConfirming] = useState(false);

    const modalTripContext = modalContext.trip || detailedTrip || guestTrip;
    
    const onOpenSelectDocument = (activityState: ItineraryActivity) => {
        openModal('selectDocument', {
            trip: modalTripContext,
            onSelect: (file: { id: string; name: string; }) => {
                const updatedActivity = { ...activityState, linkedDocumentId: file.id, linkedDocumentName: file.name };
                openModal('activity', {
                    trip: modalTripContext,
                    activity: updatedActivity,
                    date: activityState.date,
                    activityCount: modalContext.activityCount,
                });
            },
            onClose: () => {
                 openModal('activity', {
                    trip: modalTripContext,
                    activity: activityState,
                    date: activityState.date,
                    activityCount: modalContext.activityCount,
                 });
            }
        });
    };

    const openWhatsapp = (message: string, service: string) => {
        trackGenerateLead(appSettings, user, service, modalTripContext?.id);
        const businessWhatsappNumber = appSettings.whatsappNumber || "5511999999999"; // Fallback seguro
        window.open(`https://wa.me/${businessWhatsappNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
    };

    const handleDeleteConfirm = async () => {
        if (modalContext.onConfirm) {
            setIsConfirming(true);
            try {
                await modalContext.onConfirm();
                // On success, close the modal
                closeModal();
            } catch (error) {
                // Error is handled in the store which shows an info modal.
                // We just need to stop the loading state here.
                console.error("Deletion failed:", error);
            } finally {
                setIsConfirming(false);
            }
        }
    };

    if (!activeModal) return null;

    const fallback = <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><SpinnerIcon className="h-10 w-10 text-white"/></div>;

    return (
        <Suspense fallback={fallback}>
            {activeModal === 'trip' && <TripModal onClose={closeModal} onSaveTrip={saveTrip} tripToEdit={modalContext.trip || null} user={user} />}
            {activeModal === 'consent' && <ConsentModal onAccept={acceptConsent} onOpenLegalModal={openModal} persistent={modalContext.persistent || false} />}
            {activeModal === 'profile' && user && <ProfileModal onClose={closeModal} onSave={saveProfile} user={user} persistent={modalContext.persistent || false} onCancelAndLogout={cancelAndLogout} />}
            {activeModal === 'login' && <UpgradeModal onClose={closeModal} onLogin={login} onContinueAsGuest={() => { useTripStore.getState().setGuestMode(true); closeModal(); }} />}
            {activeModal === 'ticketChoice' && <TicketChoiceModal onClose={closeModal} onHelp={() => openWhatsapp('Olá! Gostaria de um atendimento personalizado para a compra dos meus ingressos. Por favor, me ajude!', 'TicketAssistance')} />}
            {activeModal === 'hotel' && <HotelModal onClose={closeModal} trip={modalTripContext} onSend={openWhatsapp} />}
            {activeModal === 'car' && <CarModal onClose={closeModal} onSend={openWhatsapp} />}
            {activeModal === 'insurance' && <InsuranceModal onClose={closeModal} trip={modalTripContext} onSend={openWhatsapp} />}
            {activeModal === 'virtualGuiding' && <VirtualGuidingModal onClose={closeModal} onSend={openWhatsapp} />}
            {activeModal === 'otherServices' && <OtherServicesModal onClose={closeModal} onSend={openWhatsapp} />}
            {activeModal === 'info' && <InfoModal onClose={closeModal} message={modalContext.message || ''} confirmText={modalContext.confirmText || 'OK'} onConfirm={modalContext.onConfirm || closeModal} />}
            {activeModal === 'deleteConfirmation' && modalContext.trip && <DeleteConfirmationModal onClose={closeModal} trip={modalContext.trip} onConfirm={handleDeleteConfirm} isLoading={isConfirming} />}
            {activeModal === 'deleteAccount' && <DeleteAccountModal onClose={closeModal} onConfirm={() => { deleteAccount(); closeModal(); }} />}
            {activeModal === 'followUs' && <FollowUsModal onClose={closeModal} />}
            {activeModal === 'checklist' && modalTripContext && user && <ChecklistModal onClose={closeModal} trip={modalTripContext} user={user} appSettings={appSettings} onActionClick={openModal} />}
            {activeModal === 'theme' && modalTripContext && <ThemeModal onClose={closeModal} trip={modalTripContext} user={user} appSettings={appSettings} onSave={(themeId) => saveTrip({ id: modalTripContext.id, themeId: themeId || undefined })} />}
            {activeModal === 'documents' && modalTripContext && user && <DocumentsModal onClose={closeModal} trip={modalTripContext} user={user} appSettings={appSettings} onUpdateTripFolder={updateTripFolder} onReloginRequest={logout} />}
            {activeModal === 'collaboration' && modalTripContext && user && <CollaborationModal onClose={closeModal} trip={modalTripContext} currentUser={user} onUpdateCollaborators={updateCollaborators} />}
            {activeModal === 'coupons' && user && <CouponsModal onClose={closeModal} user={user} appSettings={appSettings} />}
            {activeModal === 'currencyConverter' && <CurrencyConverterModal onClose={closeModal} />}
            {activeModal === 'termsOfUse' && <TermsOfUseModal onClose={closeModal} />}
            {activeModal === 'privacyPolicy' && <PrivacyPolicyModal onClose={closeModal} />}
            {activeModal === 'journal' && modalTripContext && user && <JournalModal onClose={closeModal} trip={modalTripContext} user={user} appSettings={appSettings} />}
            {activeModal === 'assistant' && modalTripContext && user && <AssistantModal onClose={closeModal} trip={modalTripContext} appSettings={appSettings} context={modalContext.context} date={modalContext.date || undefined} activities={modalContext.activities} />}
            {activeModal === 'onboarding' && <OnboardingModal />}
            {activeModal === 'upgradeToOptimizer' && <UpgradeToOptimizerModal onClose={closeModal} />}
            
            {activeModal === 'activity' && modalContext.trip && (
              <ActivityModal 
                onClose={closeModal} 
                trip={modalContext.trip} 
                activityToEdit={modalContext.activity} 
                initialDate={modalContext.date} 
                activityCount={modalContext.activityCount || 0}
                onOpenSelectDocument={onOpenSelectDocument}
              />
            )}
            
            {activeModal === 'selectDocument' && modalContext.trip && (
              <SelectDocumentModal
                onClose={modalContext.onClose as () => void}
                trip={modalContext.trip}
                onSelect={modalContext.onSelect as (file: { id: string; name: string; }) => void}
              />
            )}
        </Suspense>
    );
};

export default ModalManager;