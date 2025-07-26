import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { SpinnerIcon } from '../components';

const ParkContentManager: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string>('');

    const handleImport = async () => {
        setIsLoading(true);
        setLog('Iniciando importação...\n');
        
        try {
            const importFunction = httpsCallable(functions, 'importAndTranslateParkData');
            const result = await importFunction();
            const data = result.data as { log: string };
            setLog(prev => prev + data.log);
        } catch (error: any) {
            console.error("Error calling import function:", error);
            const errorDetails = error.details as { log?: string };
            setLog(prev => prev + (errorDetails?.log || "Ocorreu um erro desconhecido durante a importação."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Gerenciador de Conteúdo dos Parques</h1>
            <p className="text-gray-600 mb-6">Esta ferramenta importa dados estáticos de atrações (como descrições, restrições) de fontes externas, traduz e salva em nosso banco de dados. Isso nos permite usar essas informações no app sem custo de API em tempo real.</p>
            
            <button 
                onClick={handleImport} 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
                {isLoading && <SpinnerIcon className="mr-2" />}
                {isLoading ? 'Importando...' : 'Importar e Traduzir Dados Agora'}
            </button>

            {log && (
                <div className="mt-6 p-4 bg-gray-900 text-white rounded-md font-mono text-sm max-h-64 overflow-y-auto">
                    <pre>{log}</pre>
                </div>
            )}
        </div>
    );
};

export default ParkContentManager;