
import React, { useState, useEffect, useMemo, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { Attraction, Complex, AttractionType } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon, LinkIcon, SparklesIcon, ChevronDownIcon, ChevronRightIcon } from '../components';
import AttractionFormModal from './AttractionFormModal';

interface AttractionsManagerProps {
    googleMapsApiKey: string;
    onSelectAttraction: (attraction: Attraction) => void;
    openModal: (type: 'subAttractionLinker', context: { attraction: Attraction }) => void;
}

const AttractionsManager: FC<AttractionsManagerProps> = ({ googleMapsApiKey, onSelectAttraction, openModal }) => {
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [complexes, setComplexes] = useState<Complex[]>([]);
    const [attractionTypes, setAttractionTypes] = useState<AttractionType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [attractionToEdit, setAttractionToEdit] = useState<Attraction | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    
    const complexMap = useMemo(() => new Map(complexes.map(c => [c.id, c.name])), [complexes]);
    const typeMap = useMemo(() => new Map(attractionTypes.map(t => [t.id, t.name])), [attractionTypes]);
    const attractionsByParent = useMemo(() => {
        const map: Record<string, Attraction[]> = { 'root': [] };
        attractions.forEach(attr => {
            const parentId = attr.parentId || 'root';
            if (!map[parentId]) map[parentId] = [];
            map[parentId].push(attr);
        });
        return map;
    }, [attractions]);

    useEffect(() => {
        const unsubComplexes = onSnapshot(query(collection(db, 'complexes'), orderBy('name')), snap => setComplexes(snap.docs.map(d => ({id: d.id, ...d.data()} as Complex))));
        const unsubTypes = onSnapshot(query(collection(db, 'attractionTypes'), orderBy('name')), snap => setAttractionTypes(snap.docs.map(d => ({id: d.id, ...d.data()} as AttractionType))));
        const unsubAttractions = onSnapshot(query(collection(db, 'attractions'), orderBy('name')), snap => {
            setAttractions(snap.docs.map(d => ({id: d.id, ...d.data()} as Attraction)));
            setIsLoading(false);
        });
        return () => { unsubComplexes(); unsubTypes(); unsubAttractions(); };
    }, []);

    const handleSaveAndConnect = async (attractionData: Omit<Attraction, 'id' | 'createdAt'>) => {
        try {
            let savedAttraction: Attraction;
            if (attractionToEdit) {
                const attractionRef = doc(db, 'attractions', attractionToEdit.id);
                await updateDoc(attractionRef, attractionData as { [key: string]: any });
                savedAttraction = { ...attractionToEdit, ...attractionData };
            } else {
                const docRef = await addDoc(collection(db, 'attractions'), { ...attractionData, createdAt: new Date().toISOString() });
                savedAttraction = { id: docRef.id, createdAt: new Date().toISOString(), ...attractionData };
            }
            setIsModalOpen(false);
            setAttractionToEdit(null);
            onSelectAttraction(savedAttraction); // Open detail panel to manage connections
        } catch (error) { console.error("Error saving attraction:", error); }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar esta atração e todas as sub-atrações?")) {
            const childAttractionsQuery = query(collection(db, 'attractions'), where("parentId", "==", id));
            const childDocs = await getDocs(childAttractionsQuery);
            childDocs.forEach(async (doc) => {
                 await deleteDoc(doc.ref);
            });
            await deleteDoc(doc(db, 'attractions', id));
        }
    };
    
    const handlePopulateSubAttractions = async (parkId: string) => {
        if(!window.confirm("Isso buscará todas as atrações internas, traduzirá e salvará. Pode gerar custos de API. Continuar?")) return;
        try {
            const populateFunction = httpsCallable(functions, 'populateSubAttractions');
            await populateFunction({ parkId });
            alert("Sub-atrações populadas com sucesso!");
        } catch (error) {
            console.error("Error populating sub-attractions:", error);
            alert("Falha ao popular sub-atrações.");
        }
    };
    
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const DataHealthDashboard = () => {
        const total = attractions.length;
        if (total === 0) return null;
        const withGoogle = attractions.filter(a => a.googlePlaceId).length;
        const withTripAdvisor = attractions.filter(a => a.tripAdvisorLocationId).length;
        const googlePercent = Math.round((withGoogle / total) * 100);
        const taPercent = Math.round((withTripAdvisor / total) * 100);

        return (
            <div className="mb-4 p-4 bg-white rounded-lg border shadow-sm grid grid-cols-3 gap-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-500">Total de Atrações</h4>
                    <p className="text-2xl font-bold">{total}</p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-500">Conexões Google Maps</h4>
                    <div className="flex items-center">
                        <p className="text-2xl font-bold mr-2">{googlePercent}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{width: `${googlePercent}%`}}></div></div>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-500">Conexões TripAdvisor</h4>
                     <div className="flex items-center">
                        <p className="text-2xl font-bold mr-2">{taPercent}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-purple-500 h-2.5 rounded-full" style={{width: `${taPercent}%`}}></div></div>
                    </div>
                </div>
            </div>
        )
    }
    
    const renderAttractionRow = (attr: Attraction, level = 0) => {
        const children = attractionsByParent[attr.id] || [];
        const isExpanded = expandedIds.has(attr.id);
        const typeName = typeMap.get(attr.typeId)?.toLowerCase() || '';
        const isPark = typeName.includes('parque');

        return (
            <React.Fragment key={attr.id}>
                <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onSelectAttraction(attr)}>
                    <td className="p-2" style={{ paddingLeft: `${10 + level * 20}px` }}>
                        <div className="flex items-center">
                            {children.length > 0 && (
                                <button onClick={(e) => { e.stopPropagation(); toggleExpand(attr.id); }} className="mr-1 p-1 hover:bg-gray-200 rounded-full">
                                    {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                </button>
                            )}
                            {attr.name}
                        </div>
                    </td>
                    <td className="p-2">{complexMap.get(attr.complexId)}</td>
                    <td className="p-2">{typeMap.get(attr.typeId)}</td>
                    <td className="p-2 flex space-x-2">
                        <span title="Google Maps"><LinkIcon className={`w-4 h-4 ${attr.googlePlaceId ? 'text-green-500' : 'text-gray-300'}`} /></span>
                        <span title="TripAdvisor"><LinkIcon className={`w-4 h-4 ${attr.tripAdvisorLocationId ? 'text-purple-500' : 'text-gray-300'}`} /></span>
                        <span title="API de Fila"><LinkIcon className={`w-4 h-4 ${attr.queueTimesId || attr.queueTimesParkId ? 'text-blue-500' : 'text-gray-300'}`} /></span>
                    </td>
                    <td className="p-2">
                        <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                            {isPark && <button onClick={() => handlePopulateSubAttractions(attr.id)} className="text-purple-600 p-1 rounded-md hover:bg-purple-100" title="Popular Sub-Atrações"><SparklesIcon className="w-4 h-4"/></button>}
                            {isPark && attr.queueTimesParkId && <button onClick={() => openModal('subAttractionLinker', { attraction: attr })} className="text-blue-600 p-1 rounded-md hover:bg-blue-100" title="Vincular Filas das Sub-Atrações"><LinkIcon className="w-4 h-4"/></button>}
                            <button onClick={() => { setAttractionToEdit(attr); setIsModalOpen(true); }} className="text-blue-600 p-1 rounded-md hover:bg-blue-100"><EditIcon /></button>
                            <button onClick={() => handleDelete(attr.id)} className="text-red-600 p-1 rounded-md hover:bg-red-100"><TrashIcon /></button>
                        </div>
                    </td>
                </tr>
                {isExpanded && children.map(child => renderAttractionRow(child, level + 1))}
            </React.Fragment>
        );
    }
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Hub de Inteligência de Destinos</h1>
                <button onClick={() => { setAttractionToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><PlusIcon /> <span className="ml-2">Nova Atração</span></button>
            </div>
            {isModalOpen && <AttractionFormModal onClose={() => setIsModalOpen(false)} onSaveAndConnect={handleSaveAndConnect} attractionToEdit={attractionToEdit} complexes={complexes} attractionTypes={attractionTypes} googleMapsApiKey={googleMapsApiKey} />}
            
            <DataHealthDashboard />

             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-2 text-left font-semibold">Nome</th><th className="p-2 text-left font-semibold">Complexo</th><th className="p-2 text-left font-semibold">Tipo</th><th className="p-2 text-left font-semibold">Conexões</th><th className="p-2 text-left font-semibold">Ações</th></tr></thead>
                    <tbody>
                        {(attractionsByParent['root'] || []).map(attr => renderAttractionRow(attr))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttractionsManager;
