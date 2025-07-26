import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trip, User, AppSettings, DocCategory, Flight, Accommodation, VoucherInsight } from '../types';
import { firebaseConfig } from '../../firebaseConfig';
import { trackPurchase } from '../../services/analyticsEvents';
import { GoogleGenAI, Type } from "@google/genai";
import { logUserIntent } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore';
import { 
    Modal, FolderIcon, SpinnerIcon, GoogleIcon, TrashIcon, ExternalLinkIcon, DownloadCloudIcon, CheckCloudIcon, UploadCloudIcon, CameraIcon, GridIcon, ListIcon, LockIcon, UnlockIcon, PlaneIcon, BedIcon, TicketIcon, CarIcon, ShieldIcon
} from '../components';
import { saveFile, getSavedFileIds, deleteFile as deleteOfflineFile, getFile } from '../db';

type GapiState = 'loading' | 'ready' | 'error';
type FilesState = 'loading' | 'loaded' | 'error';
type ViewMode = 'list' | 'grid';

const CATEGORIES: { id: DocCategory, icon: React.ElementType, name: string }[] = [
    { id: 'Voo', icon: PlaneIcon, name: 'Voo' },
    { id: 'Hospedagem', icon: BedIcon, name: 'Hotel' },
    { id: 'Ingresso', icon: TicketIcon, name: 'Ingresso' },
    { id: 'Aluguel de Carro', icon: CarIcon, name: 'Carro' },
    { id: 'Seguro', icon: ShieldIcon, name: 'Seguro' },
    { id: 'Outro', icon: FolderIcon, name: 'Outro' },
];

const getCategoryFromFilename = (filename: string): DocCategory => {
    const match = filename.match(/^\[(.*?)\]/);
    if (match && CATEGORIES.some(c => c.id === match[1])) {
        return match[1] as DocCategory;
    }
    return 'Outro';
};

const getDisplayName = (filename: string): string => {
    return filename.replace(/^\[.*?\]\s*-\s*/, '');
};

interface FileWithMeta {
    id: string;
    name: string;
    displayName: string;
    category: DocCategory;
    webViewLink: string;
    thumbnailLink?: string;
    iconLink?: string;
}

interface OrganizeDocumentModalProps {
    data: {
        file: File;
        previewUrl: string;
        aiSuggestion: any; // Now contains the full structured object
    };
    onClose: () => void;
    onSave: (name: string, category: DocCategory, aiData: any) => void;
    isSaving: boolean;
}

const OrganizeDocumentModal: React.FC<OrganizeDocumentModalProps> = ({ data, onClose, onSave, isSaving }) => {
    const [name, setName] = useState<string>(data.aiSuggestion.suggestedName);
    const [category, setCategory] = useState<DocCategory>(data.aiSuggestion.suggestedCategory);

    const handleSave = () => {
        if (name.trim() && category) {
            onSave(name.trim(), category, data.aiSuggestion);
        }
    };

    return (
        <Modal onClose={onClose} size="lg" persistent={true}>
            <div className="flex flex-col h-[80vh] sm:h-[85vh]">
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">Organize seu Documento</h2>
                    <p className="text-sm text-gray-500 mt-1">A IA extraiu estes dados. Ajuste o nome e a categoria se necessário.</p>
                </div>
                
                <div className="flex-grow my-4 overflow-hidden bg-gray-100 rounded-lg flex items-center justify-center">
                    {data.file.type.startsWith('image/') ? (
                        <img src={data.previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                        <embed src={data.previewUrl} type={data.file.type} className="w-full h-full" />
                    )}
                </div>

                <div className="flex-shrink-0 space-y-4 pt-2">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Nome do Documento</label>
                        <input type="text" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 border border-transparent focus:border-blue-500" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600">Categoria</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {CATEGORIES.map(cat => {
                               const Icon = cat.icon;
                               return (
                                   <button 
                                     type="button" 
                                     key={cat.id}
                                     onClick={() => setCategory(cat.id)}
                                     className={`p-3 flex flex-col items-center justify-center rounded-xl border-2 transition-all ${category === cat.id ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-gray-100 border-transparent hover:border-gray-300'}`}
                                    >
                                     <div className="mb-1"><Icon className="w-6 h-6"/></div>
                                     <span className="text-xs font-semibold text-center">{cat.name}</span>
                                   </button>
                               )
                           })}
                        </div>
                    </div>
                    {/* AQUI PODERÍAMOS MOSTRAR OS DADOS EXTRAÍDOS PARA O USUÁRIO CONFIRMAR */}
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className="w-full py-3 bg-gray-200 text-gray-800 font-bold rounded-full hover:bg-gray-300 transition-colors">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="w-full py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                            {isSaving ? <SpinnerIcon /> : "Salvar e Atualizar Viagem"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


interface ReloginPromptProps {
    onRelogin: () => void;
}
const ReloginPrompt: React.FC<ReloginPromptProps> = ({ onRelogin }) => (
     <div className="text-center p-4 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center bg-blue-100 rounded-full text-blue-500">
            <GoogleIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Conexão com Google Drive</h2>
        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Para sua segurança e conveniência, agora o acesso ao Google Drive é solicitado junto com o seu login principal.
        </p>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Por favor, saia e entre novamente na sua conta para conceder a permissão e ativar o cofre de documentos.
        </p>
        <button onClick={onRelogin} className="w-full max-w-sm mx-auto py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-bold flex items-center justify-center transition-colors">
            <span className="ml-2">Sair para Reconectar</span>
        </button>
    </div>
);


interface DocumentsModalProps {
    onClose: () => void;
    trip: Trip;
    onUpdateTripFolder: (tripId: string, folderId: string) => void;
    user: User | null;
    appSettings: AppSettings;
    onReloginRequest: () => void;
}

interface SecurityLockScreenProps {
    onUnlock: () => void;
}

const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({ onUnlock }) => (
    <div className="text-center p-8 flex flex-col items-center justify-center min-h-[400px]">
        <LockIcon className="w-16 h-16 text-gray-300 mb-6"/>
        <h3 className="text-xl font-bold text-gray-800">Cofre de Documentos Trancado</h3>
        <p className="text-gray-500 mt-2 mb-6">Para sua segurança, esta área está protegida.</p>
        <button onClick={onUnlock} className="py-3 px-8 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors flex items-center">
            <UnlockIcon className="w-5 h-5 mr-2" />
            Destrancar
        </button>
    </div>
);

const DocumentsModal: React.FC<DocumentsModalProps> = ({ onClose, trip, onUpdateTripFolder, user, appSettings, onReloginRequest }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [gapiState, setGapiState] = useState<GapiState>('loading');
    const [files, setFiles] = useState<FileWithMeta[]>([]);
    const [filesState, setFilesState] = useState<FilesState>('loading');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
    
    // Upload & Scan States
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
    const [organizeModalData, setOrganizeModalData] = useState<OrganizeDocumentModalProps['data'] | null>(null);

    // Offline States
    const [offlineFileIds, setOfflineFileIds] = useState<string[]>([]);
    const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

    // Security Lock States
    const [isSecurityLockEnabled, setIsSecurityLockEnabled] = useState<boolean>(() => localStorage.getItem('docSecurityLock') === 'true');
    const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const appFolderName = "Lá em Orlando App";

    // Load local offline file IDs on mount
    useEffect(() => {
        getSavedFileIds().then(setOfflineFileIds);
    }, []);

    const initGapi = useCallback(async () => {
        setGapiState('loading');
        // The gapi script is loaded from index.html
        if (!(window as any).gapi) {
            console.error("GAPI script not loaded.");
            setGapiState('error');
            return;
        }
        try {
            await new Promise<void>((resolve) => (window as any).gapi.load('client', resolve));
            await (window as any).gapi.client.init({
                apiKey: firebaseConfig.GAPI_API_KEY,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            });
            if (!(window as any).gapi.client.drive) throw new Error("GAPI Drive client failed to initialize.");
            setGapiState('ready');
        } catch (e) {
            console.error("Error during GAPI initialization:", e);
            setGapiState('error');
        }
    }, []);

    // This is the core of the new authentication flow.
    // It checks for the token from session storage. If it exists, it proceeds.
    // If not, it will render the ReloginPrompt.
    useEffect(() => {
        const token = sessionStorage.getItem('googleDriveToken');
        setAccessToken(token); // This will trigger re-render
        if (token) {
            // If we have a token, we can initialize the Google API client.
            if ((window as any).gapi && (window as any).gapi.client) {
                 setGapiState('ready');
            } else {
                 initGapi();
            }
        }
        // If no token, the component will render the prompt to re-login.
    }, [initGapi]);

    
    const getAppFolderId = useCallback(async () => {
        const response = await (window as any).gapi.client.drive.files.list({
            q: `name='${appFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id)',
        });
        if (response.result.files.length > 0) return response.result.files[0].id;
        
        const folder = await (window as any).gapi.client.drive.files.create({ resource: { name: appFolderName, mimeType: 'application/vnd.google-apps.folder' }, fields: 'id' });
        return folder.result.id;
    }, [appFolderName]);

    const getTripFolderId = useCallback(async (appFolderId: string) => {
        if (trip.driveFolderId) return trip.driveFolderId;
        const tripFolderName = `Viagem para ${trip.destination} (${trip.id.slice(0,6)})`;
        const response = await (window as any).gapi.client.drive.files.list({
            q: `name='${tripFolderName}' and '${appFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id)',
        });

        if (response.result.files.length > 0) {
            onUpdateTripFolder(trip.id, response.result.files[0].id);
            return response.result.files[0].id;
        }

        const folder = await (window as any).gapi.client.drive.files.create({ resource: { name: tripFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [appFolderId] }, fields: 'id' });
        onUpdateTripFolder(trip.id, folder.result.id);
        return folder.result.id;
    }, [trip, onUpdateTripFolder]);

    const listFiles = useCallback(async () => {
        if (gapiState !== 'ready' || !accessToken) return;
        setFilesState('loading');
        try {
            (window as any).gapi.client.setToken({ access_token: accessToken });
            const appFolderId = await getAppFolderId();
            if (!appFolderId) throw new Error("Could not find or create app folder.");
            const tripFolderId = await getTripFolderId(appFolderId);
            if (!tripFolderId) throw new Error("Could not find or create trip folder.");

            const response = await (window as any).gapi.client.drive.files.list({
                q: `'${tripFolderId}' in parents and trashed=false`,
                fields: 'files(id, name, webViewLink, thumbnailLink, iconLink, createdTime)',
                orderBy: 'createdTime desc'
            });

            const processedFiles: FileWithMeta[] = response.result.files.map((file: any) => ({
                ...file,
                displayName: getDisplayName(file.name),
                category: getCategoryFromFilename(file.name),
            }));
            
            setFiles(processedFiles);
            setFilesState('loaded');
        } catch (e: any) {
            console.error("Error listing files:", e);
            // If token is invalid/expired, prompt for re-login.
            if (e.status === 401 || e.status === 403) {
                 setAccessToken(null); // This will trigger the ReloginPrompt
            } else {
                 setFilesState('error');
            }
        }
    }, [gapiState, accessToken, getAppFolderId, getTripFolderId]);

    useEffect(() => {
        if (gapiState === 'ready' && accessToken) {
            if (!isSecurityLockEnabled || isUnlocked) {
                listFiles();
            }
        }
    }, [gapiState, accessToken, listFiles, isSecurityLockEnabled, isUnlocked]);
    
    // --- Upload Logic ---
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFileUpload(file);
        event.target.value = '';
    };

    const getAiSuggestion = async (file: File): Promise<any> => {
        const geminiApiKey = appSettings.geminiApiKey;
        const fallback = { suggestedName: file.name.replace(/\.[^/.]+$/, ""), suggestedCategory: 'Outro' };

        if (!geminiApiKey) {
            console.warn("Gemini API Key not configured. Using fallback suggestion.");
            return fallback;
        }
        
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const filePart = { inlineData: { mimeType: file.type, data: base64 } };
            
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    suggestedName: { type: Type.STRING, description: 'Um nome curto e descritivo para o arquivo (ex: Voo GOL 1234, Ingresso Magic Kingdom).' },
                    suggestedCategory: { type: Type.STRING, description: 'A categoria mais apropriada para o documento.', enum: CATEGORIES.map(c => c.id) },
                    isFlight: { type: Type.BOOLEAN, description: 'É um voucher de voo?' },
                    flightData: {
                        type: Type.OBJECT,
                        properties: {
                            airline: { type: Type.STRING },
                            flightNumber: { type: Type.STRING },
                            departureAirport: { type: Type.STRING, description: 'Código IATA do aeroporto de partida.' },
                            departureDateTime: { type: Type.STRING, description: 'Data e hora da partida em formato ISO 8601 (YYYY-MM-DDTHH:MM:SS).' },
                            arrivalAirport: { type: Type.STRING, description: 'Código IATA do aeroporto de chegada.' },
                            arrivalDateTime: { type: Type.STRING, description: 'Data e hora da chegada em formato ISO 8601 (YYYY-MM-DDTHH:MM:SS).' },
                            confirmationNumber: { type: Type.STRING },
                            passengerNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                    },
                    isAccommodation: { type: Type.BOOLEAN, description: 'É uma reserva de hotel/hospedagem?' },
                    accommodationData: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            address: { type: Type.STRING },
                            checkIn: { type: Type.STRING, description: 'Data de check-in no formato YYYY-MM-DD.' },
                            checkOut: { type: Type.STRING, description: 'Data de check-out no formato YYYY-MM-DD.' },
                            confirmationNumber: { type: Type.STRING },
                        },
                    },
                    bookingAgency: { type: Type.STRING, description: 'A agência de viagens onde a compra foi feita, se houver (ex: Decolar.com).' },
                    totalPrice: { type: Type.NUMBER, description: 'O preço total pago, se houver.' },
                    currency: { type: Type.STRING, description: 'A moeda do preço (ex: USD, BRL).' }
                },
                required: ['suggestedName', 'suggestedCategory']
            };

            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [filePart, { text: "Analise este documento de viagem. Extraia todos os dados estruturados possíveis, incluindo detalhes de voos, hospedagem e informações de compra como agência e preço. Dê um nome curto e uma categoria para o arquivo." }] },
                config: { responseMimeType: "application/json", responseSchema }
            });

            if (!result || !result.text) {
                console.error("AI suggestion failed: empty response from API.");
                return fallback;
            }
            
            const parsed = JSON.parse(result.text.trim());
            return parsed || fallback;
        } catch (e) {
            console.error("Failed to get or parse AI suggestion:", e);
            return fallback;
        }
    };
    
    const handleFileUpload = async (file: File) => {
        setIsAiProcessing(true);
        const suggestion = await getAiSuggestion(file);
        setIsAiProcessing(false);

        const previewUrl = URL.createObjectURL(file);
        setOrganizeModalData({
            file,
            previewUrl,
            aiSuggestion: suggestion
        });
    };
    
    const handleConfirmOrganization = async (name: string, category: DocCategory, aiData: any) => {
        if (!organizeModalData) return;
        setIsUploading(true);
        const file = organizeModalData.file;
        const extension = file.name.split('.').pop() || '';
        const categorizedFilename = `[${category}] - ${name}${extension ? '.' + extension : ''}`;
        
        const uploadPromise = uploadToDrive(file, categorizedFilename);
        
        const tripUpdateData: Partial<Trip> = {};
        const insight: Partial<VoucherInsight> = {
            provider: aiData.isFlight ? aiData.flightData?.airline : (aiData.isAccommodation ? aiData.accommodationData?.name : undefined),
            bookingAgency: aiData.bookingAgency,
            totalPrice: aiData.totalPrice,
            currency: aiData.currency,
            bookingReference: aiData.isFlight ? aiData.flightData?.confirmationNumber : (aiData.isAccommodation ? aiData.accommodationData?.confirmationNumber : undefined),
            documentType: category,
            extractedAt: new Date().toISOString(),
        };

        if (Object.keys(insight).length > 2) {
            tripUpdateData.voucherInsights = [...(trip.voucherInsights || []), insight as VoucherInsight];
        }

        if (aiData.isFlight && aiData.flightData?.departureDateTime) {
            const newFlight: Flight = { id: crypto.randomUUID(), ...aiData.flightData };
            tripUpdateData.flights = [...(trip.flights || []), newFlight];
        }
        if (aiData.isAccommodation && aiData.accommodationData?.checkIn) {
            const newAccommodation: Accommodation = { id: crypto.randomUUID(), ...aiData.accommodationData };
            tripUpdateData.accommodations = [...(trip.accommodations || []), newAccommodation];
        }

        const tripUpdatePromise = Object.keys(tripUpdateData).length > 0
            ? useTripStore.getState().saveTrip({ id: trip.id, ...tripUpdateData })
            : Promise.resolve();
            
        await Promise.all([uploadPromise, tripUpdatePromise]);
        
        URL.revokeObjectURL(organizeModalData.previewUrl);
        setOrganizeModalData(null);
        setIsUploading(false);
    };

    const handleCloseOrganizeModal = () => {
        if (organizeModalData) {
            URL.revokeObjectURL(organizeModalData.previewUrl);
        }
        setOrganizeModalData(null);
    };

    const uploadToDrive = async (file: File | Blob, filename: string) => {
        if (gapiState !== 'ready' || !accessToken || !trip.driveFolderId) return;
        try {
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ name: filename, parents: [trip.driveFolderId] })], { type: 'application/json' }));
            form.append('file', file);
            
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                body: form,
            });
            if (!response.ok) throw new Error('Falha no upload do arquivo.');
            trackPurchase(appSettings, user, trip.id, 'document_upload');
            logUserIntent('uploaded_document', `Documento: ${filename}`);
            await listFiles();
        } catch (e) {
            console.error("Error uploading file:", e);
            setFilesState('error');
        }
    };

    
    // --- Scan Logic ---
    const handleScanClick = async () => {
        setIsScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert("Não foi possível acessar a câmera. Verifique as permissões no seu navegador.");
            setIsScanning(false);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        
        // Stop camera stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setIsScanning(false);

        canvas.toBlob((blob) => {
            if (blob) {
                const now = new Date();
                const file = new File([blob], `Scan_${now.toISOString()}.jpg`, { type: 'image/jpeg' });
                handleFileUpload(file);
            }
        }, 'image/jpeg', 0.95);
    };

    // --- Drag & Drop Logic ---
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };
    
    // --- File Actions Logic ---
    const handleDeleteSelected = async () => {
        if (selectedFileIds.size === 0 || !window.confirm(`Tem certeza que deseja apagar ${selectedFileIds.size} arquivo(s)?`)) return;
        
        const idsToDelete = Array.from(selectedFileIds);
        setFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
        setSelectedFileIds(new Set());

        try {
            const batch = (window as any).gapi.client.newBatch();
            idsToDelete.forEach(id => {
                batch.add((window as any).gapi.client.drive.files.delete({ fileId: id }));
                // Also delete from offline storage if present
                deleteOfflineFile(id).then(() => {
                    setOfflineFileIds(prev => prev.filter(offlineId => offlineId !== id));
                });
            });
            await batch;
        } catch (error) {
            console.error("Failed to delete files:", error);
            await listFiles(); // Refresh to show correct state
        }
    };

    const toggleSelection = (fileId: string) => {
        setSelectedFileIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) newSet.delete(fileId);
            else newSet.add(fileId);
            return newSet;
        });
    };
    
    // --- Offline Logic ---
    const handleOfflineToggle = async (file: FileWithMeta) => {
        if (!accessToken) return;
        if (offlineFileIds.includes(file.id)) {
            // Delete from offline
            await deleteOfflineFile(file.id);
            setOfflineFileIds(prev => prev.filter(id => id !== file.id));
        } else {
            // Download for offline
            setDownloadingFiles(prev => new Set(prev).add(file.id));
            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!response.ok) throw new Error("Failed to download file.");
                const blob = await response.blob();
                await saveFile(file.id, file.name, blob);
                setOfflineFileIds(prev => [...prev, file.id]);
            } catch (error) {
                console.error("Failed to save file offline:", error);
            } finally {
                setDownloadingFiles(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(file.id);
                    return newSet;
                });
            }
        }
    };
    
    const handleViewOffline = async (fileId: string) => {
        const storedFile = await getFile(fileId);
        if (storedFile) {
            const url = URL.createObjectURL(storedFile.blob);
            window.open(url, '_blank');
        }
    };

    const toggleSecurityLock = () => {
        const newLockState = !isSecurityLockEnabled;
        setIsSecurityLockEnabled(newLockState);
        localStorage.setItem('docSecurityLock', String(newLockState));
    };

    // Main component render logic
    if (!accessToken) {
        // This is the crucial fix: If the token wasn't found in session storage,
        // we render a prompt that asks the user to re-authenticate.
        return (
            <Modal onClose={onClose} size="lg">
                <ReloginPrompt onRelogin={onReloginRequest} />
            </Modal>
        );
    }
    
     if (isSecurityLockEnabled && !isUnlocked) {
        return <Modal onClose={onClose} size="lg"><SecurityLockScreen onUnlock={() => setIsUnlocked(true)}/></Modal>
    }
    
    if (isScanning) {
        return (
             <Modal onClose={() => setIsScanning(false)} size="2xl" persistent={true}>
                 <div className="relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg bg-black"></video>
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                        <button onClick={() => setIsScanning(false)} className="self-start bg-black/50 text-white rounded-full p-2">X</button>
                        <button onClick={handleCapture} className="self-center w-16 h-16 bg-white rounded-full border-4 border-black/50"></button>
                    </div>
                 </div>
            </Modal>
        )
    }

    if (organizeModalData) {
        return <OrganizeDocumentModal data={organizeModalData} onClose={handleCloseOrganizeModal} onSave={handleConfirmOrganization} isSaving={isUploading} />
    }
    
    // The main view when authenticated and unlocked
    return (
        <Modal onClose={onClose} size="4xl">
            <div className="flex flex-col h-[85vh]">
                {/* Header */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><FolderIcon className="w-8 h-8 mr-3 text-blue-500" /> Meus Documentos</h2>
                        <p className="text-sm text-gray-500 mt-1">Seu cofre digital para {trip.destination}. Salvo no seu Google Drive.</p>
                    </div>
                     <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                        {isAiProcessing && <div className="flex items-center text-sm text-gray-500"><SpinnerIcon /> <span className="ml-2">Analisando...</span></div>}
                        {isUploading && <div className="flex items-center text-sm text-gray-500"><SpinnerIcon /> <span className="ml-2">Enviando...</span></div>}
                        <button onClick={handleScanClick} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200" title="Escanear Documento"><CameraIcon className="w-5 h-5"/></button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200" title="Enviar Arquivo"><UploadCloudIcon className="w-5 h-5"/></button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex-shrink-0 flex justify-between items-center py-3">
                    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode('grid')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-600'}`}><GridIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'}`}><ListIcon className="w-5 h-5"/></button>
                    </div>
                    {selectedFileIds.size > 0 ? (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold">{selectedFileIds.size} selecionado(s)</span>
                            <button onClick={handleDeleteSelected} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ) : (
                        <button onClick={toggleSecurityLock} className="flex items-center text-sm p-2 rounded-lg hover:bg-gray-100" title={isSecurityLockEnabled ? "Desativar tranca de segurança" : "Ativar tranca de segurança"}>
                            {isSecurityLockEnabled ? <LockIcon className="w-5 h-5"/> : <UnlockIcon className="w-5 h-5" />}
                        </button>
                    )}
                </div>

                {/* Files Area */}
                <div 
                    className={`flex-grow overflow-y-auto -mx-8 px-8 py-4 ${isDragOver ? 'bg-blue-50' : ''}`}
                    onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                >
                    {filesState === 'loading' && <div className="flex justify-center items-center h-full"><SpinnerIcon /></div>}
                    {filesState === 'error' && <div className="text-center text-red-500">Erro ao carregar arquivos. Tente novamente.</div>}
                    {filesState === 'loaded' && files.length === 0 && (
                        <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
                            <UploadCloudIcon className="w-16 h-16 text-gray-300 mb-4"/>
                            <p className="font-semibold">Seu cofre está vazio.</p>
                            <p>Arraste e solte arquivos aqui ou use os botões acima.</p>
                        </div>
                    )}
                    {filesState === 'loaded' && files.length > 0 && (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                               {files.map(file => {
                                   const isSelected = selectedFileIds.has(file.id);
                                   const isOffline = offlineFileIds.includes(file.id);
                                   const isDownloading = downloadingFiles.has(file.id);
                                   return (
                                       <div key={file.id} className={`relative group rounded-lg border-2 ${isSelected ? 'border-blue-500' : 'border-gray-200'}`} onClick={() => toggleSelection(file.id)}>
                                           <div className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center">{isSelected && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}</div>
                                           <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-t-md overflow-hidden">
                                                <img src={file.thumbnailLink || file.iconLink} alt={file.displayName} className="w-full h-full object-cover"/>
                                           </div>
                                           <div className="p-2 text-xs">
                                               <p className="font-semibold truncate">{file.displayName}</p>
                                               <p className="text-gray-500">{CATEGORIES.find(c => c.id === file.category)?.name}</p>
                                           </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="p-2 bg-white/80 rounded-full hover:scale-110"><ExternalLinkIcon className="w-5 h-5"/></a>
                                                <button onClick={e=>{e.stopPropagation(); handleOfflineToggle(file)}} className="p-2 bg-white/80 rounded-full hover:scale-110">
                                                    {isDownloading ? <SpinnerIcon/> : (isOffline ? <CheckCloudIcon/> : <DownloadCloudIcon/>)}
                                                </button>
                                            </div>
                                       </div>
                                   )
                               })}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {files.map(file => {
                                     const isSelected = selectedFileIds.has(file.id);
                                     const isOffline = offlineFileIds.includes(file.id);
                                     const isDownloading = downloadingFiles.has(file.id);
                                     return (
                                        <div key={file.id} className={`flex items-center p-2 rounded-lg border-2 ${isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                                            <div className="mr-3 cursor-pointer" onClick={() => toggleSelection(file.id)}>
                                                <div className={`w-5 h-5 rounded-md border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}></div>
                                            </div>
                                            <img src={file.iconLink} alt="file icon" className="w-6 h-6 mr-3"/>
                                            <div className="flex-grow truncate">
                                                <p className="font-medium text-gray-800 truncate">{file.displayName}</p>
                                                <p className="text-xs text-gray-500">{CATEGORIES.find(c => c.id === file.category)?.name}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleOfflineToggle(file)} className="p-2 text-gray-500 hover:text-blue-600" title={isOffline ? "Remover do offline" : "Salvar para offline"}>
                                                    {isDownloading ? <SpinnerIcon/> : (isOffline ? <CheckCloudIcon/> : <DownloadCloudIcon/>)}
                                                </button>
                                                {isOffline ? (
                                                     <button type="button" onClick={() => handleViewOffline(file.id)} className="p-2 text-gray-500 hover:text-blue-600" title="Ver offline"><ExternalLinkIcon className="w-5 h-5"/></button>
                                                ) : (
                                                    <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-blue-600" title="Abrir no Google Drive"><ExternalLinkIcon className="w-5 h-5"/></a>
                                                )}
                                            </div>
                                        </div>
                                     )
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default DocumentsModal;