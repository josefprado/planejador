import { FC } from 'react';
import { Modal, SimCardIcon, WhatsAppIcon, ModalHeaderIcon } from '../components';

interface Props {
    onClose: () => void;
    onSend: (message: string, service: string) => void;
}

const OtherServicesModal: FC<Props> = ({ onClose, onSend }) => {
    const handleSendToWhatsapp = () => {
        const message = encodeURIComponent(`Olá! Vim pelo app e gostaria de saber mais sobre o Chip Internacional.`);
        onSend(message, 'SimCard Quotation');
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                <ModalHeaderIcon icon={SimCardIcon} color="blue" />
                <h2 className="text-2xl font-bold my-2">Chip Internacional</h2>
                <p className="text-gray-600 mb-8">Fique conectado durante toda a sua viagem com nossos chips internacionais. Fale com um de nossos especialistas!</p>
                <button onClick={handleSendToWhatsapp} className="w-full py-3 px-5 bg-green-500 hover:bg-green-600 rounded-full font-bold text-white transition-colors flex items-center justify-center">
                    <WhatsAppIcon className="w-5 h-5 mr-2" /> Falar com seu Agente de Sonhos
                </button>
            </div>
        </Modal>
    );
};

export default OtherServicesModal;