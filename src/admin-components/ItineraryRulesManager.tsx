import React, { useState, useEffect, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ItineraryRule } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

type ItineraryRuleFormState = Omit<ItineraryRule, 'id' | 'createdAt'>;

interface ItineraryRuleFormModalProps {
    onClose: () => void;
    onSave: (rule: ItineraryRuleFormState) => void;
    ruleToEdit: ItineraryRule | null;
}

const ItineraryRuleFormModal: FC<ItineraryRuleFormModalProps> = ({ onClose, onSave, ruleToEdit }) => {
    const [formState, setFormState] = useState<ItineraryRuleFormState>({
        rule: '', type: 'Dica',
    });

    useEffect(() => {
        if (ruleToEdit) setFormState(ruleToEdit);
    }, [ruleToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value as any }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{ruleToEdit ? 'Editar' : 'Adicionar'} Regra de Roteiro</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea name="rule" value={formState.rule} onChange={handleChange} placeholder="Descrição da regra (ex: Evitar Magic Kingdom às segundas)" className="w-full p-2 border rounded" rows={3} required />
                    <select name="type" value={formState.type} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="Dica">Dica</option>
                        <option value="Restrição">Restrição</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ItineraryRulesManager: FC = () => {
    const [rules, setRules] = useState<ItineraryRule[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [ruleToEdit, setRuleToEdit] = useState<ItineraryRule | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'itineraryRules'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryRule)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (ruleData: ItineraryRuleFormState) => {
        try {
            if (ruleToEdit) {
                await updateDoc(doc(db, 'itineraryRules', ruleToEdit.id), ruleData as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'itineraryRules'), { ...ruleData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setRuleToEdit(null);
        } catch (error) {
            console.error("Error saving itinerary rule:", error);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar esta regra?")) {
            await deleteDoc(doc(db, 'itineraryRules', id));
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Regras de Roteiro</h1>
                <button onClick={() => { setRuleToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Nova Regra</span></button>
            </div>
            {isModalOpen && <ItineraryRuleFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} ruleToEdit={ruleToEdit} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b"><th className="p-2 text-left font-semibold">Regra</th><th className="p-2 text-left font-semibold">Tipo</th><th className="p-2 text-left font-semibold">Ações</th></tr>
                    </thead>
                    <tbody>
                        {rules.map((rule: ItineraryRule) => (
                            <tr key={rule.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 w-3/4">{rule.rule}</td><td className="p-2">{rule.type}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setRuleToEdit(rule); setIsModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                    <button onClick={() => handleDelete(rule.id)} className="text-red-600"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ItineraryRulesManager;
