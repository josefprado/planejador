
import React, { useState, FC } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useTripStore } from '../stores/tripStore';
import { Traveler, Accommodation, TravelStyle, BudgetLevel } from '../types';
import { SpinnerIcon, UsersIcon, BedIcon, SparklesIcon, LightbulbIcon } from '../components';

const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null; // Invalid date
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : null;
};


const TRAVEL_STYLES: TravelStyle[] = ['Relaxar na Praia', 'Aventura e Esportes', 'Foco em Gastronomia', 'Compras', 'Viagem em Família com Crianças Pequenas', 'Cultural e Museus', 'Econômica'];
const BUDGET_LEVELS: BudgetLevel[] = ['Econômico', 'Confortável', 'Luxo'];

const Step1Travelers: FC<{ onNext: (travelers: Traveler[]) => void }> = ({ onNext }) => {
    const [travelers, setTravelers] = useState<Traveler[]>([{ id: crypto.randomUUID(), firstName: '', lastName: '', dob: '', gender: '' }]);
    const [numAdults, setNumAdults] = useState(1);
    const [numChildren, setNumChildren] = useState(0);

    React.useEffect(() => {
        const totalTravelers = numAdults + numChildren;
        setTravelers(current => {
            const newTravelers = [...current];
            while (newTravelers.length < totalTravelers) {
                newTravelers.push({ id: crypto.randomUUID(), firstName: '', lastName: '', dob: '', gender: '' });
            }
            return newTravelers.slice(0, totalTravelers);
        });
    }, [numAdults, numChildren]);
    
    const handleTravelerChange = (index: number, field: keyof Omit<Traveler, 'id'>, value: string) => {
        setTravelers(current => {
            const newTravelers = [...current];
            newTravelers[index] = { ...newTravelers[index], [field]: value };
            return newTravelers;
        });
    };
    
    const handleContinue = () => {
        onNext(travelers.filter(t => t.firstName));
    }

    return (
        <div className="text-center">
            <UsersIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-bold">Quem vai na viagem?</h3>
            <p className="text-sm text-gray-500 mb-4">Isso nos ajuda a personalizar as sugestões para o seu grupo.</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm">Adultos (18+)</label>
                    <input type="number" value={numAdults} onChange={e => setNumAdults(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="text-sm">Crianças (0-17)</label>
                    <input type="number" value={numChildren} onChange={e => setNumChildren(Math.max(0, parseInt(e.target.value) || 0))} min="0" className="w-full p-2 border rounded-md" />
                </div>
            </div>
            {travelers.map((traveler, index) => (
                <div key={traveler.id} className="mt-4 p-3 border-t text-left">
                    <p className="font-semibold text-sm mb-2">Viajante {index + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Nome</label>
                            <input type="text" placeholder="Nome do viajante" value={traveler.firstName} onChange={e => handleTravelerChange(index, 'firstName', e.target.value)} className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="relative">
                            <label className="text-xs font-medium text-gray-600">Data de Nascimento</label>
                            <div className="relative flex items-center mt-1">
                                <input 
                                    type="date" 
                                    value={traveler.dob} 
                                    onChange={e => handleTravelerChange(index, 'dob', e.target.value)} 
                                    className="w-full p-2 border rounded-md pr-16"
                                />
                                {calculateAge(traveler.dob) !== null && (
                                    <span className="absolute right-2 text-xs text-gray-500 pointer-events-none">
                                        {calculateAge(traveler.dob)} anos
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={handleContinue} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">Continuar</button>
            <button onClick={() => onNext([])} className="text-xs text-gray-500 mt-2 hover:underline">Pular esta etapa</button>
        </div>
    )
};

const Step2Accommodation: FC<{ onNext: (accommodations: Accommodation[]) => void }> = ({ onNext }) => {
    const [current, setCurrent] = useState<Omit<Accommodation, 'id'>>({ name: '', address: '', checkIn: '', checkOut: '' });
    
    const handleContinue = () => {
        if(current.name && current.checkIn && current.checkOut) {
            onNext([{ ...current, id: crypto.randomUUID() }]);
        } else {
            onNext([]);
        }
    }
    
    return (
         <div className="text-center">
            <BedIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-bold">Onde vocês vão ficar?</h3>
            <p className="text-sm text-gray-500 mb-4">Adicionar a hospedagem ajuda a criar um roteiro mais inteligente.</p>
            <div className="space-y-3 text-left">
                <input type="text" value={current.name} onChange={e => setCurrent({ ...current, name: e.target.value })} placeholder="Nome do Hotel / Local" className="w-full p-2 border rounded-md" />
                <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={current.checkIn} onChange={e => setCurrent({ ...current, checkIn: e.target.value })} className="w-full p-2 border rounded-md" />
                    <input type="date" value={current.checkOut} onChange={e => setCurrent({ ...current, checkOut: e.target.value })} className="w-full p-2 border rounded-md" />
                </div>
            </div>
             <button onClick={handleContinue} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">Continuar</button>
            <button onClick={() => onNext([])} className="text-xs text-gray-500 mt-2 hover:underline">Pular esta etapa</button>
        </div>
    )
};

const Step3Profile: FC<{ onNext: (style: TravelStyle[], budget?: BudgetLevel) => void }> = ({ onNext }) => {
    const [travelStyle, setTravelStyle] = useState<TravelStyle[]>([]);
    const [budgetLevel, setBudgetLevel] = useState<BudgetLevel | undefined>(undefined);

    const handleToggleTravelStyle = (style: TravelStyle) => {
        setTravelStyle(prev =>
            prev.includes(style)
                ? prev.filter(s => s !== style)
                : [...prev, style]
        );
    };

    return (
        <div className="text-center">
            <LightbulbIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-bold">Qual o perfil da sua viagem?</h3>
            <p className="text-sm text-gray-500 mb-4">Esses detalhes nos ajudam a qualificar seu pedido de cotação.</p>
            <div className="text-left space-y-4">
                <div>
                    <h4 className="font-semibold mb-2">Estilo da Viagem</h4>
                    <div className="flex flex-wrap gap-2">
                        {TRAVEL_STYLES.map(style => (
                            <button type="button" key={style} onClick={() => handleToggleTravelStyle(style)} className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${travelStyle.includes(style) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-400'}`}>
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Orçamento</h4>
                    <div className="flex flex-wrap gap-2">
                         {BUDGET_LEVELS.map(level => (
                            <button type="button" key={level} onClick={() => setBudgetLevel(level)} className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${budgetLevel === level ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-400'}`}>
                                {level}
                            </button>
                         ))}
                    </div>
                </div>
            </div>
            <button onClick={() => onNext(travelStyle, budgetLevel)} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">Continuar</button>
            <button onClick={() => onNext([], undefined)} className="text-xs text-gray-500 mt-2 hover:underline">Pular esta etapa</button>
        </div>
    );
};


const Step4MagicItinerary: FC<{ onFinish: () => void }> = ({ onFinish }) => {
    return (
         <div className="text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-bold">Roteiro Mágico</h3>
            <p className="text-sm text-gray-500 mb-4">Podemos criar uma primeira versão do seu roteiro com base nas informações que você nos deu. O que acha?</p>
            <button onClick={onFinish} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">Sim, criar roteiro!</button>
            <button onClick={onFinish} className="text-xs text-gray-500 mt-2 hover:underline">Não, obrigado</button>
        </div>
    )
};


const OnboardingModal: FC = () => {
    const { onboardingTrip, onboardingStep, nextOnboardingStep, closeOnboarding } = useUIStore();
    const { saveTrip } = useTripStore.getState();
    const [isLoading, setIsLoading] = useState(false);

    if (!onboardingTrip) return null;

    const handleSaveTravelers = async (travelers: Traveler[]) => {
        setIsLoading(true);
        await saveTrip({ id: onboardingTrip.id, travelers });
        setIsLoading(false);
        nextOnboardingStep();
    }
    
    const handleSaveAccommodation = async (accommodations: Accommodation[]) => {
        setIsLoading(true);
        await saveTrip({ id: onboardingTrip.id, accommodations });
        setIsLoading(false);
        nextOnboardingStep();
    }

    const handleSaveProfile = async (style: TravelStyle[], budget?: BudgetLevel) => {
        setIsLoading(true);
        await saveTrip({ id: onboardingTrip.id, travelStyle: style, budgetLevel: budget });
        setIsLoading(false);
        nextOnboardingStep();
    };
    
    const handleFinish = () => {
        useTripStore.getState().selectTrip(onboardingTrip);
        closeOnboarding();
    }

    const renderStep = () => {
        switch (onboardingStep) {
            case 1: return <Step1Travelers onNext={handleSaveTravelers} />;
            case 2: return <Step2Accommodation onNext={handleSaveAccommodation} />;
            case 3: return <Step3Profile onNext={handleSaveProfile} />;
            case 4: return <Step4MagicItinerary onFinish={handleFinish} />;
            default: closeOnboarding(); return null;
        }
    }
    
    const progress = (onboardingStep / 4) * 100;
    
    return (
        <div className="p-6">
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s' }}></div>
            </div>
            {isLoading ? <div className="text-center p-8"><SpinnerIcon /></div> : renderStep()}
        </div>
    );
};

export default OnboardingModal;
