import React, { useState, useEffect, useCallback, useMemo, FC } from 'react';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { Trip, User, LeadStatus, GeminiAnalysis } from '../types';
import { SpinnerIcon, SparklesIcon, FireIcon, ChevronDownIcon, PlaneIcon, BedIcon } from '../components';

interface LeadsManagerProps {
    onError: (message: string) => void;
}

const LeadsManager: FC<LeadsManagerProps> = ({ onError }) => {
    const [leads, setLeads] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    const fetchLeadsAndUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const tripsQuery = query(collection(db, 'trips'));
            const tripsSnapshot = await getDocs(tripsQuery);
            const tripsData = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
            setLeads(tripsData.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')));

            if (tripsData.length > 0) {
                const userIds = [...new Set(tripsData.map(trip => trip.ownerId))];
                const usersData: Record<string, User> = {};
                for (let i = 0; i < userIds.length; i += 10) {
                    const chunk = userIds.slice(i, i + 10);
                    if (chunk.length === 0) continue;
                    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', chunk));
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.forEach(doc => {
                        usersData[doc.id] = { uid: doc.id, ...doc.data() } as User;
                    });
                }
                setUsers(usersData);
            }

        } catch (error: any) {
            console.error("Erro ao buscar leads:", error);
             onError("Falha ao carregar os dados. Verifique as regras de segurança e índices do Firestore.");
        } finally {
            setIsLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        fetchLeadsAndUsers();
    }, [fetchLeadsAndUsers]);
    
    const filteredLeads = React.useMemo(() => {
        return leads.filter(lead => {
            const user = users[lead.ownerId];
            if (!user) return false;
            const searchTermLower = searchTerm.toLowerCase();
            return (
                lead.destination.toLowerCase().includes(searchTermLower) ||
                (user.displayName && user.displayName.toLowerCase().includes(searchTermLower)) ||
                (user.email && user.email.toLowerCase().includes(searchTermLower))
            );
        });
    }, [leads, users, searchTerm]);

    const leadColumns: Record<LeadStatus, Trip[]> = {
        'Novo': [],
        'Em Atendimento': [],
        'Fechado': [],
        'Quente': []
    };

    filteredLeads.forEach(lead => {
        const hasVoucher = lead.voucherInsights && lead.voucherInsights.length > 0;
        const status = hasVoucher ? 'Quente' : (lead.status || 'Novo');
        if (leadColumns[status]) {
            leadColumns[status].push(lead);
        } else {
            leadColumns['Novo'].push(lead);
        }
    });


    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciamento de Leads</h1>
                <input 
                    type="text" 
                    placeholder="Buscar por destino, nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-1/3 p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                <LeadColumn title="Leads Quentes 🔥" leads={leadColumns['Quente']} users={users} onUpdateLead={setLeads} />
                <LeadColumn title="Novos Leads 🌱" leads={leadColumns['Novo']} users={users} onUpdateLead={setLeads} />
                <LeadColumn title="Em Atendimento 💡" leads={leadColumns['Em Atendimento']} users={users} onUpdateLead={setLeads} />
                <LeadColumn title="Fechados ✅" leads={leadColumns['Fechado']} users={users} onUpdateLead={setLeads} />
            </div>
        </div>
    );
};

const LeadColumn: FC<{title: string, leads: Trip[], users: Record<string, User>, onUpdateLead: React.Dispatch<React.SetStateAction<Trip[]>>}> = ({ title, leads, users, onUpdateLead }) => (
    <div className="bg-gray-900 p-3 rounded-lg">
        <h2 className="font-bold mb-3 px-1">{title} ({leads.length})</h2>
        <div className="space-y-3 max-h-[75vh] overflow-y-auto">
            {leads.map(lead => users[lead.ownerId] ?
                <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    user={users[lead.ownerId]}
                    onUpdateLead={(id: string, data: Partial<Trip>) => {
                        onUpdateLead((prev: Trip[]) => prev.map((l: Trip) => l.id === id ? {...l, ...data} : l));
                    }}
                /> : null
            )}
        </div>
    </div>
);

const IntentTag: FC<{icon: React.ElementType, text: string}> = ({ icon: Icon, text }) => (
    <div className="flex items-center bg-green-500/20 text-green-300 text-xs font-medium px-2 py-0.5 rounded-full">
        <Icon className="w-3 h-3 mr-1" />
        {text}
    </div>
);


const LeadCard: FC<{ lead: Trip; user: User; onUpdateLead: (id: string, data: Partial<Trip>) => void; }> = ({ lead, user, onUpdateLead }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [agentNotes, setAgentNotes] = useState(lead.agentNotes || '');
    const [status, setStatus] = useState<LeadStatus>(lead.status || 'Novo');
    const [nextContactDate, setNextContactDate] = useState(lead.nextContactDate || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const hasFlightVoucher = useMemo(() => lead.voucherInsights?.some(v => v.documentType === 'Voo'), [lead.voucherInsights]);
    const hasAccommodationVoucher = useMemo(() => lead.voucherInsights?.some(v => v.documentType === 'Hospedagem'), [lead.voucherInsights]);
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const leadRef = doc(db, 'trips', lead.id);
            const updateData = { agentNotes, status, nextContactDate };
            await updateDoc(leadRef, updateData);
            onUpdateLead(lead.id, updateData);
        } catch (error) { console.error("Failed to save lead details:", error); } 
        finally { setIsSaving(false); }
    };
    
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const analyzeLeadDetails = httpsCallable(functions, 'analyzeLeadDetails');
            
            const itineraryColRef = collection(db, 'trips', lead.id, 'itinerary');
            const itinerarySnapshot = await getDocs(itineraryColRef);
            const itineraryItems = itinerarySnapshot.docs.map(doc => doc.data().title);

            const result = await analyzeLeadDetails({ trip: lead, user, itineraryItems });
            const analysis = result.data as GeminiAnalysis;

            const leadRef = doc(db, 'trips', lead.id);
            await updateDoc(leadRef, { geminiAnalysis: analysis });
            onUpdateLead(lead.id, { geminiAnalysis: analysis });

        } catch (error) {
            console.error("Failed to analyze lead:", error);
            alert("Ocorreu um erro ao analisar o lead com a IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start">
                <div className="flex-grow cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <p className="font-bold text-sm">{user.displayName}</p>
                    <p className="text-xs text-gray-400">{lead.destination}</p>
                </div>
                <div className="flex-shrink-0 flex items-center">
                    {lead.geminiAnalysis?.leadScore && (
                        <div className="flex items-center font-bold text-red-400 text-sm mr-2" title={`Lead Score: ${lead.geminiAnalysis.leadScoreReasoning}`}>
                            <FireIcon />
                            <span>{lead.geminiAnalysis.leadScore}/10</span>
                        </div>
                    )}
                    <button onClick={() => setIsExpanded(!isExpanded)}>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
                {hasFlightVoucher && <IntentTag icon={PlaneIcon} text="Voo Comprado" />}
                {hasAccommodationVoucher && <IntentTag icon={BedIcon} text="Hotel Reservado" />}
                {lead.budgetLevel && <div className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">{lead.budgetLevel}</div>}
            </div>
            
             {lead.geminiAnalysis?.dna && (
                <div className="mt-2 text-xs text-gray-300 italic">
                    "{lead.geminiAnalysis.dna}"
                </div>
            )}

            {lead.geminiAnalysis?.nextBestOffer && (
                <div className="mt-2 p-2 bg-yellow-500/10 border-l-4 border-yellow-400">
                    <p className="text-xs font-bold text-yellow-300">Oportunidade 💡: {lead.geminiAnalysis.nextBestOffer.service}</p>
                    <p className="text-xs text-yellow-400 italic">"{lead.geminiAnalysis.nextBestOffer.justification}"</p>
                </div>
            )}

            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs space-y-2 animate-fade-in">
                    <select value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-xs">
                        {(['Novo', 'Quente', 'Em Atendimento', 'Fechado'] as LeadStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea value={agentNotes} onChange={e => setAgentNotes(e.target.value)} placeholder="Notas do agente..." rows={3} className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-xs"></textarea>
                    <div className="flex justify-between items-center">
                        <div className="relative">
                            <input type="date" value={nextContactDate} onChange={e => setNextContactDate(e.target.value)} className="p-1.5 bg-gray-700 border border-gray-600 rounded-md text-xs" />
                            <div className="absolute -top-2 left-2 bg-gray-800 px-1"><label className="text-gray-400" style={{fontSize: '0.6rem'}}>Próx. Contato</label></div>
                        </div>
                        <div className="flex space-x-1">
                            <button onClick={handleSave} disabled={isSaving} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50">
                                {isSaving ? '...' : 'Salvar'}
                            </button>
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="text-xs bg-gray-600 p-1.5 rounded-md hover:bg-gray-500 disabled:opacity-50" title="Analisar com IA">
                                {isAnalyzing ? <SpinnerIcon className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsManager;