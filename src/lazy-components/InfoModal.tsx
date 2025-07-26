import { FC } from 'react';
import { Modal, InfoIcon, ModalHeaderIcon } from '../components';

interface Props {
    onClose: () => void;
    message: string;
    confirmText: string;
    onConfirm: () => void;
}

const InfoModal: FC<Props> = ({ onClose, message, confirmText, onConfirm }) => {
    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                <ModalHeaderIcon icon={InfoIcon} color="blue" />
                <h2 className="text-2xl font-bold my-2">Atenção</h2>
                <p className="text-gray-600 mb-8">{message}</p>
                <button onClick={onConfirm} className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-all transform hover:scale-105">
                    {confirmText}
                </button>
                 {confirmText !== 'OK' && (
                    <button type="button" onClick={onClose} className="mt-3 text-sm font-medium text-gray-500 hover:underline">
                        Agora não
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default InfoModal;