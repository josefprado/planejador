import { FC } from 'react';
import { Modal } from '../components';

interface Props {
    onClose: () => void;
}

const PrivacyPolicyModal: FC<Props> = ({ onClose }) => {
    return (
        <Modal onClose={onClose} size="2xl">
            <h2 className="text-2xl font-bold mb-4">Política de Privacidade (v2.1)</h2>
            <div className="space-y-4 text-sm text-gray-600 max-h-[70vh] overflow-y-auto pr-4">
                <p><strong>Última atualização:</strong> 29 de Maio de 2024</p>
                <p>Sua privacidade é importante para nós. Esta Política de Privacidade explica como a <strong>J D S DO PRADO</strong> (CNPJ <strong>32.450.984/0001-07</strong>), operando como "Lá em Orlando", coleta, usa e protege suas informações ao usar nosso aplicativo.</p>

                <h3 className="font-bold text-lg pt-2">1. Informações que Coletamos</h3>
                <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                        <strong>Informações de Cadastro:</strong> Ao se registrar usando o Login com Google, coletamos seu nome, endereço de e-mail e foto de perfil, conforme fornecido pelo Google. Ao completar seu perfil, coletamos também seu telefone, cidade, estado e país.
                    </li>
                     <li>
                        <strong>Registro de Consentimento:</strong> Ao criar sua conta, registramos seu consentimento com nossos Termos de Uso e Política de Privacidade, incluindo data, hora, endereço de IP, geolocalização aproximada e a versão dos documentos aceitos.
                    </li>
                    <li>
                        <strong>Dados da Viagem:</strong> Coletamos as informações que você insere sobre suas viagens, como destino, datas, roteiros, checklists e colaboradores.
                    </li>
                    <li>
                        <strong>Dados de Uso e Análise:</strong> Coletamos informações sobre como você interage com o aplicativo, como cliques em funcionalidades, uso de cupons e eventos de compartilhamento. Isso é feito para melhorar o serviço e a relevância de nossas campanhas (via Meta Pixel e Google Analytics).
                    </li>
                </ul>

                <h3 className="font-bold text-lg pt-2">2. Como Usamos Suas Informações</h3>
                <p>Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside ml-4">
                    <li>Fornecer e personalizar as funcionalidades do aplicativo.</li>
                    <li>Sincronizar seus dados entre dispositivos.</li>
                    <li>Permitir a colaboração com outros usuários que você convidar.</li>
                    <li>Entrar em contato para cotações de serviços que você solicitar.</li>
                    <li>Entrar em contato proativamente, por meios como WhatsApp, e-mail ou telefone, para oferecer serviços, cotações e produtos que possam ser relevantes para sua viagem e planejamento.</li>
                    <li>Manter um registro legal do seu consentimento com nossos termos.</li>
                    <li>Melhorar nosso aplicativo e entender quais recursos são mais utilizados.</li>
                </ul>

                <h3 className="font-bold text-lg pt-2">3. Armazenamento e Segurança de Dados</h3>
                <p>Seus dados de perfil e viagem são armazenados de forma segura nos servidores do Firebase (Google Cloud). Empregamos as melhores práticas de segurança para proteger suas informações contra acesso não autorizado.</p>
                <p><strong>IMPORTANTE:</strong> Os arquivos que você envia através da funcionalidade "Meus Documentos" <strong>NÃO</strong> são armazenados em nossos servidores. Eles são salvos diretamente na sua conta pessoal do Google Drive, e nós apenas guardamos uma referência para acessá-los. A segurança desses arquivos é regida pela política de privacidade do Google.</p>

                <h3 className="font-bold text-lg pt-2">4. Compartilhamento de Informações</h3>
                <p>Nós não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Suas informações só são compartilhadas quando você convida colaboradores para uma viagem, e apenas com as pessoas que você convidou.</p>
                
                <h3 className="font-bold text-lg pt-2">5. Seus Direitos, Controle e Retenção de Dados</h3>
                <ul className="list-disc list-inside ml-4 space-y-2">
                    <li><strong>Acesso e Edição:</strong> Você pode acessar e editar as informações do seu perfil a qualquer momento no menu do aplicativo.</li>
                    <li>
                        <strong>Exclusão da Conta:</strong> Você pode excluir sua conta a qualquer momento através do menu. Ao confirmar a exclusão, <strong>todos os seus dados de identificação pessoal (perfil, viagens, roteiros, checklists) serão permanentemente removidos de nossos servidores</strong>. Esta ação não pode ser desfeita.
                    </li>
                     <li>
                        <strong>Retenção de Dados Após Exclusão da Conta:</strong> Para cumprir com obrigações legais e nos proteger de disputas, mesmo após a exclusão da sua conta, manteremos um registro do seu consentimento aos nossos Termos. Este registro contém o identificador de usuário (`userId`), data, IP, localização e a versão dos termos aceitos. Este registro é mantido separadamente e não será utilizado para fins de marketing ou contato, servindo apenas como prova legal do acordo firmado.
                    </li>
                </ul>

                <h3 className="font-bold text-lg pt-2">6. Cookies e Tecnologias de Rastreamento</h3>
                <p>Utilizamos cookies e tecnologias similares para manter sua sessão de login e para coletar dados de análise anônimos sobre o uso do aplicativo.</p>
                
                <h3 className="font-bold text-lg pt-2">7. Alterações nesta Política</h3>
                <p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre quaisquer alterações publicando a nova política no aplicativo. Recomendamos que você revise esta política regularmente.</p>
            </div>
            <button onClick={onClose} className="w-full mt-6 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-white transition-colors">
                Entendi
            </button>
        </Modal>
    );
};

export default PrivacyPolicyModal;