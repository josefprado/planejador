import { FC } from 'react';
import { Modal, StarIcon, GoogleIcon, ModalHeaderIcon } from '../components';

interface Props {
    onClose: () => void;
    onLogin: () => void;
    onContinueAsGuest: () => void;
}

const UpgradeModal: FC<Props> = ({ onClose, onLogin, onContinueAsGuest }) => {
    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                <ModalHeaderIcon icon={StarIcon} color="yellow" />
                <h2 className="text-2xl font-bold mb-2">Desbloqueie todo o potencial!</h2>
                <p className="text-gray-600 mb-6">Faça login para salvar suas viagens na nuvem, adicionar múltiplas aventuras e usar o Checklist de Viagem.</p>
                
                <button onClick={onLogin} className="w-full max-w-xs mx-auto my-6 py-2.5 px-4 bg-white border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center transition-colors">
                    <GoogleIcon className="w-6 h-6"/>
                    <span className="ml-3">Fazer login com o Google</span>
                </button>

                <button onClick={onContinueAsGuest} type="button" className="mt-3 text-sm font-medium text-gray-500 hover:underline">Continuar sem login</button>
            </div>
        </Modal>
    );
};

export default UpgradeModal;