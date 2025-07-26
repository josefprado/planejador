import React, { useState, useEffect, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { EventDestination } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

type DestinationFormState = Omit<EventDestination, 'id' | 'createdAt'>;

interface FormModalProps {
    onClose: () => void;
    onSave: (dest: DestinationFormState) => void;
    destToEdit: EventDestination | null;
}

const FormModal: FC<FormModalProps> = ({ onClose, onSave, destToEdit }) => {
    const [formState, setFormState] = useState<DestinationFormState>({
        city: '', countryCode: 'US', isActive: true,
    });

    useEffect(() => {
        if (destToEdit) setFormState(destToEdit);
    }, [destToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{destToEdit ? 'Editar' : 'Adicionar'} Destino de Eventos</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="city" value={formState.city} onChange={handleChange} placeholder="Nome da Cidade (ex: Orlando)" className="w-full p-2 border rounded" required />
                    <input name="countryCode" value={formState.countryCode} onChange={handleChange} placeholder="Código do País (ex: US)" className="w-full p-2 border rounded" required />
                    <label className="flex items-center"><input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleChange} className="mr-2" /> Ativar busca de eventos para esta cidade</label>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const DestinationsManager: FC = () => {
    const [destinations, setDestinations] = useState<EventDestination[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [destToEdit, setDestToEdit] = useState<EventDestination | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'eventDestinations'), orderBy('city', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDestinations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventDestination)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (destData: DestinationFormState) => {
        try {
            if (destToEdit) {
                await updateDoc(doc(db, 'eventDestinations', destToEdit.id), destData as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'eventDestinations'), { ...destData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setDestToEdit(null);
        } catch (error) {
            console.error("Error saving destination:", error);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar este destino?")) {
            await deleteDoc(doc(db, 'eventDestinations', id));
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Destinos de Eventos</h1>
                <button onClick={() => { setDestToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Novo Destino</span></button>
            </div>
            {isModalOpen && <FormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} destToEdit={destToEdit} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-left font-semibold">Cidade</th>
                            <th className="p-2 text-left font-semibold">Código do País</th>
                            <th className="p-2 text-left font-semibold">Status</th>
                            <th className="p-2 text-left font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {destinations.map((dest: EventDestination) => (
                            <tr key={dest.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{dest.city}</td>
                                <td className="p-2">{dest.countryCode}</td>
                                <td className="p-2">{dest.isActive ? 'Ativo' : 'Inativo'}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setDestToEdit(dest); setIsModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                    <button onClick={() => handleDelete(dest.id)} className="text-red-600"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DestinationsManager;