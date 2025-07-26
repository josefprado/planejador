import React, { useState, useEffect, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Complex } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

type ComplexFormState = Omit<Complex, 'id' | 'createdAt'>;

interface ComplexFormModalProps {
    onClose: () => void;
    onSave: (complex: ComplexFormState) => void;
    complexToEdit: Complex | null;
}

const ComplexFormModal: FC<ComplexFormModalProps> = ({ onClose, onSave, complexToEdit }) => {
    const [formState, setFormState] = useState<ComplexFormState>({
        name: '', city: '', state: '', country: '', isActive: true,
    });

    useEffect(() => {
        if (complexToEdit) setFormState(complexToEdit);
    }, [complexToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{complexToEdit ? 'Editar' : 'Adicionar'} Complexo</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formState.name} onChange={handleChange} placeholder="Nome do Complexo" className="w-full p-2 border rounded" required />
                    <div className="grid grid-cols-3 gap-4">
                        <input name="city" value={formState.city} onChange={handleChange} placeholder="Cidade" className="w-full p-2 border rounded" required />
                        <input name="state" value={formState.state} onChange={handleChange} placeholder="Estado/Província" className="w-full p-2 border rounded" required />
                        <input name="country" value={formState.country} onChange={handleChange} placeholder="País" className="w-full p-2 border rounded" required />
                    </div>
                    <label className="flex items-center"><input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleChange} className="mr-2" /> Ativo</label>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ComplexesManager: FC = () => {
    const [complexes, setComplexes] = useState<Complex[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [complexToEdit, setComplexToEdit] = useState<Complex | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'complexes'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComplexes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complex)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (complexData: ComplexFormState) => {
        try {
            if (complexToEdit) {
                await updateDoc(doc(db, 'complexes', complexToEdit.id), complexData as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'complexes'), { ...complexData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setComplexToEdit(null);
        } catch (error) {
            console.error("Error saving complex:", error);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar este complexo? Isso pode afetar as atrações associadas.")) {
            await deleteDoc(doc(db, 'complexes', id));
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Complexos</h1>
                <button onClick={() => { setComplexToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Novo Complexo</span></button>
            </div>
            {isModalOpen && <ComplexFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} complexToEdit={complexToEdit} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-2 text-left font-semibold">Nome</th><th className="p-2 text-left font-semibold">Local</th><th className="p-2 text-left font-semibold">Status</th><th className="p-2 text-left font-semibold">Ações</th></tr></thead>
                    <tbody>
                        {complexes.map((c: Complex) => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{c.name}</td><td className="p-2">{`${c.city}, ${c.state}, ${c.country}`}</td><td className="p-2">{c.isActive ? 'Ativo' : 'Inativo'}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setComplexToEdit(c); setIsModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                    <button onClick={() => handleDelete(c.id)} className="text-red-600"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplexesManager;
