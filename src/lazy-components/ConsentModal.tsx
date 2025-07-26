import { useState, FC } from 'react';
import { Modal, SpinnerIcon } from '../components';
import { ModalType } from '../types';

interface Props {
    onAccept: (termsVersion: string, privacyVersion: string) => void;
    onOpenLegalModal: (modal: ModalType) => void;
    persistent: boolean;
}

const TERMS_VERSION = "2.1";
const PRIVACY_VERSION = "2.1";

const ConsentModal: FC<Props> = ({ onAccept, onOpenLegalModal, persistent }) => {
    const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const canContinue = agreedTerms && agreedPrivacy;

    const handleAccept = async () => {
        if (!canContinue) return;
        setIsLoading(true);
        await onAccept(TERMS_VERSION, PRIVACY_VERSION);
        // setIsLoading(false) is not needed as the modal will be replaced
    };

    return (
        <Modal onClose={() => {}} size="lg" persistent={persistent}>
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Quase lá!</h2>
                <p className="text-gray-600 mb-8">Para continuar e criar sua conta, por favor, leia e aceite nossos termos.</p>
            </div>
            <div className="space-y-4 my-6">
                <label className="flex items-start p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input 
                        type="checkbox" 
                        checked={agreedTerms}
                        onChange={() => setAgreedTerms(!agreedTerms)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                        Eu li e concordo com os{' '}
                        <button type="button" onClick={() => onOpenLegalModal('termsOfUse')} className="font-semibold text-blue-600 hover:underline">
                            Termos de Uso (v{TERMS_VERSION})
                        </button>.
                    </span>
                </label>
                <label className="flex items-start p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input 
                        type="checkbox" 
                        checked={agreedPrivacy}
                        onChange={() => setAgreedPrivacy(!agreedPrivacy)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                        Eu li e concordo com a{' '}
                        <button type="button" onClick={() => onOpenLegalModal('privacyPolicy')} className="font-semibold text-blue-600 hover:underline">
                            Política de Privacidade (v{PRIVACY_VERSION})
                        </button>.
                    </span>
                </label>
            </div>
            <button 
                onClick={handleAccept} 
                disabled={!canContinue || isLoading}
                className="w-full mt-6 py-3 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
            >
                {isLoading && <SpinnerIcon className="w-6 h-6"/>}
                <span className={isLoading ? 'ml-2' : ''}>Aceitar e Continuar</span>
            </button>
        </Modal>
    );
};

export default ConsentModal;