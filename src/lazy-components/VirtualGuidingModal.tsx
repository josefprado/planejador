import { FC } from 'react';
import { Modal, WandIcon, WhatsAppIcon, ModalHeaderIcon } from '../components';

interface Props {
    onClose: () => void;
    onSend: (message: string, service: string) => void;
}

const VirtualGuidingModal: FC<Props> = ({ onClose, onSend }) => {
    const handleSendToWhatsapp = () => {
        const message = encodeURIComponent(`Olá! Vim pelo app e gostaria de saber mais sobre o serviço de Guiamento Virtual em Orlando.`);
        onSend(message, 'Virtual Guiding Quotation');
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                <ModalHeaderIcon icon={WandIcon} color="blue" />
                <h2 className="text-2xl font-bold my-2">Guiamento Virtual em Orlando</h2>
                <p className="text-gray-600 mb-8">Otimize seu tempo e aproveite ao máximo os parques com a ajuda de um especialista. Contrate nosso servico de guiamento e nós cuidamos da compra dos Lightning Lanes, agendamentos, horários, rotas e dicas em tempo real!</p>
                <button onClick={handleSendToWhatsapp} className="w-full py-3 px-5 bg-green-500 hover:bg-green-600 rounded-full font-bold text-white transition-colors flex items-center justify-center">
                    <WhatsAppIcon className="w-5 h-5 mr-2" /> Falar com seu Agente de Sonhos
                </button>
            </div>
        </Modal>
    );
};

export default VirtualGuidingModal;