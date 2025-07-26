
import React, { useState, useEffect, FC } from 'react';
import { User } from '../types';
import { Modal, CheckIcon } from '../components';

interface Props {
    onClose: () => void;
    onSave: (data: Partial<User>) => void;
    user: User;
    persistent: boolean;
    onCancelAndLogout: () => void;
}

const ProfileModal: FC<Props> = ({ onClose, onSave, user, persistent, onCancelAndLogout }) => {
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [state, setState] = useState<string>('');
    const [country, setCountry] = useState<string>('Brasil');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (user) {
            const nameParts = user.displayName?.split(' ') || [];
            setFirstName(user.firstName || nameParts[0] || '');
            setLastName(user.lastName || nameParts.slice(1).join(' ') || '');
            setPhone(user.phone || '');
            setCity(user.city || '');
            setState(user.state || '');
            setCountry(user.country || 'Brasil');
            setError('');
        }
    }, [user]);

    const formatPhone = (value: string): string => {
        if (!value) return "";
        let onlyDigits = value.replace(/\D/g, '');
        if (onlyDigits.length > 11) {
            onlyDigits = onlyDigits.slice(0, 11);
        }
        
        if (country.toLowerCase().includes('brasil')) {
             if (onlyDigits.length > 2) {
                onlyDigits = `(${onlyDigits.substring(0, 2)}) ${onlyDigits.substring(2)}`;
            }
            if (onlyDigits.length > 9) {
                 onlyDigits = `${onlyDigits.substring(0, 9)}-${onlyDigits.substring(9)}`;
            }
        }
        return onlyDigits;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhone(e.target.value));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            setError('Nome e sobrenome são obrigatórios.');
            return;
        }
        setError('');
        onSave({ 
            firstName: firstName.trim(), 
            lastName: lastName.trim(), 
            phone, 
            city: city.trim(), 
            state: state.trim(), 
            country: country.trim() 
        });
    };

    const handleCancel = () => {
        if (!persistent) {
            onClose();
        } else {
            onCancelAndLogout();
        }
    }

    return (
        <Modal onClose={persistent ? () => {} : onClose} size="lg" persistent={persistent}>
            <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold mb-2">{persistent ? 'Complete seu Cadastro' : 'Editar Perfil'}</h2>
                <p className="text-gray-600 mb-6">{persistent ? 'Precisamos de mais algumas informações para personalizar sua experiência.' : 'Mantenha seus dados atualizados.'}</p>
                
                {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm my-4">{error}</p>}

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Nome</label>
                            <input type="text" placeholder="Seu nome" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Sobrenome</label>
                            <input type="text" placeholder="Seu sobrenome" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" required />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Telefone (com DDD)</label>
                        <input type="tel" placeholder="(11) 99999-9999" value={phone} onChange={handlePhoneChange} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                           <label className="text-sm font-medium text-gray-600">Cidade</label>
                           <input type="text" value={city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Estado</label>
                            <input type="text" value={state} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                        </div>
                        <div>
                           <label className="text-sm font-medium text-gray-600">País</label>
                           <input type="text" value={country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCountry(e.target.value)} className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                    <button type="submit" className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-all transform hover:scale-105 flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 mr-2" /> Salvar Perfil
                    </button>
                    {persistent && (
                        <button type="button" onClick={handleCancel} className="w-full mt-3 text-sm text-center text-red-600 hover:underline">
                            Cancelar Cadastro e Sair
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default ProfileModal;
