
import { useState, useEffect, FC } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Attraction } from '../types';
import { SpinnerIcon, LinkIcon } from '../components';

interface ConnectionManagerProps {
    attraction: Attraction;
    onClose: () => void;
}

interface MatchResult {
    google?: { place_id: string; name: string; };
    tripadvisor?: { location_id: string; name: string; };
}

const ConnectionManager: FC<ConnectionManagerProps> = ({ attraction, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [matches, setMatches] = useState<MatchResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const findMatches = async () => {
            try {
                const findExternalMatches = httpsCallable(functions, 'findExternalMatches');
                const result = await findExternalMatches({ name: attraction.name, address: attraction.fullAddress });
                setMatches(result.data as MatchResult);
            } catch (err) {
                console.error("Error finding external matches:", err);
                setError('Falha ao buscar conexões. Tente vincular manualmente.');
            } finally {
                setIsLoading(false);
            }
        };
        findMatches();
    }, [attraction]);

    const handleLink = async (source: 'google' | 'tripadvisor', id: string) => {
        const fieldToUpdate = source === 'google' ? 'googlePlaceId' : 'tripAdvisorLocationId';
        try {
            const attractionRef = doc(db, 'attractions', attraction.id);
            await updateDoc(attractionRef, { [fieldToUpdate]: id });
            onClose(); // Close after linking
        } catch (err) {
            console.error(`Error linking ${source}:`, err);
            setError(`Falha ao vincular ${source}.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Conectar a Serviços Externos</h2>
                <p className="text-sm text-gray-600 mb-4">Verifique as correspondências encontradas para "{attraction.name}" e vincule os registros.</p>
                {isLoading && <div className="flex justify-center p-8"><SpinnerIcon /></div>}
                {error && <div className="text-red-500 p-2 bg-red-50 rounded-md">{error}</div>}
                {!isLoading && !error && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Google Maps</h3>
                            {matches?.google ? (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <span>{matches.google.name}</span>
                                    <button onClick={() => handleLink('google', matches!.google!.place_id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md flex items-center"><LinkIcon className="w-3 h-3 mr-1"/>Vincular</button>
                                </div>
                            ) : <p className="text-xs text-gray-500">Nenhuma correspondência encontrada.</p>}
                        </div>
                        <div>
                            <h3 className="font-semibold">TripAdvisor</h3>
                            {matches?.tripadvisor ? (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <span>{matches.tripadvisor.name}</span>
                                    <button onClick={() => handleLink('tripadvisor', matches!.tripadvisor!.location_id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md flex items-center"><LinkIcon className="w-3 h-3 mr-1"/>Vincular</button>
                                </div>
                            ) : <p className="text-xs text-gray-500">Nenhuma correspondência encontrada.</p>}
                        </div>
                    </div>
                )}
                 <button type="button" onClick={onClose} className="mt-6 w-full px-4 py-2 bg-gray-200 rounded-md">Fechar</button>
            </div>
        </div>
    );
};

export default ConnectionManager;
