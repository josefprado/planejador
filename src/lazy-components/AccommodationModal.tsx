import React, { useState, useEffect, FC } from 'react';
import { Trip, Accommodation } from '../types';
import { ModalHeaderIcon, BedIcon, TrashIcon, EmptyState } from '../components';
import { useTripStore } from '../stores/tripStore';

interface AccommodationModalProps {
    trip: Trip;
}

const AccommodationModal: FC<AccommodationModalProps> = ({ trip }) => {
    const { saveTrip } = useTripStore.getState();
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [isEditing, setIsEditing] = useState<string | null>(null); // holds id of accommodation being edited
    const [current, setCurrent] = useState<Omit<Accommodation, 'id'>>({ name: '', address: '', checkIn: '', checkOut: '' });

    useEffect(() => {
        setAccommodations(trip.accommodations || []);
    }, [trip]);

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedList: Accommodation[];
        if (isEditing) {
            updatedList = accommodations.map(acc => acc.id === isEditing ? { ...current, id: isEditing } : acc);
        } else {
            updatedList = [...accommodations, { ...current, id: crypto.randomUUID() }];
        }
        saveTrip({ id: trip.id, accommodations: updatedList });
        setIsEditing(null);
        setCurrent({ name: '', address: '', checkIn: '', checkOut: '', confirmationNumber: '', notes: '' });
    };

    const handleEdit = (accommodation: Accommodation) => {
        setIsEditing(accommodation.id);
        setCurrent(accommodation);
    };

    const handleDelete = (id: string) => {
        const updatedList = accommodations.filter(acc => acc.id !== id);
        saveTrip({ id: trip.id, accommodations: updatedList });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setCurrent({ name: '', address: '', checkIn: '', checkOut: '', confirmationNumber: '', notes: '' });
    };

    const minCheckoutDate = current.checkIn ? new Date(new Date(current.checkIn).getTime() + 86400000).toISOString().split('T')[0] : '';


    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={BedIcon} color="blue" />
                <h2 className="text-2xl font-bold">Minhas Hospedagens</h2>
                <p className="text-gray-600">Adicione os locais onde você vai ficar.</p>
            </div>

            <div className="flex-shrink-0 p-4 bg-gray-50 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">{isEditing ? 'Editando Hospedagem' : 'Adicionar Nova Hospedagem'}</h3>
                <form onSubmit={handleAddOrUpdate} className="space-y-3">
                    <input type="text" value={current.name} onChange={e => setCurrent({ ...current, name: e.target.value })} placeholder="Nome do Hotel / Local" className="w-full p-2 border rounded-md" required />
                    <input type="text" value={current.address} onChange={e => setCurrent({ ...current, address: e.target.value })} placeholder="Endereço" className="w-full p-2 border rounded-md" />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={current.checkIn} onChange={e => setCurrent({ ...current, checkIn: e.target.value })} className="w-full p-2 border rounded-md" required />
                        <input type="date" value={current.checkOut} onChange={e => setCurrent({ ...current, checkOut: e.target.value })} min={minCheckoutDate} className="w-full p-2 border rounded-md" required />
                    </div>
                    <input type="text" value={current.confirmationNumber || ''} onChange={e => setCurrent({ ...current, confirmationNumber: e.target.value })} placeholder="Nº da Confirmação (opcional)" className="w-full p-2 border rounded-md" />
                    <textarea value={current.notes || ''} onChange={e => setCurrent({ ...current, notes: e.target.value })} placeholder="Notas (opcional)" rows={2} className="w-full p-2 border rounded-md" />
                    <div className="flex space-x-2">
                         <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700">
                            {isEditing ? 'Salvar Alterações' : 'Adicionar'}
                        </button>
                        {isEditing && <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-200 p-2 rounded-md font-semibold hover:bg-gray-300">Cancelar</button>}
                    </div>
                </form>
            </div>

            <div className="flex-grow overflow-y-auto -mx-6 px-6">
                <h3 className="font-semibold mb-2">Hospedagens Salvas</h3>
                <div className="space-y-3">
                    {accommodations.map(acc => (
                        <div key={acc.id} className="p-3 bg-white rounded-lg border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{acc.name}</p>
                                    <p className="text-sm text-gray-500">{acc.address}</p>
                                    <p className="text-sm text-gray-700 font-medium mt-1">
                                        {new Date(`${acc.checkIn}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a {new Date(`${acc.checkOut}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    <button onClick={() => handleEdit(acc)} className="p-2 text-gray-500 hover:text-blue-600">✏️</button>
                                    <button onClick={() => handleDelete(acc.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                     {accommodations.length === 0 && <EmptyState icon={BedIcon} title="Nenhuma Hospedagem" message="Adicione seu hotel para começar." />}
                </div>
            </div>
        </div>
    );
};

export default AccommodationModal;