
import { useState, useEffect, FC } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, Attraction } from '../types';
import { ModalHeaderIcon, SparklesIcon, SpinnerIcon } from '../components';

interface MagicGuidePanelProps {
    parkId: string;
    trip: Trip; // Keep trip for context if needed later, but parkId is primary
}

const MagicGuidePanel: FC<MagicGuidePanelProps> = ({ parkId }) => {
    const [park, setPark] = useState<Attraction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!parkId) {
            setIsLoading(false);
            return;
        }
        const parkRef = doc(db, 'attractions', parkId);
        const unsubscribe = onSnapshot(parkRef, (docSnap) => {
            if (docSnap.exists()) {
                setPark({ id: docSnap.id, ...docSnap.data() } as Attraction);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [parkId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><SpinnerIcon /></div>;
    }

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={SparklesIcon} color="purple" />
                <h2 className="text-2xl font-bold">{park ? park.name : "Guia Mágico"}</h2>
                <p className="text-gray-600">Dicas e segredos dos nossos especialistas para o seu dia!</p>
            </div>

            <div className="flex-grow overflow-y-auto -mx-6 px-6 prose lg:prose-lg">
                {park && park.guideContent ? (
                    <div dangerouslySetInnerHTML={{ __html: park.guideContent.replace(/\n/g, '<br />') }} />
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        <p className="font-semibold">Guia em Preparação!</p>
                        <p className="text-sm">O guia para este parque ainda não foi gerado. Peça ao seu agente para criá-lo!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MagicGuidePanel;
