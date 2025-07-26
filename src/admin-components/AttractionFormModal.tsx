import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import { Attraction, Complex, AttractionType } from '../types';

type AttractionFormState = Omit<Attraction, 'id' | 'createdAt'>;

interface AttractionFormModalProps {
    onClose: () => void;
    onSaveAndConnect: (attraction: AttractionFormState) => void;
    attractionToEdit: Attraction | null;
    complexes: Complex[];
    attractionTypes: AttractionType[];
    googleMapsApiKey: string;
}

const AttractionFormModal: FC<AttractionFormModalProps> = ({ onClose, onSaveAndConnect, attractionToEdit, complexes, attractionTypes, googleMapsApiKey }) => {
    const [formState, setFormState] = useState<AttractionFormState>({
        name: '', complexId: '', typeId: '', city: '', state: '', country: '', fullAddress: '', googlePlaceId: '', isActive: true,
    });
    
    const autocompleteInput = useRef<HTMLInputElement>(null);
    const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (attractionToEdit) {
            setFormState(attractionToEdit);
        } else if (complexes.length > 0 && attractionTypes.length > 0) {
            setFormState(prev => ({ ...prev, complexId: complexes[0].id, typeId: attractionTypes[0].id }));
        }
    }, [attractionToEdit, complexes, attractionTypes]);

    const handlePlaceSelect = useCallback(() => {
        const place = autocomplete.current?.getPlace();
        if (place && place.name && place.formatted_address) {
            setFormState(prev => ({
                ...prev,
                name: place.name || prev.name,
                fullAddress: place.formatted_address || prev.fullAddress,
                googlePlaceId: place.place_id || prev.googlePlaceId,
            }));
        }
    }, []);

    useEffect(() => {
        if (!googleMapsApiKey) return;
        const google = (window as any).google;
        if (google && google.maps) {
           if (autocompleteInput.current && !autocomplete.current) {
                const ac = new google.maps.places.Autocomplete(autocompleteInput.current, {
                    fields: ["name", "formatted_address", "place_id"],
                });
                autocomplete.current = ac;
                ac.addListener("place_changed", handlePlaceSelect);
            }
        } else {
            // Script loading handled in AttractionsManager
        }
    }, [handlePlaceSelect, googleMapsApiKey]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
             setFormState(prev => ({ ...prev, [name]: value }));
             if (name === 'complexId') {
                 const selectedComplex = complexes.find(c => c.id === value);
                 if (selectedComplex) {
                     setFormState(prev => ({...prev, city: selectedComplex.city, state: selectedComplex.state, country: selectedComplex.country}));
                 }
             }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveAndConnect(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{attractionToEdit ? 'Editar' : 'Adicionar'} Atração</h2>
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    <div>
                        <label className="block text-xs font-medium">Buscar no Google Maps</label>
                        <input ref={autocompleteInput} placeholder="Digite o nome do local para preencher automaticamente..." className="w-full p-2 border rounded" />
                    </div>
                     <input name="name" value={formState.name} onChange={handleChange} placeholder="Nome da Atração" className="w-full p-2 border rounded" required />
                    <div className="grid grid-cols-2 gap-4">
                        <select name="complexId" value={formState.complexId} onChange={handleChange} className="w-full p-2 border rounded">{complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <select name="typeId" value={formState.typeId} onChange={handleChange} className="w-full p-2 border rounded">{attractionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                    </div>
                    <input name="fullAddress" value={formState.fullAddress} onChange={handleChange} placeholder="Endereço Completo" className="w-full p-2 border rounded" />
                     <div className="grid grid-cols-3 gap-4">
                        <input name="city" value={formState.city} onChange={handleChange} placeholder="Cidade" className="w-full p-2 border rounded" required />
                        <input name="state" value={formState.state} onChange={handleChange} placeholder="Estado" className="w-full p-2 border rounded" required />
                        <input name="country" value={formState.country} onChange={handleChange} placeholder="País" className="w-full p-2 border rounded" required />
                    </div>
                     <label className="flex items-center"><input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleChange} className="mr-2" /> Ativo</label>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar e Conectar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttractionFormModal;