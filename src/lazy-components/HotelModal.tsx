
import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { 
    Modal, HelpCircleIcon, WhatsAppIcon, ModalHeaderIcon, BedIcon
} from '../components';

interface Props {
    onClose: () => void;
    trip: Trip | null;
    onSend: (message: string, service: string) => void;
}

const HotelModal: React.FC<Props> = ({ onClose, trip, onSend }) => {
    const [destination, setDestination] = useState<string>('');
    const [checkIn, setCheckIn] = useState<string>('');
    const [checkOut, setCheckOut] = useState<string>('');
    const [adults, setAdults] = useState<string>('');
    const [children, setChildren] = useState<string>('');
    const [childAges, setChildAges] = useState<string[]>([]);
    const [roomPref, setRoomPref] = useState<string>('');
    const [multipleCities, setMultipleCities] = useState<boolean>(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (trip) {
            setDestination(trip.destination);
            setCheckIn(trip.startDate.split('T')[0]);
            setCheckOut(trip.endDate.split('T')[0]);
        }
        setAdults('');
        setChildren('');
        setRoomPref('');
        setMultipleCities(false);
        setError('');
    }, [trip]);

    useEffect(() => {
        const numChildren = children ? parseInt(children, 10) : 0;
        if (numChildren >= 0 && numChildren <= 10) { // Limit to a reasonable number
            setChildAges(Array(numChildren).fill(''));
        }
        if (error && children !== '') setError('');
    }, [children, error]);

    const handleAgeChange = (i: number, value: string) => {
        const newAges = [...childAges];
        newAges[i] = value;
        setChildAges(newAges);
        if (error) setError('');
    };

    const handleSendToWhatsapp = () => {
        const numAdults = adults ? parseInt(adults, 10) : 0;
        const numChildren = children !== '' ? parseInt(children, 10) : -1;

        if (numAdults < 1) {
            setError('Por favor, informe o número de adultos.');
            return;
        }
        if (numChildren < 0) {
            setError('Por favor, informe o número de crianças (pode ser 0).');
            return;
        }
        if (!roomPref) {
            setError('Por favor, selecione a preferência de quarto.');
            return;
        }
        if (numChildren > 0 && childAges.some(age => age === null || age.trim() === '')) {
            setError('Por favor, preencha a idade de todas as crianças.');
            return;
        }
        setError('');
        const agesString = numChildren > 0 ? childAges.join(', ') : 'Nenhuma';
        let message = `Olá! Preciso de cotação de hotel para ${destination}.\n\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nHóspedes: ${numAdults} adultos e ${numChildren} crianças (idades: ${agesString})\nPreferência: ${roomPref}`;
        if (multipleCities) {
            message += "\n\nObservação: Preciso de hospedagem em mais de uma cidade durante este período.";
        }
        message += "\n\n(Para agilizar seu atendimento, por favor, não altere esta mensagem.)";
        onSend(encodeURIComponent(message), 'Hotel Quotation');
        onClose();
    };

    const numChildrenForMap = children ? parseInt(children, 10) : 0;

    return (
        <Modal onClose={onClose} size="lg">
            <ModalHeaderIcon icon={BedIcon} color="blue" />
            <h2 className="text-2xl font-bold mb-2 text-center">Cotação de Hotéis e Casas</h2>
            <p className="text-gray-600 mb-6 text-center">Nos ajude a encontrar o lugar perfeito para você.</p>
            <div className="space-y-5">
                <div>
                    <label className="text-sm font-medium text-gray-600">Destino</label>
                    <input type="text" value={destination} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-600">Período da Hospedagem</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1.5">
                        <input type="date" value={checkIn} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all" />
                        <input type="date" value={checkOut} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all" />
                    </div>
                    <div className="flex items-center mt-3">
                        <input id="multiple-cities" type="checkbox" checked={multipleCities} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMultipleCities(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-100" />
                        <label htmlFor="multiple-cities" className="ml-2 text-sm text-gray-600">Preciso de hospedagem em mais de uma cidade</label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Adultos</label>
                        <input type="number" min="1" placeholder="Ex: 2" value={adults} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAdults(e.target.value); if (error) setError(''); }} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Crianças</label>
                        <input type="number" min="0" placeholder="Ex: 0" value={children} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setChildren(e.target.value); if (error) setError(''); }} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" />
                    </div>
                </div>
                {numChildrenForMap > 0 && numChildrenForMap <= 10 && (
                    <div>
                        <label className="text-sm font-medium text-gray-600">Idade das Crianças</label>
                        <div className="grid grid-cols-4 gap-2 mt-1.5">
                            {Array.from({ length: numChildrenForMap }).map((_, i) => <input key={i} type="number" min="0" max="17" placeholder={`Idade ${i + 1}`} value={childAges[i] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAgeChange(i, e.target.value)} className="w-full p-2 text-center bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all" />)}
                        </div>
                    </div>
                )}
                <div className="relative">
                    <label className="text-sm font-medium text-gray-600 inline-flex items-center">
                        Preferência de Quarto
                        <button type="button" onMouseEnter={() => setIsTooltipVisible(true)} onMouseLeave={() => setIsTooltipVisible(false)} className="ml-2 text-gray-400">
                            <HelpCircleIcon className="w-4 h-4" />
                        </button>
                    </label>
                    {isTooltipVisible && (
                        <div className="absolute bottom-full mb-2 w-full sm:w-64 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-10 transition-opacity duration-300">
                            <strong className="block">Padrão:</strong> Quarto de hotel com frigobar e/ou microondas.
                            <strong className="block mt-2">Cozinha Completa:</strong> Apartamento ou suíte com fogão, panelas e utensílios para cozinhar.
                        </div>
                    )}
                    <select value={roomPref} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setRoomPref(e.target.value); if (error) setError(''); }} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all">
                        <option value="" disabled>Selecione a preferência...</option>
                        <option value="Tanto faz">Tanto faz</option>
                        <option value="Padrão (frigobar/microondas)">Padrão (frigobar/microondas)</option>
                        <option value="Cozinha Completa">Cozinha Completa</option>
                    </select>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            <button onClick={handleSendToWhatsapp} className="w-full mt-8 py-3 px-5 bg-green-500 hover:bg-green-600 rounded-full font-bold text-white transition-colors flex items-center justify-center"><WhatsAppIcon className="w-5 h-5 mr-2" /> Falar com seu Agente de Sonhos</button>
        </Modal>
    );
};

export default HotelModal;
