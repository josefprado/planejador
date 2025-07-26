import React, { useState, useEffect, FC, ElementType } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, ItineraryActivity, ItineraryPeriod, ItineraryCategory } from '../types';
import { 
    Modal, TrashIcon, UtensilsIcon, 
    ShoppingBagIcon, BedIcon, PlaneIcon, TicketIcon, LinkIcon, XIcon
} from '../components';

interface Props {
    onClose: () => void;
    trip: Trip;
    activityToEdit?: ItineraryActivity | null;
    initialDate?: string | null;
    activityCount: number;
    onOpenSelectDocument: (activity: ItineraryActivity) => void;
}

const CATEGORIES: { id: ItineraryCategory; name: string; icon: ElementType }[] = [
    { id: 'park', name: 'Parque/Atração', icon: TicketIcon },
    { id: 'restaurant', name: 'Restaurante', icon: UtensilsIcon },
    { id: 'shopping', name: 'Compras', icon: ShoppingBagIcon },
    { id: 'hotel', name: 'Hotel/Descanso', icon: BedIcon },
    { id: 'transport', name: 'Transporte', icon: PlaneIcon },
    { id: 'event', name: 'Show/Evento', icon: TicketIcon },
];

const ActivityModal: FC<Props> = ({ onClose, trip, activityToEdit, initialDate, activityCount, onOpenSelectDocument }) => {
    const [title, setTitle] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [period, setPeriod] = useState<ItineraryPeriod>('Manhã');
    const [category, setCategory] = useState<ItineraryCategory>('park');
    const [notes, setNotes] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [linkedDocumentName, setLinkedDocumentName] = useState<string | undefined>(undefined);
    const [linkedDocumentId, setLinkedDocumentId] = useState<string | undefined>(undefined);
    const isEditMode = !!activityToEdit;

    useEffect(() => {
        if (activityToEdit) {
            setTitle(activityToEdit.title);
            setDate(activityToEdit.date);
            setPeriod(activityToEdit.period);
            setCategory(activityToEdit.category);
            setNotes(activityToEdit.notes || '');
            setLinkedDocumentId(activityToEdit.linkedDocumentId);
            setLinkedDocumentName(activityToEdit.linkedDocumentName);
        } else {
            setTitle('');
            setDate(initialDate || trip.startDate.split('T')[0]);
            setPeriod('Manhã');
            setCategory('park');
            setNotes('');
            setLinkedDocumentId(undefined);
            setLinkedDocumentName(undefined);
        }
        setError('');
    }, [activityToEdit, initialDate, trip]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date || !period || !category) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const activityData = {
            title: title.trim(),
            date,
            period,
            category,
            notes: notes.trim(),
            order: isEditMode && activityToEdit ? activityToEdit.order : activityCount,
            linkedDocumentId: linkedDocumentId || null,
            linkedDocumentName: linkedDocumentName || null,
        };

        try {
            const itineraryColRef = collection(db, 'trips', trip.id, 'itinerary');
            if (isEditMode && activityToEdit) {
                const activityRef = doc(itineraryColRef, activityToEdit.id);
                await updateDoc(activityRef, activityData as { [x: string]: any; });
            } else {
                await addDoc(itineraryColRef, activityData);
            }
            onClose();
        } catch (err) {
            console.error("Error saving activity:", err);
            setError("Ocorreu um erro ao salvar a atividade. Tente novamente.");
        }
    };

    const handleDelete = async () => {
        if (!isEditMode || !activityToEdit) return;
        if (window.confirm(`Tem certeza que deseja apagar a atividade "${activityToEdit.title}"?`)) {
            try {
                const activityRef = doc(db, 'trips', trip.id, 'itinerary', activityToEdit.id);
                await deleteDoc(activityRef);
                onClose();
            } catch (err) {
                console.error("Error deleting activity:", err);
                setError("Ocorreu um erro ao apagar a atividade.");
            }
        }
    };
    
    const handleUnlinkDocument = () => {
        setLinkedDocumentId(undefined);
        setLinkedDocumentName(undefined);
    }
    
    const handleOpenSelect = () => {
        if (!activityToEdit) return;

        const currentActivityState: ItineraryActivity = {
          ...activityToEdit,
          title,
          date,
          period,
          category,
          notes,
        };
        onOpenSelectDocument(currentActivityState);
    };


    return (
        <Modal onClose={onClose} size="lg">
            <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditMode ? 'Editar Atividade' : 'Nova Atividade'}</h2>
                    {isEditMode && (
                        <button type="button" onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Título da Atividade</label>
                        <input type="text" placeholder="Ex: Jantar no Be Our Guest" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Data</label>
                            <input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} min={trip.startDate.split('T')[0]} max={trip.endDate.split('T')[0]} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Período</label>
                            <select value={period} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPeriod(e.target.value as ItineraryPeriod)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all">
                                <option>Manhã</option>
                                <option>Tarde</option>
                                <option>Noite</option>
                                <option>Dia Todo</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">Categoria</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                           {CATEGORIES.map(cat => {
                               const Icon = cat.icon;
                               return (
                                   <button 
                                     type="button" 
                                     key={cat.id}
                                     onClick={() => setCategory(cat.id)}
                                     className={`p-3 flex flex-col items-center justify-center rounded-xl border-2 transition-all ${category === cat.id ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-gray-100 border-transparent hover:border-gray-300'}`}
                                    >
                                     <div className="mb-1"><Icon className="w-6 h-6"/></div>
                                     <span className="text-xs font-semibold text-center">{cat.name}</span>
                                   </button>
                               )
                           })}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-gray-600">Notas (opcional)</label>
                        <textarea placeholder="Ex: Reserva nº 12345, levar câmera..." value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} rows={3} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5 border border-transparent focus:border-blue-500 transition-all" />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">Documento Anexado</label>
                        {linkedDocumentName ? (
                            <div className="mt-1.5 flex items-center justify-between p-3 bg-green-50 text-green-800 rounded-xl">
                                <div className="flex items-center truncate">
                                    <LinkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                    <span className="truncate font-medium">{linkedDocumentName}</span>
                                </div>
                                <button type="button" onClick={handleUnlinkDocument} className="p-1 rounded-full hover:bg-green-100"><XIcon className="w-5 h-5"/></button>
                            </div>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleOpenSelect}
                                disabled={!isEditMode}
                                className="w-full mt-1.5 p-3.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <LinkIcon className="w-5 h-5 mr-2" />
                                {isEditMode ? 'Anexar Ingresso, Voucher, etc.' : 'Salve primeiro para poder anexar'}
                            </button>
                        )}
                    </div>

                </div>
                
                {error && <p className="text-red-500 text-sm text-center pt-4">{error}</p>}
                
                <button type="submit" className="w-full mt-8 py-3 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-all transform hover:scale-105">
                    {isEditMode ? 'Salvar Alterações' : 'Adicionar Atividade'}
                </button>
            </form>
        </Modal>
    );
};

export default ActivityModal;
