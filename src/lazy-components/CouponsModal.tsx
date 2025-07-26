import { useState, useEffect, useMemo, FC } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Coupon, CouponCategory, User, AppSettings } from '../types';
import { Modal, GiftIcon, SpinnerIcon, CheckIcon, ExternalLinkIcon, ModalHeaderIcon } from '../components';
import { trackViewCouponList, trackFilterCoupon, trackCouponUse } from '../../services/analyticsEvents';
import { logUserIntent } from '../stores/authStore';


const couponCategories: CouponCategory[] = ['Alimentação', 'Compras', 'Transporte', 'Serviços', 'Passeios', 'Hospedagem', 'Outros'];

interface CouponCardProps {
    coupon: Coupon;
    onAction: (coupon: Coupon) => void;
    copiedId: string | null;
}

const CouponCard: FC<CouponCardProps> = ({ coupon, onAction, copiedId }) => {
    
    const getOfferText = () => {
        if (coupon.discountType === 'percentage' && coupon.discountValue) {
            return <><span className="text-4xl font-black">{coupon.discountValue}</span><span className="text-2xl font-bold">% OFF</span></>;
        }
        if (coupon.discountType === 'fixed' && coupon.discountValue) {
            return <><span className="text-2xl font-bold">R$</span><span className="text-4xl font-black">{coupon.discountValue}</span></>;
        }
        return <span className="text-lg font-bold">{coupon.offerTitle}</span>;
    };
    
    const getButtonContent = () => {
        if (copiedId === coupon.id) return <><CheckIcon className="w-5 h-5"/> Copiado!</>;
        if (coupon.type === 'code') return "Copiar Código";
        return <span className="flex items-center justify-center">Acessar Oferta <ExternalLinkIcon className="w-4 h-4 ml-1.5"/></span>;
    };
    
    return (
        <div className="bg-white rounded-2xl shadow-lg flex overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            {/* Left part */}
            <div className="w-2/3 p-4 flex flex-col">
                <div className="flex-grow">
                    <div className="flex items-center mb-2">
                        {coupon.logoUrl && <img src={coupon.logoUrl} alt={`${coupon.companyName} logo`} className="w-8 h-8 mr-3 object-contain"/>}
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg leading-tight">{coupon.companyName}</h3>
                            <p className="text-gray-600 text-sm leading-tight">{coupon.offerTitle}</p>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{coupon.description}</p>
                    {coupon.usageInstructions && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Instruções:</p>
                            <p className="text-xs text-gray-500 mt-1">{coupon.usageInstructions}</p>
                        </div>
                    )}
                </div>
                 <div className="text-gray-400 text-xs mt-3 pt-2 border-t border-gray-100">
                    {coupon.isUnlimited || !coupon.expiresAt ? 'Sem data de validade' : `Válido até ${new Date(coupon.expiresAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                </div>
            </div>
            
            {/* Dashed line */}
            <div className="w-0 border-l-2 border-dashed border-gray-300"></div>

            {/* Right part */}
            <div className="w-1/3 bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="text-blue-600 mb-3">{getOfferText()}</div>
                <button 
                    onClick={() => onAction(coupon)} 
                    className={`w-full py-2 px-3 text-sm font-bold text-white rounded-lg transition-colors flex items-center justify-center ${copiedId === coupon.id ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {getButtonContent()}
                </button>
            </div>
        </div>
    );
};

interface Props {
    onClose: () => void;
    user: User | null;
    appSettings: AppSettings;
}

const CouponsModal: FC<Props> = ({ onClose, user, appSettings }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState<CouponCategory | 'Todos'>('Todos');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        trackViewCouponList(appSettings, user);
        const q = query(collection(db, 'coupons'), where('isActive', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedCoupons: Coupon[] = [];
            snapshot.forEach(doc => {
                const data = doc.data() as Omit<Coupon, 'id'>;
                const isExpired = data.expiresAt && !data.isUnlimited && new Date(data.expiresAt) < new Date();
                if (!isExpired) {
                    fetchedCoupons.push({ id: doc.id, ...data });
                }
            });
            setCoupons(fetchedCoupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching coupons:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user, appSettings]);
    
    const handleCategorySelect = (category: CouponCategory | 'Todos') => {
        trackFilterCoupon(appSettings, user, category);
        setSelectedCategory(category);
    };

    const handleAction = (coupon: Coupon) => {
        trackCouponUse(appSettings, user, coupon);
        logUserIntent('used_coupon', `Cupom: ${coupon.companyName} - ${coupon.offerTitle}`);
        if (coupon.type === 'code' && coupon.code) {
            navigator.clipboard.writeText(coupon.code);
            setCopiedId(coupon.id);
            setTimeout(() => setCopiedId(null), 2500);
        } else if (coupon.type === 'url' && coupon.url) {
            window.open(coupon.url, '_blank', 'noopener,noreferrer');
        }
    };

    const filteredCoupons = useMemo(() => {
        if (selectedCategory === 'Todos') return coupons;
        return coupons.filter((c: Coupon) => c.category === selectedCategory);
    }, [coupons, selectedCategory]);

    return (
        <Modal onClose={onClose} size="3xl">
            <div className="text-center">
                <ModalHeaderIcon icon={GiftIcon} color="blue" />
                <h2 className="text-2xl font-bold my-2">Clube de Vantagens</h2>
                <p className="text-gray-600 mb-6">Cupons e descontos exclusivos para sua viagem!</p>
            </div>

            <div className="mb-6 sticky top-0 bg-white pt-2 pb-4 z-10">
                <div className="flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => handleCategorySelect('Todos')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${selectedCategory === 'Todos' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'}`}
                    >
                        Todos
                    </button>
                    {couponCategories.map(cat => (
                         <button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                {isLoading ? (
                    <div className="flex justify-center items-center py-10"><SpinnerIcon /></div>
                ) : filteredCoupons.length > 0 ? (
                    filteredCoupons.map((coupon: Coupon) => <CouponCard key={coupon.id} coupon={coupon} onAction={handleAction} copiedId={copiedId} />)
                ) : (
                    <p className="text-center text-gray-500 py-10">Nenhum cupom disponível nesta categoria no momento.</p>
                )}
            </div>
        </Modal>
    );
};

export default CouponsModal;