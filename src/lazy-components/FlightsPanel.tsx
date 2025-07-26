import React, { useState, useEffect, FC } from 'react';
import { Trip, Flight } from '../types';
import { ModalHeaderIcon, PlaneIcon, TrashIcon, EmptyState } from '../components';
import { useTripStore } from '../stores/tripStore';

interface FlightsPanelProps {
    trip: Trip;
}

const FlightsPanel: FC<FlightsPanelProps> = ({ trip }) => {
    const { saveTrip } = useTripStore.getState();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [current, setCurrent] = useState<Omit<Flight, 'id'>>({ airline: '', flightNumber: '', departureAirport: '', departureDateTime: '', arrivalAirport: '', arrivalDateTime: '' });

    useEffect(() => {
        setFlights(trip.flights || []);
    }, [trip]);

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedList: Flight[];
        if (isEditing) {
            updatedList = flights.map(f => f.id === isEditing ? { ...current, id: isEditing } : f);
        } else {
            updatedList = [...flights, { ...current, id: crypto.randomUUID() }];
        }
        saveTrip({ id: trip.id, flights: updatedList });
        setIsEditing(null);
        setCurrent({ airline: '', flightNumber: '', departureAirport: '', departureDateTime: '', arrivalAirport: '', arrivalDateTime: '', confirmationNumber: '', passengerNames: [] });
    };
    
    const handleEdit = (flight: Flight) => {
        setIsEditing(flight.id);
        setCurrent({
            ...flight,
            departureDateTime: flight.departureDateTime ? flight.departureDateTime.substring(0, 16) : '',
            arrivalDateTime: flight.arrivalDateTime ? flight.arrivalDateTime.substring(0, 16) : '',
        });
    };

    const handleDelete = (id: string) => {
        const updatedList = flights.filter(f => f.id !== id);
        saveTrip({ id: trip.id, flights: updatedList });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setCurrent({ airline: '', flightNumber: '', departureAirport: '', departureDateTime: '', arrivalAirport: '', arrivalDateTime: '', confirmationNumber: '', passengerNames: [] });
    };
    
    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={PlaneIcon} color="blue" />
                <h2 className="text-2xl font-bold">Meus Voos</h2>
                <p className="text-gray-600">Gerencie os voos da sua viagem.</p>
            </div>

            <div className="flex-shrink-0 p-4 bg-gray-50 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">{isEditing ? 'Editando Voo' : 'Adicionar Novo Voo'}</h3>
                <form onSubmit={handleAddOrUpdate} className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={current.airline} onChange={e => setCurrent({ ...current, airline: e.target.value })} placeholder="Cia Aérea" className="w-full p-2 border rounded-md" required />
                        <input type="text" value={current.flightNumber} onChange={e => setCurrent({ ...current, flightNumber: e.target.value })} placeholder="Nº do Voo" className="w-full p-2 border rounded-md" required />
                    </div>
                     <div>
                        <label className="text-xs font-medium">Partida</label>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={current.departureAirport} onChange={e => setCurrent({ ...current, departureAirport: e.target.value })} placeholder="Aeroporto (ex: GRU)" className="w-full p-2 border rounded-md" required />
                            <input type="datetime-local" value={current.departureDateTime} onChange={e => setCurrent({ ...current, departureDateTime: e.target.value })} className="w-full p-2 border rounded-md" required />
                        </div>
                    </div>
                     <div>
                        <label className="text-xs font-medium">Chegada</label>
                         <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={current.arrivalAirport} onChange={e => setCurrent({ ...current, arrivalAirport: e.target.value })} placeholder="Aeroporto (ex: MCO)" className="w-full p-2 border rounded-md" required />
                            <input type="datetime-local" value={current.arrivalDateTime} onChange={e => setCurrent({ ...current, arrivalDateTime: e.target.value })} className="w-full p-2 border rounded-md" required />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700">
                            {isEditing ? 'Salvar Alterações' : 'Adicionar Voo'}
                        </button>
                        {isEditing && <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-200 p-2 rounded-md font-semibold hover:bg-gray-300">Cancelar</button>}
                    </div>
                </form>
            </div>
            
            <div className="flex-grow overflow-y-auto -mx-6 px-6">
                <h3 className="font-semibold mb-2">Voos Salvos</h3>
                <div className="space-y-3">
                    {flights.map(flight => (
                         <div key={flight.id} className="p-3 bg-white rounded-lg border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{flight.airline} {flight.flightNumber}</p>
                                    <p className="text-sm font-semibold text-gray-700">{flight.departureAirport} → {flight.arrivalAirport}</p>
                                    <p className="text-xs text-gray-500">
                                        Partida: {new Date(flight.departureDateTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    <button onClick={() => handleEdit(flight)} className="p-2 text-gray-500 hover:text-blue-600">✏️</button>
                                    <button onClick={() => handleDelete(flight.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {flights.length === 0 && <EmptyState icon={PlaneIcon} title="Nenhum Voo Adicionado" message="Adicione os voos da sua viagem." />}
                </div>
            </div>

        </div>
    );
};

export default FlightsPanel;
