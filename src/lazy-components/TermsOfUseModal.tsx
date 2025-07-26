import { FC } from 'react';
import { Modal } from '../components';

interface Props {
    onClose: () => void;
}

const TermsOfUseModal: FC<Props> = ({ onClose }) => {
    return (
        <Modal onClose={onClose} size="2xl">
            <h2 className="text-2xl font-bold mb-4">Termos de Uso (v2.1)</h2>
            <div className="space-y-4 text-sm text-gray-600 max-h-[70vh] overflow-y-auto pr-4">
                <p><strong>Última atualização:</strong> 29 de Maio de 2024</p>
                <p>Bem-vindo ao Planejador de Viagens Lá em Orlando! Estes Termos de Uso ("Termos") regem seu acesso e uso do nosso aplicativo e serviços. Ao usar nosso aplicativo, você concorda com estes Termos.</p>
                
                <h3 className="font-bold text-lg pt-2">1. O Serviço</h3>
                <p>O aplicativo é fornecido por <strong>J D S DO PRADO</strong>, CNPJ <strong>32.450.984/0001-07</strong>, doravante denominada "Empresa". Nosso serviço visa auxiliar no planejamento de viagens, oferecendo ferramentas como contador regressivo, roteiro, checklist e gerenciamento de documentos.</p>

                <h3 className="font-bold text-lg pt-2">2. Uso do Aplicativo</h3>
                <p>Você concorda em usar o aplicativo apenas para fins legais e de acordo com estes Termos. Você é responsável por manter a confidencialidade de sua conta e senha.</p>
                
                <h3 className="font-bold text-lg pt-2">3. Isenção de Garantias e Limitação de Responsabilidade</h3>
                <p>O aplicativo é fornecido <strong>"COMO ESTÁ"</strong> e <strong>"COMO DISPONÍVEL"</strong>, sem garantias de qualquer tipo, expressas ou implícitas. A Empresa não garante que o aplicativo será ininterrupto, livre de erros, seguro ou que atenderá às suas expectativas.</p>
                <p><strong>Você concorda expressamente que o uso do aplicativo é por sua conta e risco.</strong> A Empresa não se responsabiliza por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do uso ou da incapacidade de usar o serviço. Isso inclui, mas não se limita a:</p>
                <ul className="list-disc list-inside ml-4">
                    <li>Falhas de conectividade ou indisponibilidade do serviço durante sua viagem.</li>
                    <li>Perda de acesso a documentos, vouchers, ingressos ou qualquer outro dado armazenado através do aplicativo.</li>
                    <li>Erros ou imprecisões nas informações fornecidas, como checklists ou dicas.</li>
                    <li>Qualquer prejuízo financeiro ou de oportunidade decorrente de uma falha do aplicativo.</li>
                </ul>
                <p>É de sua exclusiva responsabilidade manter cópias de segurança de todos os documentos importantes (ex: impressos ou em outros dispositivos) e verificar todas as informações de sua viagem (horários, reservas, etc.) diretamente com os fornecedores.</p>

                <h3 className="font-bold text-lg pt-2">4. Conteúdo do Usuário e Documentos</h3>
                <p>A funcionalidade "Meus Documentos" utiliza a API do Google Drive para armazenar seus arquivos em uma pasta específica dentro da <strong>SUA PRÓPRIA CONTA DO GOOGLE DRIVE</strong>. Nós não armazenamos, copiamos ou temos acesso aos seus arquivos em nossos servidores. A responsabilidade pela segurança e gerenciamento desses arquivos é sua e do Google.</p>

                <h3 className="font-bold text-lg pt-2">5. Modificações nos Termos</h3>
                <p>Podemos revisar e atualizar estes Termos de tempos em tempos. Todas as alterações entram em vigor imediatamente quando as publicamos. Seu uso continuado do aplicativo após a publicação dos Termos revisados significa que você aceita e concorda com as alterações.</p>
                
                <h3 className="font-bold text-lg pt-2">6. Encerramento da Conta</h3>
                <p>Você pode encerrar sua conta a qualquer momento através das configurações do aplicativo. Ao fazer isso, todos os seus dados de viagem e perfil armazenados em nossos servidores serão permanentemente excluídos, conforme detalhado em nossa Política de Privacidade.</p>
                
                <h3 className="font-bold text-lg pt-2">7. Comunicações da Empresa</h3>
                <p>Ao criar uma conta e utilizar nosso aplicativo, você concorda em receber comunicações da nossa parte. Essas comunicações podem incluir e-mails, mensagens de WhatsApp, ligações telefônicas ou outras formas de contato.</p>
                <p>Utilizaremos os dados de seu cadastro e de suas viagens (como destino e datas) para enviar informações, dicas e ofertas de serviços e produtos que consideramos relevantes para o seu planejamento (como cotações de hotéis, ingressos, seguro viagem, etc.).</p>
                <p>Este contato proativo é parte integrante do serviço que oferecemos. <strong>Caso você não concorde em receber estas comunicações, seu único recurso é encerrar sua conta e descontinuar o uso do aplicativo.</strong> A continuidade do uso do aplicativo será considerada como seu consentimento explícito para receber tais contatos.</p>
            </div>
            <button onClick={onClose} className="w-full mt-6 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-colors">
                Entendi
            </button>
        </Modal>
    );
};

export default TermsOfUseModal;