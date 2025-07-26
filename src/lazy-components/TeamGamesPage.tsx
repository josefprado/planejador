import { useState, useEffect, FC } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { TicketmasterEvent } from '../types';
import { Logo, SpinnerIcon, ExternalLinkIcon, CalendarDaysIcon } from '../components';

interface TeamGamesPageProps {
    team: string;
}

const TEAM_CONFIG: Record<string, { name: string; colors: { primary: string; secondary: string; text: string; } }> = {
    'orlando-magic': { name: 'Orlando Magic', colors: { primary: '#0077c0', secondary: '#c4ced3', text: '#000000' } },
    'miami-heat': { name: 'Miami Heat', colors: { primary: '#98002e', secondary: '#f9a01b', text: '#000000' } },
    'tampa-bay-buccaneers': { name: 'Tampa Bay Buccaneers', colors: { primary: '#d50a0a', secondary: '#343434', text: '#ff7900' } },
    'orlando-city-sc': { name: 'Orlando City SC', colors: { primary: '#633492', secondary: '#fdee21', text: '#FFFFFF' } },
    'orlando-solar-bears': { name: 'Orlando Solar Bears', colors: { primary: '#5a3992', secondary: '#f58426', text: '#007399' } },
};


const TeamGamesPage: FC<TeamGamesPageProps> = ({ team }) => {
    const [events, setEvents] = useState<TicketmasterEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const config = TEAM_CONFIG[team] || { name: team.replace(/-/g, ' '), colors: { primary: '#1d4ed8', secondary: '#e5e7eb', text: '#ffffff' } };

    useEffect(() => {
        const today = new Date().toISOString();
        const q = query(
            collection(db, 'events'),
            where('team', '==', team),
            where('date', '>=', today),
            orderBy('date', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEvents(snapshot.docs.map(doc => doc.data() as TicketmasterEvent));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching team games:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [team]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: config.colors.primary, color: config.colors.text }}>
            <header className="bg-black/20 p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <Logo className="h-10 w-auto" />
                    <a href="/" className="font-semibold bg-white/90 hover:bg-white text-black px-4 py-2 rounded-full transition-colors text-sm">
                        Planeje sua Viagem
                    </a>
                </div>
            </header>
            <main className="container mx-auto p-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Próximos Jogos: {config.name}</h1>
                <p className="opacity-80 mb-8">Todos os jogos em casa para você planejar sua visita.</p>
                
                {isLoading ? (
                    <div className="flex justify-center py-20"><SpinnerIcon className="w-10 h-10" /></div>
                ) : events.length === 0 ? (
                    <p className="text-center opacity-70 py-20">Nenhum jogo futuro encontrado para {config.name} no momento.</p>
                ) : (
                    <div className="space-y-4">
                        {events.map(event => (
                            <div key={event.id} className="bg-black/20 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex-grow">
                                    <h2 className="font-bold text-lg">{event.name}</h2>
                                    <p className="text-sm opacity-80">{event.venue}</p>
                                    <p className="text-xs font-semibold mt-1" style={{color: config.colors.secondary}}>{new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                </div>
                                <a href={event.url} target="_blank" rel="noopener noreferrer" className="ml-4 flex-shrink-0 bg-white hover:bg-gray-200 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center" style={{ color: config.colors.primary }}>
                                    <ExternalLinkIcon className="w-4 h-4 mr-2" /> Ver Ingressos
                                </a>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-12 p-6 bg-black/30 rounded-lg text-center border" style={{ borderColor: config.colors.secondary }}>
                    <CalendarDaysIcon className="w-10 h-10 mx-auto opacity-80 mb-3" />
                    <h3 className="text-2xl font-bold">Vai ao jogo?</h3>
                    <p className="mt-2 mb-4 max-w-2xl mx-auto opacity-90">Adicione a partida ao seu roteiro e organize sua viagem inteira com nosso planejador gratuito. Crie um contador regressivo, organize seus dias e muito mais!</p>
                    <a href="/" className="font-semibold bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-full transition-colors">
                        Começar a Planejar Gratuitamente
                    </a>
                </div>
            </main>
        </div>
    );
};

export default TeamGamesPage;