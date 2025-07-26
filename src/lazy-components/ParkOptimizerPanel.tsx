


import { useState, useEffect, useMemo, FC } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { Trip, Attraction, MagicOptimizerPlan } from '../types';
import { useTripStore } from '../stores/tripStore';
import { useAuthStore } from '../stores/authStore';
import { ModalHeaderIcon, TicketIcon, SpinnerIcon } from '../components';

interface ParkOptimizerPanelProps {
    trip: Trip;
    parkName: string;
}

const ParkOptimizerPanel: FC<ParkOptimizerPanelProps> = ({ trip, parkName }) => {
    const { saveTrip } = useTripStore.getState();
    const { user } = useAuthStore.getState();

    const [park, setPark] = useState<Attraction | null>(null);
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [waitTimes, setWaitTimes] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'optimizer' | 'magicPlan'>('optimizer');
    const [sortOrder, setSortOrder] = useState<'wishlist' | 'wait'>('wishlist');
    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [lastFetch, setLastFetch] = useState<Date | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [magicPlan, setMagicPlan] = useState<MagicOptimizerPlan | null>(null);
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

    const isPremium = useMemo(() => {
        if (!user || !user.premiumAccessUntil) return false;
        const today = new Date().toISOString().split('T')[0];
        return user.premiumAccessUntil >= today;
    }, [user]);

    const fetchWaitTimes = async (targetPark: Attraction | null) => {
        if (!targetPark || !targetPark.queueTimesParkId) {
            console.warn("Park or queueTimesParkId not available to fetch wait times.");
            return;
        }
        setIsUpdating(true);
        try {
            const getQueueTimes = httpsCallable(functions, 'getQueueTimes');
            const result = await getQueueTimes({ queueTimesParkId: targetPark.queueTimesParkId });
            setWaitTimes(result.data as Record<string, number>);
            setLastFetch(new Date());
        } catch (error) {
            console.error("Error fetching wait times:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setCompleted(new Set(trip.completedAttractions?.[today] || []));

        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Fetch park data to get the queueTimesParkId
                const parkQuery = query(collection(db, 'attractions'), where('name', '==', parkName), where('parentId', '==', null), limit(1));
                const parkSnapshot = await getDocs(parkQuery);
                let targetPark: Attraction | null = null;
                if (!parkSnapshot.empty) {
                    targetPark = { id: parkSnapshot.docs[0].id, ...parkSnapshot.docs[0].data() } as Attraction;
                    setPark(targetPark);
                }

                const wishlistIds = trip.parkWishlists?.[parkName] || [];
                if (wishlistIds.length > 0) {
                    const attractionsQuery = query(collection(db, 'attractions'), where('__name__', 'in', wishlistIds));
                    const attractionsSnapshot = await getDocs(attractionsQuery);
                    setAttractions(attractionsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data() } as Attraction)));
                }
                
                await fetchWaitTimes(targetPark);

            } catch (error) {
                console.error("Error fetching optimizer data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
        
        const tripRef = doc(db, 'trips', trip.id);
        const unsubscribe = onSnapshot(tripRef, (docSnap) => {
            if (docSnap.exists()) {
                const updatedTrip = docSnap.data() as Trip;
                setMagicPlan(updatedTrip.magicOptimizerPlans?.[parkName] || null);
            }
        });
        
        return () => unsubscribe();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trip, parkName]);
    
    const findWaitTime = (attractionName: string): number | null => {
        const key = Object.keys(waitTimes).find(k => k.toLowerCase().includes(attractionName.toLowerCase()));
        return key ? waitTimes[key] : null;
    };

    const handleToggleFilter = (filter: string) => {
        setActiveFilters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(filter)) newSet.delete(filter);
            else newSet.add(filter);
            return newSet;
        });
    };

    const sortedAndFilteredAttractions = useMemo(() => {
        let filtered = attractions;

        if (activeFilters.has('singleRider')) {
            filtered = filtered.filter(attr => attr.single_rider_available);
        }

        const to_do = filtered.filter(attr => !completed.has(attr.id));
        const done = filtered.filter(attr => completed.has(attr.id));

        if (sortOrder === 'wait') {
            to_do.sort((a, b) => (findWaitTime(a.name) ?? 999) - (findWaitTime(b.name) ?? 999));
        } else {
             to_do.sort((a,b) => a.name.localeCompare(b.name));
        }

        return [...to_do, ...done];
    }, [attractions, completed, sortOrder, waitTimes, activeFilters]);

    const handleToggleComplete = (attractionId: string) => {
        const newCompleted = new Set(completed);
        if (newCompleted.has(attractionId)) {
            newCompleted.delete(attractionId);
        } else {
            newCompleted.add(attractionId);
        }
        setCompleted(newCompleted);

        const today = new Date().toISOString().split('T')[0];
        saveTrip({
            id: trip.id,
            completedAttractions: {
                ...trip.completedAttractions,
                [today]: Array.from(newCompleted),
            }
        });
    };
    
    const canUpdate = !isUpdating && (!lastFetch || (new Date().getTime() - lastFetch.getTime()) > 2 * 60 * 1000);

    const renderOptimizerTab = () => (
        <>
            <div className="flex-shrink-0 mb-4">
                 <div className="flex justify-between items-center">
                    <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
                        <button onClick={() => setSortOrder('wishlist')} className={`px-3 py-1 text-sm font-semibold rounded-md ${sortOrder === 'wishlist' ? 'bg-white shadow' : ''}`}>Minha Lista</button>
                        <button onClick={() => setSortOrder('wait')} className={`px-3 py-1 text-sm font-semibold rounded-md ${sortOrder === 'wait' ? 'bg-white shadow' : ''}`}>Menor Fila</button>
                    </div>
                     <div className="text-right">
                        <button onClick={() => fetchWaitTimes(park)} disabled={!canUpdate} className="px-3 py-1.5 text-sm font-semibold rounded-md bg-blue-100 text-blue-700 disabled:opacity-50 flex items-center">
                            {isUpdating ? <SpinnerIcon/> : '↻ Atualizar Filas'}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                            {lastFetch ? `Atualizado às ${lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </p>
                     </div>
                </div>
                 {isPremium && (
                    <div className="mt-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Filtros Inteligentes</h4>
                        <div className="flex flex-wrap gap-2">
                             <button onClick={() => handleToggleFilter('singleRider')} className={`px-3 py-1 text-xs font-semibold rounded-full border ${activeFilters.has('singleRider') ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:border-purple-400'}`}>
                                Single Rider
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-grow overflow-y-auto -mx-6 px-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><SpinnerIcon /></div>
                ) : sortedAndFilteredAttractions.length === 0 ? (
                     <p className="text-center text-gray-500 py-10">Vá para "Meus Parques" e adicione atrações à sua lista de desejos para começar!</p>
                ) : (
                    <div className="space-y-3">
                        {sortedAndFilteredAttractions.map(attr => {
                            const waitTime = findWaitTime(attr.name);
                            const isDone = completed.has(attr.id);
                            return (
                                <div key={attr.id} className={`flex items-center p-3 rounded-lg border transition-all ${isDone ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                                    <input type="checkbox" checked={isDone} onChange={() => handleToggleComplete(attr.id)} className="h-5 w-5 rounded mr-3 flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className={`font-semibold ${isDone ? 'line-through' : ''}`}>{attr.name}</p>
                                    </div>
                                    {waitTime !== null && (
                                        <span className={`font-bold text-lg ml-2 ${waitTime <= 30 ? 'text-green-600' : waitTime <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {waitTime} min
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );

    const renderMagicPlanTab = () => {
        if (!magicPlan) {
            return <div className="text-center text-gray-500 py-10">Nenhum roteiro mágico gerado para este parque ainda. Vá para "Meus Parques" para criar um!</div>;
        }
        return (
            <div className="flex-grow overflow-y-auto -mx-6 px-6 space-y-4">
                {magicPlan.steps.map((step, index) => (
                    <div key={index} className="flex">
                        <div className="flex flex-col items-center mr-4">
                            <div className="text-xs font-bold text-blue-600">{step.startTime}</div>
                            <div className="w-px h-full bg-blue-200"></div>
                        </div>
                        <div className="pb-4">
                            <h4 className="font-bold">{step.title}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={TicketIcon} color="blue" />
                <h2 className="text-2xl font-bold">Otimizador de Parque</h2>
                <p className="text-gray-600 font-semibold">{parkName}</p>
            </div>
            
             <div className="flex-shrink-0 border-b mb-4">
                <div className="flex space-x-4">
                    <button onClick={() => setActiveTab('optimizer')} className={`py-2 font-semibold ${activeTab === 'optimizer' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Otimizador Manual</button>
                    <button onClick={() => setActiveTab('magicPlan')} className={`py-2 font-semibold ${activeTab === 'magicPlan' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>✨ Roteiro Mágico</button>
                </div>
            </div>

            {activeTab === 'optimizer' ? renderOptimizerTab() : renderMagicPlanTab()}
        </div>
    );
};

export default ParkOptimizerPanel;
