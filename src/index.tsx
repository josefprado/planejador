import React, { useEffect, lazy, Suspense, FC } from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';


import { useAuthStore } from './stores/authStore';
import { useTripStore } from './stores/tripStore';
import { useUIStore } from './stores/uiStore';

import { Logo, SideMenu, SpinnerIcon, MenuIcon, PlusIcon, TripCard, SidePanel, TabBar } from './components';
import ModalManager from './ModalManager';
import { Trip, DetailedTrip } from './types';

const LandingPage = lazy(() => import('./lazy-components/LandingPage'));
const TripDashboardView = lazy(() => import('./lazy-components/TripDashboardView'));
const ItineraryView = lazy(() => import('./lazy-components/ItineraryView'));
const ParksHubView = lazy(() => import('./lazy-components/ParksHubView'));
const VaultView = lazy(() => import('./lazy-components/VaultView'));
const ParkDetailView = lazy(() => import('./lazy-components/ParkDetailView'));

const ExpensesModal = lazy(() => import('./lazy-components/ExpensesModal'));
const AccommodationModal = lazy(() => import('./lazy-components/AccommodationModal'));
const FlightsPanel = lazy(() => import('./lazy-components/FlightsPanel'));
const ParkSelectionPanel = lazy(() => import('./lazy-components/ParkSelectionPanel'));
const ParkOptimizerPanel = lazy(() => import('./lazy-components/ParkOptimizerPanel'));
const CrowdCalendarPanel = lazy(() => import('./lazy-components/CrowdCalendarPanel'));
const MagicGuidePanel = lazy(() => import('./lazy-components/MagicGuidePanel'));
const EventsPanel = lazy(() => import('./lazy-components/EventsPanel'));
const EventsPage = lazy(() => import('./lazy-components/EventsPage'));
const TeamGamesPage = lazy(() => import('./lazy-components/TeamGamesPage'));

const MainLayout: FC<{ trip: Trip, children: React.ReactNode }> = ({ trip, children }) => {
    const { toggleMenu } = useUIStore.getState();
    const { unselectTrip } = useTripStore.getState();

    return (
        <div className="flex flex-col h-screen">
            <header className="bg-white/80 backdrop-blur-sm shadow-sm p-4 flex justify-between items-center sticky top-0 z-20">
                <button onClick={unselectTrip} className="p-2 -ml-2 text-gray-700 hover:text-blue-600">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
                <h1 className="text-xl font-bold text-gray-800 truncate px-2">{trip.destination}</h1>
                <button onClick={() => toggleMenu(true)} className="p-2 text-gray-700 hover:text-blue-600">
                    <MenuIcon className="w-6 h-6"/>
                </button>
            </header>
            <main className="flex-grow overflow-y-auto bg-gray-100">
                {children}
            </main>
            <TabBar />
        </div>
    );
};

const AppRouter: FC = () => {
    const path = window.location.pathname;
    const cityMatch = path.match(/\/eventos\/cidade\/(.+)/);
    const teamMatch = path.match(/\/eventos\/time\/(.+)/);

    const fallback = <div className="h-screen w-screen flex justify-center items-center bg-gray-900"><SpinnerIcon className="h-10 w-10 text-white"/></div>;

    if (cityMatch) {
        return <Suspense fallback={fallback}><EventsPage city={cityMatch[1]} /></Suspense>;
    }
    if (teamMatch) {
        return <Suspense fallback={fallback}><TeamGamesPage team={teamMatch[1]} /></Suspense>;
    }

    return <App />;
};

const App: FC = () => {
    useEffect(() => {
        useAuthStore.getState().fetchAppSettings();
        const authUnsubscribe = useAuthStore.getState().initAuthListener();
        useTripStore.getState().initGuestState();

        return () => {
            authUnsubscribe();
            useTripStore.getState().clearTripListener();
        };
    }, []);

    const { user, isLoading, authError } = useAuthStore();
    const { trips, guestTrip, detailedTrip } = useTripStore();
    const { activeTab, isMenuOpen, isPanelOpen, panelType, panelContext, selectedParkId } = useUIStore();
    
    const { openModal, toggleMenu, closePanel } = useUIStore.getState();
    const { selectTrip, deleteTrip } = useTripStore.getState();

    if (isLoading) {
        return <div className="h-screen w-screen flex justify-center items-center bg-gray-900"><SpinnerIcon className="h-10 w-10 text-white" /></div>;
    }

    const handleOpenModalToEdit = (trip: Trip) => {
        if (!user) {
            openModal('login');
            return;
        }
        const userRole = trip.collaborators[user.uid]?.role;
        if (trip.ownerId === user.uid || userRole === 'editor') {
            openModal('trip', { trip });
        } else {
            useUIStore.getState().showInfoModal("Você não tem permissão para editar os detalhes desta viagem.");
        }
    };

    const renderActiveTab = (trip: DetailedTrip) => {
        if (selectedParkId) {
            return <Suspense fallback={<div className="h-full w-full flex justify-center items-center"><SpinnerIcon /></div>}><ParkDetailView parkId={selectedParkId} trip={trip} /></Suspense>;
        }

        switch(activeTab) {
            case 'hoje': return <Suspense fallback={<div className="p-4"><SpinnerIcon /></div>}><TripDashboardView trip={trip} /></Suspense>;
            case 'roteiro': return <Suspense fallback={<div className="p-4"><SpinnerIcon /></div>}><ItineraryView trip={trip} /></Suspense>;
            case 'parques': return <Suspense fallback={<div className="p-4"><SpinnerIcon /></div>}><ParksHubView trip={trip} /></Suspense>;
            case 'cofre': return <Suspense fallback={<div className="p-4"><SpinnerIcon /></div>}><VaultView trip={trip} /></Suspense>;
            default: return <Suspense fallback={<div className="p-4"><SpinnerIcon /></div>}><TripDashboardView trip={trip} /></Suspense>;
        }
    }
    
    const renderSidePanel = () => {
        if (!isPanelOpen || !panelContext.trip) return null;
        const fallback = <div className="w-full h-full flex justify-center items-center"><SpinnerIcon /></div>;
        switch (panelType) {
            case 'expenses': return <Suspense fallback={fallback}><ExpensesModal trip={panelContext.trip} appSettings={useAuthStore.getState().appSettings} /></Suspense>;
            case 'accommodation': return <Suspense fallback={fallback}><AccommodationModal trip={panelContext.trip} /></Suspense>;
            case 'flights': return <Suspense fallback={fallback}><FlightsPanel trip={panelContext.trip} /></Suspense>;
            case 'parkSelection': return <Suspense fallback={fallback}><ParkSelectionPanel trip={panelContext.trip} /></Suspense>;
            case 'parkOptimizer': return <Suspense fallback={fallback}><ParkOptimizerPanel trip={panelContext.trip} parkName={panelContext.parkName || ''} /></Suspense>;
            case 'crowdCalendar': return <Suspense fallback={fallback}><CrowdCalendarPanel trip={panelContext.trip} /></Suspense>;
            case 'magicGuide': return <Suspense fallback={fallback}><MagicGuidePanel parkId={panelContext.parkId || ''} trip={panelContext.trip} /></Suspense>;
            case 'events': return <Suspense fallback={fallback}><EventsPanel trip={panelContext.trip} /></Suspense>;
            default: return null;
        }
    }

    const renderMainContent = () => {
        const tripToRender = detailedTrip || guestTrip;
        if (tripToRender) {
            return (
                <MainLayout trip={tripToRender}>
                    {renderActiveTab(tripToRender)}
                </MainLayout>
            );
        }

        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="container mx-auto">
                    <header className="flex justify-between items-center mb-8">
                        <Logo className="h-10 w-auto" />
                        <button onClick={() => toggleMenu(true)} className="p-2 text-white hover:bg-white/10 rounded-full">
                            <MenuIcon />
                        </button>
                    </header>
                    <h2 className="text-3xl font-bold mb-6">Minhas Viagens</h2>
                    {authError && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4">{authError}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.map((trip) => (
                            <TripCard 
                                key={trip.id} 
                                trip={trip} 
                                user={user}
                                onSelectTrip={selectTrip}
                                onEdit={handleOpenModalToEdit}
                                onDelete={deleteTrip}
                            />
                        ))}
                        <button onClick={() => openModal('trip')} className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 rounded-2xl min-h-[250px] transition-colors">
                            <PlusIcon className="w-12 h-12 text-white/50 mb-2"/>
                            <span className="font-bold">Adicionar Nova Viagem</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <Suspense fallback={<div className="h-screen w-screen flex justify-center items-center bg-gray-900"><SpinnerIcon className="h-10 w-10 text-white"/></div>}>
                {(!user && !guestTrip) ? (
                    <LandingPage onOpenModal={openModal} />
                ) : (
                    <>
                        {renderMainContent()}
                        <SidePanel isOpen={isPanelOpen} onClose={closePanel}>
                            {renderSidePanel()}
                        </SidePanel>
                    </>
                )}
            </Suspense>
            
            <ModalManager />
            <SideMenu 
                isOpen={isMenuOpen}
                user={user}
            />
        </>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppRouter />
    </React.StrictMode>
);