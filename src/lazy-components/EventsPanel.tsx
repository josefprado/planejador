import { useState, useEffect, FC } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, TicketmasterEvent } from '../types';
import { ModalHeaderIcon, CalendarDaysIcon, SpinnerIcon, ExternalLinkIcon, PlusIcon } from '../components';

interface EventsPanelProps {
    trip: Trip;
}

const EventsPanel: FC<EventsPanelProps> = ({ trip }) => {
    const [events, setEvents] = useState<TicketmasterEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [city, setCity] = useState('');

    useEffect(() => {
        const destinationCity = trip.destination.split(',')[0].trim();
        setCity(destinationCity);

        const q = query(
            collection(db, 'events'), 
            where('city', '==', destinationCity),
            where('date', '>=', trip.startDate),
            where('date', '<=', trip.endDate),
            orderBy('date', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEvents(snapshot.docs.map(doc => doc.data() as TicketmasterEvent));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching events:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [trip]);
    
    const handleAddEventToItinerary = async (event: TicketmasterEvent) => {
        const itineraryColRef = collection(db, 'trips', trip.id, 'itinerary');
        const newActivity = {
            title: event.name,
            date: event.date.split('T')[0],
            period: new Date(event.date).getHours() < 18 ? 'Tarde' : 'Noite',
            category: 'event',
            notes: `Evento no ${event.venue}. Horário: ${new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            order: 99, // Add to the end
        };
        await addDoc(itineraryColRef, newActivity);
        alert(`${event.name} adicionado ao seu roteiro!`);
    };

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={CalendarDaysIcon} color="blue" />
                <h2 className="text-2xl font-bold">Eventos em {city}</h2>
                <p className="text-gray-600">Descubra o que está acontecendo durante sua viagem!</p>
            </div>

            <div className="flex-grow overflow-y-auto -mx-6 px-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><SpinnerIcon /></div>
                ) : events.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">Nenhum evento encontrado para seu destino e datas.</p>
                ) : (
                    <div className="space-y-4">
                        {events.map(event => (
                            <div key={event.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                <img src={event.imageUrl} alt={event.name} className="w-full h-32 object-cover" />
                                <div className="p-3">
                                    <p className="font-bold">{event.name}</p>
                                    <p className="text-sm text-gray-600">{event.venue}</p>
                                    <p className="text-xs text-gray-500">{new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    <div className="flex space-x-2 mt-2">
                                        <button onClick={() => handleAddEventToItinerary(event)} className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md flex items-center justify-center font-semibold"><PlusIcon className="w-3 h-3 mr-1"/>Roteiro</button>
                                        <a href={event.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md flex items-center justify-center font-semibold"><ExternalLinkIcon className="w-3 h-3 mr-1"/>Ingressos</a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPanel;