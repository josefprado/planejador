
import React, { useState, useEffect, FC } from 'react';
import { collection, query, doc, updateDoc, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../../firebase';
import { User } from '../types';
import { SpinnerIcon, EditIcon } from '../components';

interface UserEditModalProps {
    user: User;
    onClose: () => void;
    onSave: (uid: string, data: Partial<User>) => void;
}

const UserEditModal: FC<UserEditModalProps> = ({ user, onClose, onSave }) => {
    const [premiumAccessUntil, setPremiumAccessUntil] = useState(user.premiumAccessUntil || '');

    const handleSave = () => {
        onSave(user.uid, { premiumAccessUntil });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Editar Acesso de {user.displayName}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Acesso Premium até</label>
                        <input
                            type="date"
                            value={premiumAccessUntil}
                            onChange={e => setPremiumAccessUntil(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                         <p className="text-xs text-gray-500 mt-1">Deixe em branco para remover o acesso premium.</p>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                </div>
            </div>
        </div>
    );
};


const UsersManager: FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            let q;
            if (searchTerm.trim() === '') {
                 q = query(collection(db, 'users'), orderBy('displayName'));
            } else {
                 q = query(collection(db, 'users'), orderBy('displayName'), startAt(searchTerm), endAt(searchTerm + '\uf8ff'));
                 // This is a basic search. For more complex search (e.g., email), you'd need more complex queries or a search service like Algolia.
            }
            
            const querySnapshot = await getDocs(q);
            setUsers(querySnapshot.docs.map(doc => (Object.assign({}, doc.data(), { uid: doc.id }) as User)));
            setIsLoading(false);
        };
        
        const debounce = setTimeout(() => {
            fetchUsers();
        }, 500); // Debounce search to avoid too many reads

        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleSaveUser = async (uid: string, data: Partial<User>) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, data as { [x: string]: any });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...data } : u));
        } catch (error) {
            console.error("Error saving user:", error);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
                <input 
                    type="text" 
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-1/3 p-2 border rounded-md"
                />
            </div>
            {userToEdit && <UserEditModal user={userToEdit} onClose={() => setUserToEdit(null)} onSave={handleSaveUser} />}
             <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-left font-semibold">Nome</th>
                            <th className="p-2 text-left font-semibold">Email</th>
                            <th className="p-2 text-left font-semibold">Acesso Premium Até</th>
                            <th className="p-2 text-left font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center p-8"><SpinnerIcon /></td></tr>
                        ) : users.map((user: User) => (
                            <tr key={user.uid} className="border-b hover:bg-gray-50">
                                <td className="p-2">{user.displayName}</td>
                                <td className="p-2">{user.email}</td>
                                <td className="p-2">{user.premiumAccessUntil ? new Date(user.premiumAccessUntil + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>
                                <td className="p-2">
                                    <button onClick={() => setUserToEdit(user)} className="text-blue-600"><EditIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersManager;
