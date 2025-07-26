

import { FC, useMemo, useState, useEffect } from 'react';
import { DetailedTrip, Coords } from '../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { 
    CompactCountdownCard, LifeRingIcon,
    WeatherIcon,
    SparklesIcon,
    LoadingSkeleton
} from '../components';
import { useUIStore } from '../stores/uiStore';

interface TripDashboardViewProps {
    trip: DetailedTrip;
}

const WeatherWidget: FC<{ coords: Coords }> = ({ coords }) => {
    const [weather, setWeather] = useState<{ current: { temp: number; weather: { description: string; icon: string; }[] } } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            if (!coords) return;
            setIsLoading(true);
            try {
                const getOpenWeather = httpsCallable(functions, 'getOpenWeather');
                const result = await getOpenWeather({ lat: coords.lat, lng: coords.lng });
                if (result.data) {
                    setWeather(result.data as any);
                }
            } catch (error) {
                console.error("Failed to fetch weather:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWeather();
    }, [coords]);

    if (isLoading) return <LoadingSkeleton className="w-24 h-12" />;
    if (!weather) return null;

    return (
        <div className="flex items-center space-x-2">
            <WeatherIcon iconCode={weather.current.weather[0].icon} className="w-6 h-6 text-yellow-500" />
            <div>
                <p className="font-bold text-lg">{Math.round(weather.current.temp)}°C</p>
                <p className="text-xs text-gray-500 -mt-1 capitalize">{weather.current.weather[0].description}</p>
            </div>
        </div>
    );
};


const TripDashboardView: FC<TripDashboardViewProps> = ({ trip }) => {
    const { openModal, setTripSubView } = useUIStore.getState();
    
    const { isFinished } = useMemo(() => {
        const startDate = new Date(trip.startDate);
        const now = new Date();
        return { isFinished: now > startDate };
    }, [trip.startDate]);

    const nextChecklistItem = useMemo(() =>
        (trip.checklist || []).find(item => !item.checked),
    [trip.checklist]);
    
    const HeroCard = () => {
       if (!isFinished) {
            return (
                <div className="space-y-4">
                    <CompactCountdownCard trip={trip} onClick={() => setTripSubView('countdown')} />
                    <div className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:bg-gray-50" onClick={() => openModal('checklist', { trip })}>
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Próxima Tarefa do Checklist</h3>
                        {nextChecklistItem ? (
                             <p className="font-semibold text-gray-800">▫️ {nextChecklistItem.text}</p>
                        ) : (trip.checklist || []).length > 0 ? (
                            <p className="text-green-600 font-semibold">Tudo pronto para a viagem! ✅</p>
                        ) : (
                            <p>Seu checklist de preparação está pronto para começar.</p>
                        )}
                    </div>
                </div>
            );
        }
        
        const todayStr = new Date().toISOString().split('T')[0];
        const nextActivity = trip.itinerary.find(item => item.date >= todayStr);

        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm border text-gray-800 flex justify-between items-center">
                <div>
                    <p className="text-sm font-semibold text-green-600">🎉 Você está em {trip.destination}!</p>
                    <p className="text-lg font-bold truncate">{nextActivity ? `Próxima atividade: ${nextActivity.title}` : "Aproveite cada momento!"}</p>
                    <button onClick={() => useUIStore.getState().setActiveTab('roteiro')} className="text-sm font-bold text-blue-600 mt-1">Ver roteiro de hoje →</button>
                </div>
                {trip.coords && <WeatherWidget coords={trip.coords} />}
            </div>
        );
    };
    
    return (
        <div className="p-4 md:p-6 space-y-6">
            <HeroCard />
            
            {/* Placeholder for Magic Alerts */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-3"/>
                    <h3 className="font-bold">Alertas Mágicos</h3>
                </div>
                <p className="text-sm mt-1 opacity-90">Em breve, nosso assistente trará dicas em tempo real aqui!</p>
            </div>
            
             <div className="fixed bottom-20 right-6 z-30">
                <button 
                    onClick={() => openModal('assistant', {trip, context: 'planB', date: new Date().toISOString().split('T')[0], activities: trip.itinerary})} 
                    className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform"
                    aria-label="Assistente de Viagem"
                >
                    <LifeRingIcon className="w-8 h-8"/>
                </button>
            </div>
        </div>
    );
};

export default TripDashboardView;