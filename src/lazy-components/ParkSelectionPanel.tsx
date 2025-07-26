
import { useState, useEffect, useMemo, FC } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { Trip, Attraction } from '../types';
import { useTripStore } from '../stores/tripStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ModalHeaderIcon, TicketIcon, SpinnerIcon, StarIcon, ChevronDownIcon } from '../components';

interface ParkSelectionPanelProps {
    trip: Trip;
    parkId?: string;
}

const ParkSelectionPanel: FC<ParkSelectionPanelProps> = ({ trip, parkId }) => {
    const { saveTrip } = useTripStore.getState();
    const { user } = useAuthStore.getState();
    const { openModal, openPanel } = useUIStore.getState();

    const [parks, setParks] = useState<Record<string, Attraction[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedPark, setExpandedPark] = useState<string | null>(null);
    const [wishlists, setWishlists] = useState<Record<string, string[]>>(trip.parkWishlists || {});
    
    const isPremium = useMemo(() => {
        if (!user || !user.premiumAccessUntil) return false;
        const today = new Date().toISOString().split('T')[0];
        return user.premiumAccessUntil >= today;
    }, [user]);

    useEffect(() => {
        const fetchAttractions = async () => {
            setIsLoading(true);
            try {
                const attractionsByPark: Record<string, Attraction[]> = {};
                let parkList: Attraction[] = [];

                if (parkId) {
                    const parkRef = doc(db, 'attractions', parkId);
                    const parkSnap = await getDoc(parkRef);
                    if (parkSnap.exists()) {
                        parkList = [{ id: parkSnap.id, ...parkSnap.data() } as Attraction];
                    }
                } else {
                    const parkTypesQuery = query(collection(db, 'attractionTypes'), where("name", "in", ["Parque Temático", "Parque Aquático"]));
                    const parkTypesSnapshot = await getDocs(parkTypesQuery);
                    const parkTypeIds = parkTypesSnapshot.docs.map(doc => doc.id);
                    
                    if (parkTypeIds.length > 0) {
                        const q = query(collection(db, 'attractions'), where("typeId", "in", parkTypeIds), orderBy('name'));
                        const parkDocs = await getDocs(q);
                        parkList = parkDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attraction));
                    }
                }
                
                for (const park of parkList) {
                    const subAttractionsQuery = query(collection(db, 'attractions'), where("parentId", "==", park.id), orderBy('name'));
                    const subAttractionsDocs = await getDocs(subAttractionsQuery);
                    attractionsByPark[park.name] = subAttractionsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attraction));
                }
                
                setParks(attractionsByPark);
                if (Object.keys(attractionsByPark).length > 0) {
                    setExpandedPark(Object.keys(attractionsByPark)[0]);
                }

            } catch (error) {
                console.error("Error fetching park attractions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttractions();
    }, [parkId, trip.destination]);

    const toggleWishlist = (parkName: string, attractionId: string) => {
        const currentWishlist = wishlists[parkName] || [];
        const newWishlist = currentWishlist.includes(attractionId)
            ? currentWishlist.filter(id => id !== attractionId)
            : [...currentWishlist, attractionId];
        
        const newWishlists = { ...wishlists, [parkName]: newWishlist };
        setWishlists(newWishlists);
        saveTrip({ id: trip.id, parkWishlists: newWishlists });
    };
    
    const handleGeneratePlan = async (parkName: string) => {
        if (!isPremium) {
            openModal('upgradeToOptimizer');
            return;
        }
        
        setIsGenerating(true);
        try {
            const getMagicOptimizerPlan = httpsCallable(functions, 'getMagicOptimizerPlan');
            await getMagicOptimizerPlan({
                tripId: trip.id,
                parkName: parkName,
                date: new Date().toISOString().split('T')[0] // Use today's date or a selected date
            });
            // The result is cached in Firestore, now we can open the panel.
            openPanel('parkOptimizer', { trip, parkName });
        } catch (error) {
            console.error("Error generating magic optimizer plan:", error);
            alert("Ocorreu um erro ao gerar o roteiro. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={TicketIcon} color="blue" />
                <h2 className="text-2xl font-bold">Meus Parques</h2>
                <p className="text-gray-600">Marque suas atrações imperdíveis para usar o Otimizador de Parque!</p>
            </div>

            <div className="flex-grow overflow-y-auto -mx-6 px-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><SpinnerIcon /></div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(parks).map(([parkName, attractions]) => (
                            <div key={parkName} className="bg-gray-50 rounded-lg">
                                <button onClick={() => setExpandedPark(expandedPark === parkName ? null : parkName)} className="w-full flex justify-between items-center p-3 font-bold text-lg">
                                    {parkName}
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedPark === parkName ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedPark === parkName && (
                                    <div className="p-3 border-t">
                                        <button onClick={() => handleGeneratePlan(parkName)} disabled={isGenerating} className="w-full mb-4 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center">
                                            {isGenerating && <SpinnerIcon className="mr-2" />}
                                            ✨ Gerar Roteiro Otimizado (Premium)
                                        </button>
                                        {attractions.map(attr => (
                                            <div key={attr.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md">
                                                <span>{attr.name}</span>
                                                <button onClick={() => toggleWishlist(parkName, attr.id)}>
                                                    <StarIcon className={`w-6 h-6 transition-colors ${(wishlists[parkName] || []).includes(attr.id) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParkSelectionPanel;
