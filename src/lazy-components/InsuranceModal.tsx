
import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { 
    Modal, ShieldIcon, HelpCircleIcon, WhatsAppIcon, ModalHeaderIcon
} from '../components';

interface Props {
    onClose: () => void;
    trip: Trip | null;
    onSend: (message: string, service: string) => void;
}

const InsuranceModal: React.FC<Props> = ({ onClose, trip, onSend }) => {
    const [departureDate, setDepartureDate] = useState<string>('');
    const [returnDate, setReturnDate] = useState<string>('');
    const [numberOfTravelers, setNumberOfTravelers] = useState<number>(1);
    const [travelerAges, setTravelerAges] = useState<string[]>(['']);
    const [isDepartureTooltipVisible, setIsDepartureTooltipVisible] = useState<boolean>(false);
    const [isReturnTooltipVisible, setIsReturnTooltipVisible] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (trip) {
            setDepartureDate(trip.startDate.split('T')[0]);
            setReturnDate(trip.endDate.split('T')[0]);
        } else {
            setDepartureDate('');
            setReturnDate('');
        }
        setNumberOfTravelers(1);
        setTravelerAges(['']);
        setError('');
    }, [trip]);

    useEffect(() => {
        setTravelerAges(Array(numberOfTravelers > 0 ? numberOfTravelers : 0).fill(''));
        setError('');
    }, [numberOfTravelers]);

    const handleSendToWhatsapp = () => {
        if (numberOfTravelers > 0 && travelerAges.some(age => age === null || age.trim() === '')) {
            setError('Por favor, preencha a idade de todos os viajantes.');
            return;
        }
        if(!departureDate || !returnDate){
            setError('Por favor, preencha as datas de decolagem e pouso.');
            return;
        }
        setError('');
        const agesString = travelerAges.join(', ');
        let message = `Olá! Preciso de cotação de Seguro Viagem.\n\nData de decolagem no Brasil: ${departureDate}\nData de pouso no Brasil: ${returnDate}\n\nViajantes: ${numberOfTravelers}\nIdades: ${agesString}`;
        
        message += "\n\n(Para agilizar seu atendimento, por favor, não altere esta mensagem.)";
        onSend(encodeURIComponent(message), 'Insurance Quotation');
        onClose();
    };
    
    const handleTravelerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = parseInt(e.target.value, 10);
        setNumberOfTravelers(count >= 1 ? count : 1);
    }
    
    const handleAgeChange = (index: number, value: string) => {
        const newAges = [...travelerAges];
        newAges[index] = value;
        setTravelerAges(newAges);
        setError('');
    }

    return (
        <Modal onClose={onClose} size="lg">
            <ModalHeaderIcon icon={ShieldIcon} color="blue" />
            <h2 className="text-2xl font-bold mb-2 text-center">Cotação de Seguro Viagem</h2>
            <p className="text-gray-600 mb-8 text-center">Viaje com tranquilidade. Preencha os dados abaixo.</p>
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="text-sm font-medium text-gray-600 inline-flex items-center">
                            Decolagem no Brasil
                            <button type="button" onMouseEnter={() => setIsDepartureTooltipVisible(true)} onMouseLeave={() => setIsDepartureTooltipVisible(false)} className="ml-1.5 text-gray-400">
                                <HelpCircleIcon className="w-4 h-4" />
                            </button>
                        </label>
                        {isDepartureTooltipVisible && (
                            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded-lg p-2 shadow-lg z-10">
                               Se seu voo tiver escalas, informe a data do primeiro trecho.
                            </div>
                        )}
                        <input type="date" value={departureDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartureDate(e.target.value)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" />
                    </div>
                    <div className="relative">
                        <label className="text-sm font-medium text-gray-600 inline-flex items-center">
                            Pouso no Brasil
                            <button type="button" onMouseEnter={() => setIsReturnTooltipVisible(true)} onMouseLeave={() => setIsReturnTooltipVisible(false)} className="ml-1.5 text-gray-400">
                                <HelpCircleIcon className="w-4 h-4" />
                            </button>
                        </label>
                        {isReturnTooltipVisible && (
                            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded-lg p-2 shadow-lg z-10">
                               Se seu voo de volta tiver escalas, informe a data do pouso do último trecho.
                            </div>
                        )}
                        <input type="date" value={returnDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnDate(e.target.value)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-600">Número de Viajantes</label>
                    <input type="number" min="1" value={numberOfTravelers} onChange={handleTravelerCountChange} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" />
                </div>
               
                {numberOfTravelers > 0 && numberOfTravelers <= 20 && ( // Limit to a reasonable number
                    <div>
                        <label className="text-sm font-medium text-gray-600">Idade dos Viajantes</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                            {Array.from({ length: numberOfTravelers }).map((_, i) => <input key={i} type="number" min="0" max="120" placeholder={`Idade ${i + 1}`} value={travelerAges[i] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAgeChange(i, e.target.value)} className="w-full p-2.5 text-center bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all" />)}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            <button onClick={handleSendToWhatsapp} className="w-full mt-8 py-3 px-5 bg-green-500 hover:bg-green-600 rounded-full font-bold text-white transition-colors flex items-center justify-center"><WhatsAppIcon className="w-5 h-5 mr-2" /> Falar com seu Agente de Sonhos</button>
        </Modal>
    );
};

export default InsuranceModal;
