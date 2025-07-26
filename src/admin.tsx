import React, { useState, useEffect, lazy, Suspense, FC } from 'react';
import ReactDOM from 'react-dom/client';
import { auth, db, googleProvider, onAuthStateChanged, signInWithPopup, signOut } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { AuthUserType } from '../firebase';
import { User, AppSettings, Attraction, AdminTab } from './types';
import { Logo, SpinnerIcon, GoogleIcon } from './components';

import './index.css';


// Lazy load manager components for better code splitting
const AdminDashboard = lazy(() => import('./admin-components/AdminDashboard'));
const LeadsManager = lazy(() => import('./admin-components/LeadsManager'));
const CouponsManager = lazy(() => import('./admin-components/CouponsManager'));
const TicketRulesManager = lazy(() => import('./admin-components/TicketRulesManager'));
const ItineraryRulesManager = lazy(() => import('./admin-components/ItineraryRulesManager'));
const SettingsManager = lazy(() => import('./admin-components/SettingsManager'));
const ComplexesManager = lazy(() => import('./admin-components/ComplexesManager'));
const AttractionTypesManager = lazy(() => import('./admin-components/AttractionTypesManager'));
const AttractionsManager = lazy(() => import('./admin-components/AttractionsManager'));
const ParkContentManager = lazy(() => import('./admin-components/ParkContentManager'));
const FutureToolsViewer = lazy(() => import('./admin-components/FutureToolsViewer'));
const AttractionDetailPanel = lazy(() => import('./admin-components/AttractionDetailPanel'));
const EventsManager = lazy(() => import('./admin-components/EventsManager'));
const CalendarSourcesManager = lazy(() => import('./admin-components/CalendarSourcesManager'));
const UsersManager = lazy(() => import('./admin-components/UsersManager'));
const HistoricalDataManager = lazy(() => import('./admin-components/HistoricalDataManager'));
const SubAttractionLinkerModal = lazy(() => import('./admin-components/SubAttractionLinkerModal'));
const DataMaintenanceManager = lazy(() => import('./admin-components/DataMigrationManager'));
const DestinationsManager = lazy(() => import('./admin-components/DestinationsManager'));


interface NavLinkProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavLink: FC<NavLinkProps> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const AdminApp: FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [appSettings, setAppSettings] = useState<AppSettings>({});
    const [detailAttraction, setDetailAttraction] = useState<Attraction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser: AuthUserType | null) => {
            if (currentUser) {
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists() && docSnap.data().isAdmin) {
                        setUser({ uid: currentUser.uid, ...docSnap.data() } as User);
                    } else {
                        setError("Acesso negado. Você precisa ser um administrador.");
                        setUser(null);
                        await signOut(auth);
                    }
                } catch (e) {
                     setError("Erro ao verificar as permissões de administrador.");
                     setUser(null);
                     await signOut(auth);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const settingsRef = doc(db, "settings", "integrations");
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    const settingsData = docSnap.data() as AppSettings;
                    setAppSettings(settingsData);
                }
            } catch (e) {
                console.error("Error fetching app settings for admin:", e);
                setError("Não foi possível carregar as configurações de integrações.");
            }
        };
        fetchSettings();
    }, [user]);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error(error);
            setError("Falha no login.");
        }
    };
    
    const handleSettingsChange = async (newSettings: AppSettings) => {
        setAppSettings(newSettings);
        try {
            await setDoc(doc(db, "settings", "integrations"), newSettings, { merge: true });
        } catch (error) {
            console.error("Failed to save settings:", error);
            setError("Falha ao salvar as configurações.");
        }
    };
    
    // Quick and dirty modal manager for admin
    const openModal = (type: 'subAttractionLinker', context: { attraction: Attraction }) => {
        if (type === 'subAttractionLinker') {
            setModalContent(
                <Suspense fallback={<SpinnerIcon />}>
                    <SubAttractionLinkerModal
                        park={context.attraction}
                        onClose={() => setIsModalOpen(false)}
                    />
                </Suspense>
            );
            setIsModalOpen(true);
        }
    };


    if (isLoading) {
        return <div className="h-screen w-screen flex justify-center items-center bg-gray-900"><SpinnerIcon className="h-10 w-10 text-white" /></div>;
    }

    if (!user) {
        return (
            <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-100 p-4">
                 <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-sm">
                    <Logo className="h-12 w-auto mx-auto mb-6" />
                    <h1 className="text-xl font-bold mb-2">Painel de Administração</h1>
                    {error && <p className="text-red-600 mb-4">{error}</p>}
                    <button onClick={handleLogin} className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                       <GoogleIcon /><span className="ml-2">Login com Google</span>
                    </button>
                </div>
            </div>
        );
    }
    
    const renderContent = (): React.ReactNode => {
        switch (activeTab) {
            case 'dashboard': return <AdminDashboard />;
            case 'leads': return <LeadsManager onError={setError} />;
            case 'users': return <UsersManager />;
            case 'coupons': return <CouponsManager />;
            case 'ticketRules': return <TicketRulesManager />;
            case 'itineraryRules': return <ItineraryRulesManager />;
            case 'complexes': return <ComplexesManager />;
            case 'attractionTypes': return <AttractionTypesManager />;
            case 'attractions': return <AttractionsManager googleMapsApiKey={appSettings.googleMapsApiKey || ''} onSelectAttraction={setDetailAttraction} openModal={openModal} />;
            case 'parkContent': return <ParkContentManager />;
            case 'events': return <EventsManager />;
            case 'eventDestinations': return <DestinationsManager />;
            case 'calendarSources': return <CalendarSourcesManager />;
            case 'historicalData': return <HistoricalDataManager />;
            case 'dataMigration': return <DataMaintenanceManager />;
            case 'settings': return <SettingsManager initialSettings={appSettings} onSettingsChange={handleSettingsChange} />;
            case 'futureTools': return <FutureToolsViewer />;
            default: return <div>Selecione uma opção</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-800 text-gray-200">
            <aside className="w-64 bg-gray-900 p-4 flex flex-col">
                <Logo className="h-10 w-auto" />
                <nav className="mt-8 space-y-2 flex-grow">
                    <NavLink label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <NavLink label="Leads" isActive={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
                    <NavLink label="Usuários" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <NavLink label="Cupons" isActive={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} />
                    <hr className="border-gray-700 my-2" />
                    <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 tracking-wider">Conteúdo</h3>
                    <NavLink label="Atrações (Hub)" isActive={activeTab === 'attractions'} onClick={() => setActiveTab('attractions')} />
                    <NavLink label="Complexos" isActive={activeTab === 'complexes'} onClick={() => setActiveTab('complexes')} />
                    <NavLink label="Tipos de Atração" isActive={activeTab === 'attractionTypes'} onClick={() => setActiveTab('attractionTypes')} />
                    <hr className="border-gray-700 my-2" />
                     <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 tracking-wider">Inteligência</h3>
                    <NavLink label="Regras de Roteiro" isActive={activeTab === 'itineraryRules'} onClick={() => setActiveTab('itineraryRules')} />
                    <NavLink label="Eventos Personalizados" isActive={activeTab === 'events'} onClick={() => setActiveTab('events')} />
                    <NavLink label="Destinos de Eventos" isActive={activeTab === 'eventDestinations'} onClick={() => setActiveTab('eventDestinations')} />
                    <NavLink label="Fontes de Calendário" isActive={activeTab === 'calendarSources'} onClick={() => setActiveTab('calendarSources')} />
                    <NavLink label="Regras de Ingressos" isActive={activeTab === 'ticketRules'} onClick={() => setActiveTab('ticketRules')} />
                    <hr className="border-gray-700 my-2" />
                    <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 tracking-wider">Dados</h3>
                    <NavLink label="Conteúdo Parques" isActive={activeTab === 'parkContent'} onClick={() => setActiveTab('parkContent')} />
                    <NavLink label="Dados Históricos" isActive={activeTab === 'historicalData'} onClick={() => setActiveTab('historicalData')} />
                    <NavLink label="Manutenção de Dados" isActive={activeTab === 'dataMigration'} onClick={() => setActiveTab('dataMigration')} />
                    <hr className="border-gray-700 my-2" />
                    <NavLink label="Integrações" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>
                <div>
                     <button onClick={() => signOut(auth)} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">
                        Sair
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto relative">
                 {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4">{error}</div>}
                <Suspense fallback={<div className="flex justify-center items-center h-full"><SpinnerIcon className="h-8 w-8 text-white"/></div>}>
                    {renderContent()}
                </Suspense>
            </main>
             {detailAttraction && (
                <aside className="w-1/3 max-w-md bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto animate-fade-in">
                    <Suspense fallback={<SpinnerIcon/>}>
                        <AttractionDetailPanel attraction={detailAttraction} onClose={() => setDetailAttraction(null)} />
                    </Suspense>
                </aside>
            )}
             {isModalOpen && modalContent}
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);