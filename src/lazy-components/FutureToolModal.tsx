import { FC, ElementType } from 'react';
import { Modal, ModalHeaderIcon, SparklesIcon, LifeRingIcon, DollarSignIcon, LightbulbIcon, TicketIcon } from '../components';

interface FeatureItemProps {
    icon: ElementType;
    title: string;
    description: string;
}

const FeatureItem: FC<FeatureItemProps> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg mr-4">
            <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
            <h4 className="font-bold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    </div>
);

const FutureToolModal: FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <Modal onClose={onClose} size="lg">
            <div className="text-center">
                <ModalHeaderIcon icon={LightbulbIcon} color="blue" />
                <h2 className="text-2xl font-bold my-2">Visão de Futuro: Monetização Preditiva</h2>
                <p className="text-gray-600 mb-8">
                    Estas são as próximas grandes ferramentas que planejamos para tornar o aplicativo ainda mais valioso, transformando dados em oportunidades de negócio.
                </p>
            </div>
            <div className="space-y-6 text-left">
                <FeatureItem
                    icon={TicketIcon}
                    title="Hub de Eventos (Shows e Jogos)"
                    description="Integrar a API da Ticketmaster para criar páginas de eventos por cidade (Orlando, NY) e de times (Orlando Magic, etc.). Isso atrairá novos usuários via SEO e permitirá que a IA sugira eventos relevantes durante o planejamento da viagem."
                />
                <FeatureItem
                    icon={SparklesIcon}
                    title="Ofertas Preditivas e Contextuais"
                    description="O aplicativo irá identificar oportunidades com base no planejamento do usuário (destino, datas, perfil) e enviará notificações in-app com ofertas relevantes, como ingressos para eventos ou passeios, no momento exato em que o usuário precisa."
                />
                <FeatureItem
                    icon={DollarSignIcon}
                    title="Parcerias de Afiliados Hiper-Contextuais"
                    description="Integraremos ofertas de parceiros diretamente no roteiro. Se um usuário adiciona um restaurante específico, poderemos oferecer um link de afiliado para reserva que garanta um benefício, gerando uma nova fonte de receita."
                />
                <FeatureItem
                    icon={LifeRingIcon}
                    title="Serviço 'Lá em Orlando Concierge'"
                    description="Para usuários premium, ofereceremos um serviço pago onde um agente de viagens se torna um colaborador na viagem, otimizando o roteiro, fazendo reservas e oferecendo suporte em tempo real, tudo dentro da plataforma que o cliente já ama."
                />
            </div>
             <button onClick={onClose} className="w-full mt-8 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-colors">
                Entendi
            </button>
        </Modal>
    );
};

export default FutureToolModal;