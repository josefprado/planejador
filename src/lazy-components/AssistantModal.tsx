import { useState, useEffect, FC } from 'react';
import { Trip, AppSettings, ItineraryActivity, Coords } from '../types';
import { Modal, ModalHeaderIcon, LifeRingIcon, SpinnerIcon, SparklesIcon } from '../components';
import { GoogleGenAI } from '@google/genai';
import { logUserIntent } from '../stores/authStore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

type LocationState = 'prompting' | 'denied' | 'out_of_bounds' | 'ready' | 'error';
interface WeatherInfo { current: { temp: number; weather: { description: string }[] } }

// Helper to calculate distance between two lat/lng points in km
const getDistance = (coords1: Coords, coords2: Coords): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
    const dLon = (coords2.lng - coords1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1.lat * (Math.PI / 180)) * Math.cos(coords2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

interface AssistantModalProps {
    onClose: () => void;
    trip: Trip;
    appSettings: AppSettings;
    context?: 'suggestion' | 'planB' | string;
    date?: string;
    activities?: ItineraryActivity[];
}

const AssistantModal: FC<AssistantModalProps> = ({ onClose, trip, appSettings, context, activities }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [locationState, setLocationState] = useState<LocationState>('prompting');
    const [userCoords, setUserCoords] = useState<Coords | null>(null);
    const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);


    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentUserCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
                
                const destinationCoords = trip.coords;
                const accommodationCoords = trip.accommodations?.map(a => a.coords).filter(Boolean) as Coords[];

                if (!destinationCoords && accommodationCoords.length === 0) {
                     // If no location is set for the trip, allow usage anywhere
                    setUserCoords(currentUserCoords);
                    setLocationState('ready');
                    return;
                }

                const checkPoints = [destinationCoords, ...accommodationCoords].filter(Boolean) as Coords[];
                
                const isNearby = checkPoints.some(point => getDistance(currentUserCoords, point) < 50); // 50km radius

                if (isNearby) {
                    setUserCoords(currentUserCoords);
                    setLocationState('ready');
                } else {
                    setLocationState('out_of_bounds');
                }
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setLocationState('denied');
                } else {
                    setLocationState('error');
                    setError("Não foi possível obter sua localização.");
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [trip]);
    
    // Fetch weather when location is ready
    useEffect(() => {
        const fetchWeather = async (coords: Coords) => {
            if (!appSettings.openWeatherApiKey) return;
            try {
                const getOpenWeather = httpsCallable(functions, 'getOpenWeather');
                const result = await getOpenWeather({ lat: coords.lat, lng: coords.lng });
                if (result.data) {
                    setWeatherInfo(result.data as WeatherInfo);
                }
            } catch (error) {
                console.error("Failed to fetch weather for assistant:", error);
            }
        };
        
        if (locationState === 'ready' && userCoords) {
            fetchWeather(userCoords);
        }

    }, [locationState, userCoords, appSettings.openWeatherApiKey])


    const handleAction = async (promptContext: string) => {
        if (locationState !== 'ready' || !userCoords) {
             setError("Localização não está pronta para uso.");
             return;
        }
        if (!appSettings.geminiApiKey) {
            setError("A chave de API para nosso assistente não está configurada.");
            return;
        }
        setIsLoading(true);
        setResult('');
        setError('');

        if (context === 'planB') {
            logUserIntent('used_plan_b', `Motivo: ${promptContext}`);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: appSettings.geminiApiKey });
            let prompt = '';
            let config: any = {};

            const travelerDetails = trip.travelers ? `O grupo é composto por: ${trip.travelers.map(t => `${t.firstName} (${new Date().getFullYear() - new Date(t.dob).getFullYear()} anos)`).join(', ')}.` : '';
            const dayActivities = activities ? `As atividades já planejadas para hoje são: ${activities.map(a => a.title).join(', ')}.` : '';
            const locationContext = `Minha localização atual é latitude ${userCoords.lat}, longitude ${userCoords.lng}.`;
            const weatherContext = weatherInfo ? `A previsão do tempo atual é: ${weatherInfo.current.weather[0].description} com temperatura de ${Math.round(weatherInfo.current.temp)}°C.` : '';

            if (context === 'suggestion') {
                prompt = `Aja como um guia local especialista em ${trip.destination}. ${travelerDetails} ${dayActivities} ${locationContext} ${weatherContext} Sugira uma única atividade ou local autêntico e "secreto" (não muito turístico) para hoje, que seja próximo da minha localização atual e combine com o roteiro. Forneça uma breve justificativa do porquê seria uma boa escolha.`;
                config = { tools: [{ googleSearch: {} }] };
            } else { // Plan B or general assistant
                prompt = `Sou um turista em ${trip.destination}. ${travelerDetails} ${dayActivities} ${locationContext} ${weatherContext} Ocorreu um imprevisto: ${promptContext}. Por favor, me dê 3 alternativas de atividades ou soluções para salvar meu dia, que sejam próximas da minha localização atual. Seja direto e prático.`;
            }

            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config });
            
            if (!response || !response.text) throw new Error("Resposta vazia do nosso assistente.");
            setResult(response.text);

        } catch (e) {
            console.error(e);
            setError("Ocorreu um erro ao contatar o assistente. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        if (locationState === 'prompting') {
             return <div className="flex flex-col items-center justify-center p-8"><SpinnerIcon className="w-10 h-10 mb-4" /><p className="font-semibold">Verificando sua localização...</p></div>;
        }
        if (locationState === 'denied') {
            return <div className="text-center p-4">
                <h3 className="font-bold text-lg">Permissão de Localização Negada</h3>
                <p className="text-sm text-gray-600 mt-2">Para te dar sugestões personalizadas, precisamos saber onde você está. Por favor, habilite a permissão de localização nas configurações do seu navegador e tente novamente.</p>
            </div>;
        }
        if (locationState === 'out_of_bounds') {
             return <div className="text-center p-4">
                <h3 className="font-bold text-lg">Função Indisponível</h3>
                <p className="text-sm text-gray-600 mt-2">Parece que você ainda não está em {trip.destination}. Esta função mágica estará disponível assim que você chegar!</p>
            </div>;
        }
        if (locationState === 'error') {
            return <p className="text-center text-red-500 p-4">{error}</p>;
        }

        if (isLoading) {
            return <div className="flex flex-col items-center justify-center p-8"><SpinnerIcon className="w-10 h-10 mb-4" /><p className="font-semibold">Pensando em uma solução...</p></div>;
        }
        if (result) {
            return (
                <div>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm whitespace-pre-wrap font-sans">{result}</pre>
                     {context === 'suggestion' && (
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            <strong>Dica:</strong> Recomendamos conferir o horário de funcionamento e a disponibilidade do local antes de ir para garantir a melhor experiência.
                        </p>
                    )}
                </div>
            );
        }

        if (context === 'planB') {
            return (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-center mb-4">O que aconteceu?</h3>
                    <button onClick={() => handleAction('Chuva estragou os planos ao ar livre')} className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">☔️ Chuva</button>
                    <button onClick={() => handleAction('O orçamento está apertado hoje')} className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">💸 Orçamento Apertado</button>
                    <button onClick={() => handleAction('Problemas com transporte ou locomoção')} className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">🚗 Problemas com Transporte</button>
                    <button onClick={() => handleAction('A atração que íamos está fechada ou o ingresso é inválido')} className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">🎟️ Atração Fechada / Ingresso</button>
                </div>
            );
        }
        
        // Default assistant view
        return (
             <div className="space-y-3">
                <h3 className="text-lg font-semibold text-center mb-4">Como posso ajudar?</h3>
                <button onClick={() => handleAction('Onde almoçar por aqui?')} className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Onde almoçar por aqui?</button>
                <button onClick={() => handleAction('Sugira algo tranquilo para o fim do dia')} className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Sugira algo tranquilo</button>
                <button onClick={() => handleAction('Qual a melhor forma de ir para [LOCAL]?')} className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Como chegar em...?</button>
             </div>
        )
    };
    
    // Auto-trigger for suggestion context
    useEffect(() => {
        if (context === 'suggestion' && locationState === 'ready') {
            handleAction("Sugestão de atividade surpresa");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context, locationState]);

    const getTitle = () => {
        if (context === 'suggestion') return "Sugestão Surpresa";
        if (context === 'planB') return "Plano B";
        return "Assistente de Viagem";
    }

    return (
        <Modal onClose={onClose} size="lg">
            <div className="text-center mb-6">
                <ModalHeaderIcon icon={context === 'suggestion' ? SparklesIcon : LifeRingIcon} color="blue" />
                <h2 className="text-2xl font-bold">{getTitle()}</h2>
            </div>
            {renderContent()}
        </Modal>
    );
};

export default AssistantModal;
