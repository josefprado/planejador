
import { useState, useEffect, FC } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, Attraction } from '../types';
import { useUIStore } from '../stores/uiStore';
import { LoadingSkeleton, ChevronRightIcon } from '../components';

interface ParksHubViewProps {
    trip: Trip;
}

const ParksHubView: FC<ParksHubViewProps> = ({ trip }) => {
    const { setSelectedParkId } = useUIStore.getState();
    const [parks, setParks] = useState<Attraction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchParks = async () => {
            if (!isOrlandoTrip(trip.destination)) {
                setIsLoading(false);
                return;
            }
            try {
                const parkTypesQuery = query(collection(db, 'attractionTypes'), where("name", "in", ["Parque Temático", "Parque Aquático"]));
                const parkTypesSnapshot = await getDocs(parkTypesQuery);
                const parkTypeIds = parkTypesSnapshot.docs.map(doc => doc.id);

                if (parkTypeIds.length > 0) {
                    const q = query(collection(db, 'attractions'), where("typeId", "in", parkTypeIds), where("parentId", "==", null), orderBy('name'));
                    const parkDocs = await getDocs(q);
                    setParks(parkDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attraction)));
                }
            } catch (error) {
                console.error("Error fetching parks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchParks();
    }, [trip.destination]);

    const isOrlandoTrip = (destination: string): boolean => {
        const lowerCaseDestination = destination.toLowerCase();
        const keywords = ['orlando', 'disney', 'universal'];
        return keywords.some(keyword => lowerCaseDestination.includes(keyword));
    };

    if (isLoading) {
        return (
            <div className="p-4 space-y-3">
                <LoadingSkeleton className="h-16 w-full" />
                <LoadingSkeleton className="h-16 w-full" />
                <LoadingSkeleton className="h-16 w-full" />
            </div>
        );
    }

    if (!isOrlandoTrip(trip.destination)) {
        return <div className="p-4 text-center text-gray-600">As ferramentas de parque estão disponíveis para viagens em Orlando.</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-4">
             <h2 className="text-2xl font-bold text-gray-800">Hub dos Parques</h2>
             <p className="text-gray-600">Acesse guias, crie sua lista de desejos e otimize seu dia em cada parque.</p>
            {parks.map(park => (
                <button 
                    key={park.id}
                    onClick={() => setSelectedParkId(park.id)}
                    className="w-full flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border hover:bg-gray-50 transition-colors"
                >
                    <span className="font-bold text-lg text-gray-800">{park.name}</span>
                    <ChevronRightIcon />
                </button>
            ))}
        </div>
    );
};

export default ParksHubView;
