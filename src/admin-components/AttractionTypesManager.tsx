import React, { useState, useEffect, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AttractionType } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

type AttractionTypeFormState = Omit<AttractionType, 'id' | 'createdAt'>;

interface AttractionTypeFormModalProps {
    onClose: () => void;
    onSave: (type: AttractionTypeFormState) => void;
    typeToEdit: AttractionType | null;
}

const AttractionTypeFormModal: FC<AttractionTypeFormModalProps> = ({ onClose, onSave, typeToEdit }) => {
    const [name, setName] = useState<string>('');

    useEffect(() => {
        if (typeToEdit) setName(typeToEdit.name);
    }, [typeToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{typeToEdit ? 'Editar' : 'Adicionar'} Tipo de Atração</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Nome do Tipo (ex: Parque Temático)" className="w-full p-2 border rounded" required />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AttractionTypesManager: FC = () => {
    const [types, setTypes] = useState<AttractionType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [typeToEdit, setTypeToEdit] = useState<AttractionType | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'attractionTypes'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttractionType)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (typeData: AttractionTypeFormState) => {
        try {
            if (typeToEdit) {
                await updateDoc(doc(db, 'attractionTypes', typeToEdit.id), typeData as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'attractionTypes'), { ...typeData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setTypeToEdit(null);
        } catch (error) {
            console.error("Error saving attraction type:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar este tipo? Isso pode afetar as atrações associadas.")) {
            await deleteDoc(doc(db, 'attractionTypes', id));
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Tipos de Atração</h1>
                <button onClick={() => { setTypeToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Novo Tipo</span></button>
            </div>
            {isModalOpen && <AttractionTypeFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} typeToEdit={typeToEdit} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-2 text-left font-semibold">Nome</th><th className="p-2 text-left font-semibold">Ações</th></tr></thead>
                    <tbody>
                        {types.map((t: AttractionType) => (
                            <tr key={t.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{t.name}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setTypeToEdit(t); setIsModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                    <button onClick={() => handleDelete(t.id)} className="text-red-600"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttractionTypesManager;
