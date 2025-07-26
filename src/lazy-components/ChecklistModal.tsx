import { useState, useEffect, useCallback, useMemo, FC } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, ChecklistItem, ModalType, User, AppSettings } from '../types';
import { trackChecklistItemToggle, trackGenerateLead } from '../../services/analyticsEvents';
import { 
    Modal, ChecklistIcon, LightbulbIcon, ChevronRightIcon, ModalHeaderIcon, SpinnerIcon
} from '../components';

interface Props {
    onClose: () => void;
    trip: Trip;
    onActionClick: (modal: ModalType) => void;
    user: User;
    appSettings: AppSettings;
}

const ChecklistModal: FC<Props> = ({ onClose, trip, onActionClick, user, appSettings }) => {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const tripRef = useMemo(() => doc(db, 'trips', trip.id), [trip.id]);

    const canEdit = useMemo(() => {
        if (!user) return false;
        const userRole = trip.collaborators[user.uid]?.role;
        return trip.ownerId === user.uid || userRole === 'editor';
    }, [trip, user]);

    const CHECKLIST_TEMPLATE: { text: string; phase: string; order: number; action: ModalType | null; }[] = useMemo(() => [
        { text: 'Passaporte em Dia? (validade de 6 meses)', phase: 'A Grande Conquista', order: 1, action: null },
        { text: 'Visto é Necessário?', phase: 'A Grande Conquista', order: 2, action: null },
        { text: 'Vacinas Obrigatórias?', phase: 'A Grande Conquista', order: 3, action: null },
        { text: 'Reservas Principais (voos, hotéis) OK!', phase: 'A Grande Conquista', order: 4, action: 'hotel' },
        { text: 'Ingressos de parques e atrações', phase: 'Contagem Regressiva', order: 5, action: 'ticketChoice' },
        { text: 'Seguro Viagem Contratado', phase: 'Contagem Regressiva', order: 6, action: 'insurance' },
        { text: 'Definir como levar dinheiro (cartão, espécie)', phase: 'Contagem Regressiva', order: 7, action: null },
        { text: 'Roteiro Básico Definido', phase: 'Contagem Regressiva', order: 8, action: null },
        { text: 'Preparar as Malas', phase: 'Quase Lá!', order: 9, action: null },
        { text: 'Montar Farmacinha de Viagem', phase: 'Quase Lá!', order: 10, action: null },
        { text: 'Comprar itens finais (adaptador, etc)', phase: 'Quase Lá!', order: 11, action: null },
        { text: 'Confirmar horários de voos e reservas', phase: 'Quase Lá!', order: 12, action: null },
        { text: 'Check-in Online do Voo', phase: 'A Reta Final', order: 13, action: null },
        { text: 'Mala de Mão Pronta (documentos, eletrônicos)', phase: 'A Reta Final', order: 14, action: null },
        { text: 'Carregar todas as baterias', phase: 'A Reta Final', order: 15, action: null },
        { text: 'Separar documentos para fácil acesso', phase: 'A Reta Final', order: 16, action: null },
    ], []);

    const EXPERT_TIPS = useMemo(() => ({
        'A Grande Conquista': 'Tire fotos dos seus documentos (passaporte, visto) e salve na nuvem (Google Drive, etc). É uma segurança extra que pode salvar sua viagem!',
        'Contagem Regressiva': 'Ao comprar ingressos, verifique opções "fura-fila" (skip the line). O custo extra pode valer a pena, transformando horas de espera em diversão.',
        'Quase Lá!': 'Deixe um espaço extra na mala ou leve uma bolsa dobrável. É quase impossível resistir às comprinhas e lembrancinhas do destino!',
        'A Reta Final': 'Baixe mapas offline da cidade que irá visitar no seu aplicativo de GPS. Isso garante que você não ficará perdido, mesmo sem internet.',
    }), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(tripRef, async (docSnap) => {
            if (docSnap.exists()) {
                const tripData = docSnap.data() as Trip;
                if (tripData.checklist && tripData.checklist.length > 0) {
                     const sortedChecklist = [...tripData.checklist].sort((a, b) => a.order - b.order);
                     setItems(sortedChecklist);
                } else {
                    const newChecklist: ChecklistItem[] = CHECKLIST_TEMPLATE.map((item, index) => ({
                        ...item,
                        id: `${trip.id}_${index}`,
                        checked: false,
                    }));
                    await updateDoc(tripRef, { checklist: newChecklist });
                    setItems(newChecklist.sort((a, b) => a.order - b.order));
                }
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [trip.id, tripRef, CHECKLIST_TEMPLATE]);

    const handleToggleCheck = useCallback(async (item: ChecklistItem) => {
        if (!canEdit) return;
        const newCheckedState = !item.checked;
        const updatedItems = items.map(i =>
            i.id === item.id ? { ...i, checked: newCheckedState } : i
        );
        setItems(updatedItems);
        trackChecklistItemToggle(item, trip.id, newCheckedState);
        await updateDoc(tripRef, { checklist: updatedItems });
    }, [items, tripRef, canEdit, trip.id]);

    const handleActionClick = (item: ChecklistItem) => {
        if (!item.action) return;
        trackGenerateLead(appSettings, user, item.action, trip.id);
        onActionClick(item.action);
    };

    const groupedItems = useMemo(() => items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
        (acc[item.phase] = acc[item.phase] || []).push(item);
        return acc;
    }, {}), [items]);
    
    const phaseOrder = useMemo(() => ['A Grande Conquista', 'Contagem Regressiva', 'Quase Lá!', 'A Reta Final'], []);

    return (
        <Modal onClose={onClose} size="2xl">
            <div className="text-center">
                <ModalHeaderIcon icon={ChecklistIcon} color="blue" />
                <h2 className="text-2xl font-bold my-2">Checklist da Viagem para {trip.destination}</h2>
                <p className="text-gray-600 mb-8">Organize-se para não esquecer de nada!</p>
            </div>
            {isLoading ? <div className="text-center py-10 flex justify-center"><SpinnerIcon /></div> : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                    {phaseOrder.map((phase: string) => groupedItems[phase] ? (
                        <div key={phase}>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-blue-200 pb-2">{phase}</h3>
                            <ul className="space-y-1">
                                {groupedItems[phase].map((item: ChecklistItem) => (
                                    <li key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center">
                                            <input
                                                id={item.id}
                                                type="checkbox"
                                                checked={item.checked}
                                                onChange={() => handleToggleCheck(item)}
                                                disabled={!canEdit}
                                                className="h-5 w-5 rounded border-gray-400 text-blue-600 focus:ring-blue-500 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <label htmlFor={item.id} className={`ml-3 text-gray-700 transition-colors ${item.checked ? 'line-through text-gray-400' : ''} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}>
                                                {item.text}
                                            </label>
                                        </div>
                                        {item.action && (
                                          <button onClick={() => handleActionClick(item)} className="ml-4 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-full">
                                              <span>Cotar agora</span>
                                              <ChevronRightIcon className="w-4 h-4 ml-1.5" />
                                          </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {EXPERT_TIPS[phase as keyof typeof EXPERT_TIPS] && (
                                <div className="mt-4 flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <LightbulbIcon className="flex-shrink-0 mr-3 w-6 h-6 text-yellow-500" />
                                    <p className="text-sm text-yellow-800"><strong>Dica do Especialista:</strong> {EXPERT_TIPS[phase as keyof typeof EXPERT_TIPS]}</p>
                                </div>
                            )}
                        </div>
                    ) : null)}
                </div>
            )}
        </Modal>
    );
};

export default ChecklistModal;