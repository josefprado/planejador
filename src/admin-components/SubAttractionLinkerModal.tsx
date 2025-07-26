
import { useState, useEffect, FC } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { functions, db } from '../../firebase';
import { Attraction } from '../types';
import { Modal, SpinnerIcon } from '../components';

interface SubAttractionLinkerModalProps {
    park: Attraction;
    onClose: () => void;
}

interface LinkSuggestion {
    ourAttraction: { id: string; name: string; };
    queueTimesAttraction: { id: number; name: string; };
}

const SubAttractionLinkerModal: FC<SubAttractionLinkerModalProps> = ({ park, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const linkSubAttractions = httpsCallable(functions, 'linkSubAttractions');
                const result = await linkSubAttractions({ ourParkId: park.id });
                setSuggestions(result.data as LinkSuggestion[]);
            } catch (err) {
                console.error("Error fetching link suggestions:", err);
                setError('Falha ao buscar sugestões de vínculo.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuggestions();
    }, [park.id]);

    const handleLink = async (ourAttractionId: string, queueTimesId: number) => {
        try {
            const attractionRef = doc(db, 'attractions', ourAttractionId);
            await updateDoc(attractionRef, { queueTimesId });
            // Remove linked suggestion from the list to give user feedback
            setSuggestions(prev => prev.filter(s => s.ourAttraction.id !== ourAttractionId));
        } catch (err) {
            console.error("Error linking attraction:", err);
            setError('Falha ao salvar o vínculo.');
        }
    };

    return (
        <Modal onClose={onClose} size="3xl">
            <h2 className="text-xl font-bold mb-4">Vincular Sub-Atrações de "{park.name}"</h2>
            <p className="text-sm text-gray-600 mb-4">
                Nosso assistente analisou as atrações e sugere os vínculos abaixo. Confirme para conectar os dados de fila.
            </p>
            {isLoading && <div className="flex justify-center p-8"><SpinnerIcon /></div>}
            {error && <div className="text-red-500 p-2 bg-red-50 rounded-md">{error}</div>}
            {!isLoading && !error && (
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left font-semibold">Nossa Atração (TouringPlans)</th>
                                <th className="p-2 text-left font-semibold">Correspondência (Queue-Times API)</th>
                                <th className="p-2 text-left font-semibold">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suggestions.map(suggestion => (
                                <tr key={suggestion.ourAttraction.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{suggestion.ourAttraction.name}</td>
                                    <td className="p-2">{suggestion.queueTimesAttraction.name}</td>
                                    <td className="p-2">
                                        <button 
                                            onClick={() => handleLink(suggestion.ourAttraction.id, suggestion.queueTimesAttraction.id)}
                                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700"
                                        >
                                            Confirmar Vínculo
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {suggestions.length === 0 && <p className="text-center p-4 text-gray-500">Nenhuma nova sugestão de vínculo encontrada.</p>}
                </div>
            )}
            <button type="button" onClick={onClose} className="mt-6 w-full px-4 py-2 bg-gray-200 rounded-md">Fechar</button>
        </Modal>
    );
};

export default SubAttractionLinkerModal;
