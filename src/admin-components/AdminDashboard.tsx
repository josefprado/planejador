
import { useState, useEffect, FC } from 'react';
import { collection, query, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, LeadStatus, DailyBriefing } from '../types';
import { SpinnerIcon } from '../components';

const AdminDashboard: FC = () => {
    const [leads, setLeads] = useState<Trip[]>([]);
    const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubLeads = onSnapshot(query(collection(db, 'trips')), snap => {
            setLeads(snap.docs.map(d => d.data() as Trip));
        });

        const unsubBriefing = onSnapshot(doc(db, 'admin', 'dailyBriefing'), snap => {
            if (snap.exists()) {
                setBriefing(snap.data() as DailyBriefing);
            }
        });

        Promise.all([
            getDocs(query(collection(db, 'trips'))),
            getDoc(doc(db, 'admin', 'dailyBriefing'))
        ]).finally(() => setIsLoading(false));

        return () => {
            unsubLeads();
            unsubBriefing();
        };
    }, []);

    const funnelData = leads.reduce((acc, lead) => {
        const hasVoucher = lead.voucherInsights && lead.voucherInsights.length > 0;
        const status = hasVoucher ? 'Quente' : (lead.status || 'Novo');
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<LeadStatus, number>);
        
    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><SpinnerIcon className="text-white"/></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Mission Control</h1>

            {briefing && (
                 <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h2 className="font-bold mb-2 text-blue-400">Briefing Diário do Assistente Mágico ☀️</h2>
                    <div className="text-sm space-y-2">
                        <p><strong>🔥 Foco Total:</strong> Temos {briefing.hotLeads.length} novos 'Leads Quentes' que compraram voos/hotéis. Eles são sua prioridade máxima hoje.</p>
                        <p><strong>📈 Radar de Tendências:</strong> O interesse por '{briefing.trends[0]?.destination || 'Orlando'}' continua alto. É um ótimo momento para um post no Instagram sobre o tema.</p>
                        <p><strong>🚨 Alerta de Urgência:</strong> {briefing.urgentTasks.length > 0 ? `A viagem da família '${briefing.urgentTasks[0].ownerId}' começa em breve e eles ainda não têm ingressos. Contato imediato recomendado.` : 'Nenhuma tarefa urgente no momento.'}</p>
                    </div>
                </div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Sales Funnel */}
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <h2 className="font-bold mb-4">Funil de Vendas Ativo</h2>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-3xl font-bold">{funnelData['Novo'] || 0}</p>
                                <p className="text-sm text-gray-400">Novos Leads</p>
                            </div>
                             <div>
                                <p className="text-3xl font-bold text-red-400">{funnelData['Quente'] || 0}</p>
                                <p className="text-sm text-gray-400">Leads Quentes</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{funnelData['Em Atendimento'] || 0}</p>
                                <p className="text-sm text-gray-400">Em Atendimento</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-green-400">{funnelData['Fechado'] || 0}</p>
                                <p className="text-sm text-gray-400">Fechados</p>
                            </div>
                        </div>
                    </div>
                     {/* Agent Tasks */}
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <h2 className="font-bold mb-2">Tarefas Prioritárias</h2>
                        <ul className="divide-y divide-gray-700">
                            {briefing?.hotLeads.map(task => (
                                <li key={task.id} className="py-2">
                                    <p className="font-semibold text-blue-400">{task.ownerId} (Lead Quente)</p>
                                    <p className="text-sm text-gray-300">Viagem para {task.destination}</p>
                                </li>
                            ))}
                             {briefing?.urgentTasks.map(task => (
                                <li key={task.id} className="py-2">
                                    <p className="font-semibold text-yellow-400">{task.ownerId} (Urgente)</p>
                                    <p className="text-sm text-gray-300">Viagem para {task.destination} começa em breve</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <h2 className="font-bold mb-2">Radar de Tendências</h2>
                        <p className="text-xs text-gray-500 mb-4">Destinos mais planejados pelos usuários.</p>
                        <ul className="space-y-2">
                            {briefing?.trends.map(trend => (
                                <li key={trend.destination} className="text-sm flex justify-between">
                                    <span>{trend.destination}</span>
                                    <span className="font-bold">{trend.count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
