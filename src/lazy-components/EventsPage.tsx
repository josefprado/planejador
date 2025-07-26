import { useState, useEffect, FC } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { TicketmasterEvent } from '../types';
import { Logo, SpinnerIcon, ExternalLinkIcon, CalendarDaysIcon } from '../components';

interface EventsPageProps {
    city: string;
}

const EventsPage: FC<EventsPageProps> = ({ city }) => {
    const [events, setEvents] = useState<TicketmasterEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const formattedCity = city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    useEffect(() => {
        const today = new Date().toISOString();
        const q = query(
            collection(db, 'events'),
            where('city', '==', formattedCity),
            where('date', '>=', today),
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
    }, [formattedCity]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <Logo className="h-10 w-auto" />
                    <a href="/" className="font-semibold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors text-sm">
                        Planeje sua Viagem
                    </a>
                </div>
            </header>
            <main className="container mx-auto p-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Eventos em {formattedCity}</h1>
                <p className="text-gray-400 mb-8">Shows, jogos e espetáculos imperdíveis para a sua viagem.</p>
                
                {isLoading ? (
                    <div className="flex justify-center py-20"><SpinnerIcon className="w-10 h-10" /></div>
                ) : events.length === 0 ? (
                    <p className="text-center text-gray-500 py-20">Nenhum evento futuro encontrado para {formattedCity} no momento.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <div key={event.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex flex-col">
                                <img src={event.imageUrl} alt={event.name} className="w-full h-40 object-cover" />
                                <div className="p-4 flex flex-col flex-grow">
                                    <h2 className="font-bold text-lg mb-1 flex-grow">{event.name}</h2>
                                    <p className="text-sm text-gray-400">{event.venue}</p>
                                    <p className="text-xs text-blue-400 font-semibold mt-1">{new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="mt-4 w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center">
                                        <ExternalLinkIcon className="w-4 h-4 mr-2" /> Ver Ingressos
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-12 p-6 bg-blue-900/50 rounded-lg text-center border border-blue-800">
                    <CalendarDaysIcon className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                    <h3 className="text-2xl font-bold">Gostou de um evento?</h3>
                    <p className="text-blue-200 mt-2 mb-4 max-w-2xl mx-auto">Adicione-o ao seu roteiro e organize sua viagem inteira com nosso planejador gratuito. Crie um contador regressivo, organize seus dias e muito mais!</p>
                    <a href="/" className="font-semibold bg-white text-blue-700 hover:bg-gray-200 px-6 py-3 rounded-full transition-colors">
                        Começar a Planejar Gratuitamente
                    </a>
                </div>
            </main>
        </div>
    );
};

export default EventsPage;