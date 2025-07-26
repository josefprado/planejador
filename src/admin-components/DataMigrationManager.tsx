

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { SpinnerIcon } from '../components';

const TRIP_TASKS = [
    { id: 'geocode', label: 'Geocodificar Destinos', description: 'Busca e salva as coordenadas de latitude/longitude para viagens que não as possuem.' },
    { id: 'setThemeParkFlag', label: 'Definir Flag de Viagem de Parques', description: 'Analisa o destino e marca as viagens como sendo de "parques temáticos" ou não.' },
    { id: 'initializeStructures', label: 'Inicializar Estruturas de Dados de Viagem', description: 'Garante que viagens antigas tenham os campos mais recentes (ex: parkWishlists, flights) para evitar erros.' },
];

const USER_TASKS = [
    { id: 'initializeUserStructures', label: 'Inicializar Estruturas de Dados de Usuário', description: 'Garante que usuários antigos tenham os campos mais recentes (ex: intentLog, aiUsage) para novas funcionalidades.' },
];

const DataMaintenanceManager: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string>('');
    const [selectedTripTasks, setSelectedTripTasks] = useState(new Set<string>());
    const [selectedUserTasks, setSelectedUserTasks] = useState(new Set<string>());

    const handleTaskToggle = (taskId: string, type: 'trip' | 'user') => {
        const updater = type === 'trip' ? setSelectedTripTasks : setSelectedUserTasks;
        updater(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handleRunTasks = async (type: 'trip' | 'user') => {
        const tasks = type === 'trip' ? selectedTripTasks : selectedUserTasks;
        const functionName = type === 'trip' ? 'upgradeExistingTrips' : 'upgradeExistingUsers';
        const entityName = type === 'trip' ? 'viagens' : 'usuários';

        if (tasks.size === 0) {
            alert(`Por favor, selecione pelo menos uma tarefa de ${entityName} para executar.`);
            return;
        }
        if (!window.confirm(`Esta ação irá executar as ${tasks.size} tarefas selecionadas em todos os ${entityName}. Deseja continuar?`)) return;
        
        setIsLoading(true);
        setLog(`Iniciando processo de manutenção para ${entityName}...\n`);
        
        try {
            const maintenanceFunction = httpsCallable(functions, functionName);
            const result = await maintenanceFunction({ tasks: Array.from(tasks) });
            const data = result.data as { log: string; success: boolean };
            setLog(prev => prev + data.log);
        } catch (error: any) {
            console.error(`Error calling ${functionName} function:`, error);
            const errorDetails = error.details as { log?: string };
            setLog(prev => prev + (errorDetails?.log || `Ocorreu um erro desconhecido durante a manutenção: ${error.message}`));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Manutenção de Dados</h1>
            <p className="text-gray-600 mb-6">Use esta ferramenta para executar tarefas de manutenção em lote. Selecione as tarefas desejadas e inicie o processo.</p>
            
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-6">
                <h4 className="font-bold text-yellow-800">Atenção</h4>
                <p className="text-sm text-yellow-700">Estas operações consomem leituras e escritas do Firestore. Execute apenas quando necessário para garantir a consistência e qualidade dos dados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Trip Tasks */}
                <div>
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">Tarefas de Viagens</h2>
                    <div className="space-y-3 mb-6">
                        {TRIP_TASKS.map(task => (
                            <label key={task.id} className="flex items-start p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input type="checkbox" checked={selectedTripTasks.has(task.id)} onChange={() => handleTaskToggle(task.id, 'trip')} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5" />
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-800">{task.label}</p>
                                    <p className="text-xs text-gray-500">{task.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <button onClick={() => handleRunTasks('trip')} disabled={isLoading || selectedTripTasks.size === 0} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
                        {isLoading && <SpinnerIcon className="mr-2" />}
                        {isLoading ? 'Executando...' : `Executar ${selectedTripTasks.size} Tarefa(s) de Viagem`}
                    </button>
                </div>

                {/* User Tasks */}
                <div>
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">Tarefas de Usuários</h2>
                    <div className="space-y-3 mb-6">
                        {USER_TASKS.map(task => (
                            <label key={task.id} className="flex items-start p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input type="checkbox" checked={selectedUserTasks.has(task.id)} onChange={() => handleTaskToggle(task.id, 'user')} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5" />
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-800">{task.label}</p>
                                    <p className="text-xs text-gray-500">{task.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <button onClick={() => handleRunTasks('user')} disabled={isLoading || selectedUserTasks.size === 0} className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center">
                        {isLoading && <SpinnerIcon className="mr-2" />}
                        {isLoading ? 'Executando...' : `Executar ${selectedUserTasks.size} Tarefa(s) de Usuário`}
                    </button>
                </div>
            </div>

            {log && (
                <div className="mt-6">
                    <h3 className="font-semibold mb-2">Log de Execução:</h3>
                    <div className="p-4 bg-gray-900 text-white rounded-md font-mono text-xs max-h-80 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{log}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataMaintenanceManager;
