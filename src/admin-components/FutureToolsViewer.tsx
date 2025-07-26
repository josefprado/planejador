import React, { FC } from 'react';
import { SparklesIcon, LifeRingIcon, DollarSignIcon, TicketIcon } from '../components';

interface FeatureItemProps {
    icon: React.ElementType;
    title: string;
    description: string;
}

const FeatureItem: FC<FeatureItemProps> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg mr-4">
            <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
            <h4 className="font-bold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    </div>
);

const FutureToolsViewer: FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold my-2">Visão de Futuro: Monetização Preditiva</h1>
                <p className="text-gray-600">
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
        </div>
    );
};

export default FutureToolsViewer;