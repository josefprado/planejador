

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, ItineraryActivity } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { 
    SpinnerIcon, CalendarDaysIcon, 
    ChevronDownIcon, EditIcon, GripVerticalIcon,
    UtensilsIcon, ShoppingBagIcon, BedIcon, PlaneIcon, TicketIcon, LinkIcon,
    SparklesIcon, StarIcon
} from '../components';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

const isOrlandoTrip = (destination: string): boolean => {
    if (!destination) return false;
    const lowerCaseDestination = destination.toLowerCase();
    const keywords = ['orlando', 'disney', 'universal', 'florida', 'sea world', 'magic kingdom', 'epcot', 'hollywood studios', 'animal kingdom', 'walt disney world'];
    return keywords.some(keyword => lowerCaseDestination.includes(keyword));
};

interface ItineraryViewProps {
    trip: Trip;
}

const getDatesInRange = (startDateStr: string, endDateStr: string): string[] => {
    const dates: string[] = [];
    let currentDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    currentDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(0, 0, 0, 0);
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

interface CategoryIconProps {
    category: string;
    className?: string;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`w-3 h-3 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
        ))}
    </div>
);


const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className }) => {
    const iconProps = { className: className || "w-5 h-5 text-gray-500" };
    switch (category) {
        case 'park': return <TicketIcon {...iconProps} />;
        case 'restaurant': return <UtensilsIcon {...iconProps} />;
        case 'shopping': return <ShoppingBagIcon {...iconProps} />;
        case 'hotel': return <BedIcon {...iconProps} />;
        case 'transport': return <PlaneIcon {...iconProps} />;
        case 'event': return <TicketIcon {...iconProps} />;
        default: return <CalendarDaysIcon {...iconProps} />;
    }
};

interface ActivityItemProps {
    activity: ItineraryActivity;
    onEdit: () => void;
    canEdit: boolean;
    waitTime?: number | null;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onEdit, canEdit, waitTime }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: activity.id, disabled: !canEdit });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style} className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            {canEdit && (
                <div {...attributes} {...listeners} className="cursor-grab p-2 text-gray-400 touch-none">
                    <GripVerticalIcon className="w-5 h-5" />
                </div>
            )}
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <CategoryIcon category={activity.category} />
            </div>
            <div className="flex-grow truncate">
                <p className="font-semibold text-gray-800 truncate">{activity.title}</p>
                 <div className="flex items-center text-sm text-gray-500">
                    <span>{activity.period}</span>
                    {waitTime !== null && waitTime !== undefined && (
                        <span className={`ml-3 font-bold ${waitTime <= 30 ? 'text-green-600' : waitTime <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            🕒 {waitTime} min
                        </span>
                    )}
                    {activity.tripAdvisorRating && (
                         <div className="flex items-center ml-3 space-x-1" title={`Avaliação: ${activity.tripAdvisorRating} de 5`}>
                            <StarRating rating={activity.tripAdvisorRating} />
                            <span className="text-xs font-semibold">({activity.tripAdvisorRating.toFixed(1)})</span>
                        </div>
                    )}
                </div>
                {activity.linkedDocumentName && (
                    <div className="flex items-center text-xs text-blue-600 mt-1">
                        <LinkIcon className="w-3 h-3 mr-1.5" />
                        <span className="truncate">{activity.linkedDocumentName}</span>
                    </div>
                )}
            </div>
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600">
                <EditIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const ItineraryView: React.FC<ItineraryViewProps> = ({ trip }) => {
    const { user, appSettings } = useAuthStore();
    const { openModal, openPanel } = useUIStore.getState();
    const [activities, setActivities] = useState<ItineraryActivity[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [aiError, setAiError] = useState<string>('');
    const [openDays, setOpenDays] = useState<Set<string>>(new Set());
    const [promptText, setPromptText] = useState<string>('');
    const [locationVerifying, setLocationVerifying] = useState(false);
    
    const itineraryColRef = useMemo(() => collection(db, 'trips', trip.id, 'itinerary'), [trip.id]);
    
    const canEdit = useMemo(() => {
        if (!user) return false;
        const userRole = trip.collaborators[user.uid]?.role;
        return trip.ownerId === user.uid || userRole === 'editor';
    }, [trip, user]);

    useEffect(() => {
        const q = query(itineraryColRef, orderBy('date'), orderBy('order'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedActivities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryActivity));
            setActivities(fetchedActivities);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching itinerary: ", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [itineraryColRef]);
    
    const handleActivateParkMode = (parkName: string) => {
        setLocationVerifying(true);
        navigator.geolocation.getCurrentPosition(
            () => {
                setLocationVerifying(false);
                openPanel('parkOptimizer', { trip, parkName });
            },
            (error) => {
                setLocationVerifying(false);
                if (error.code === error.PERMISSION_DENIED) {
                    alert("Por favor, habilite a permissão de localização para usar esta função.");
                } else {
                    alert("Não foi possível obter sua localização. Tente novamente.");
                }
            }
        );
    };

    const handleGenerateItinerary = async () => {
        if (!appSettings.geminiApiKey) {
            setAiError("A chave de API do nosso assistente não está configurada.");
            return;
        }
        
        setIsGenerating(true);
        setAiError('');

        try {
            const ai = new GoogleGenAI({ apiKey: appSettings.geminiApiKey });
            const userPrompt = `Crie um roteiro de viagem para ${trip.destination} de ${trip.startDate.split('T')[0]} a ${trip.endDate.split('T')[0]}. As preferências do usuário são: "${promptText}". Atividades existentes para não repetir: ${activities.map(a => a.title).join(', ')}.`;
            const systemPrompt = `Você é um especialista em roteiros de viagem para ${trip.destination}. Retorne SEMPRE um JSON array, seguindo o schema definido. Para cada atividade, se for um local conhecido, inclua o 'tripAdvisorLocationId'.`;

            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        date: { type: Type.STRING, description: 'Formato YYYY-MM-DD' },
                        period: { type: Type.STRING, enum: ['Manhã', 'Tarde', 'Noite', 'Dia Todo'] },
                        category: { type: Type.STRING, enum: ['park', 'restaurant', 'shopping', 'hotel', 'transport', 'event'] },
                        notes: { type: Type.STRING, description: 'Uma breve dica ou observação sobre a atividade.' },
                        tripAdvisorLocationId: { type: Type.STRING, description: 'O ID do local no TripAdvisor, se aplicável.' }
                    },
                    required: ["title", "date", "period", "category"]
                }
            };
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: userPrompt,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });

            if (!response || !response.text) {
                throw new Error("A IA não retornou um resultado válido.");
            }

            const newActivities = JSON.parse(response.text.trim());

            if (Array.isArray(newActivities) && newActivities.length > 0) {
                const batch = writeBatch(db);
                let order = activities.length;
                newActivities.forEach(activity => {
                    const newDocRef = doc(itineraryColRef);
                    batch.set(newDocRef, { ...activity, order: order++ });
                });
                await batch.commit();
            } else {
                setAiError("Não foi possível gerar novas atividades com base na sua solicitação. Tente ser mais específico.");
            }

        } catch (error) {
            console.error("Error generating itinerary:", error);
            setAiError("Ocorreu um erro ao comunicar com o assistente. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const datesInRange = useMemo(() => getDatesInRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
    
    const groupedActivities = useMemo(() => {
        const groups: { [key: string]: ItineraryActivity[] } = {};
        activities.forEach(activity => {
            if (!groups[activity.date]) groups[activity.date] = [];
            groups[activity.date].push(activity);
        });
        Object.keys(groups).forEach(date => groups[date].sort((a, b) => a.order - b.order));
        return groups;
    }, [activities]);

    const toggleDay = (date: string) => {
        setOpenDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) newSet.delete(date); else newSet.add(date);
            return newSet;
        });
    };
    
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = activities.findIndex(a => a.id === active.id);
            const newIndex = activities.findIndex(a => a.id === over.id);
            const newActivitiesOrder = arrayMove(activities, oldIndex, newIndex);
            setActivities(newActivitiesOrder);
            
            const batch = writeBatch(db);
            newActivitiesOrder.forEach((activity, index) => {
                batch.update(doc(itineraryColRef, activity.id), { order: index });
            });
            await batch.commit();
        }
    }, [activities, itineraryColRef]);
    
    useEffect(() => {
        if (activities.length > 0 && openDays.size === 0) {
            const firstDateWithActivity = datesInRange.find(date => groupedActivities[date]?.length > 0);
            if (firstDateWithActivity) setOpenDays(new Set([firstDateWithActivity]));
        }
    }, [activities, datesInRange, groupedActivities, openDays]);

    return (
        <div className="p-4 md:p-6">
            {isOrlandoTrip(trip.destination) && canEdit && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
                    <div className="flex items-center">
                        <SparklesIcon className="h-6 w-6 text-blue-500 mr-3" />
                        <h3 className="text-lg font-bold text-blue-800">Gerador de Roteiro Mágico</h3>
                    </div>
                    <p className="text-blue-700 text-sm mt-2">Diga ao nosso assistente o que você gosta e ele montará um roteiro para você!</p>
                    <textarea value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Ex: 'foco em crianças pequenas', 'muitas compras'" className="w-full mt-3 p-2 border rounded-md text-sm" rows={2} />
                    {aiError && <p className="text-red-500 text-sm mt-2">{aiError}</p>}
                    <button onClick={handleGenerateItinerary} disabled={isGenerating} className="mt-3 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                        {isGenerating ? <><SpinnerIcon className="mr-2" /> Criando Magia...</> : '✨ Criar Roteiro Mágico'}
                    </button>
                </div>
            )}

            {isLoading ? <div className="flex justify-center py-20"><SpinnerIcon className="w-8 h-8"/></div> : (
                <div className="space-y-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    {datesInRange.map(date => {
                        const activitiesForDay = groupedActivities[date] || [];
                        const parkActivityForDay = activitiesForDay.find(act => act.category === 'park');
                        const isOpen = openDays.has(date);
                        return (
                            <div key={date} className="bg-white rounded-xl shadow-md overflow-hidden">
                                <button onClick={() => toggleDay(date)} className="w-full flex justify-between items-center p-4 text-left">
                                    <div className="flex items-center">
                                        <CalendarDaysIcon className="w-6 h-6 mr-3 text-blue-500" />
                                        <div>
                                            <p className="font-bold text-lg text-gray-800">{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                                            <p className="text-sm text-gray-500">{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-sm bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full mr-4">{activitiesForDay.length} atividades</span>
                                        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="p-4 border-t border-gray-200">
                                        {canEdit && isOrlandoTrip(trip.destination) && parkActivityForDay && (
                                            <div className="mb-4">
                                                <button onClick={() => handleActivateParkMode(parkActivityForDay.title)} disabled={locationVerifying} className="w-full text-purple-600 font-semibold p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center text-sm from-purple-500 to-blue-500 bg-gradient-to-r text-white">
                                                    {locationVerifying ? <SpinnerIcon/> : '🎢 Ativar Modo Parque'}
                                                </button>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            <SortableContext items={activitiesForDay.map(a => a.id)} strategy={verticalListSortingStrategy}>
                                                {activitiesForDay.map(activity => <ActivityItem key={activity.id} activity={activity} onEdit={() => openModal('activity', { trip, activity, date, activityCount: activitiesForDay.length })} canEdit={canEdit} />)}
                                            </SortableContext>
                                        </div>
                                        {canEdit && (
                                            <button onClick={() => openModal('activity', { trip, date, activityCount: activitiesForDay.length })} className="w-full mt-4 text-blue-600 font-semibold p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                + Adicionar Atividade
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    </DndContext>
                </div>
            )}
        </div>
    );
};

export default ItineraryView;
