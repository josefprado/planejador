import { FC } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Modal, SparklesIcon, WhatsAppIcon, ModalHeaderIcon } from '../components';

interface Props {
    onClose: () => void;
}

const UpgradeToOptimizerModal: FC<Props> = ({ onClose }) => {
    const { appSettings } = useAuthStore.getState();
    
    const handleContactAgent = () => {
        const message = encodeURIComponent(`Olá! Vim pelo app e gostaria de saber como me tornar um cliente para ter acesso ao "Otimizador Mágico de Roteiro"!`);
        const businessWhatsappNumber = appSettings.whatsappNumber || "5511999999999"; // Fallback seguro
        window.open(`https://wa.me/${businessWhatsappNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
        onClose();
    };

    return (
        <Modal onClose={onClose} size="lg">
            <div className="text-center">
                <ModalHeaderIcon icon={SparklesIcon} color="purple" />
                <h2 className="text-2xl font-bold my-2">✨ Otimizador Mágico ✨</h2>
                <p className="text-gray-600 mb-6">
                    Esta é uma funcionalidade <strong>exclusiva para clientes</strong> da nossa agência.
                </p>
                <div className="bg-purple-50 p-4 rounded-lg text-left text-sm text-purple-800 space-y-2">
                    <p>Ao se tornar nosso cliente, você desbloqueia a magia do nosso assistente para criar um roteiro de parque passo a passo, otimizado para:</p>
                    <ul className="list-disc list-inside font-semibold">
                        <li>Minimizar seu tempo em filas.</li>
                        <li>Maximizar a diversão da sua família.</li>
                        <li>Adaptar-se à lotação e ao clima do dia.</li>
                    </ul>
                    <p>É como ter um guia VIP no seu bolso!</p>
                </div>
                
                <button onClick={handleContactAgent} className="w-full mt-8 py-3 px-5 bg-green-500 hover:bg-green-600 rounded-full font-bold text-white transition-colors flex items-center justify-center transform hover:scale-105">
                    <WhatsAppIcon className="w-5 h-5 mr-2" /> <span>Quero ser cliente!</span>
                </button>
            </div>
        </Modal>
    );
};

export default UpgradeToOptimizerModal;
