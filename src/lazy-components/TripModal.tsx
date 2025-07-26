
import React, { useState, useEffect, FC } from 'react';
import { Trip, Traveler, User, TravelStyle, BudgetLevel } from '../types';
import { Modal, UsersIcon } from '../components';

const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null; // Invalid date
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : null;
};

const TRAVEL_STYLES: TravelStyle[] = ['Relaxar na Praia', 'Aventura e Esportes', 'Foco em Gastronomia', 'Compras', 'Viagem em Família com Crianças Pequenas', 'Cultural e Museus', 'Econômica'];
const BUDGET_LEVELS: BudgetLevel[] = ['Econômico', 'Confortável', 'Luxo'];


const TripModal: FC<{ onClose: () => void; onSaveTrip: (tripData: Partial<Trip>) => void; tripToEdit: Trip | null; user: User | null; }> = ({ onClose, onSaveTrip, tripToEdit, user }) => {
    const [destination, setDestination] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [travelers, setTravelers] = useState<Traveler[]>([]);
    const [numAdults, setNumAdults] = useState(1);
    const [numChildren, setNumChildren] = useState(0);
    const [travelStyle, setTravelStyle] = useState<TravelStyle[]>([]);
    const [budgetLevel, setBudgetLevel] = useState<BudgetLevel | undefined>(undefined);

    const isEditMode = !!tripToEdit;

    useEffect(() => {
        if (isEditMode && tripToEdit) {
            setDestination(tripToEdit.destination);
            setStartDate(tripToEdit.startDate.split('T')[0]);
            setEndDate(tripToEdit.endDate.split('T')[0]);
            setImageUrl(tripToEdit.imageUrl);
            setTravelers(tripToEdit.travelers || []);
            setTravelStyle(tripToEdit.travelStyle || []);
            setBudgetLevel(tripToEdit.budgetLevel);
            if (tripToEdit.travelers) {
                const adults = tripToEdit.travelers.filter(t => (calculateAge(t.dob) || 0) >= 18).length;
                const children = tripToEdit.travelers.length - adults;
                setNumAdults(adults || 1);
                setNumChildren(children || 0);
            } else {
                setNumAdults(1);
                setNumChildren(0);
            }
        } else {
            // Reset for new trip
            setDestination(''); setStartDate(''); setEndDate(''); setImageUrl('');
            setNumAdults(1); setNumChildren(0); setTravelers([]);
            setTravelStyle([]); setBudgetLevel(undefined);
        }
    }, [tripToEdit, isEditMode]);
    
    useEffect(() => {
        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            setEndDate('');
        }
    }, [startDate, endDate]);
    
    useEffect(() => {
        if (!isEditMode) {
             const totalTravelers = numAdults + numChildren;
            setTravelers(currentTravelers => {
                const newTravelers = [...currentTravelers];
                while (newTravelers.length < totalTravelers) {
                    newTravelers.push({ id: crypto.randomUUID(), firstName: '', lastName: '', dob: '', gender: '' });
                }
                return newTravelers.slice(0, totalTravelers);
            });
        }
    }, [numAdults, numChildren, isEditMode]);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setImageUrl(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTravelerChange = (index: number, field: keyof Omit<Traveler, 'id'>, value: string) => {
        setTravelers(current => {
            const newTravelers = [...current];
            newTravelers[index] = { ...newTravelers[index], [field]: value };
            return newTravelers;
        });
    };

    const handleToggleTravelStyle = (style: TravelStyle) => {
        setTravelStyle(prev =>
            prev.includes(style)
                ? prev.filter(s => s !== style)
                : [...prev, style]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!destination || !startDate || !endDate) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        const tripData: Partial<Trip> = {
            id: isEditMode ? tripToEdit?.id : undefined,
            destination,
            startDate: `${startDate}T08:00:00`,
            endDate: `${endDate}T23:59:59`,
            imageUrl: imageUrl,
            travelers: user ? travelers.filter(t => t.firstName) : undefined,
            travelStyle: user ? travelStyle : undefined,
            budgetLevel: user ? budgetLevel : undefined,
        };
        onSaveTrip(tripData);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minEndDate = startDate ? new Date(new Date(startDate).getTime() + 86400000).toISOString().split('T')[0] : '';

    return (
        <Modal onClose={onClose} size="2xl">
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Editar Viagem' : 'Adicionar Nova Viagem'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                    <input type="text" placeholder="Destino (ex: Orlando, Flórida)" value={destination} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Data de Início</label>
                            <input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} min={today.toISOString().split('T')[0]} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 border border-transparent focus:border-blue-500 transition-all" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Data de Fim</label>
                            <input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} min={minEndDate} disabled={!startDate} className="w-full p-3.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 disabled:opacity-50 border border-transparent focus:border-blue-500 transition-all" required />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Imagem de Fundo (Opcional)</label>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-gray-200 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 mt-1.5 transition-colors" />
                        {imageUrl && !imageUrl.startsWith('data:image') && <span className="text-xs text-gray-400 mt-1">URL da imagem atual. Escolha um novo arquivo para substituir.</span>}
                    </div>

                    {user && isEditMode && (
                        <>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-800 mb-2">Estilo da Viagem</h3>
                                <div className="flex flex-wrap gap-2">
                                    {TRAVEL_STYLES.map(style => (
                                        <button type="button" key={style} onClick={() => handleToggleTravelStyle(style)} className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${travelStyle.includes(style) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-400'}`}>
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-800 mb-2">Orçamento</h3>
                                <div className="flex flex-wrap gap-2">
                                     {BUDGET_LEVELS.map(level => (
                                        <button type="button" key={level} onClick={() => setBudgetLevel(level)} className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${budgetLevel === level ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-400'}`}>
                                            {level}
                                        </button>
                                     ))}
                                </div>
                            </div>
                        </>
                    )}

                    {user && !isEditMode && (
                         <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-800 flex items-center mb-3"><UsersIcon className="w-5 h-5 mr-2" /> Detalhes dos Viajantes</h3>
                            <p className="text-xs text-gray-500 mb-3">Esta informação é opcional, mas ajuda nossos agentes mágicos a criar um roteiro e sugestões mais personalizadas para o seu grupo.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm">Adultos (18+)</label>
                                    <input type="number" value={numAdults} onChange={e => setNumAdults(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="w-full p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="text-sm">Crianças (0-17)</label>
                                    <input type="number" value={numChildren} onChange={e => setNumChildren(Math.max(0, parseInt(e.target.value) || 0))} min="0" className="w-full p-2 border rounded-md" />
                                </div>
                            </div>
                            {travelers.map((traveler, index) => (
                                <div key={traveler.id} className="mt-4 p-3 border-t">
                                    <p className="font-semibold text-sm mb-2">Viajante {index + 1}</p>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-600">Nome</label>
                                            <input type="text" placeholder="Nome" value={traveler.firstName} onChange={e => handleTravelerChange(index, 'firstName', e.target.value)} className="w-full p-2 border rounded-md" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-600">Sobrenome</label>
                                            <input type="text" placeholder="Sobrenome" value={traveler.lastName} onChange={e => handleTravelerChange(index, 'lastName', e.target.value)} className="w-full p-2 border rounded-md" />
                                        </div>
                                        <div className="relative">
                                            <label className="text-xs font-medium text-gray-600">Data de Nascimento</label>
                                            <div className="relative flex items-center mt-1">
                                                <input 
                                                    type="date" 
                                                    value={traveler.dob} 
                                                    onChange={e => handleTravelerChange(index, 'dob', e.target.value)} 
                                                    className="w-full p-2 border rounded-md pr-16"
                                                />
                                                {calculateAge(traveler.dob) !== null && (
                                                    <span className="absolute right-2 text-xs text-gray-500 pointer-events-none">
                                                        {calculateAge(traveler.dob)} anos
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-600">Gênero</label>
                                            <select value={traveler.gender} onChange={e => handleTravelerChange(index, 'gender', e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                                <option value="">Selecione</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Feminino">Feminino</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button type="submit" className="w-full mt-8 py-3 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-all transform hover:scale-105">{isEditMode ? 'Salvar Alterações' : 'Criar Viagem'}</button>
            </form>
        </Modal>
    );
};

export default TripModal;
