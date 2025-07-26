import React, { useState, useRef, useMemo, useEffect, FC } from 'react';
import html2canvas from 'html2canvas';
import { Trip, User, AppSettings } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { THEMES } from '../themes';
import { getCountdownPhrase } from '../utils/phraseGenerator';
import { trackShare } from '../../services/analyticsEvents';
import { 
    ArrowLeftIcon, ShareIcon, PaletteIcon, DotsIcon, EditIcon, 
    SpinnerIcon
} from '../components';

interface TripDetailViewProps {
    trip: Trip;
    user: User | null;
    isGuestMode: boolean;
    appSettings: AppSettings;
    onBack: () => void;
    onShareSuccess: () => void;
    onOpenThemeModal: () => void;
    onEdit: (trip: Trip) => void;
}

interface CountdownBlockProps {
    value: number;
    label: string;
    blockClass: string;
}

const CountdownBlock: FC<CountdownBlockProps> = ({ value, label, blockClass }) => (
    <div className={`p-4 text-center ${blockClass}`}>
        <div className="text-5xl lg:text-6xl font-black">{String(value).padStart(2, '0')}</div>
        <div className="text-sm uppercase tracking-widest opacity-70 mt-1">{label}</div>
    </div>
);

const TripDetailView: FC<TripDetailViewProps> = ({ 
    trip, 
    user, 
    isGuestMode,
    appSettings, 
    onBack, 
    onShareSuccess, 
    onOpenThemeModal, 
    onEdit
}) => {
    const activeTheme = trip.themeId ? THEMES.find(t => t.id === trip.themeId) : null;
    
    const { days, hours, minutes, seconds, isFinished } = useCountdown(trip.startDate);
    const shareableRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);
    const optionsMenuRef = useRef<HTMLDivElement>(null);

    const canEdit = useMemo(() => {
        if (isGuestMode || !user) return false;
        const userRole = trip.collaborators[user.uid]?.role;
        return trip.ownerId === user.uid || userRole === 'editor';
    }, [trip, user, isGuestMode]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
                setIsOptionsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [optionsMenuRef]);
    
    const mainClasses = activeTheme ? `${activeTheme.fontClass} ${activeTheme.textColor}` : 'font-sans text-white';
    const blockClasses = activeTheme ? activeTheme.blockClass : 'bg-black/20 backdrop-blur-md rounded-2xl border border-white/10';

    const countdownPhrase = getCountdownPhrase(days, trip.destination, user);

    const handleShare = async () => {
        if (!shareableRef.current) return;
        
        setIsCapturing(true); 
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        setIsSharing(true);
        try {
            const canvas = await html2canvas(shareableRef.current, {
                useCORS: true,
                backgroundColor: '#111827',
                scrollX: 0,
                scrollY: 0,
                windowWidth: shareableRef.current.scrollWidth,
                windowHeight: shareableRef.current.scrollHeight,
            });

            canvas.toBlob(async (blob) => {
                setIsCapturing(false); 
                if (!blob) {
                    alert("Não foi possível gerar a imagem. Tente novamente.");
                    setIsSharing(false);
                    return;
                }

                const file = new File([blob], `viagem-${trip.destination}.png`, { type: 'image/png' });
                const shareData: ShareData = {
                    files: [file],
                    title: `Contagem regressiva para ${trip.destination}!`,
                    text: `Faltam ${days} dias para minha viagem! Acompanhe comigo.`,
                };

                if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        trackShare(appSettings, user, trip.id, trip.themeId);
                        onShareSuccess();
                    } catch (err) {
                        console.info("Share cancelado pelo usuário", err);
                    }
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `viagem-${trip.destination}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    trackShare(appSettings, user, trip.id, trip.themeId);
                    onShareSuccess();
                }
                 setIsSharing(false);
            }, 'image/png');

        } catch (error) {
            console.error('Erro ao gerar a imagem:', error);
            alert('Ocorreu um erro ao tentar compartilhar a imagem.');
            setIsSharing(false);
            setIsCapturing(false);
        }
    };
    
    const mainStyle: React.CSSProperties = {
      backgroundImage: activeTheme 
          ? `url('${activeTheme.background}')` 
          : `url('${trip.imageUrl || `https://source.unsplash.com/1600x900/?${encodeURIComponent(trip.destination)}`}')`,
    };

    return (
        <>
            {isSharing && !isCapturing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity">
                    <SpinnerIcon className="h-10 w-10 text-white mb-4" />
                    <p className="text-lg font-semibold text-white">Gerando imagem...</p>
                </div>
            )}
            <div ref={shareableRef} className="h-screen w-screen bg-cover bg-center flex flex-col relative" style={mainStyle} >
                <div className="absolute inset-0 bg-black/60"></div>
                <div className={`relative z-10 p-4 sm:p-6 flex-grow flex flex-col justify-between ${mainClasses}`}>
                    <header className={`font-sans flex justify-between items-center transition-opacity duration-200 ${isCapturing ? 'opacity-0' : 'opacity-100'}`}>
                        <button onClick={onBack} className="bg-black/30 backdrop-blur-sm text-white font-bold py-2.5 px-3 sm:px-5 rounded-full inline-flex items-center hover:bg-black/50 transition-colors shadow-lg">
                            <ArrowLeftIcon className="w-6 h-6"/>
                            <span className="hidden sm:inline ml-2">Voltar ao Painel</span>
                        </button>
                        
                        <div className="flex items-center space-x-2">
                             <button onClick={handleShare} disabled={isSharing} className="bg-black/30 backdrop-blur-sm text-white font-bold py-2.5 px-5 rounded-full inline-flex items-center hover:bg-black/50 transition-colors shadow-lg disabled:opacity-50">
                                <ShareIcon />
                                <span className="ml-2 hidden sm:inline">Compartilhar</span>
                            </button>
                            
                            {!isGuestMode && user && (
                                <div ref={optionsMenuRef} className="relative">
                                    <button onClick={() => setIsOptionsMenuOpen(prev => !prev)} className="bg-black/30 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/50 transition-colors shadow-lg">
                                        <DotsIcon className="w-6 h-6"/>
                                    </button>
                                    {isOptionsMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-2xl py-2 animate-fade-in-up z-30">
                                            {canEdit && (
                                                <button onClick={() => { onEdit(trip); setIsOptionsMenuOpen(false); }} className="w-full flex items-center px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors">
                                                    <EditIcon className="mr-2" /> Editar Viagem
                                                </button>
                                            )}
                                            {canEdit && (
                                                <button onClick={() => { onOpenThemeModal(); setIsOptionsMenuOpen(false); }} className="w-full flex items-center px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors">
                                                    <PaletteIcon className="mr-3 w-4 h-4" /> Mudar Tema
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="text-center">
                        <p className="text-2xl font-bold text-shadow-lg">{countdownPhrase}</p>
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-tight my-2 text-shadow-lg">{trip.destination}</h1>

                        {isFinished ? (
                            <div className="text-4xl font-bold mt-8">🎉 BOA VIAGEM! 🎉</div>
                        ) : (
                            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 max-w-2xl mx-auto mt-8">
                               <div className="flex-1 min-w-[70px]"><CountdownBlock value={days} label="Dias" blockClass={blockClasses} /></div>
                               <div className="flex-1 min-w-[70px]"><CountdownBlock value={hours} label="Horas" blockClass={blockClasses} /></div>
                               <div className="flex-1 min-w-[70px]"><CountdownBlock value={minutes} label="Min" blockClass={blockClasses} /></div>
                               <div className="flex-1 min-w-[70px]"><CountdownBlock value={seconds} label="Seg" blockClass={blockClasses} /></div>
                            </div>
                        )}
                    </main>

                    <footer className={`text-center text-xs opacity-70 font-mono tracking-wider transition-opacity duration-200 ${isCapturing ? 'opacity-100' : 'opacity-0'}`}>
                        Powered by Lá em Orlando Travel
                    </footer>
                </div>
            </div>
        </>
    );
};

export default TripDetailView;