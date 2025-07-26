
import React, { useState, useEffect, FC, Suspense } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, Attraction } from '../types';
import { useUIStore } from '../stores/uiStore';
import { ArrowLeftIcon, SpinnerIcon } from '../components';

const MagicGuidePanel = React.lazy(() => import('./MagicGuidePanel'));
const ParkSelectionPanel = React.lazy(() => import('./ParkSelectionPanel'));
const ParkOptimizerPanel = React.lazy(() => import('./ParkOptimizerPanel'));


interface ParkDetailViewProps {
    parkId: string;
    trip: Trip;
}

type ParkDetailTab = 'guia' | 'lista' | 'otimizador';

const ParkDetailView: FC<ParkDetailViewProps> = ({ parkId, trip }) => {
    const { setSelectedParkId } = useUIStore.getState();
    const [activeTab, setActiveTab] = useState<ParkDetailTab>('guia');
    const [park, setPark] = useState<Attraction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const parkRef = doc(db, 'attractions', parkId);
        const unsubscribe = onSnapshot(parkRef, (docSnap) => {
            if (docSnap.exists()) {
                setPark({ id: docSnap.id, ...docSnap.data() } as Attraction);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [parkId]);

    const renderActiveTab = () => {
        if (isLoading || !park) {
            return <div className="flex justify-center items-center p-8"><SpinnerIcon /></div>;
        }
        const fallback = <div className="flex justify-center items-center p-8"><SpinnerIcon /></div>;
        switch (activeTab) {
            case 'guia':
                return <Suspense fallback={fallback}><MagicGuidePanel parkId={parkId} trip={trip} /></Suspense>;
            case 'lista':
                return <Suspense fallback={fallback}><ParkSelectionPanel trip={trip} parkId={parkId} /></Suspense>;
            case 'otimizador':
                return <Suspense fallback={fallback}><ParkOptimizerPanel trip={trip} parkName={park.name} /></Suspense>;
        }
    }

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 p-4 border-b bg-white">
                <button onClick={() => setSelectedParkId(null)} className="flex items-center font-semibold text-blue-600">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Voltar para todos os parques
                </button>
                 <div className="mt-4 border-b">
                    <div className="flex space-x-4">
                        <button onClick={() => setActiveTab('guia')} className={`py-2 font-semibold ${activeTab === 'guia' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Guia Mágico</button>
                        <button onClick={() => setActiveTab('lista')} className={`py-2 font-semibold ${activeTab === 'lista' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Minha Lista</button>
                        <button onClick={() => setActiveTab('otimizador')} className={`py-2 font-semibold ${activeTab === 'otimizador' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Otimizador</button>
                    </div>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto">
                {renderActiveTab()}
            </div>
        </div>
    );
};

export default ParkDetailView;
