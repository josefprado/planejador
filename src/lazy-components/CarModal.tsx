import React, { useState, useEffect, FC } from 'react';
import { 
    Modal, CarIcon, HelpCircleIcon, WhatsAppIcon, ModalHeaderIcon
} from '../components';

interface Props {
    onClose: () => void;
    onSend: (message: string, service: string) => void;
}

const CarModal: FC<Props> = ({ onClose, onSend }) => {
    const [pickupLocation, setPickupLocation] = useState<string>('');
    const [dropoffLocation, setDropoffLocation] = useState<string>('');
    const [isDifferentDropoff, setIsDifferentDropoff] = useState<boolean>(false);
    const [pickupDate, setPickupDate] = useState<string>('');
    const [pickupTime, setPickupTime] = useState<string>('');
    const [dropoffDate, setDropoffDate] = useState<string>('');
    const [dropoffTime, setDropoffTime] = useState<string>('');
    const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        setPickupLocation('');
        setDropoffLocation('');
        setIsDifferentDropoff(false);
        setPickupDate('');
        setPickupTime('');
        setDropoffDate('');
        setDropoffTime('');
        setError('');
    }, []);

    useEffect(() => {
        if (!isDifferentDropoff) {
            setDropoffLocation('');
        }
    }, [isDifferentDropoff]);

    const handleSendToWhatsapp = () => {
        if (!pickupLocation || !pickupDate || !pickupTime || !dropoffDate || !dropoffTime) {
            setError('Por favor, preencha todos os campos.');
            return;
        }
        if (isDifferentDropoff && !dropoffLocation) {
             setError('Por favor, preencha o local de devolução.');
            return;
        }
        setError('');

        const finalDropoffLocation = isDifferentDropoff ? dropoffLocation : pickupLocation;
        let message = `Olá! Preciso de cotação de aluguel de carro.\n\nLocal de Retirada: ${pickupLocation}\nLocal de Devolução: ${finalDropoffLocation}\n\nData/Hora de Chegada do Voo (Retirada): ${pickupDate} às ${pickupTime}\nData/Hora de Decolagem do Voo (Devolução): ${dropoffDate} às ${dropoffTime}`;
        message += "\n\n(Para agilizar seu atendimento, por favor, não altere esta mensagem.)";
        onSend(encodeURIComponent(message), 'Car Rental Quotation');
        onClose();
    };

    return (
        <Modal onClose={onClose} size="lg">
             <ModalHeaderIcon icon={CarIcon} color="blue" />
            <h2 className="text-2xl font-bold mb-2 text-center">Cotação de Aluguel de Carro</h2>
            <p className="text-gray-600 mb-8 text-center">Informe os detalhes para encontrarmos o melhor carro para você.</p>
            
            <div className="space-y-6">
                <div className="p-5 bg-gray-50 rounded-2xl">
                    <h3 className="font-semibold text-lg pb-3">Aeroporto de retirada e devolução:</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Local de Retirada (ex: Aeroporto de Orlando)" value={pickupLocation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPickupLocation(e.target.value); setError('')}} className="w-full p-3.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 focus:border-blue-500 transition-all" />
                        <div className="flex items-center">
                            <input id="different-dropoff" type="checkbox" checked={isDifferentDropoff} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDifferentDropoff(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white" />
                            <label htmlFor="different-dropoff" className="ml-2 text-sm font-medium text-gray-700">Devolver em outro aeroporto</label>
                        </div>
                        {isDifferentDropoff && (
                             <input type="text" placeholder="Local de Devolução" value={dropoffLocation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setDropoffLocation(e.target.value); setError('')}} className="w-full p-3.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 focus:border-blue-500 transition-all animate-fade-in-up" />
                        )}
                    </div>
                </div>
                 <div className="p-5 bg-gray-50 rounded-2xl">
                     <div className="relative flex items-center justify-between pb-3">
                        <h3 className="font-semibold text-lg">Datas e Horários dos Voos</h3>
                         <div onMouseEnter={() => setIsTooltipVisible(true)} onMouseLeave={() => setIsTooltipVisible(false)} className="relative">
                            <button type="button" className="ml-2 text-gray-400 hover:text-gray-600">
                                <HelpCircleIcon className="w-5 h-5" />
                            </button>
                            {isTooltipVisible && (
                                <div className="absolute bottom-full right-0 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded-lg p-2.5 shadow-lg z-10 transition-opacity duration-300">
                                   É importante que você coloque os horários dos voos, e não os que você quer pegar e devolver o carro.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Dia e hora que seu voo chega:</label>
                            <div className="grid grid-cols-2 gap-4 mt-1.5">
                                <input type="date" value={pickupDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPickupDate(e.target.value); setError('')}} className="w-full p-3.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 focus:border-blue-500 transition-all" />
                                <input type="time" value={pickupTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPickupTime(e.target.value); setError('')}} className="w-full p-3.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 focus:border-blue-500 transition-all" step="600" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Dia e hora que seu voo decola:</label>
                            <div className="grid grid-cols-2 gap-4 mt-1.5">
                                <input type="date" value={dropoffDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setDropoffDate(e.target.value); setError('')}} className="w-full p-3.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 focus:border-blue-500 transition-all" />
                                <input type="time" value={dropoffTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setDropoffTime(e.target.value); setError('')}} className="w-full p-3.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 focus:border-blue-500 transition-all" step="600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            <button onClick={handleSendToWhatsapp} className="w-full mt-8 py-3 px-5 bg-green-500 hover:bg-green-600 rounded-full font-bold text-white transition-colors flex items-center justify-center"><WhatsAppIcon className="w-5 h-5 mr-2" /> Falar com seu Agente de Sonhos</button>
        </Modal>
    );
};

export default CarModal;
