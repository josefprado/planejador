import React, { useState, useEffect, useMemo, FC } from 'react';
import { Modal, CalculatorIcon, SpinnerIcon, WifiOffIcon, HelpCircleIcon, ModalHeaderIcon } from '../components';

const CURRENCIES = [
    { code: 'USD', name: 'Dólar Americano', symbol: 'US$', key: 'USDBRL' },
    { code: 'EUR', name: 'Euro', symbol: '€', key: 'EURBRL' },
    { code: 'GBP', name: 'Libra Esterlina', symbol: '£', key: 'GBPBRL' },
    { code: 'ARS', name: 'Peso Argentino', symbol: 'ARS$', key: 'ARSBRL' },
    { code: 'CLP', name: 'Peso Chileno', symbol: 'CLP$', key: 'CLPBRL' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: 'MXN$', key: 'MXNBRL' },
    { code: 'JPY', name: 'Iene Japonês', symbol: '¥', key: 'JPYBRL' },
    { code: 'AED', name: 'Dirham dos Emirados', symbol: 'AED', key: 'AEDBRL' },
    { code: 'EGP', name: 'Libra Egípcia', symbol: 'EGP', key: 'EGPBRL' },
];

const CACHE_KEY = 'currencyRatesCache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface Props {
    onClose: () => void;
}

const CurrencyConverterModal: FC<Props> = ({ onClose }) => {
    const [amount, setAmount] = useState<string>('');
    const [rate, setRate] = useState<string>('');
    const [tax, setTax] = useState<string>('');
    const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isOffline, setIsOffline] = useState<boolean>(false);
    const [isTaxHelpVisible, setIsTaxHelpVisible] = useState<boolean>(false);

    useEffect(() => {
        const fetchRates = async () => {
            setIsLoading(true);
            setError('');
            setIsOffline(false);

            const handleData = (data: any) => {
                const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrencyCode);
                if (currentCurrency && data && data[currentCurrency.key]) {
                    setRate(data[currentCurrency.key].bid);
                } else {
                    setRate('');
                    setError(`Cotação para ${selectedCurrencyCode} não encontrada.`);
                }
            };

            const cachedItem = localStorage.getItem(CACHE_KEY);
            if (cachedItem) {
                const { data, timestamp } = JSON.parse(cachedItem);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    handleData(data);
                    setIsLoading(false);
                    return;
                }
            }

            try {
                const apiCodes = CURRENCIES.map(c => c.key.replace('BRL', '-BRL')).join(',');
                const apiUrl = `https://economia.awesomeapi.com.br/json/last/${apiCodes}`;

                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('A resposta da rede não foi OK');
                const data = await response.json();
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
                handleData(data);
            } catch (err: any) {
                console.error("Falha ao buscar cotações, usando cache se disponível.", err);
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data } = JSON.parse(cached);
                    handleData(data);
                    setIsOffline(true);
                } else {
                    setRate('');
                    setError('Falha ao buscar cotações. Verifique sua conexão ou insira manualmente.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
    }, [selectedCurrencyCode]);

    const { subtotal, taxValue, total } = useMemo(() => {
        const amountNum = parseFloat(amount.replace(',', '.')) || 0;
        const rateNum = parseFloat(rate.replace(',', '.')) || 0;
        const taxNum = parseFloat(tax.replace(',', '.')) || 0;

        const subtotalInBRL = amountNum * rateNum;
        const taxAmountInBRL = subtotalInBRL * (taxNum / 100);
        const totalInBRL = subtotalInBRL + taxAmountInBRL;

        return {
            subtotal: subtotalInBRL,
            taxValue: taxAmountInBRL,
            total: totalInBRL,
        };
    }, [amount, rate, tax]);
    
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrencyCode = e.target.value;
        setSelectedCurrencyCode(newCurrencyCode);
    };
    
    return (
        <Modal onClose={onClose} size="lg">
            <div className="text-center mb-6">
                <ModalHeaderIcon icon={CalculatorIcon} color="blue" />
                <h2 className="text-2xl font-bold">Conversor de Moedas</h2>
                <p className="text-gray-600">Calcule o custo final de suas compras no exterior.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-600">Moeda</label>
                    <select value={selectedCurrencyCode} onChange={handleCurrencyChange} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 border border-transparent focus:border-blue-500 transition-all">
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium text-gray-600">Valor na Moeda</label>
                        <input type="number" placeholder="Ex: 100.00" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 border border-transparent focus:border-blue-500 transition-all text-lg font-semibold" />
                    </div>
                     <div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-600">Imposto (%)</label>
                             <div className="relative" onMouseEnter={() => setIsTaxHelpVisible(true)} onMouseLeave={() => setIsTaxHelpVisible(false)}>
                                <HelpCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                                {isTaxHelpVisible && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded-lg p-2.5 shadow-lg z-10">
                                        Informe o imposto local (ex: Sales Tax nos EUA) que é adicionado no caixa, não na etiqueta do produto.
                                    </div>
                                )}
                            </div>
                        </div>
                        <input type="number" placeholder="Ex: 6.5" value={tax} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTax(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 border border-transparent focus:border-blue-500 transition-all text-lg font-semibold" />
                    </div>
                 </div>

                <div>
                    <label className="text-sm font-medium text-gray-600">Cotação (1 {selectedCurrencyCode} = ? BRL)</label>
                    <div className="relative">
                        <input type="number" placeholder="Cotação do dia" value={rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRate(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 border border-transparent focus:border-blue-500 transition-all text-lg font-semibold" />
                        {isLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5"><SpinnerIcon/></div>}
                    </div>
                    {error && <p className="text-orange-600 text-xs mt-1">{error}</p>}
                    {isOffline && !isLoading && (
                        <div className="mt-2 text-xs flex items-center text-gray-500 bg-gray-100 p-2 rounded-lg">
                           <WifiOffIcon className="w-4 h-4 mr-2"/>
                           <span>Você está offline. Usando a última cotação salva.</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-gray-600">
                        <span>Valor do Produto</span>
                        <span className="font-medium">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                        <span>Imposto ({tax || 0}%)</span>
                        <span className="font-medium">{taxValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900 pt-3 border-t border-dashed">
                        <span>Custo Total em Reais</span>
                        <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CurrencyConverterModal;
