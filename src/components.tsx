
import React, { useEffect, useRef, useState, FC, ElementType, ReactNode } from 'react';
import { User, Trip, ModalType, Collaborator } from './types';
import { useCountdown } from './hooks/useCountdown';

import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useTripStore } from './stores/tripStore';


// Font Awesome Icons from react-icons
import { 
    FaPlus, FaTimes, FaArrowLeft, FaCheck, FaInfoCircle, FaQuestionCircle, FaExternalLinkAlt, FaLink, FaLightbulb, 
    FaStar, FaExclamationTriangle, FaWifi, FaBars, FaEllipsisV, FaChevronDown, FaChevronRight, FaArrowsAltV, 
    FaPencilAlt, FaTrashAlt, FaShareAlt, FaPaintBrush, FaFolder, FaCloudDownloadAlt, FaCheckCircle, FaCloudUploadAlt, 
    FaCamera, FaTh, FaList, FaLock, FaLockOpen, FaFileDownload, FaTicketAlt, FaBed, FaCar, FaShieldAlt, 
    FaMobileAlt, FaClipboardList, FaUsers, FaGift, FaCalculator, FaCalendarAlt, FaPlane, FaUtensils, FaShoppingBag, 
    FaBookOpen, FaDollarSign, FaLifeRing, FaFire, FaSun, FaCloud, FaCloudRain, FaSnowflake, FaBolt, FaSmog, FaCloudSun,
    FaCloudShowersHeavy, FaMoon, FaHome, FaRoute, FaArchive
} from 'react-icons/fa';

// Other Icon Libraries (to keep)
import { FaWhatsapp, FaInstagram } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import { SiAppstore } from 'react-icons/si';
import { IoLogoGooglePlaystore } from 'react-icons/io5';


// Re-export hook for convenience
export { useCountdown };

// --- ICONS ---
interface IconProps {
    className?: string;
}

// General
export const PlusIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaPlus className={className} />;
export const XIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaTimes className={className} />;
export const ArrowLeftIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaArrowLeft className={className} />;
export const SpinnerIcon: FC<IconProps> = ({ className = "h-5 w-5" }) => (<svg className={`animate-spin text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
export const CheckIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => <FaCheck className={className} />;
export const InfoIcon: FC<IconProps> = ({ className = "w-8 h-8" }) => <FaInfoCircle className={className} />;
export const HelpCircleIcon: FC<IconProps> = ({className="w-6 h-6"}) => <FaQuestionCircle className={className} />;
export const ExternalLinkIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => <FaExternalLinkAlt className={className} />;
export const LinkIcon: FC<IconProps> = ({ className = "w-5 h-5" }) => <FaLink className={className} />;
export const LightbulbIcon: FC<IconProps> = ({className="w-6 h-6"}) => <FaLightbulb className={className}/>;
export const StarIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaStar className={className} />;
export const AlertTriangleIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaExclamationTriangle className={className} />;
export const SparklesIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
      <path d="M5.26 17.242a.75.75 0 10-1.06-1.06 7.5 7.5 0 0110.607-10.607.75.75 0 00-1.06-1.06 9 9 0 00-12.728 12.728.75.75 0 001.06 1.06z" />
    </svg>
);
export const WifiOffIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaWifi className={className} />;
export const FireIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => <FaFire className={className} />;


// Menu & Navigation
export const MenuIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaBars className={className} />;
export const DotsIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaEllipsisV className={className} />;
export const ChevronDownIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaChevronDown className={className} />;
export const ChevronRightIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => <FaChevronRight className={className} />;
export const GripVerticalIcon: FC<IconProps> = ({ className = "w-5 h-5" }) => <FaArrowsAltV className={className} />;
export const HomeIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaHome className={className} />;
export const RouteIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaRoute className={className} />;
export const VaultIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaArchive className={className} />;


// Actions
export const EditIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => <FaPencilAlt className={className} />;
export const TrashIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => <FaTrashAlt className={className} />;
export const ShareIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => <FaShareAlt className={className} />;
export const PaletteIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaPaintBrush className={className} />;

// File & Document
export const FolderIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaFolder className={className} />;
export const BookOpenIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaBookOpen className={className} />;
export const DownloadCloudIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaCloudDownloadAlt className={className} />;
export const CheckCloudIcon: FC<IconProps> = ({ className = "w-6 h-6 text-green-500" }) => <FaCheckCircle className={className} />;
export const UploadCloudIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaCloudUploadAlt className={className} />;
export const CameraIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaCamera className={className} />;
export const GridIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaTh className={className} />;
export const ListIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaList className={className} />;
export const LockIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaLock className={className} />;
export const UnlockIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaLockOpen className={className} />;
export const FileDownIcon: FC<IconProps> = ({ className = "w-5 h-5" }) => <FaFileDownload className={className} />;


// Categories & Services
export const TicketIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaTicketAlt className={className} />;
export const BedIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaBed className={className} />;
export const CarIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaCar className={className} />;
export const ShieldIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaShieldAlt className={className} />;
export const WandIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
      <path d="M5.26 17.242a.75.75 0 10-1.06-1.06 7.5 7.5 0 0110.607-10.607.75.75 0 00-1.06-1.06 9 9 0 00-12.728 12.728.75.75 0 001.06 1.06z" />
    </svg>
);
export const SimCardIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaMobileAlt className={className} />;
export const ChecklistIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaClipboardList className={className} />;
export const UsersIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaUsers className={className} />;
export const GiftIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaGift className={className} />;
export const CalculatorIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaCalculator className={className} />;
export const CalendarDaysIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaCalendarAlt className={className} />;
export const PlaneIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaPlane className={className} />;
export const UtensilsIcon: FC<IconProps> = ({ className = "w-5 h-5" }) => <FaUtensils className={className} />;
export const ShoppingBagIcon: FC<IconProps> = ({ className = "w-5 h-5" }) => <FaShoppingBag className={className} />;
export const DollarSignIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaDollarSign className={className} />;
export const LifeRingIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaLifeRing className={className} />;

// Social & Brand
export const WhatsAppIcon: FC<IconProps> = ({className="w-5 h-5"}) => <FaWhatsapp className={className} />;
export const InstagramIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <FaInstagram className={className} />;
export const GoogleIcon: FC<IconProps> = ({ className = "w-5 h-5" }) => <FcGoogle className={className} />;
export const AppleStoreIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <SiAppstore className={className} />;
export const GooglePlayIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => <IoLogoGooglePlaystore className={className} />;

// Weather Icons
export const WeatherIcon: FC<{ iconCode: string, className?: string }> = ({ iconCode, className = "w-6 h-6" }) => {
    switch (iconCode) {
        case '01d': return <FaSun className={className} />;
        case '01n': return <FaMoon className={className} />;
        case '02d': return <FaCloudSun className={className} />;
        case '02n': return <FaCloudSun className={className} />; // Or FaCloudMoon
        case '03d':
        case '03n':
        case '04d':
        case '04n': return <FaCloud className={className} />;
        case '09d':
        case '09n': return <FaCloudShowersHeavy className={className} />;
        case '10d':
        case '10n': return <FaCloudRain className={className} />;
        case '11d':
        case '11n': return <FaBolt className={className} />;
        case '13d':
        case '13n': return <FaSnowflake className={className} />;
        case '50d':
        case '50n': return <FaSmog className={className} />;
        default: return <FaSun className={className} />;
    }
};

// --- UI Components ---

export const LoadingSkeleton: FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);


interface ModalHeaderIconProps {
  icon: ElementType;
  color: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink';
}

export const ModalHeaderIcon: FC<ModalHeaderIconProps> = ({ icon: Icon, color }) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-500',
        red: 'bg-red-100 text-red-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-500',
        purple: 'bg-purple-100 text-purple-600',
        pink: 'bg-pink-100 text-pink-500',
    };

    return (
        <div className={`w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full ${colorClasses[color] || 'bg-gray-100 text-gray-600'}`}>
            <Icon className="w-8 h-8" />
        </div>
    );
};

interface LogoProps {
    className?: string;
}

export const Logo: FC<LogoProps> = ({ className }) => {
    return (
        <img src="/logo.png" alt="Lá em Orlando Logo" className={className} />
    );
};

interface ModalProps {
    onClose: () => void;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    persistent?: boolean;
}

export const Modal: FC<ModalProps> = ({ onClose, children, size = 'md', persistent = false }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const sizeClasses: Record<string, string> = {
        sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl'
    };
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !persistent) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, persistent]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && modalRef.current === e.target && !persistent) {
            onClose();
        }
    };

    return (
        <div
            ref={modalRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        >
            <div className={`bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full ${sizeClasses[size]} relative animate-fade-in-up`}>
                {!persistent && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10">
                        <XIcon />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
};

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const SidePanel: FC<SidePanelProps> = ({ isOpen, onClose, children }) => {
    return (
        <div className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'bg-black/40' : 'bg-transparent pointer-events-none'}`} onClick={onClose}>
            <div 
                className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10">
                    <XIcon />
                </button>
                {children}
            </div>
        </div>
    );
};


interface TripCardProps {
    trip: Trip;
    user: User | null;
    onSelectTrip: (trip: Trip) => void;
    onEdit: (trip: Trip) => void;
    onDelete: (trip: Trip) => void;
}

export const TripCard: FC<TripCardProps> = ({ trip, user, onSelectTrip, onEdit, onDelete }) => {
    const { days } = useCountdown(trip.startDate);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const canEdit = user && (trip.ownerId === user.uid || (trip.collaborators && trip.collaborators[user.uid]?.role === 'editor'));
    const isOwner = user && trip.ownerId === user.uid;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);
    
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(trip.destination)}`;
    };

    return (
        <div 
            className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg group transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
            onClick={() => onSelectTrip(trip)}
        >
            <div className="relative h-40">
                <img 
                    src={trip.imageUrl || `https://source.unsplash.com/800x600/?${encodeURIComponent(trip.destination)}`} 
                    alt={trip.destination} 
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute top-2 right-2" ref={menuRef}>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="text-white bg-black/30 p-1.5 rounded-full hover:bg-black/50 transition-colors">
                        <DotsIcon className="w-5 h-5" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-10 text-gray-700 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                            {canEdit && (
                                <button onClick={() => { onEdit(trip); setMenuOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                                    <EditIcon className="w-4 h-4 mr-2" /> Editar Viagem
                                </button>
                            )}
                             <button onClick={() => { onDelete(trip); setMenuOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <TrashIcon className="w-4 h-4 mr-2" /> {isOwner ? 'Apagar Viagem' : 'Sair da Viagem'}
                            </button>
                        </div>
                    )}
                </div>
                 {days > 0 && (
                    <div className="absolute bottom-3 left-4 text-white">
                        <span className="text-4xl font-black">{days}</span>
                        <span className="ml-1 font-bold">dias</span>
                    </div>
                 )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg truncate">{trip.destination}</h3>
                <p className="text-sm text-gray-400">
                     {new Date(trip.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(trip.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                 <div className="flex -space-x-2 overflow-hidden mt-3">
                    {trip.collaborators && Object.values(trip.collaborators).map((collaborator: Collaborator, index) => (
                        <img key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-gray-800" src={collaborator.photoURL || `https://ui-avatars.com/api/?name=${collaborator.displayName}&background=random`} alt={collaborator.displayName || 'collab'}/>
                    ))}
                 </div>
            </div>
        </div>
    );
};

interface CompactCountdownCardProps {
    trip: Trip;
    onClick: () => void;
}

export const CompactCountdownCard: FC<CompactCountdownCardProps> = ({ trip, onClick }) => {
    const { days, isFinished } = useCountdown(trip.startDate);
    
    return (
        <div 
            onClick={onClick}
            className="bg-white p-6 rounded-2xl shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
            <div>
                <p className="text-sm text-gray-500">Contagem Regressiva para</p>
                <h2 className="text-2xl font-bold truncate text-gray-800">{trip.destination}</h2>
            </div>
            <div className="text-right">
                {isFinished ? (
                    <span className="text-2xl font-bold text-green-400">🎉</span>
                ) : (
                    <>
                        <span className="text-5xl font-black text-blue-600">{days}</span>
                        <p className="text-sm font-bold -mt-1 text-gray-600">dias</p>
                    </>
                )}
            </div>
        </div>
    );
};

interface EmptyStateProps {
    icon: ElementType;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

export const EmptyState: FC<EmptyStateProps> = ({ icon: Icon, title, message, actionText, onAction }) => (
    <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed">
        <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
        {actionText && onAction && (
            <button onClick={onAction} className="mt-4 bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-200">
                {actionText}
            </button>
        )}
    </div>
);


// --- SIDEMENU ---
interface MenuItemProps {
  icon: ElementType;
  label: string;
  onClick: () => void;
  isDisabled?: boolean;
}

const MenuItem: FC<MenuItemProps> = ({ icon: Icon, label, onClick, isDisabled = false }) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    className="w-full flex items-center p-3 text-lg font-medium text-gray-300 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
  >
    <div className="w-6 h-6 mr-4"><Icon /></div>
    {label}
  </button>
);

interface SideMenuProps {
    isOpen: boolean;
    user: User | null;
}

export const SideMenu: FC<SideMenuProps> = ({ isOpen, user }) => {
    const { logout } = useAuthStore.getState();
    const { openModal, toggleMenu } = useUIStore.getState();
    const { detailedTrip } = useTripStore.getState();
    
    const handleMenuItemClick = (modalId: ModalType) => {
        openModal(modalId, { trip: detailedTrip });
    };

    return (
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'bg-black/60' : 'bg-transparent pointer-events-none'}`} onClick={() => toggleMenu(false)}>
            <div className={`absolute top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center mb-10">
                        {user ? (
                            <>
                                <img src={user.photoURL || undefined} alt={user.displayName || 'Usuário'} className="w-12 h-12 rounded-full mr-4" />
                                <div>
                                    <p className="font-bold text-white">{user.displayName}</p>
                                    <button onClick={() => openModal('profile')} className="text-sm text-blue-400 hover:underline">Editar Perfil</button>
                                </div>
                            </>
                        ) : (
                             <Logo className="h-10 w-auto" />
                        )}
                    </div>

                    <nav className="space-y-3 flex-grow">
                        <MenuItem icon={GiftIcon} label="Clube de Vantagens" onClick={() => openModal('coupons')} isDisabled={!user} />
                        <MenuItem icon={CalculatorIcon} label="Conversor de Moedas" onClick={() => openModal('currencyConverter')} />
                        <hr className="border-gray-700 my-3"/>
                        <p className="text-sm font-semibold text-gray-500 px-3 pt-2">Cotações e Serviços</p>
                        <MenuItem icon={TicketIcon} label="Ingressos" onClick={() => handleMenuItemClick('ticketChoice')} />
                        <MenuItem icon={BedIcon} label="Hotéis e Casas" onClick={() => handleMenuItemClick('hotel')} />
                        <MenuItem icon={CarIcon} label="Aluguel de Carro" onClick={() => handleMenuItemClick('car')} />
                        <MenuItem icon={ShieldIcon} label="Seguro Viagem" onClick={() => handleMenuItemClick('insurance')} />
                        <MenuItem icon={WandIcon} label="Guiamento Virtual" onClick={() => handleMenuItemClick('virtualGuiding')} />
                        <MenuItem icon={SimCardIcon} label="Chip Internacional" onClick={() => handleMenuItemClick('otherServices')} />
                    </nav>

                    <div className="mt-6 pt-6 border-t border-gray-700">
                        {user ? (
                            <>
                                <button onClick={logout} className="w-full text-left text-gray-400 hover:text-white p-2 rounded-lg transition-colors">Sair da Conta</button>
                                <button onClick={() => openModal('deleteAccount')} className="w-full text-left text-red-500 hover:text-red-400 p-2 rounded-lg transition-colors mt-1">Excluir Conta</button>
                            </>
                        ) : (
                            <button onClick={() => toggleMenu(false)} className="w-full text-left text-gray-400 hover:text-white p-2 rounded-lg transition-colors">Fechar</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW TAB BAR ---
const TabBarButton: FC<{ icon: ElementType, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full pt-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
        <Icon className="w-6 h-6" />
        <span className="text-xs font-semibold mt-0.5">{label}</span>
    </button>
);

export const TabBar: FC = () => {
    const { activeTab, setActiveTab } = useUIStore();
    return (
        <div className="h-16 bg-white border-t border-gray-200 grid grid-cols-4 shadow-inner flex-shrink-0">
            <TabBarButton icon={HomeIcon} label="Hoje" isActive={activeTab === 'hoje'} onClick={() => setActiveTab('hoje')} />
            <TabBarButton icon={RouteIcon} label="Roteiro" isActive={activeTab === 'roteiro'} onClick={() => setActiveTab('roteiro')} />
            <TabBarButton icon={TicketIcon} label="Parques" isActive={activeTab === 'parques'} onClick={() => setActiveTab('parques')} />
            <TabBarButton icon={VaultIcon} label="Cofre" isActive={activeTab === 'cofre'} onClick={() => setActiveTab('cofre')} />
        </div>
    );
};