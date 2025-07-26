import { User } from '../types';

interface ThemedDestination {
  keywords: string[];
  phrases: Record<number, string>;
}

const themedDestinations: ThemedDestination[] = [
  {
    keywords: ['orlando', 'disney', 'universal', 'hollywood studios', 'magic kingdom', 'epcot', 'animal kingdom', 'anaheim'],
    phrases: {
      180: "A magia já te chama... Contagem regressiva para a terra da fantasia!",
      165: "Sonhando com a foto perfeita em frente ao Castelo...",
      150: "Planejando os dias de parque e as pausas para as compras...",
      135: "A playlist da viagem já tem as trilhas sonoras dos filmes?",
      120: "Separando as orelhinhas do Mickey para a viagem...",
      105: "Já consigo sentir o cheiro da pipoca do Magic Kingdom...",
      90: "Treinando o feitiço 'Wingardium Leviosa' para a Universal...",
      75: "Decidindo qual montanha-russa encarar primeiro...",
      60: "Planejando a foto perfeita em frente ao Castelo da Cinderela...",
      45: "Contando as horas para tomar uma Butterbeer em Hogsmeade...",
      30: "Decidindo qual parque visitar primeiro...",
      15: "Os fogos do Castelo estão quase começando...",
      7: "A aventura está virando a esquina, no próximo parque temático...",
      3: "A magia é real e está quase na hora de embarcar!",
      1: "Prepare-se! A magia te espera amanhã!",
      0: "É hoje! Onde os sonhos se tornam realidade.",
    }
  },
  {
    keywords: ['paris', 'frança', 'france'],
    phrases: {
      180: "Bonjour! A contagem começou para a cidade luz...",
      165: "Sonhando com croissants na beira do rio Sena...",
      150: "Planejando o melhor ângulo para a foto na Torre Eiffel...",
      135: "Imaginando um passeio charmoso por Montmartre...",
      120: "Limpando a galeria do celular para as obras do Louvre...",
      105: "A contagem regressiva tem um charme especial em francês...",
      90: "Separando o look para um jantar romântico...",
      75: "Já dá pra sentir o cheirinho de crêpe no ar...",
      60: "Treinando o 'merci' e o 's'il vous plaît'...",
      45: "A cada dia, um 'je t'aime' mais perto de Paris...",
      30: "Quase na hora de dizer 'oui' para a cidade do amor...",
      15: "As luzes da Torre Eiffel estão quase acendendo para você...",
      7: "Só mais alguns dias para viver a 'vie en rose'...",
      3: "Fazendo as malas... com um espacinho para os macarons!",
      1: "Au revoir, rotina! A aventura espera em...",
      0: "C'est aujourd'hui! Viva a magia de Paris!",
    }
  },
  {
    keywords: ['cancun', 'maceio', 'salvador', 'rio de janeiro', 'praia', 'beach', 'caribe'],
    phrases: {
      180: "Contando os dias para colocar o pé na areia...",
      165: "A brisa do mar já está chamando seu nome...",
      150: "Sonhando com água de coco e um belo pôr do sol...",
      135: "O barulho das ondas está cada vez mais perto...",
      120: "Separando o protetor solar e os óculos escuros...",
      105: "Planejando os dias de puro relaxamento...",
      90: "A contagem regressiva para o paraíso começou!",
      75: "Imaginando um mergulho em águas cristalinas...",
      60: "A playlist de verão já está pronta?",
      45: "Quase lá! Sentindo o cheiro de maresia...",
      30: "Falta pouco para trocar o escritório pela praia...",
      15: "Contando as horas para um mergulho refrescante...",
      7: "Deixando as preocupações para trás, o mar espera!",
      3: "As malas estão prontas? O sol está te esperando!",
      1: "Prepare-se! O paraíso te espera amanhã!",
      0: "É hoje! Aproveite cada raio de sol neste lugar incrível.",
    }
  },
  {
    keywords: ['new york', 'nova iorque'],
    phrases: {
      180: "A contagem começou para a cidade que nunca dorme...",
      165: "Sonhando com as luzes da Times Square...",
      150: "Planejando um passeio relaxante no Central Park...",
      135: "Preparando para as vistas do topo do Empire State...",
      120: "A contagem regressiva para a Big Apple está a todo vapor!",
      105: "Imaginando um show da Broadway...",
      90: "Quase na hora de pegar um yellow cab!",
      75: "Start spreading the news... a viagem está chegando!",
      60: "Planejando o roteiro de museus e galerias...",
      45: "A cada dia, um passo mais perto de Manhattan...",
      30: "Sonhando com um café da manhã em um 'diner' clássico...",
      15: "Falta pouco para atravessar a Brooklyn Bridge...",
      7: "A energia da cidade já está te contagiando!",
      3: "New York, New York... está quase na hora!",
      1: "A cidade dos sonhos te espera amanhã!",
      0: "Bem-vindo a Nova York! Faça sua história acontecer.",
    }
  },
  {
    keywords: ['las vegas'],
    phrases: {
      180: "A contagem começou para a cidade do entretenimento!",
      165: "Sonhando com as fontes do Bellagio...",
      150: "O que acontece em Vegas... começa com essa contagem!",
      135: "Planejando um passeio pela incrível Strip...",
      120: "Viva Las Vegas! A sorte está lançada e a viagem chegando.",
      105: "Imaginando qual show incrível assistir...",
      90: "As luzes de neon estão cada vez mais próximas...",
      75: "A playlist da viagem já tem Elvis Presley?",
      60: "Contagem regressiva para a cidade mais brilhante do mundo!",
      45: "Falta pouco para ouvir o som das slot machines!",
      30: "A cada dia, uma aposta a menos na espera...",
      15: "Quase na hora de ver o impossível acontecer...",
      7: "A diversão está garantida, falta pouco!",
      3: "Façam suas apostas, a viagem é quase certa!",
      1: "Prepare-se! A cidade mais fabulosa do mundo te espera amanhã.",
      0: "Bem-vindo à fabulosa Las Vegas!",
    }
  },
  {
    keywords: ['patagonia', 'bariloche'],
    phrases: {
      180: "A contagem começou para a aventura na Patagônia!",
      165: "Sonhando com as paisagens de tirar o fôlego e lagos azuis...",
      150: "Separando os casacos e as botas de trekking...",
      135: "A aventura gelada está cada vez mais próxima...",
      120: "Imaginando um chocolate quente com vista para as montanhas...",
      105: "A contagem regressiva para o ar puro da natureza!",
      90: "Planejando o roteiro pelo Circuito Chico...",
      75: "As paisagens mais bonitas do mundo estão te esperando...",
      60: "Quase na hora de respirar o ar fresco da montanha...",
      45: "A câmera está pronta para fotos incríveis?",
      30: "Falta pouco para se deslumbrar com a natureza...",
      15: "A aventura está te chamando, cada dia mais alto!",
      7: "Prepare o coração para vistas inesquecíveis!",
      3: "A Patagônia está quase ao seu alcance!",
      1: "A majestade da natureza te espera amanhã.",
      0: "É hoje! Desfrute da beleza imponente da Patagônia.",
    }
  },
  {
      keywords: ['chile', 'santiago'],
      phrases: {
          180: "¡Hola! A contagem para o Chile começou!",
          165: "Sonhando com a vista da Cordilheira dos Andes...",
          150: "Planejando um tour pelas famosas vinícolas chilenas...",
          135: "A cultura vibrante de Santiago está cada vez mais perto!",
          120: "Imaginando um passeio pelo charmoso bairro de Lastarria...",
          105: "Separando um espaço na mala para os vinhos...",
          90: "A contagem regressiva para empanadas e pisco sour!",
          75: "Falta pouco para subir o Cerro San Cristóbal...",
          60: "A cada dia, uma nova descoberta se aproxima...",
          45: "Preparando para a beleza dos Andes e a agitação da cidade...",
          30: "Quase na hora de brindar com um Carménère!",
          15: "A aventura chilena está batendo na porta!",
          7: "Falta pouco para dizer '¡Viva Chile!'",
          3: "Os Andes estão te chamando, prepare-se!",
          1: "A beleza do Chile te espera amanhã!",
          0: "¡Bienvenido a Chile! Aproveite cada momento.",
      }
  },
  {
      keywords: ['argentina', 'buenos aires'],
      phrases: {
          180: "¡Che! A contagem para a Argentina começou!",
          165: "Sonhando com um show de tango em San Telmo...",
          150: "Planejando um passeio pelas ruas coloridas do Caminito...",
          135: "O cheiro de parrilla e medialunas já está no ar...",
          120: "Imaginando um café no icônico Café Tortoni...",
          105: "Separando os sapatos para dançar um tango...",
          90: "A contagem regressiva para a terra do doce de leite!",
          75: "Falta pouco para se encantar com a arquitetura de Recoleta...",
          60: "A cada dia, um 'gracias' mais perto de Buenos Aires...",
          45: "Preparando para a paixão e a cultura portenha...",
          30: "Quase na hora de provar o famoso bife de chorizo!",
          15: "A viagem mais charmosa da América do Sul está chegando!",
          7: "Falta pouco para dizer 'Hola, Buenos Aires!'",
          3: "A capital do tango está quase pronta para te receber!",
          1: "A paixão argentina te espera amanhã!",
          0: "¡Bienvenido a Buenos Aires! Respire a cultura local.",
      }
  },
  {
    keywords: ['dubai'],
    phrases: {
      180: "A contagem começou para a cidade do futuro!",
      165: "Sonhando com o topo do Burj Khalifa...",
      150: "O luxo e a inovação estão cada vez mais perto...",
      135: "Planejando um passeio pelo deserto e um mergulho no Golfo Pérsico...",
      120: "A contagem para o extraordinário começou!",
      105: "Imaginando as compras no Dubai Mall...",
      90: "Quase na hora de ver o futuro de perto...",
      75: "A modernidade e a tradição se encontram em breve...",
      60: "Preparando-se para uma experiência única no deserto...",
      45: "A cidade mais futurista do mundo está te esperando...",
      30: "Falta pouco para se deslumbrar com a arquitetura audaciosa...",
      15: "A contagem regressiva para o impossível!",
      7: "O oásis de luxo está quase ao seu alcance.",
      3: "Prepare as malas para uma viagem inesquecível!",
      1: "O futuro te espera amanhã em Dubai!",
      0: "Bem-vindo a Dubai! Onde o impossível acontece.",
    }
  },
  {
    keywords: ['egito', 'cairo'],
    phrases: {
      180: "A contagem começou para a terra dos faraós!",
      165: "Sonhando com as pirâmides de Gizé e a Esfinge...",
      150: "Os mistérios do antigo Egito estão cada vez mais perto...",
      135: "Planejando um cruzeiro pelo Rio Nilo...",
      120: "A contagem para uma jornada histórica começou!",
      105: "Imaginando os tesouros do Museu Egípcio...",
      90: "Quase na hora de desvendar os segredos dos templos...",
      75: "A história da humanidade está te esperando...",
      60: "Preparando a câmera para registrar uma das 7 maravilhas...",
      45: "Falta pouco para caminhar por onde os faraós andaram...",
      30: "A aventura pelos desertos e templos está próxima!",
      15: "A cada dia, um passo mais perto da história...",
      7: "A Esfinge está te esperando para contar seus segredos...",
      3: "A viagem no tempo está prestes a começar!",
      1: "A história milenar te espera amanhã.",
      0: "Bem-vindo ao Egito! Uma jornada inesquecível.",
    }
  },
  {
    keywords: ['roma', 'itália', 'italia'],
    phrases: {
      180: "Tutti a tavola! A contagem para a Cidade Eterna começou!",
      165: "Sonhando em jogar uma moeda na Fontana di Trevi...",
      150: "Imaginando os gladiadores no Coliseu...",
      135: "A contagem para a melhor massa da sua vida está rolando...",
      120: "Planejando um gelato em cada esquina...",
      105: "A história do Império Romano está cada vez mais perto...",
      90: "Quase na hora de dizer 'ciao' para a rotina!",
      75: "Imaginando a vista da Basílica de São Pedro...",
      60: "Preparando para se perder nas charmosas ruas de Trastevere...",
      45: "A cada dia, um cappuccino mais perto da Itália...",
      30: "Falta pouco para viver 'La Dolce Vita'...",
      15: "A beleza da Itália está te chamando!",
      7: "Todos os caminhos levam a Roma... e falta pouco!",
      3: "Prepare o coração e o estômago, a Itália espera!",
      1: "Arrivederci, espera! A Itália te chama amanhã.",
      0: "Benvenuto a Roma! Aproveite cada momento.",
    }
  },
  {
    keywords: ['tóquio', 'tokyo', 'japão', 'japao'],
    phrases: {
      180: "Konnichiwa! A contagem para a terra do sol nascente começou...",
      165: "Sonhando com as luzes de Shibuya e a paz dos templos...",
      150: "Hora de treinar o 'arigatou' e estudar o mapa do metrô...",
      135: "Preparando o paladar para sushis e lámens autênticos...",
      120: "A contagem regressiva para o futuro chegou!",
      105: "Imaginando a vista do Monte Fuji...",
      90: "Quase na hora de mergulhar na cultura pop e na tradição milenar...",
      75: "A eficiência e a beleza do Japão estão próximas...",
      60: "Falta pouco para se encantar com os jardins zen...",
      45: "A cada dia, uma nova descoberta sobre o Japão...",
      30: "Preparando para o contraste entre o moderno e o antigo...",
      15: "A viagem dos sonhos para o outro lado do mundo está chegando!",
      7: "O futuro e a tradição te esperam de braços abertos.",
      3: "Prepare-se para uma experiência cultural única!",
      1: "Sayōnara, rotina! O Japão te espera.",
      0: "Bem-vindo a Tóquio! Uma cidade de contrastes incríveis.",
    }
  },
  {
    keywords: ['londres', 'london', 'inglaterra'],
    phrases: {
      180: "Keep calm! A contagem para Londres está só começando.",
      165: "Sonhando em ouvir o Big Ben e atravessar a Abbey Road...",
      150: "Cuidado com o vão entre o trem e a plataforma! Mind the gap...",
      135: "Planejando um chá das 5 e uma visita à Torre de Londres...",
      120: "A contagem para a terra da rainha está a todo vapor!",
      105: "Imaginando um passeio pelos museus gratuitos...",
      90: "Limpando a memória do celular para as fotos com as cabines vermelhas...",
      75: "A cada dia, um passo mais perto de um 'pub' inglês...",
      60: "Preparando o guarda-chuva, por via das dúvidas!",
      45: "Falta pouco para ver a troca da guarda...",
      30: "A cidade mais cosmopolita do mundo está te esperando...",
      15: "A realeza e o punk rock te aguardam!",
      7: "A neblina de Londres está se dissipando para sua chegada...",
      3: "A terra dos Beatles e de Harry Potter te espera!",
      1: "God save the Queen! A aventura te espera amanhã.",
      0: "Cheers, mate! Bem-vindo a Londres!",
    }
  }
];

const premiumGenericPhrases: Record<number, string> = {
  180: "O sonho já começou... planejando a viagem para...",
  165: "Cada dia um passo mais perto de...",
  150: "O planejamento está a todo vapor para...",
  135: "As melhores coisas levam tempo... especialmente esta viagem!",
  120: "A contagem regressiva oficial começou para...",
  105: "Imaginando cada detalhe da sua próxima aventura...",
  90: "A ansiedade boa já bateu para...",
  75: "Falta pouco! Hora de começar a pensar na mala...",
  60: "A cada dia, a expectativa só aumenta para...",
  45: "Contando os dias nos dedos para...",
  30: "Checando os detalhes finais do roteiro para...",
  15: "A contagem final está rolando para...",
  7: "Contando as horas para decolar rumo a...",
  3: "Está quase na hora de fazer as malas e partir para...",
  1: "É amanhã! A aventura espera em...",
  0: "É hoje! Aproveite cada segundo em...",
};

const basicPhrases: Record<number, string> = {
  90: "A contagem está rolando para...",
  30: "A contagem continua para...",
  7: "Falta pouco para...",
  3: "Está quase na hora de viajar para...",
  1: "É amanhã! Prepare-se para...",
  0: "É hoje! Sua aventura em...",
};

const findPhrase = (days: number, phraseMap: Record<number, string>): string => {
  const applicableDays = Object.keys(phraseMap)
    .map(Number)
    .sort((a, b) => b - a)
    .find(d => days >= d);
  
  return applicableDays !== undefined ? phraseMap[applicableDays] : "A contagem continua para...";
};

export const getCountdownPhrase = (days: number, destination: string, user: User | null): string => {
    let phraseMap: Record<number, string>;

    if (user) {
        const lowerCaseDestination = destination.toLowerCase();
        const themedDestination = themedDestinations.find(d => 
            d.keywords.some(k => lowerCaseDestination.includes(k))
        );
        
        if (themedDestination) {
            phraseMap = themedDestination.phrases;
        } else {
            phraseMap = premiumGenericPhrases;
        }
    } else {
        phraseMap = basicPhrases;
    }
    
    return findPhrase(days, phraseMap);
};
