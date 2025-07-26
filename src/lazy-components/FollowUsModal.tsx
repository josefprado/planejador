import { FC } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Modal, InstagramIcon, ModalHeaderIcon } from '../components';

interface Props {
    onClose: () => void;
}

const FollowUsModal: FC<Props> = ({ onClose }) => {
    const { appSettings } = useAuthStore.getState();
    
    const setModalShownToday = () => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('followUsModalLastShown', today);
    };

    const handleFollowClick = () => {
        setModalShownToday();
        const url = appSettings.instagramUrl || 'https://instagram.com/laemorlando.travel';
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const handleDismissPermanently = () => {
        localStorage.setItem('hasFollowedOnInstagram', 'true');
        onClose();
    };
    
    const handleCloseTemporarily = () => {
        setModalShownToday();
        onClose();
    };

    return (
        <Modal onClose={handleCloseTemporarily}>
            <div className="text-center">
                <ModalHeaderIcon icon={InstagramIcon} color="pink" />
                <h2 className="text-2xl font-bold my-2">Sua imagem foi compartilhada! 🎉</h2>
                <p className="text-gray-600 mb-8">Gostou do nosso app? Siga a gente no Instagram para receber dicas incríveis e novidades sobre sua viagem para Orlando!</p>
                
                <div className="flex flex-col items-center space-y-3">
                     <button onClick={handleFollowClick} className="w-full py-3 px-5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded-full font-bold text-white transition-all transform hover:scale-105 flex items-center justify-center">
                        <InstagramIcon className="w-5 h-5 mr-2" /> <span>Seguir no Instagram</span>
                    </button>
                    <button onClick={handleCloseTemporarily} type="button" className="text-sm font-medium text-gray-500 hover:underline">
                        Agora não
                    </button>
                    <button onClick={handleDismissPermanently} type="button" className="text-xs text-gray-400 hover:text-gray-500 hover:underline mt-2">
                        Eu já curto a página
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FollowUsModal;