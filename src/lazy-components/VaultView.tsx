

import { FC, ElementType } from 'react';
import { DetailedTrip, PanelType } from '../types';
import { useUIStore } from '../stores/uiStore';
import { 
    PlaneIcon, BedIcon, FolderIcon, DollarSignIcon, ChevronRightIcon, CalendarDaysIcon 
} from '../components';

interface VaultViewProps {
    trip: DetailedTrip;
}

const VaultButton: FC<{ icon: ElementType, label: string, description: string, onClick: () => void }> = ({ icon: Icon, label, description, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border hover:bg-gray-50 transition-colors text-left"
    >
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg mr-4">
            <Icon className="w-6 h-6 text-gray-600" />
        </div>
        <div className="flex-grow">
            <p className="font-bold text-gray-800">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </button>
);

const VaultView: FC<VaultViewProps> = ({ trip }) => {
    const { openPanel, openModal } = useUIStore.getState();

    const handleOpenPanel = (type: PanelType) => {
        openPanel(type, { trip });
    };

    return (
        <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Cofre da Viagem</h2>
            <p className="text-gray-600">Acesse todas as suas informações organizacionais aqui.</p>

            <VaultButton
                icon={PlaneIcon}
                label="Voos"
                description={`${trip.flights?.length || 0} voos adicionados`}
                onClick={() => handleOpenPanel('flights')}
            />
            <VaultButton
                icon={BedIcon}
                label="Hospedagem"
                description={`${trip.accommodations?.length || 0} locais adicionados`}
                onClick={() => handleOpenPanel('accommodation')}
            />
             <VaultButton
                icon={CalendarDaysIcon}
                label="Eventos no Destino"
                description="Shows, jogos e mais"
                onClick={() => handleOpenPanel('events')}
            />
            <VaultButton
                icon={FolderIcon}
                label="Documentos"
                description="Ingressos, vouchers e mais"
                onClick={() => openModal('documents', { trip })}
            />
             <VaultButton
                icon={DollarSignIcon}
                label="Despesas"
                description={`${trip.expenses?.length || 0} despesas registradas`}
                onClick={() => handleOpenPanel('expenses')}
            />
        </div>
    );
};

export default VaultView;