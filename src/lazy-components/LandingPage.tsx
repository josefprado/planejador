import { ReactNode, ElementType, FC } from 'react';
import { ModalType } from '../types';
import { 
    Logo, AppleStoreIcon, GooglePlayIcon,
    CalendarDaysIcon, ChecklistIcon, FolderIcon, GiftIcon,
    PaletteIcon, ShareIcon
} from '../components';

interface Props {
    onOpenModal: (modal: ModalType) => void;
}

interface FeatureCardProps {
    icon: ElementType;
    title: string;
    children: ReactNode;
}

const FeatureCard: FC<FeatureCardProps> = ({ icon: Icon, title, children }) => (
    <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 text-blue-300 mb-4">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{children}</p>
    </div>
);

const LandingPage: FC<Props> = ({ onOpenModal }) => {
    return (
        <div className="bg-gray-900 text-white font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/50 backdrop-blur-md">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Logo className="h-10 w-auto" />
                    <button onClick={() => onOpenModal('login')} className="font-semibold bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full transition-colors">
                        Fazer Login
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center text-center px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-gray-900 to-gray-900 opacity-60"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-4 animate-fade-in-up">
                        Sua Viagem dos Sonhos, <span className="text-blue-400">Organizada em um Só Lugar.</span>
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-300 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Crie um contador regressivo, monte seu roteiro, use checklists inteligentes e guarde documentos. Comece a planejar gratuitamente e transforme sua viagem em uma experiência inesquecível.
                    </p>
                    <button onClick={() => onOpenModal('trip')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/20 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        Começar a Planejar Gratuitamente
                    </button>
                </div>
            </section>
            
            {/* Features Section */}
            <section className="py-20 bg-gray-900 px-6">
                <div className="container mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Todas as ferramentas para a viagem perfeita</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={PaletteIcon} title="Contador Regressivo">
                            Crie expectativa com um lindo contador regressivo personalizado. Escolha temas e compartilhe com amigos e família.
                        </FeatureCard>
                         <FeatureCard icon={CalendarDaysIcon} title="Roteiro Dia a Dia">
                            Chega de planilhas! Organize parques, restaurantes e passeios de forma visual e intuitiva para cada dia da sua viagem.
                        </FeatureCard>
                        <FeatureCard icon={ChecklistIcon} title="Checklist Inteligente">
                            Não esqueça de nada! Use nosso checklist com dicas de especialista para cada fase da sua preparação.
                        </FeatureCard>
                        <FeatureCard icon={FolderIcon} title="Documentos Offline">
                            Salve seus vouchers, ingressos e passaportes na palma da mão, com acesso seguro mesmo sem internet.
                        </FeatureCard>
                        <FeatureCard icon={ShareIcon} title="Planejamento Colaborativo">
                            Convide amigos e família para ver e editar o roteiro, tornando o planejamento uma atividade em grupo.
                        </FeatureCard>
                        <FeatureCard icon={GiftIcon} title="Clube de Vantagens">
                            Economize durante sua viagem com cupons e descontos exclusivos em restaurantes, lojas e serviços.
                        </FeatureCard>
                    </div>
                </div>
            </section>

            {/* App Store Section */}
            <section className="py-20 bg-gray-800/50 px-6">
                <div className="container mx-auto text-center">
                     <h2 className="text-3xl font-bold mb-4">Leve seu roteiro no bolso</h2>
                    <p className="max-w-2xl mx-auto text-gray-300 mb-8">
                        Acesse todo o seu planejamento no celular. Nosso app está disponível para download e garante que você tenha tudo à mão, mesmo offline.
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <a href="#" className="flex items-center bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                            <AppleStoreIcon className="w-8 h-8 mr-3 fill-current" />
                            <div>
                                <p className="text-xs">Baixar na</p>
                                <p className="text-xl font-semibold leading-tight">App Store</p>
                            </div>
                        </a>
                         <a href="#" className="flex items-center bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                            <GooglePlayIcon className="w-7 h-7 mr-3 fill-current" />
                            <div>
                                <p className="text-xs">Disponível no</p>
                                <p className="text-xl font-semibold leading-tight">Google Play</p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

             {/* Footer */}
            <footer className="bg-gray-900 py-8 px-6">
                <div className="container mx-auto text-center text-gray-400">
                    <Logo className="h-12 w-auto mx-auto mb-4" />
                    <p>&copy; {new Date().getFullYear()} Planejador de Viagens: Lá em Orlando. Todos os direitos reservados.</p>
                     <div className="mt-4 text-sm">
                        <button onClick={() => onOpenModal('termsOfUse')} className="hover:underline">Termos de Uso</button>
                        <span className="mx-2">·</span>
                        <button onClick={() => onOpenModal('privacyPolicy')} className="hover:underline">Política de Privacidade</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;