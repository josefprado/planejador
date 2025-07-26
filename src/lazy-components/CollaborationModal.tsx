import React, { useState, FC } from 'react';
import { Trip, User, CollaboratorRole, Collaborator } from '../types';
import { Modal, UsersIcon, TrashIcon, SpinnerIcon, ModalHeaderIcon } from '../components';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

interface Props {
    onClose: () => void;
    trip: Trip;
    onUpdateCollaborators: (tripId: string, collaborators: Trip['collaborators'], memberIds: string[]) => void;
    currentUser: User;
}

const CollaborationModal: FC<Props> = ({ onClose, trip, onUpdateCollaborators, currentUser }) => {
    const [inviteEmail, setInviteEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [info, setInfo] = useState<string>('');
    const isOwner = trip.ownerId === currentUser.uid;

    const handleInvite = async () => {
        if (!isOwner || !inviteEmail.trim()) return;
        setError('');
        setInfo('');
        setIsLoading(true);

        const emailToInvite = inviteEmail.trim().toLowerCase();

        if(emailToInvite === currentUser.email) {
            setError("Você não pode convidar a si mesmo.");
            setIsLoading(false);
            return;
        }

        if (trip.collaborators && (Object.values(trip.collaborators) as Collaborator[]).some((c: Collaborator) => c.email === emailToInvite)) {
            setError("Este usuário já faz parte da viagem.");
            setIsLoading(false);
            return;
        }

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", emailToInvite));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                const subject = `Convite para planejar nossa viagem: ${trip.destination}`;
                const body = `Olá!\n\n${currentUser.displayName} convidou você para colaborar no planejamento da viagem para "${trip.destination}" no app Planejador de Viagens: Lá em Orlando.\n\nPara participar, acesse o link abaixo, crie sua conta (ou faça login) com este mesmo e-mail (${emailToInvite}) e avise seu amigo para que ele possa te adicionar ao planejamento.\n\n${window.location.origin}\n\nAtenciosamente,\nEquipe Lá em Orlando Travel`;

                const mailtoLink = `mailto:${emailToInvite}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(mailtoLink, '_self');
                
                setInfo(`Não encontramos uma conta com este e-mail. Para sua conveniência, abrimos seu aplicativo de e-mail para que você possa convidá-lo(a) a se registrar. Após o cadastro, volte aqui para adicioná-lo(a) à viagem.`);
                setInviteEmail('');

            } else {
                const invitedUserDoc = querySnapshot.docs[0];
                const invitedUser = { uid: invitedUserDoc.id, ...invitedUserDoc.data() } as User;
                
                const newCollaborators = {
                    ...trip.collaborators,
                    [invitedUser.uid]: {
                        role: 'viewer' as CollaboratorRole,
                        displayName: invitedUser.displayName || '',
                        photoURL: invitedUser.photoURL || '',
                        email: invitedUser.email || '',
                    }
                };
                const newMemberIds = [...trip.memberIds, invitedUser.uid];
                
                onUpdateCollaborators(trip.id, newCollaborators, newMemberIds);
                setInfo(`${invitedUser.displayName} foi adicionado à viagem!`);
                setInviteEmail('');
            }
        } catch (e) {
            const error = e as any;
            if(error.code === 'failed-precondition') {
                 setError("Para buscar usuários por e-mail, é necessário criar um índice no Firestore. Clique no link na mensagem de erro do console para criá-lo (isso pode levar alguns minutos). Após criar, atualize a página.");
                 setInfo(error.message); // Show the full error message which contains the link
            } else {
                setError("Ocorreu um erro ao convidar o usuário.");
            }
            console.error("Error inviting user:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = (uid: string, role: CollaboratorRole) => {
        if (!isOwner) return;
        const newCollaborators = { ...trip.collaborators };
        newCollaborators[uid].role = role;
        onUpdateCollaborators(trip.id, newCollaborators, trip.memberIds);
    };

    const handleRemoveCollaborator = (uid: string) => {
        if (!isOwner) return;
        if (window.confirm("Tem certeza que deseja remover este participante?")) {
            const newCollaborators = { ...trip.collaborators };
            delete newCollaborators[uid];
            const newMemberIds = trip.memberIds.filter((id: string) => id !== uid);
            onUpdateCollaborators(trip.id, newCollaborators, newMemberIds);
        }
    };
    
    const handleLeaveTrip = () => {
        if (isOwner) {
            setError("O dono não pode sair da viagem. Você pode excluí-la na tela principal.");
            return;
        }
        if (window.confirm("Tem certeza que deseja sair desta viagem compartilhada?")) {
            const newCollaborators = { ...trip.collaborators };
            delete newCollaborators[currentUser.uid];
            const newMemberIds = trip.memberIds.filter((id: string) => id !== currentUser.uid);
            onUpdateCollaborators(trip.id, newCollaborators, newMemberIds);
            onClose();
        }
    }

    return (
        <Modal onClose={onClose} size="lg">
            <div className="text-center mb-6">
                <ModalHeaderIcon icon={UsersIcon} color="blue" />
                <h2 className="text-2xl font-bold">Convidar para a Viagem</h2>
                <p className="text-gray-600">Convide amigos e família para planejarem juntos!</p>
            </div>
            
            {isOwner && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Convidar novo participante</h3>
                    <div className="flex space-x-2">
                        <input
                            type="email"
                            placeholder="E-mail do convidado"
                            value={inviteEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setInviteEmail(e.target.value); setError(''); setInfo(''); }}
                            className="w-full p-2.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                        />
                        <button onClick={handleInvite} disabled={isLoading} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {isLoading ? <SpinnerIcon /> : "Convidar"}
                        </button>
                    </div>
                </div>
            )}
            
            {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm my-4">{error} {info.includes('https://') && <a href={info.match(/https:\/\/[^ )]*/)?.[0]} target="_blank" rel="noopener noreferrer" className="font-bold underline">Criar Índice</a>}</div>}
            {info && !info.includes('https://') && <div className="text-blue-600 bg-blue-50 p-3 rounded-lg text-sm my-4">{info}</div>}

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                <h3 className="font-semibold text-gray-800">Participantes</h3>
                {trip.collaborators && Object.entries(trip.collaborators).map(([uid, collaborator]: [string, Collaborator]) => (
                    <div key={uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center truncate">
                            <img src={collaborator.photoURL || `https://ui-avatars.com/api/?name=${collaborator.displayName || collaborator.email}&background=random`} alt={collaborator.displayName || ''} className="w-10 h-10 rounded-full mr-3" />
                            <div className="truncate">
                                <p className="font-medium text-gray-800 truncate">{collaborator.displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{uid === trip.ownerId ? 'Dono(a)' : (collaborator.role === 'editor' ? 'Pode Editar' : 'Pode Visualizar')}</p>
                            </div>
                        </div>
                        {isOwner && uid !== trip.ownerId ? (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                                <select value={collaborator.role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRoleChange(uid, e.target.value as CollaboratorRole)} className="text-xs rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Visualizador</option>
                                </select>
                                <button onClick={() => handleRemoveCollaborator(uid)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            {!isOwner && (
                <div className="mt-6 border-t pt-4 text-center">
                    <button onClick={handleLeaveTrip} className="text-sm text-red-600 hover:underline">Sair desta viagem</button>
                </div>
            )}
        </Modal>
    );
};

export default CollaborationModal;