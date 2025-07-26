
import { useState, useEffect, useMemo, FC } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { Trip, CrowdPrediction } from '../types';
import { ModalHeaderIcon, UsersIcon, SpinnerIcon, ArrowLeftIcon } from '../components';
import { useAuthStore } from '../stores/authStore';

interface CrowdCalendarPanelProps {
    trip: Trip;
}

const CrowdCalendarPanel: FC<CrowdCalendarPanelProps> = ({ trip }) => {
    const { user } = useAuthStore.getState();
    const [currentDate, setCurrentDate] = useState(new Date(trip.startDate));
    const [predictions, setPredictions] = useState<Record<string, CrowdPrediction>>({});
    const [selectedDay, setSelectedDay] = useState<CrowdPrediction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isPremium = useMemo(() => {
        if (!user || !user.premiumAccessUntil) return false;
        const today = new Date().toISOString().split('T')[0];
        return user.premiumAccessUntil >= today;
    }, [user]);

    useEffect(() => {
        const fetchPredictions = async () => {
            setIsLoading(true);
            try {
                const getCrowdCalendarPrediction = httpsCallable(functions, 'getCrowdCalendarPrediction');
                const result = await getCrowdCalendarPrediction({
                    year: currentDate.getFullYear(),
                    month: currentDate.getMonth() + 1,
                });
                const preds = (result.data as CrowdPrediction[]).reduce((acc, p) => {
                    acc[p.date] = p;
                    return acc;
                }, {} as Record<string, CrowdPrediction>);
                setPredictions(preds);
            } catch (error) {
                console.error("Error fetching crowd predictions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchHolidays = httpsCallable(functions, 'fetchAndCacheHolidays');
        fetchHolidays({ year: currentDate.getFullYear() }).then(fetchPredictions);

    }, [currentDate]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getScoreColor = (score: number) => {
        if (score <= 4) return 'bg-green-200 text-green-800';
        if (score <= 7) return 'bg-yellow-200 text-yellow-800';
        return 'bg-red-200 text-red-800';
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid: (Date | null)[] = Array(firstDay).fill(null);
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(new Date(year, month, i));
        }
        return grid;
    }, [currentDate]);

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={UsersIcon} color="blue" />
                <h2 className="text-2xl font-bold">Calendário Mágico de Lotação</h2>
                <p className="text-gray-600">Planeje seus dias de parque com nossa previsão inteligente.</p>
            </div>

            {selectedDay ? (
                <div className="flex-grow">
                    <button onClick={() => setSelectedDay(null)} className="flex items-center text-sm font-semibold text-blue-600 mb-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" /> Voltar para o Calendário
                    </button>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-bold text-lg">{new Date(`${selectedDay.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p className={`font-bold text-xl ${getScoreColor(selectedDay.score).split(' ')[1]}`}>Lotação: {selectedDay.score}/10</p>
                        {isPremium ? (
                            <>
                                <p className="text-sm mt-2">{selectedDay.explanation}</p>
                                {selectedDay.events.length > 0 && (
                                    <div className="mt-3">
                                        <h4 className="font-semibold text-sm">Eventos/Feriados:</h4>
                                        <ul className="list-disc list-inside text-xs">
                                            {selectedDay.events.map((e, i) => <li key={i}>{e.name}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mt-3 p-3 bg-purple-50 text-purple-800 rounded-lg text-sm">
                                ✨ Clientes VIP veem os detalhes e os motivos da lotação. Fale com seu agente!
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth}>‹</button>
                        <h3 className="font-bold text-lg">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={handleNextMonth}>›</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
                        <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                    </div>
                    {isLoading ? <div className="flex justify-center items-center h-48"><SpinnerIcon/></div> : (
                        <div className="grid grid-cols-7 gap-1">
                            {calendarGrid.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`}></div>;
                                const dateStr = day.toISOString().split('T')[0];
                                const prediction = predictions[dateStr];
                                return (
                                    <button 
                                        key={dateStr}
                                        onClick={() => prediction && setSelectedDay(prediction)}
                                        className={`h-12 flex flex-col items-center justify-center rounded-lg ${prediction ? getScoreColor(prediction.score) : 'bg-gray-100'} ${prediction ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <span className="font-bold">{day.getDate()}</span>
                                        {prediction && <span className="text-xs">{prediction.score}/10</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CrowdCalendarPanel;
