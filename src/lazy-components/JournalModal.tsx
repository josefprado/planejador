import React, { useState, useEffect, useMemo, useCallback, useRef, FC } from 'react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trip, User, AppSettings, JournalEntry } from '../types';
import { Modal, ModalHeaderIcon, BookOpenIcon, SpinnerIcon, SparklesIcon, ShareIcon, CameraIcon, XIcon } from '../components';
import { GoogleGenAI } from '@google/genai';
import html2canvas from 'html2canvas';

// Helper to get dates
const getDatesInRange = (startDateStr: string, endDateStr: string): string[] => {
    const dates: string[] = [];
    let currentDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// --- Memory Card Component ---
const MemoryCard: FC<{ entry: JournalEntry, onShare: () => void, shareableRef: React.RefObject<HTMLDivElement> }> = ({ entry, onShare, shareableRef }) => {
    const photoUrl = entry.photoUrls?.find(p => p.id === entry.chroniclePhotoId)?.url;

    return (
        <div className="space-y-4">
            <div ref={shareableRef} className="bg-gray-800 p-6 rounded-lg shadow-xl text-white font-playfair relative aspect-[9/16] flex flex-col justify-end" style={{ backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-0"></div>
                 <div className="relative z-10">
                    <p className="text-lg md:text-xl leading-relaxed text-shadow-lg">{entry.chronicle}</p>
                    <p className="text-right text-sm opacity-80 mt-4">- {new Date(`${entry.id}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} -</p>
                 </div>
            </div>
            <button onClick={onShare} className="w-full py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center">
                <ShareIcon className="w-5 h-5 mr-2" /> Compartilhar Recordação
            </button>
        </div>
    );
};

// --- Main Journal Modal Component ---
interface JournalModalProps {
    onClose: () => void;
    trip: Trip;
    user: User | null;
    appSettings: AppSettings;
}

const JournalModal: FC<JournalModalProps> = ({ onClose, trip, appSettings }) => {
    const [journalEntries, setJournalEntries] = useState<Record<string, JournalEntry>>({});
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [error, setError] = useState('');
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<{ id: string, url: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const shareableCardRef = useRef<HTMLDivElement>(null);
    const datesInRange = useMemo(() => getDatesInRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
    const journalColRef = useMemo(() => collection(db, 'trips', trip.id, 'journalEntries'), [trip.id]);

    useEffect(() => {
        setSelectedDate(datesInRange[0] || '');
        const unsubscribe = onSnapshot(journalColRef, (snapshot) => {
            const entries: Record<string, JournalEntry> = {};
            snapshot.forEach(doc => {
                entries[doc.id] = { id: doc.id, ...doc.data() } as JournalEntry;
            });
            setJournalEntries(entries);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [journalColRef, datesInRange]);

    const currentEntry = useMemo(() => journalEntries[selectedDate], [journalEntries, selectedDate]);

    // Load notes and photos when the current entry changes
    useEffect(() => {
        setNotes(currentEntry?.notes || '');
        setPhotos(currentEntry?.photoUrls || []);
    }, [currentEntry]);
    
    // --- Handlers ---
    const handleSaveNotes = useCallback(async (newNotes: string) => {
        const entryRef = doc(journalColRef, selectedDate);
        const data: Partial<JournalEntry> = { notes: newNotes };
        if (!currentEntry) {
            data.id = selectedDate;
            data.photoIds = [];
        }
        await setDoc(entryRef, data, { merge: true });
    }, [selectedDate, journalColRef, currentEntry]);

    const handlePhotoUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        
        const accessToken = sessionStorage.getItem('googleDriveToken');
        if (!trip.driveFolderId || !accessToken) {
            setError("Conexão com o Drive não está ativa. Tente reabrir a seção 'Meus Documentos'.");
            return;
        }

        setIsGenerating(true);
        setGenerationStatus(`Enviando foto...`);

        try {
            // Ensure journal folder exists
            const journalDriveFolderId = await getOrCreateJournalDriveFolder(trip.driveFolderId, accessToken);
            
            // Upload
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ name: file.name, parents: [journalDriveFolderId] })], { type: 'application/json' }));
            form.append('file', file);
            
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                body: form,
            });

            if (!response.ok) throw new Error('Falha no upload do arquivo.');
            const result = await response.json();
            const newPhotoId = result.id;

            // Update Firestore
            const entryRef = doc(journalColRef, selectedDate);
            const newPhotoIds = [...(currentEntry?.photoIds || []), newPhotoId];
            await setDoc(entryRef, { id: selectedDate, photoIds: newPhotoIds }, { merge: true });
        } catch (e) {
            console.error(e);
            setError("Erro ao enviar a foto.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const getOrCreateJournalDriveFolder = async (parentFolderId: string, accessToken: string) => {
        const q = `name='Diário de Bordo' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, {
             headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (data.files && data.files.length > 0) return data.files[0].id;

        // Create if not exists
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Diário de Bordo', mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] })
        });
        const createData = await createResponse.json();
        return createData.id;
    }

    const fetchPhotoUrls = useCallback(async (photoIds: string[]): Promise<{ id: string, url: string }[]> => {
        const accessToken = sessionStorage.getItem('googleDriveToken');
        if (!accessToken) {
            setError("Token de acesso expirado.");
            return [];
        }

        const urls = await Promise.all(photoIds.map(async (id) => {
            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!response.ok) throw new Error(`Failed to download ${id}`);
                const blob = await response.blob();
                return { id, url: URL.createObjectURL(blob) };
            } catch (e) {
                console.error(e);
                return { id, url: '' };
            }
        }));
        return urls.filter(u => u.url);
    }, []);

    const handleGenerate = async () => {
        if (!currentEntry || !currentEntry.photoIds || currentEntry.photoIds.length === 0) {
            setError("Adicione pelo menos uma foto e algumas notas para criar sua recordação.");
            return;
        }

        const isWifi = navigator.onLine && (!('connection' in navigator) || (navigator as any).connection.type === 'wifi');
        if (!isWifi) {
            if (!window.confirm("Você não está em uma rede Wi-Fi. A geração da sua recordação usa fotos e pode consumir muitos dados. Deseja continuar?")) {
                return;
            }
        }
        
        setIsGenerating(true);
        setError('');
        
        try {
            setGenerationStatus('Carregando suas fotos...');
            const photoUrls = await fetchPhotoUrls(currentEntry.photoIds);
            const base64Photos = await Promise.all(photoUrls.map(async (p, index) => {
                 setGenerationStatus(`Processando foto ${index + 1} de ${photoUrls.length}...`);
                 const response = await fetch(p.url);
                 const blob = await response.blob();
                 return new Promise<string>((resolve, reject) => {
                     const reader = new FileReader();
                     reader.onload = () => resolve((reader.result as string).split(',')[1]);
                     reader.onerror = reject;
                     reader.readAsDataURL(blob);
                 });
            }));

            setGenerationStatus('Nosso escritor está criando sua história...');
            const ai = new GoogleGenAI({ apiKey: appSettings.geminiApiKey! });
            
            const promptParts = [
                { text: `Você é um escritor de viagens. Sua tarefa é criar uma crônica curta, pessoal e emocionante baseada nas anotações e fotos de um dia de viagem. Use um tom nostálgico e criativo. Não descreva as imagens literalmente, mas capture o sentimento que elas transmitem junto com as anotações. Notas do usuário: "${currentEntry.notes}"` },
                ...base64Photos.map(data => ({ inlineData: { mimeType: 'image/jpeg', data } }))
            ];

            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: promptParts },
            });
            
            if (!result || !result.text) throw new Error("A resposta da IA estava vazia.");
            
            setGenerationStatus('Salvando sua recordação...');
            const entryRef = doc(journalColRef, selectedDate);
            await setDoc(entryRef, {
                chronicle: result.text,
                chroniclePhotoId: currentEntry.photoIds[0] // Use the first photo for the card background
            }, { merge: true });

        } catch (e) {
            console.error(e);
            setError("Ocorreu um erro mágico... Tente novamente mais tarde.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        if (!shareableCardRef.current) return;
        const canvas = await html2canvas(shareableCardRef.current, { useCORS: true });
        canvas.toBlob(async (blob) => {
            if (blob && navigator.share) {
                const file = new File([blob], 'recordacao.png', { type: 'image/png' });
                try {
                    await navigator.share({
                        title: 'Recordação da minha viagem!',
                        files: [file]
                    });
                } catch (e) {
                    console.log("Compartilhamento cancelado.");
                }
            }
        });
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!window.confirm("Tem certeza que deseja apagar esta foto?")) return;
        
        const newPhotoIds = currentEntry.photoIds.filter(id => id !== photoId);
        const entryRef = doc(journalColRef, selectedDate);
        await setDoc(entryRef, { photoIds: newPhotoIds }, { merge: true });

        // Note: This doesn't delete the file from Drive to prevent accidental data loss.
    }

    if (isLoading) {
        return <Modal onClose={onClose} size="lg"><div className="text-center p-8"><SpinnerIcon/></div></Modal>;
    }

    return (
        <Modal onClose={onClose} size="lg">
            <div className="flex flex-col h-[85vh]">
                <div className="flex-shrink-0 text-center mb-6">
                    <ModalHeaderIcon icon={BookOpenIcon} color="purple" />
                    <h2 className="text-2xl font-bold">Diário de Bordo</h2>
                    <p className="text-gray-600">Registre os melhores momentos da sua viagem.</p>
                </div>
                
                {/* Day Selector */}
                <div className="flex-shrink-0 mb-4 border-b border-gray-200">
                    <div className="flex space-x-2 overflow-x-auto pb-2 -mx-6 px-6">
                        {datesInRange.map(date => (
                            <button key={date} onClick={() => setSelectedDate(date)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedDate === date ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Dia {new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto -mx-6 px-6">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <SpinnerIcon className="w-10 h-10 text-purple-600 mb-4" />
                            <p className="font-semibold text-lg">{generationStatus}</p>
                            <p className="text-gray-500">Isso pode levar um momento...</p>
                        </div>
                    ) : currentEntry?.chronicle ? (
                        <MemoryCard entry={currentEntry} onShare={handleShare} shareableRef={shareableCardRef} />
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-700">O que tornou este dia especial?</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    onBlur={e => handleSaveNotes(e.target.value)}
                                    placeholder="Descreva seus sentimentos, uma descoberta, um momento engraçado..."
                                    rows={4}
                                    className="w-full mt-1 p-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Fotos do dia ({photos.length}/5)</label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {photos.map(p => (
                                        <div key={p.id} className="relative group aspect-square bg-gray-200 rounded-md">
                                            <img src={p.url} alt="thumbnail" className="w-full h-full object-cover rounded-md" />
                                            <button onClick={() => handleDeletePhoto(p.id)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {photos.length < 5 && (
                                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md text-gray-400 hover:bg-gray-50">
                                            <CameraIcon className="w-8 h-8"/>
                                            <span className="text-xs mt-1">Adicionar</span>
                                        </button>
                                    )}
                                </div>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => e.target.files && handlePhotoUpload(e.target.files)} className="hidden" />
                            </div>
                             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                             <button onClick={handleGenerate} className="w-full py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50" disabled={!notes || photos.length === 0}>
                                <SparklesIcon className="w-5 h-5 mr-2" /> Revelar a História do Dia
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default JournalModal;