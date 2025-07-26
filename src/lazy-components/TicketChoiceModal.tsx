import { FC } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
    Modal, TicketIcon, ExternalLinkIcon, HelpCircleIcon, ModalHeaderIcon
} from '../components';

interface Props {
    onClose: () => void;
    onHelp: () => void;
}

const TicketChoiceModal: FC<Props> = ({ onClose, onHelp }) => {
    const { appSettings } = useAuthStore.getState();

    const handleBuy = () => {
        const url = appSettings.ticketStoreUrl || 'https://www.google.com/search?q=orlando+park+tickets';
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                <ModalHeaderIcon icon={TicketIcon} color="blue" />
                <h2 className="text-2xl font-bold my-2">Ingressos para sua Viagem</h2>
                <p className="text-gray-600 mb-8">Como podemos te ajudar?</p>
                <div className="flex flex-col space-y-4">
                    <button onClick={handleBuy} className="flex items-center justify-center py-3 px-5 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-gray-800 transition-colors">
                        <ExternalLinkIcon className="w-5 h-5"/> <span className="ml-2">Ver Preços e Comprar Online</span>
                    </button>
                    <button onClick={onHelp} className="flex items-center justify-center py-3 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-colors">
                        <HelpCircleIcon className="w-5 h-5" /> <span className="ml-2">Quero Atendimento Personalizado</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TicketChoiceModal;