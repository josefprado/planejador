
import { useState, FC } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { Attraction } from '../types';
import { XIcon, SpinnerIcon } from '../components';

interface AttractionDetailPanelProps {
    attraction: Attraction;
    onClose: () => void;
}

const AttractionDetailPanel: FC<AttractionDetailPanelProps> = ({ attraction, onClose }) => {
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [isAnalyzingPerformance, setIsAnalyzingPerformance] = useState(false);
    const [isAnalyzingSynergies, setIsAnalyzingSynergies] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    const handleGenerateGuide = async () => {
        if (!window.confirm("Isso irá usar nosso assistente para gerar um guia completo para este parque. Pode gerar custos. Continuar?")) return;
        setIsGeneratingGuide(true);
        try {
            const generateMagicGuide = httpsCallable(functions, 'generateMagicGuide');
            await generateMagicGuide({ attractionId: attraction.id });
            alert("Guia gerado com sucesso! A atração será atualizada.");
            onClose(); // Refresh needed
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao gerar o guia.");
        } finally {
            setIsGeneratingGuide(false);
        }
    };
    
    const handleAnalyzePerformance = async () => {
        setIsAnalyzingPerformance(true);
        try {
            const analyzeAttractionPerformance = httpsCallable(functions, 'analyzeAttractionPerformance');
            await analyzeAttractionPerformance({ attractionId: attraction.id, targetDate: selectedDate });
            alert("Análise de performance concluída! A atração será atualizada. Por favor, feche e reabra este painel para ver as mudanças.");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao analisar a performance.");
        } finally {
            setIsAnalyzingPerformance(false);
        }
    };
    
    const handleAnalyzeSynergies = async () => {
        setIsAnalyzingSynergies(true);
        try {
            const analyzeSynergies = httpsCallable(functions, 'analyzeSynergies');
            await analyzeSynergies({ attractionId: attraction.id });
            alert("Análise de sinergias concluída! A atração será atualizada.");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao analisar sinergias.");
        } finally {
            setIsAnalyzingSynergies(false);
        }
    };

    const currentPrediction = attraction.performancePredictions?.[selectedDate];

    return (
        <div className="p-4 h-full flex flex-col text-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{attraction.name}</h2>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><XIcon /></button>
            </div>
            
            <div className="space-y-2 text-sm overflow-y-auto pr-2">
                <div className="mt-4 border-t border-gray-700 pt-2">
                    {attraction.when_to_go && <p><strong>💡 Quando Ir:</strong> {attraction.when_to_go}</p>}
                    {attraction.height_restriction_cm && <p><strong>📏 Altura Mínima:</strong> {attraction.height_restriction_cm} cm</p>}
                    {attraction.tags && <p><strong>🏷️ Tags:</strong> {attraction.tags.join(', ')}</p>}
                    {attraction.showtimes && <p><strong>⏰ Horários:</strong> {attraction.showtimes.join(', ')}</p>}
                </div>

                <div className="mt-6 border-t border-gray-700 pt-4">
                     <h3 className="font-bold mb-2 flex items-center">Análises de IA</h3>
                     
                     <div className="p-3 bg-gray-800 rounded-lg space-y-2">
                        <label className="text-xs font-semibold">Previsão de Performance para:</label>
                        <div className="flex items-center space-x-2">
                           <input 
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-xs text-white"
                            />
                            <button onClick={handleAnalyzePerformance} disabled={isAnalyzingPerformance} className="flex-shrink-0 text-xs bg-blue-600 hover:bg-blue-700 p-2 rounded-md flex justify-center items-center font-semibold">
                                {isAnalyzingPerformance ? <SpinnerIcon className="w-4 h-4" /> : "Analisar"}
                            </button>
                        </div>
                        {currentPrediction && (
                            <div className="mt-2 pt-2 border-t border-gray-700 text-xs space-y-1 animate-fade-in">
                                <p><strong className="text-blue-300">Análise:</strong> {currentPrediction.analysis}</p>
                                <p><strong className="text-blue-300">Melhores Horários:</strong> {currentPrediction.bestHours}</p>
                                <p><strong className="text-blue-300">Dica do Gênio:</strong> {currentPrediction.geniusTip}</p>
                            </div>
                        )}
                     </div>

                     <div className="space-y-2 mt-2">
                         <button onClick={handleAnalyzeSynergies} disabled={isAnalyzingSynergies} className="w-full text-sm bg-gray-700 hover:bg-gray-600 p-2 rounded-md flex justify-center items-center font-semibold">
                           {isAnalyzingSynergies ? <SpinnerIcon /> : "Analisar Sinergias"}
                        </button>
                    </div>
                    {attraction.synergies && <div className="mt-2 p-2 bg-gray-800 rounded-md text-xs"><h4 className="font-bold">Sinergias Populares:</h4><ul className="list-disc list-inside">{attraction.synergies.map((s,i) => <li key={i}>{s}</li>)}</ul></div>}
                </div>
                 
                 {attraction.typeId && attractionTypes.some(t => t.id === attraction.typeId && t.name.toLowerCase().includes('parque')) && (
                    <div className="mt-6 border-t border-gray-700 pt-4">
                        <h3 className="font-bold mb-2">Conteúdo Premium</h3>
                        <button onClick={handleGenerateGuide} disabled={isGeneratingGuide} className="w-full text-sm bg-purple-600/50 text-purple-300 hover:bg-purple-600/70 p-2 rounded-md flex justify-center items-center font-semibold">
                           {isGeneratingGuide ? <SpinnerIcon /> : "Gerar Guia Mágico"}
                        </button>
                         {attraction.guideContent && <p className="text-xs text-green-400 mt-2">✅ Guia já foi gerado para este parque.</p>}
                    </div>
                 )}

            </div>
        </div>
    );
};

// Assume attractionTypes is passed as a prop or available in a context
const attractionTypes: { id: string, name: string }[] = []; 

export default AttractionDetailPanel;