import React, { useState, useEffect, useMemo, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { TicketRule, Complex } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

type TicketRuleFormState = Omit<TicketRule, 'id' | 'createdAt' | 'promoSaleStartDate' | 'promoSaleEndDate' | 'promoUsageStartDate' | 'promoUsageEndDate'> & {
    promoSaleStartDate?: string;
    promoSaleEndDate?: string;
    promoUsageStartDate?: string;
    promoUsageEndDate?: string;
};

interface TicketRuleFormModalProps {
    onClose: () => void;
    onSave: (rule: Omit<TicketRule, 'id' | 'createdAt'>) => void;
    ruleToEdit: TicketRule | null;
    complexes: Complex[];
}

const TicketRuleFormModal: FC<TicketRuleFormModalProps> = ({ onClose, onSave, ruleToEdit, complexes }) => {
    const [formState, setFormState] = useState<TicketRuleFormState>({
        complexId: '', name: '', daysOfUse: 0, validityWindowDays: 0, specialRules: '', isPromo: false,
    });

    useEffect(() => {
        if (ruleToEdit) {
            setFormState({
                ...ruleToEdit,
                promoSaleStartDate: ruleToEdit.promoSaleStartDate ? new Date(ruleToEdit.promoSaleStartDate).toISOString().split('T')[0] : '',
                promoSaleEndDate: ruleToEdit.promoSaleEndDate ? new Date(ruleToEdit.promoSaleEndDate).toISOString().split('T')[0] : '',
                promoUsageStartDate: ruleToEdit.promoUsageStartDate ? new Date(ruleToEdit.promoUsageStartDate).toISOString().split('T')[0] : '',
                promoUsageEndDate: ruleToEdit.promoUsageEndDate ? new Date(ruleToEdit.promoUsageEndDate).toISOString().split('T')[0] : '',
            });
        } else if (complexes.length > 0) {
            setFormState(prev => ({...prev, complexId: complexes[0].id}));
        }
    }, [ruleToEdit, complexes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
            setFormState(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
        }
        else {
             setFormState(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{ruleToEdit ? 'Editar' : 'Adicionar'} Regra de Ingresso</h2>
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    <select name="complexId" value={formState.complexId} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="" disabled>Selecione um complexo</option>
                        {complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input name="name" value={formState.name} onChange={handleChange} placeholder="Nome do Ingresso (ex: 4-Day Park Hopper)" className="w-full p-2 border rounded" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="daysOfUse" value={formState.daysOfUse} onChange={handleChange} type="number" placeholder="Dias de Uso" className="w-full p-2 border rounded" required />
                        <input name="validityWindowDays" value={formState.validityWindowDays} onChange={handleChange} type="number" placeholder="Janela de Validade (dias)" className="w-full p-2 border rounded" required />
                    </div>
                    <textarea name="specialRules" value={formState.specialRules} onChange={handleChange} placeholder="Regras especiais (opcional)" className="w-full p-2 border rounded" />
                    <label className="flex items-center"><input type="checkbox" name="isPromo" checked={formState.isPromo} onChange={handleChange} className="mr-2" /> É promocional?</label>
                    {formState.isPromo && (
                        <div className="grid grid-cols-2 gap-4 border p-2 rounded-md">
                            <div>
                                <label className="block text-xs">Início Venda</label>
                                <input name="promoSaleStartDate" value={formState.promoSaleStartDate || ''} onChange={handleChange} type="date" className="w-full p-2 border rounded" />
                            </div>
                             <div>
                                <label className="block text-xs">Fim Venda</label>
                                <input name="promoSaleEndDate" value={formState.promoSaleEndDate || ''} onChange={handleChange} type="date" className="w-full p-2 border rounded" />
                            </div>
                             <div>
                                <label className="block text-xs">Início Uso</label>
                                <input name="promoUsageStartDate" value={formState.promoUsageStartDate || ''} onChange={handleChange} type="date" className="w-full p-2 border rounded" />
                            </div>
                             <div>
                                <label className="block text-xs">Fim Uso</label>
                                <input name="promoUsageEndDate" value={formState.promoUsageEndDate || ''} onChange={handleChange} type="date" className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const TicketRulesManager: FC = () => {
    const [rules, setRules] = useState<TicketRule[]>([]);
    const [complexes, setComplexes] = useState<Complex[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [ruleToEdit, setRuleToEdit] = useState<TicketRule | null>(null);

    const complexMap = useMemo(() => new Map(complexes.map(c => [c.id, c.name])), [complexes]);

    useEffect(() => {
        const qRules = query(collection(db, 'ticketRules'), orderBy('createdAt', 'desc'));
        const unsubRules = onSnapshot(qRules, (snapshot) => {
            setRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketRule)));
        }, () => setIsLoading(false));

        const qComplexes = query(collection(db, 'complexes'), orderBy('name', 'asc'));
        const unsubComplexes = onSnapshot(qComplexes, (snapshot) => {
            setComplexes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complex)));
        }, () => setIsLoading(false));

        Promise.all([
            new Promise(res => onSnapshot(qRules, () => res(true))),
            new Promise(res => onSnapshot(qComplexes, () => res(true)))
        ]).then(() => setIsLoading(false));

        return () => {
            unsubRules();
            unsubComplexes();
        };
    }, []);

    const handleSave = async (ruleData: Omit<TicketRule, 'id' | 'createdAt'>) => {
        try {
            const dataToSave = {
                ...ruleData,
                promoSaleStartDate: ruleData.isPromo && ruleData.promoSaleStartDate ? new Date(ruleData.promoSaleStartDate + 'T00:00:00Z').toISOString() : '',
                promoSaleEndDate: ruleData.isPromo && ruleData.promoSaleEndDate ? new Date(ruleData.promoSaleEndDate + 'T00:00:00Z').toISOString() : '',
                promoUsageStartDate: ruleData.isPromo && ruleData.promoUsageStartDate ? new Date(ruleData.promoUsageStartDate + 'T00:00:00Z').toISOString() : '',
                promoUsageEndDate: ruleData.isPromo && ruleData.promoUsageEndDate ? new Date(ruleData.promoUsageEndDate + 'T00:00:00Z').toISOString() : '',
            };

            if (ruleToEdit) {
                await updateDoc(doc(db, 'ticketRules', ruleToEdit.id), dataToSave as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'ticketRules'), { ...dataToSave, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setRuleToEdit(null);
        } catch (error) {
            console.error("Error saving ticket rule:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar esta regra?")) {
            await deleteDoc(doc(db, 'ticketRules', id));
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Regras de Ingressos</h1>
                <button onClick={() => { setRuleToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Nova Regra</span></button>
            </div>
            {isModalOpen && <TicketRuleFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} ruleToEdit={ruleToEdit} complexes={complexes} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b"><th className="p-2 text-left font-semibold">Complexo</th><th className="p-2 text-left font-semibold">Nome</th><th className="p-2 text-left font-semibold">Dias Uso</th><th className="p-2 text-left font-semibold">Validade</th><th className="p-2 text-left font-semibold">Ações</th></tr>
                    </thead>
                    <tbody>
                        {rules.map(rule => (
                            <tr key={rule.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{complexMap.get(rule.complexId) || 'Não encontrado'}</td>
                                <td className="p-2">{rule.name}</td>
                                <td className="p-2">{rule.daysOfUse}</td>
                                <td className="p-2">{rule.validityWindowDays}</td>
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

export default TicketRulesManager;