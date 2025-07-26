
import { FC } from 'react';
import { Trip } from '../types';
import { Modal, TrashIcon, ModalHeaderIcon, SpinnerIcon } from '../components';

interface Props {
    onClose: () => void;
    onConfirm: () => void;
    trip: Trip;
    isLoading?: boolean;
}

const DeleteConfirmationModal: FC<Props> = ({ onClose, onConfirm, trip, isLoading = false }) => {
    
    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                <ModalHeaderIcon icon={TrashIcon} color="red" />
                <h2 className="text-2xl font-bold my-2">Apagar Viagem</h2>
                <p className="text-gray-600 mb-8">
                    Tem certeza que deseja apagar permanentemente sua viagem para <span className="font-bold text-gray-800">{trip.destination}</span>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} disabled={isLoading} className="px-8 py-3 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 transition-colors disabled:opacity-50">Cancelar</button>
                    <button onClick={onConfirm} disabled={isLoading} className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                        {isLoading ? <SpinnerIcon /> : 'Sim, apagar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;
