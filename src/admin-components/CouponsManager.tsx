import React, { useState, useEffect, FC } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Coupon, CouponType, DiscountType, CouponCategory } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../components';

const couponCategories: CouponCategory[] = ['Alimentação', 'Compras', 'Transporte', 'Serviços', 'Passeios', 'Hospedagem', 'Outros'];
const couponTypes: CouponType[] = ['code', 'url'];
const discountTypes: DiscountType[] = ['percentage', 'fixed', 'other'];

type CouponFormState = Omit<Coupon, 'id' | 'createdAt' | 'expiresAt'> & {
    id?: string;
    createdAt?: string;
    expiresAt?: string; // Keep expiresAt as a string for the date input
};

interface CouponFormModalProps {
    onClose: () => void;
    onSave: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => void;
    couponToEdit: Coupon | null;
}

const CouponFormModal: FC<CouponFormModalProps> = ({ onClose, onSave, couponToEdit }) => {
    const [formState, setFormState] = useState<CouponFormState>({
        companyName: '', offerTitle: '', description: '', category: 'Outros', type: 'code', discountType: 'percentage', isActive: true, isUnlimited: false,
    });

    useEffect(() => {
        if (couponToEdit) {
            setFormState({
                ...couponToEdit,
                expiresAt: couponToEdit.expiresAt ? new Date(couponToEdit.expiresAt).toISOString().split('T')[0] : '',
            });
        }
    }, [couponToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             setFormState((prev: CouponFormState) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
            setFormState((prev: CouponFormState) => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
        } else {
             setFormState((prev: CouponFormState) => ({ ...prev, [name]: value as any }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { id, createdAt, ...dataToSave } = formState; // Exclude id and createdAt
        const finalData: Omit<Coupon, 'id' | 'createdAt'> = {
            ...dataToSave,
            expiresAt: formState.isUnlimited || !formState.expiresAt 
                ? undefined 
                : new Date(formState.expiresAt + 'T00:00:00Z').toISOString(),
        };
        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{couponToEdit ? 'Editar' : 'Adicionar'} Cupom</h2>
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="companyName" value={formState.companyName} onChange={handleChange} placeholder="Nome da Empresa" className="w-full p-2 border rounded" required />
                        <input name="offerTitle" value={formState.offerTitle} onChange={handleChange} placeholder="Título da Oferta (ex: 20% OFF)" className="w-full p-2 border rounded" required />
                    </div>
                    <textarea name="description" value={formState.description} onChange={handleChange} placeholder="Descrição da oferta" className="w-full p-2 border rounded" required />
                    <textarea name="usageInstructions" value={formState.usageInstructions || ''} onChange={handleChange} placeholder="Instruções de uso (opcional)" className="w-full p-2 border rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="logoUrl" value={formState.logoUrl || ''} onChange={handleChange} placeholder="URL do Logo" className="w-full p-2 border rounded" />
                        <input name="imageUrl" value={formState.imageUrl || ''} onChange={handleChange} placeholder="URL da Imagem de Destaque" className="w-full p-2 border rounded" />
                    </div>
                    <select name="category" value={formState.category} onChange={handleChange} className="w-full p-2 border rounded"><option disabled>Categoria</option>{couponCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select name="type" value={formState.type} onChange={handleChange} className="w-full p-2 border rounded">{couponTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                        <select name="discountType" value={formState.discountType} onChange={handleChange} className="w-full p-2 border rounded">{discountTypes.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        <input name="discountValue" value={formState.discountValue || ''} onChange={handleChange} type="number" step="0.01" placeholder="Valor do Desconto" className="w-full p-2 border rounded" />
                    </div>
                     {formState.type === 'code' && <input name="code" value={formState.code || ''} onChange={handleChange} placeholder="Código do Cupom" className="w-full p-2 border rounded" />}
                     {formState.type === 'url' && <input name="url" value={formState.url || ''} onChange={handleChange} placeholder="URL da Oferta" className="w-full p-2 border rounded" />}
                    <div className="flex items-center space-x-4">
                         <label className="flex items-center"><input type="checkbox" name="isUnlimited" checked={formState.isUnlimited} onChange={handleChange} className="mr-2" /> Sem Validade</label>
                        {!formState.isUnlimited && <input name="expiresAt" value={formState.expiresAt || ''} onChange={handleChange} type="date" className="w-full p-2 border rounded" />}
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="partnerName" value={formState.partnerName || ''} onChange={handleChange} placeholder="Nome do Parceiro (admin)" className="w-full p-2 border rounded" />
                        <input name="partnerEmail" value={formState.partnerEmail || ''} onChange={handleChange} placeholder="E-mail do Parceiro (admin)" className="w-full p-2 border rounded" />
                    </div>
                     <input name="companyWebsite" value={formState.companyWebsite || ''} onChange={handleChange} placeholder="Site da Empresa (admin)" className="w-full p-2 border rounded" />
                     <label className="flex items-center"><input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleChange} className="mr-2" /> Ativo</label>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CouponsManager: FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (couponData: Omit<Coupon, 'id' | 'createdAt'>) => {
        try {
            if (couponToEdit) {
                await updateDoc(doc(db, 'coupons', couponToEdit.id), { ...couponData, createdAt: couponToEdit.createdAt } as { [key: string]: any });
            } else {
                await addDoc(collection(db, 'coupons'), { ...couponData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
            setCouponToEdit(null);
        } catch (error) {
            console.error("Error saving coupon:", error);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja apagar este cupom?")) {
            await deleteDoc(doc(db, 'coupons', id));
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><SpinnerIcon /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Cupons</h1>
                <button onClick={() => { setCouponToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                    <PlusIcon /> <span className="ml-2">Novo Cupom</span>
                </button>
            </div>
            {isModalOpen && <CouponFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} couponToEdit={couponToEdit} />}
            <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-left font-semibold">Empresa</th>
                            <th className="p-2 text-left font-semibold">Oferta</th>
                            <th className="p-2 text-left font-semibold">Categoria</th>
                            <th className="p-2 text-left font-semibold">Status</th>
                            <th className="p-2 text-left font-semibold">Validade</th>
                            <th className="p-2 text-left font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map((coupon: Coupon) => (
                            <tr key={coupon.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{coupon.companyName}</td>
                                <td className="p-2">{coupon.offerTitle}</td>
                                <td className="p-2">{coupon.category}</td>
                                <td className="p-2">{coupon.isActive ? <span className="text-green-600">Ativo</span> : <span className="text-red-600">Inativo</span>}</td>
                                <td className="p-2">{coupon.isUnlimited || !coupon.expiresAt ? 'Ilimitado' : new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setCouponToEdit(coupon); setIsModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                    <button onClick={() => handleDelete(coupon.id)} className="text-red-600"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CouponsManager;