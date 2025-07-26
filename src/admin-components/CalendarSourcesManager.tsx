import React, { useState, useEffect, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { CalendarSource } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

type CalendarSourceFormState = Omit<CalendarSource, 'id' | 'createdAt'>;

interface FormModalProps {
    onClose: () => void;
    onSave: (source: CalendarSourceFormState) => void;
    sourceToEdit: CalendarSource | null;
}

const FormModal: FC<FormModalProps> = ({ onClose, onSave, sourceToEdit }) => {
    const [formState, setFormState] = useState<CalendarSourceFormState>({
        name: '', calendarId: '', type: 'Feriado Nacional',
    });

    useEffect(() => {
        if (sourceToEdit) setFormState(sourceToEdit);
    }, [sourceToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                <h2 className="text-xl font-bold mb-4">{sourceToEdit ? 'Editar' : 'Adicionar'} Fonte de Calendário</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formState.name} onChange={handleChange} placeholder="Nome da Fonte (ex: Feriados Escolares - Orange County)" className="w-full p-2 border rounded" required />
                    <input name="calendarId" value={formState.calendarId} onChange={handleChange} placeholder="ID do Google Calendar (ex: ...@group.calendar.google.com)" className="w-full p-2 border rounded" required />
                    <select name="type" value={formState.type} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="Feriado Nacional">Feriado Nacional</option>
                        <option value="Feriado Escolar">Feriado Escolar</option>
                        <option value="Evento Local">Evento Local</option>
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

const CalendarSourcesManager: FC = () => {
    const [sources, setSources] = useState<CalendarSource[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [sourceToEdit, setSourceToEdit] = useState<CalendarSource | null>(null);
    const [syncMessage, setSyncMessage] = useState<string>('');

    useEffect(() => {
        const q = query(collection(db, 'calendarSources'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarSource)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (sourceData: CalendarSourceFormState) => {
        try {
            if (sourceToEdit) {
                await updateDoc(doc(db, 'calendarSources', sourceToEdit.id), sourceData as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'calendarSources'), { ...sourceData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setSourceToEdit(null);
        } catch (error) {
            console.error("Error saving calendar source:", error);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar esta fonte?")) {
            await deleteDoc(doc(db, 'calendarSources', id));
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage('');
        try {
            const syncFunction = httpsCallable(functions, 'fetchAndCacheHolidays');
            const result = await syncFunction();
            setSyncMessage((result.data as any).message);
        } catch (error: any) {
            console.error("Error syncing calendars:", error);
            setSyncMessage(error.message || "Ocorreu um erro durante a sincronização.");
        } finally {
            setIsSyncing(false);
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Fontes de Calendário</h1>
                <button onClick={handleSync} disabled={isSyncing} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50">
                    {isSyncing ? <SpinnerIcon /> : '🔄'}
                    <span className="ml-2">{isSyncing ? 'Sincronizando...' : 'Sincronizar Calendários Agora'}</span>
                </button>
            </div>
            {syncMessage && <p className="text-sm p-3 bg-blue-50 text-blue-800 rounded-md mb-4">{syncMessage}</p>}

            <div className="flex justify-end mb-4">
                 <button onClick={() => { setSourceToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Nova Fonte</span></button>
            </div>

            {isModalOpen && <FormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} sourceToEdit={sourceToEdit} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-left font-semibold">Nome</th>
                            <th className="p-2 text-left font-semibold">Tipo</th>
                            <th className="p-2 text-left font-semibold">ID do Calendário</th>
                            <th className="p-2 text-left font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sources.map((s: CalendarSource) => (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{s.name}</td>
                                <td className="p-2">{s.type}</td>
                                <td className="p-2 truncate max-w-xs">{s.calendarId}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setSourceToEdit(s); setIsModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                    <button onClick={() => handleDelete(s.id)} className="text-red-600"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CalendarSourcesManager;