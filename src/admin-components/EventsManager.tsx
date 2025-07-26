
import React, { useState, useEffect, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CustomEvent } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

type CustomEventFormState = Omit<CustomEvent, 'id' | 'createdAt'>;

interface EventFormModalProps {
    onClose: () => void;
    onSave: (event: CustomEventFormState) => void;
    eventToEdit: CustomEvent | null;
}

const EventFormModal: FC<EventFormModalProps> = ({ onClose, onSave, eventToEdit }) => {
    const [formState, setFormState] = useState<CustomEventFormState>({
        name: '', startDate: '', endDate: '', impactDescription: '', description: '',
    });

    useEffect(() => {
        if (eventToEdit) {
            setFormState({
                ...eventToEdit,
                startDate: eventToEdit.startDate ? new Date(eventToEdit.startDate).toISOString().split('T')[0] : '',
                endDate: eventToEdit.endDate ? new Date(eventToEdit.endDate).toISOString().split('T')[0] : '',
            });
        }
    }, [eventToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{eventToEdit ? 'Editar' : 'Adicionar'} Evento</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formState.name} onChange={handleChange} placeholder="Nome do Evento (ex: Spring Break)" className="w-full p-2 border rounded" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="startDate" value={formState.startDate} onChange={handleChange} type="date" className="w-full p-2 border rounded" required />
                        <input name="endDate" value={formState.endDate} onChange={handleChange} type="date" className="w-full p-2 border rounded" required />
                    </div>
                    <textarea name="impactDescription" value={formState.impactDescription} onChange={handleChange} placeholder="Descrição do Impacto (ex: Lotação muito alta, evento de corrida)" className="w-full p-2 border rounded" rows={2} required />
                    <textarea name="description" value={formState.description || ''} onChange={handleChange} placeholder="Descrição (opcional)" className="w-full p-2 border rounded" rows={2} />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EventsManager: FC = () => {
    const [events, setEvents] = useState<CustomEvent[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [eventToEdit, setEventToEdit] = useState<CustomEvent | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'customEvents'), orderBy('startDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomEvent)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (eventData: CustomEventFormState) => {
        try {
            if (eventToEdit) {
                await updateDoc(doc(db, 'customEvents', eventToEdit.id), eventData as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'customEvents'), { ...eventData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setEventToEdit(null);
        } catch (error) {
            console.error("Error saving event:", error);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar este evento?")) {
            await deleteDoc(doc(db, 'customEvents', id));
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Eventos Personalizados</h1>
                <button onClick={() => { setEventToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Novo Evento</span></button>
            </div>
            {isModalOpen && <EventFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} eventToEdit={eventToEdit} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-left font-semibold">Nome</th>
                            <th className="p-2 text-left font-semibold">Período</th>
                            <th className="p-2 text-left font-semibold">Descrição do Impacto</th>
                            <th className="p-2 text-left font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: CustomEvent) => (
                            <tr key={event.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{event.name}</td>
                                <td className="p-2">{`${new Date(event.startDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - ${new Date(event.endDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`}</td>
                                <td className="p-2">{event.impactDescription}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setEventToEdit(event); setIsModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                    <button onClick={() => handleDelete(event.id)} className="text-red-600"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EventsManager;
