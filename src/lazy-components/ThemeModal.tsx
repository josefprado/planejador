
import React from 'react';
import { Modal, SparklesIcon, CheckIcon, ModalHeaderIcon } from '../components';
import { THEMES, Theme } from '../themes';
import { Trip, User, AppSettings } from '../types';
import { trackSelectTheme } from '../../services/analyticsEvents';

interface Props {
    onClose: () => void;
    onSave: (themeId: string | null) => void;
    trip: Trip;
    user: User | null;
    appSettings: AppSettings;
}

const ThemeModal: React.FC<Props> = ({ onClose, onSave, trip, user, appSettings }) => {
    const handleSelectTheme = (themeId: string | null) => {
        if (themeId) {
            trackSelectTheme(appSettings, user, trip.id, themeId);
        }
        onSave(themeId);
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `https://picsum.photos/seed/${trip.destination}/400/300`;
    };

    return (
        <Modal onClose={onClose} size="2xl">
            <div className="text-center">
                <ModalHeaderIcon icon={SparklesIcon} color="purple" />
                <h2 className="text-2xl font-bold my-2">Escolha um Tema</h2>
                <p className="text-gray-600 mb-8">Personalize a contagem regressiva para sua viagem!</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {/* Default Theme Option */}
                <div 
                    className="group relative rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                    onClick={() => handleSelectTheme(null)}
                >
                    <div className="absolute inset-0 bg-gray-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Tema Padrão</span>
                    </div>
                    <img 
                        src={trip.imageUrl || `https://source.unsplash.com/400x300/?${encodeURIComponent(trip.destination)}`}
                        onError={handleImageError}
                        alt="Tema Padrão (Sua Imagem)" 
                        className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                    {!trip.themeId && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 flex items-center justify-center">
                            <CheckIcon className="w-4 h-4" />
                        </div>
                    )}
                     <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-white font-bold text-sm truncate">Sua Imagem</p>
                    </div>
                </div>
                
                {/* Map through THEMES */}
                {THEMES.map((theme: Theme) => (
                    <div 
                        key={theme.id} 
                        className="group relative rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                        onClick={() => handleSelectTheme(theme.id)}
                    >
                        <img src={theme.preview} alt={theme.name} className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                        {trip.themeId === theme.id && (
                             <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 flex items-center justify-center">
                                <CheckIcon className="w-4 h-4" />
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white font-bold text-sm truncate">{theme.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default ThemeModal;
