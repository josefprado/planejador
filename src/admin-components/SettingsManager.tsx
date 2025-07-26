import React, { useState, useEffect, FC } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AppSettings } from '../types';

interface SettingsManagerProps {
    initialSettings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

const SettingsManager: FC<SettingsManagerProps> = ({ initialSettings, onSettingsChange }) => {
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            const settingsRef = doc(db, 'settings', 'integrations');
            await setDoc(settingsRef, settings, { merge: true });
            onSettingsChange(settings);
            setMessage('Configurações salvas com sucesso!');
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage('Erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Configurações e Contato</h1>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Número de WhatsApp para Contato</label>
                    <input type="text" name="whatsappNumber" value={settings.whatsappNumber || ''} onChange={handleChange} placeholder="5511999999999" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                     <p className="mt-2 text-xs text-gray-500">
                        Insira o número completo com código do país (ex: 55 para Brasil) e DDD, sem espaços ou símbolos.
                    </p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">URL da Loja de Ingressos</label>
                    <input type="url" name="ticketStoreUrl" value={settings.ticketStoreUrl || ''} onChange={handleChange} placeholder="https://sua-loja.com/ingressos" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">URL do Perfil do Instagram</label>
                    <input type="url" name="instagramUrl" value={settings.instagramUrl || ''} onChange={handleChange} placeholder="https://instagram.com/seu-perfil" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <hr className="my-6"/>
                <h2 className="text-xl font-bold">Integrações & Marketing</h2>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">ID do Pixel da Meta</label>
                    <input type="text" name="metaPixelId" value={settings.metaPixelId || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Token de Acesso da API de Conversões (CAPI)</label>
                    <input type="password" name="metaCapiToken" value={settings.metaCapiToken || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">URL da Cloud Function</label>
                    <input type="text" name="cloudFunctionUrl" value={settings.cloudFunctionUrl || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tag ID do Google Ads</label>
                    <input type="text" name="googleAdsTagId" value={settings.googleAdsTagId || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Chave de API do Gemini</label>
                    <input type="password" name="geminiApiKey" value={settings.geminiApiKey || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Chave de API do Google Maps</label>
                    <input type="password" name="googleMapsApiKey" value={settings.googleMapsApiKey || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Chave de API do TripAdvisor</label>
                    <input type="password" name="tripAdvisorApiKey" value={settings.tripAdvisorApiKey || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Chave de API da OpenWeatherMap</label>
                    <input type="password" name="openWeatherApiKey" value={settings.openWeatherApiKey || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Chave de API do Google Calendar</label>
                    <input type="password" name="googleCalendarApiKey" value={settings.googleCalendarApiKey || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Chave de API da Ticketmaster</label>
                    <input type="password" name="ticketmasterApiKey" value={settings.ticketmasterApiKey || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                     <p className="mt-2 text-xs text-gray-500">
                        <strong>Nota:</strong> Esta chave também deve ser configurada como um "secret" no back-end. Execute: <br />
                        <code className="bg-gray-100 p-1 rounded">firebase secrets:set TICKETMASTER_API_KEY</code>
                    </p>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
                {message && <p className="text-sm mt-2 text-center text-green-600">{message}</p>}
            </div>
        </div>
    );
};

export default SettingsManager;