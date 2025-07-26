import { FC } from 'react';
import { Modal, AlertTriangleIcon, ModalHeaderIcon } from '../components';

interface Props {
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteAccountModal: FC<Props> = ({ onClose, onConfirm }) => {
    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                <ModalHeaderIcon icon={AlertTriangleIcon} color="red" />
                <h2 className="text-2xl font-bold my-2">Excluir Conta Permanentemente</h2>
                <p className="text-gray-600 mb-8">
                    Tem certeza absoluta? Todos os seus dados, incluindo perfil e viagens salvas, serão apagados para sempre. <strong>Esta ação não pode ser desfeita.</strong>
                </p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} className="px-8 py-3 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-colors">
                        Sim, excluir tudo
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteAccountModal;