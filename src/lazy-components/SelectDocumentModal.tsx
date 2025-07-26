import React, { useState, useEffect, useCallback } from 'react';
import { Trip } from '../types';
import { 
    Modal, FolderIcon, SpinnerIcon, ModalHeaderIcon
} from '../components';

interface FileData {
    id: string;
    name: string;
    webViewLink: string;
}

interface Props {
    onClose: () => void;
    trip: Trip;
    onSelect: (file: { id: string, name: string }) => void;
}

const SelectDocumentModal: React.FC<Props> = ({ onClose, trip, onSelect }) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [filesState, setFilesState] = useState<'loading' | 'loaded' | 'error'>('loading');

    const listFiles = useCallback(async () => {
        if (!(window as any).gapi || !(window as any).gapi.client.drive || !trip.driveFolderId) {
            setFilesState('error');
            console.error("GAPI not ready or no trip folder ID");
            return;
        }
        setFilesState('loading');
        try {
            const response = await (window as any).gapi.client.drive.files.list({
                q: `'${trip.driveFolderId}' in parents and trashed=false`,
                fields: 'files(id, name, webViewLink)',
            });
            setFiles(response.result.files);
            setFilesState('loaded');
        } catch (e: any) {
            console.error("Error listing files:", e);
            setFilesState('error');
        }
    }, [trip.driveFolderId]);

    useEffect(() => {
        listFiles();
    }, [listFiles]);
    
    return (
        <Modal onClose={onClose} size="lg">
            <div className="text-center mb-8">
                <ModalHeaderIcon icon={FolderIcon} color="blue" />
                <h2 className="text-2xl font-bold">Anexar Documento</h2>
                <p className="text-gray-600">Selecione um arquivo de "Meus Documentos" para vincular a esta atividade.</p>
            </div>
             <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {filesState === 'loading' && <div className="flex justify-center items-center h-24"><SpinnerIcon /></div>}
                {filesState === 'error' && <div className="text-red-500 text-center"><p>Não foi possível carregar os documentos. Verifique se você conectou sua conta em "Meus Documentos" no menu.</p></div>}
                {filesState === 'loaded' && files.length > 0 && (
                    files.map((file: FileData) => (
                        <button 
                            key={file.id} 
                            onClick={() => onSelect({id: file.id, name: file.name})}
                            className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors text-left"
                        >
                            <span className="font-medium text-gray-800 truncate pr-2">{file.name}</span>
                            <span className="text-sm font-semibold text-blue-600">Selecionar</span>
                        </button>
                    ))
                )}
                {filesState === 'loaded' && files.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Nenhum documento salvo em "Meus Documentos" para esta viagem. Adicione arquivos lá primeiro.</p>
                )}
            </div>
        </Modal>
    );
};

export default SelectDocumentModal;
