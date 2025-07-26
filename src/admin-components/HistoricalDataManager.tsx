import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { SpinnerIcon } from '../components';

const HistoricalDataManager: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string>('');
    const [mode, setMode] = useState<'full' | 'update'>('update');

    const handleImport = async () => {
        setIsLoading(true);
        setLog(`Iniciando importação no modo '${mode}'... Isso pode levar vários minutos. Não feche esta janela.\n\n`);
        
        try {
            const importFunction = httpsCallable(functions, 'importHistoricalWaitTimes');
            const result = await importFunction({ mode });
            const data = result.data as { log: string, success: boolean };
            setLog(prev => prev + data.log);
        } catch (error: any) {
            console.error("Error calling import function:", error);
            const errorDetails = error.details as { log?: string };
            setLog(prev => prev + (errorDetails?.log || `Ocorreu um erro desconhecido durante a importação: ${error.message}`));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Gerenciador de Dados Históricos de Filas</h1>
            <p className="text-gray-600 mb-6">Esta ferramenta importa dados históricos de filas e status de atrações da API da Queue-Times para nossa base de dados. Isso alimenta nosso Crowd Calendar com previsões estatísticas precisas.</p>
            
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-6">
                <h4 className="font-bold text-yellow-800">Atenção</h4>
                <p className="text-sm text-yellow-700">A importação completa pode ser um processo muito longo e consumir recursos significativos. Use-a apenas na primeira vez. Para atualizações diárias, use o modo "Atualizar".</p>
            </div>

            <div className="flex items-center space-x-4 mb-4">
                 <select value={mode} onChange={(e) => setMode(e.target.value as 'full' | 'update')} className="p-2 border rounded-md">
                    <option value="update">Atualizar (Apenas dados novos)</option>
                    <option value="full">Completa (Últimos 3 anos)</option>
                </select>
                <button 
                    onClick={handleImport} 
                    disabled={isLoading}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                    {isLoading && <SpinnerIcon className="mr-2" />}
                    {isLoading ? 'Importando...' : 'Iniciar Importação'}
                </button>
            </div>

            {log && (
                <div className="mt-6">
                    <h3 className="font-semibold mb-2">Log de Importação:</h3>
                    <div className="p-4 bg-gray-900 text-white rounded-md font-mono text-xs max-h-80 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{log}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalDataManager;