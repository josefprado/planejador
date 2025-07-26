import React, { useState, useEffect, useMemo, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, Expense, ExpenseCategory, AppSettings } from '../types';
import { ModalHeaderIcon, DollarSignIcon, SpinnerIcon, TrashIcon, SparklesIcon } from '../components';
import { GoogleGenAI } from "@google/genai";

interface ExpensesModalProps {
    trip: Trip;
    appSettings: AppSettings;
}

const ExpensesModal: FC<ExpensesModalProps> = ({ trip, appSettings }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    
    // Form state
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('Alimentação');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isBRL, setIsBRL] = useState(false);
    
    // Exchange Rate State
    const [usdRate, setUsdRate] = useState<number | null>(null);
    const [isRateLoading, setIsRateLoading] = useState(true);


    const expensesColRef = useMemo(() => collection(db, 'trips', trip.id, 'expenses'), [trip.id]);

    useEffect(() => {
        const q = query(expensesColRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setExpenses(fetchedExpenses);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [expensesColRef]);

     useEffect(() => {
        const fetchRate = async () => {
            setIsRateLoading(true);
            try {
                const response = await fetch(`https://economia.awesomeapi.com.br/json/last/USD-BRL`);
                if (!response.ok) throw new Error('Falha ao buscar cotação');
                const data = await response.json();
                if (data.USDBRL && data.USDBRL.bid) {
                    setUsdRate(parseFloat(data.USDBRL.bid));
                } else {
                    throw new Error('Cotação não encontrada na resposta da API');
                }
            } catch (error) {
                console.error("Erro ao buscar cotação do dólar:", error);
            } finally {
                setIsRateLoading(false);
            }
        };
        fetchRate();
    }, []);
    
    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const originalAmountNum = parseFloat(amount);
        if (!description.trim() || !amount || isNaN(originalAmountNum)) return;
        
        if (!isBRL && !usdRate) {
            alert("A cotação do dólar não pôde ser carregada. Por favor, verifique sua conexão ou tente novamente.");
            return;
        }

        setIsAdding(true);

        const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
            description: description.trim(),
            originalAmount: originalAmountNum,
            originalCurrency: isBRL ? 'BRL' : 'USD',
            convertedAmountBRL: isBRL ? originalAmountNum : originalAmountNum * (usdRate || 1),
            exchangeRate: isBRL ? undefined : usdRate || undefined,
            category,
            date,
        };

        try {
            await addDoc(expensesColRef, { ...expenseData, createdAt: new Date().toISOString() });
            setDescription('');
            setAmount('');
        } catch (error) {
            console.error("Error adding expense:", error);
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleDeleteExpense = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar esta despesa?")) {
            await deleteDoc(doc(expensesColRef, id));
        }
    };

    const handleAnalyze = async () => {
        if (!appSettings.geminiApiKey) {
            alert("A chave da API do Gemini não está configurada.");
            return;
        }
        if (expenses.length === 0) {
            alert("Adicione algumas despesas antes de analisar.");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisResult('');
        try {
            const ai = new GoogleGenAI({ apiKey: appSettings.geminiApiKey });
            const expensesSummary = expenses.map(e => `${e.category}: BRL ${e.convertedAmountBRL.toFixed(2)}`).join(', ');
            const prompt = `Analise estes gastos de uma viagem para ${trip.destination} (em BRL). Gastos: ${expensesSummary}. Identifique as 3 principais categorias de despesa e dê uma dica inteligente e personalizada sobre como economizar na próxima viagem semelhante. Seja amigável e direto. Retorne em formato de texto simples.`;
            
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (!result || !result.text) throw new Error("Resposta vazia da IA.");
            setAnalysisResult(result.text);

        } catch (error) {
            console.error("Failed to analyze expenses:", error);
            setAnalysisResult("Ocorreu um erro ao analisar suas despesas. Tente novamente.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.convertedAmountBRL, 0), [expenses]);
    const convertedAmountPreview = useMemo(() => {
        const amountNum = parseFloat(amount);
        if (isBRL || !usdRate || isNaN(amountNum)) return null;
        return (amountNum * usdRate).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }, [amount, isBRL, usdRate]);


    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-shrink-0 text-center mb-6">
                <ModalHeaderIcon icon={DollarSignIcon} color="green" />
                <h2 className="text-2xl font-bold">Controle de Despesas</h2>
                <p className="text-gray-600">Acompanhe seus gastos durante a viagem.</p>
            </div>

            <div className="flex-shrink-0 p-4 bg-gray-50 rounded-lg mb-4">
                <form onSubmit={handleAddExpense} className="space-y-3">
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição da Despesa" className="w-full p-2 border rounded-md" required />
                    <div className="grid grid-cols-2 gap-3">
                         <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Valor em ${isBRL ? 'BRL' : 'USD'}`} className="w-full p-2 border rounded-md" required step="0.01" />
                         <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-md" />
                    </div>
                     <div className="text-xs text-gray-500 text-right h-4">
                        {!isBRL && convertedAmountPreview && `(aprox. ${convertedAmountPreview})`}
                    </div>
                     <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="w-full p-2 border rounded-md bg-white">
                        <option>Alimentação</option><option>Transporte</option><option>Compras</option>
                        <option>Hospedagem</option><option>Passeios</option><option>Outro</option>
                    </select>
                    <div className="flex items-center justify-between">
                        <label className="flex items-center text-sm">
                            <input type="checkbox" checked={isBRL} onChange={() => setIsBRL(prev => !prev)} className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Lançar valor em Reais (BRL)
                        </label>
                        <button type="submit" disabled={isAdding || (isRateLoading && !isBRL)} className="bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">
                            {isAdding ? <SpinnerIcon /> : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="flex-grow overflow-y-auto -mx-6 px-6">
                {isLoading ? <div className="flex justify-center p-8"><SpinnerIcon /></div> : (
                    <div className="space-y-2">
                        {expenses.map(expense => (
                            <div key={expense.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <div>
                                    <p className="font-semibold">{expense.description}</p>
                                    <p className="text-sm text-gray-500">{expense.category} - {new Date(`${expense.date}T12:00:00`).toLocaleDateString('pt-BR')}</p>
                                    {expense.originalCurrency === 'USD' && (
                                        <p className="text-xs text-gray-400">
                                            US$ {expense.originalAmount.toFixed(2)} @ R$ {expense.exchangeRate?.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    <p className="font-bold text-lg mr-4">{expense.convertedAmountBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    <button onClick={() => handleDeleteExpense(expense.id)} className="text-gray-400 hover:text-red-500"><TrashIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {expenses.length === 0 && !isLoading && <p className="text-center text-gray-500 py-8">Nenhuma despesa registrada.</p>}
            </div>

            <div className="flex-shrink-0 mt-4 pt-4 border-t">
                 <div className="flex justify-between items-center text-xl font-bold mb-4">
                    <span>Total Gasto:</span>
                    <span>{totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                {analysisResult && (
                    <div className="p-4 bg-green-50 text-green-800 rounded-lg whitespace-pre-wrap font-sans text-sm">
                        {analysisResult}
                    </div>
                )}
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full mt-2 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50">
                    {isAnalyzing ? <SpinnerIcon /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                    Analisar Meus Gastos
                </button>
            </div>
        </div>
    );
};

export default ExpensesModal;