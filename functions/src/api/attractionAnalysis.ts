import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { corsOptions } from "../config";

const db = admin.firestore();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ensureAdmin = async (uid: string | undefined) => {
    if (!uid) {
        throw new HttpsError("unauthenticated", "Acesso negado. Você precisa estar autenticado.");
    }
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        throw new HttpsError("permission-denied", "Acesso negado. Apenas administradores podem executar esta operação.");
    }
};

export const generateMagicGuide = onCall({ ...corsOptions, secrets: ["GEMINI_API_KEY"] }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    if (!GEMINI_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");

    const { attractionId } = request.data;
    if (!attractionId) throw new HttpsError("invalid-argument", "ID da Atração é obrigatório.");

    try {
        const attractionRef = db.collection('attractions').doc(attractionId);
        const attractionSnap = await attractionRef.get();
        if (!attractionSnap.exists) throw new HttpsError("not-found", "Atração não encontrada.");

        const park = attractionSnap.data();
        
        const subAttractionsSnap = await db.collection('attractions').where('parentId', '==', attractionId).get();
        const subAttractions = subAttractionsSnap.docs.map(doc => doc.data());

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `
            Aja como o "Gênio do Planejador", um guia de viagens especialista, divertido e mágico para Orlando.
            Sua missão é criar um guia completo e envolvente para o parque "${park?.name}".
            Use a massa de dados abaixo e complemente com informações de fontes confiáveis (como sites oficiais e blogs de viagem) para criar o guia.

            **Dados que Temos:**
            - **Dicas de Quando Ir:** ${subAttractions.map(a => a.when_to_go).filter(Boolean).join(', ')}
            - **Atrações Populares (por tipo):** ${subAttractions.map(a => `${a.name} (${a.what_it_is})`).join(', ')}
            - **Dicas para Famílias:** Considere os ratings para crianças e restrições de altura.
            - **Restaurantes:** Destaque 2-3 opções de restaurantes dentro do parque, mencionando tipo de cozinha e custo.

            **Estrutura do Guia (use este formato):**
            ### Uma Aventura Mágica no ${park?.name}
            [Parágrafo de introdução curto e mágico sobre a essência do parque.]

            #### ✨ As Jóias da Coroa: Atrações Imperdíveis
            [Liste de 3 a 5 atrações principais. Para cada uma, dê uma breve descrição e uma dica mágica (ex: "melhor horário para ir", "lugar secreto para foto").]

            #### 🍔 Onde Recarregar as Energias
            [Descreva 2-3 opções de alimentação (rápida e de mesa), com o tipo de comida e para quem é ideal.]

            #### 🤫 Segredos do Gênio
            [Liste 3 dicas secretas ou truques que só um especialista saberia para aproveitar melhor o parque (ex: "melhor lugar para ver a parada", "como usar o Rider Switch", etc.).]

            #### 💡 Roteiro de 1 Dia para Famílias
            [Sugira um roteiro simples (manhã, tarde, noite) para uma família com crianças, otimizando o tempo e a diversão.]
            
            Use uma linguagem divertida, use emojis e formate com markdown (###, ####, *, **).
        `;

        const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        if (!result || !result.text) throw new HttpsError("internal", "A IA não retornou um guia.");

        await attractionRef.update({ guideContent: result.text });

        return { success: true };

    } catch (error) {
        console.error("Error generating magic guide:", error);
        throw new HttpsError("internal", "Ocorreu um erro ao gerar o guia mágico.");
    }
});

export const analyzeLeadDetails = onCall({ ...corsOptions, secrets: ["GEMINI_API_KEY"] }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    if (!GEMINI_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");
    
    const { trip, user, itineraryItems } = request.data;
    if (!trip || !user) throw new HttpsError("invalid-argument", "Dados da viagem e do usuário são obrigatórios.");

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `
        Analise este lead de viagem para a agência 'Lá em Orlando'.
        
        **Dados da Viagem:**
        - Destino: ${trip.destination}
        - Período: ${trip.startDate} a ${trip.endDate}.
        - Perfil: Estilo ${trip.travelStyle?.join(', ') || 'N/I'}, Orçamento ${trip.budgetLevel || 'N/I'}.
        - Viajantes: ${trip.travelers?.map((t: any) => `${t.firstName} (${new Date().getFullYear() - new Date(t.dob).getFullYear()} anos)`).join(', ') || 'N/I'}.

        **Dados do Usuário:**
        - Intenções Registradas (log): ${user.intentLog?.map((l: any) => l.details).join('; ') || 'Nenhuma'}.
        - Vouchers Enviados (compras confirmadas): ${trip.voucherInsights?.map((i: any) => `${i.documentType} de ${i.provider || 'N/I'} comprado em ${i.bookingAgency || 'N/I'}`).join('; ') || 'Nenhum'}.
        - Roteiro Planejado: ${itineraryItems.join(', ') || 'Nenhum item adicionado'}.

        **Sua Missão:**
        1.  **DNA do Lead:** Crie um resumo de 2-3 frases que capture a essência deste cliente e sua principal necessidade no momento.
        2.  **Lead Score:** Dê uma nota de 1 (frio) a 10 (pronto para comprar).
        3.  **Justificativa do Score:** Explique brevemente por que deu essa nota.
        4.  **Próxima Melhor Oferta (Next Best Offer):** Com base no que ele JÁ COMPROU (vouchers) e no que ele está planejando, qual é a ÚNICA e mais estratégica oferta que o agente deve fazer agora? Seja específico. Ex: 'Oferecer Ingresso Universal 2-Park' ou 'Oferecer Aluguel de Carro'.
        5.  **Justificativa da Oferta:** Por que essa é a melhor oferta?

        **Formato de Saída OBRIGATÓRIO (JSON):**
        {
          "dna": "string",
          "leadScore": "number",
          "leadScoreReasoning": "string",
          "nextBestOffer": {
            "service": "string",
            "justification": "string"
          }
        }
    `;
    
    try {
        const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" }});
        if (!result || !result.text) throw new HttpsError("internal", "A IA não retornou uma análise válida.");
        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error analyzing lead with AI:", error);
        throw new HttpsError("internal", "Ocorreu um erro ao analisar o lead.");
    }
});

export const analyzeAttractionPerformance = onCall({ ...corsOptions, secrets: ["GEMINI_API_KEY"] }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    if (!GEMINI_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");

    const { attractionId, targetDate } = request.data;
    if (!attractionId || !targetDate) {
        throw new HttpsError("invalid-argument", "ID da Atração e a data alvo são obrigatórios.");
    }

    try {
        const attractionRef = db.collection('attractions').doc(attractionId);
        const dailyDataCollection = db.collection('historicalAttractionStats').doc(attractionId).collection('dailyData');

        const target = new Date(targetDate + 'T12:00:00Z');
        const targetDayOfWeek = target.getUTCDay();
        const mirrorDaysData = [];

        for (let i = 1; i <= 3; i++) {
            const pastYear = target.getUTCFullYear() - i;
            const pastDate = new Date(Date.UTC(pastYear, target.getUTCMonth(), target.getUTCDate()));
            
            const adjustment = pastDate.getUTCDay() - targetDayOfWeek;
            pastDate.setUTCDate(pastDate.getUTCDate() - adjustment);
            
            const dateStr = pastDate.toISOString().split('T')[0];
            const docSnap = await dailyDataCollection.doc(dateStr).get();
            if (docSnap.exists) {
                const data = docSnap.data();
                mirrorDaysData.push(`Em ${dateStr} (dia da semana similar): espera média ${data?.avgWait} min, inatividade ${data?.downtimePercent}%.`);
            }
        }
        
        const recentTrendData: string[] = [];
        const recentDocsSnap = await dailyDataCollection
            .where(admin.firestore.FieldPath.documentId(), '<', targetDate)
            .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
            .limit(3)
            .get();
            
        recentDocsSnap.forEach(doc => {
            const data = doc.data();
            recentTrendData.push(`Em ${doc.id} (tendência recente): espera média ${data.avgWait} min, inatividade ${data.downtimePercent}%.`);
        });

        const uptimeDataSnap = await dailyDataCollection
            .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
            .limit(30)
            .get();

        let totalDowntime = 0;
        let samples = 0;
        uptimeDataSnap.forEach(doc => {
            totalDowntime += doc.data().downtimePercent;
            samples++;
        });
        const avgDowntime = samples > 0 ? totalDowntime / samples : 0;
        const reliabilityContext = avgDowntime > 15 
            ? "Esta atração tem tido inatividade considerável recentemente." 
            : avgDowntime > 5 
            ? "A atração tem operado com algumas paradas técnicas ocasionais." 
            : "A atração tem se mostrado muito confiável ultimamente.";

        if (mirrorDaysData.length === 0 && recentTrendData.length === 0) {
            throw new HttpsError("not-found", "Não há dados históricos suficientes para esta atração.");
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `
            Aja como um analista de dados especialista em parques temáticos de Orlando. Sua tarefa é criar uma previsão de performance para uma atração para o dia ${targetDate}.
            
            **Dados Históricos (dias similares em anos anteriores):**
            ${mirrorDaysData.join('\n') || 'Nenhum dado de anos anteriores.'}

            **Tendência Recente (últimos dias de operação):**
            ${recentTrendData.join('\n') || 'Nenhum dado recente.'}

            **Confiabilidade (últimos 30 dias):**
            - ${reliabilityContext} (Média de ${avgDowntime.toFixed(1)}% de inatividade).

            **Sua Missão:**
            Com base em todos os dados fornecidos, gere um JSON com as seguintes chaves:
            1.  "analysis": Um parágrafo curto (2-3 frases) analisando o comportamento esperado das filas para o dia ${targetDate}, combinando o histórico com a tendência recente.
            2.  "bestHours": Uma string com os melhores horários para visitar a atração, em um formato como "Das 09h às 10h30 e Após as 19h".
            3.  "geniusTip": Uma "Dica do Gênio" curta, acionável e sutil. Se a confiabilidade for baixa, a dica deve sugerir visitar pela manhã ou aproveitar a chance se a atração estiver funcionando, sem usar termos técnicos como "downtime".

            Seja preciso, útil e use uma linguagem amigável, como um guia experiente.
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        if (!result || !result.text) throw new HttpsError("internal", "A IA não retornou uma análise válida.");

        const prediction = JSON.parse(result.text.trim());

        await attractionRef.update({
            [`performancePredictions.${targetDate}`]: prediction
        });

        return { success: true, prediction };

    } catch (error) {
        console.error("Error analyzing attraction performance:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Ocorreu um erro ao analisar a performance da atração.");
    }
});

export const analyzeSynergies = onCall({ ...corsOptions }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    
    const { attractionId } = request.data;
    if (!attractionId) throw new HttpsError("invalid-argument", "ID da Atração é obrigatório.");

    try {
        const attractionSnap = await db.collection('attractions').doc(attractionId).get();
        if (!attractionSnap.exists) throw new HttpsError("not-found", "Atração não encontrada.");
        const attractionName = attractionSnap.data()?.name;
        
        const synergyCounts: Record<string, number> = {};
        const tripsSnap = await db.collection('trips').get();

        for (const tripDoc of tripsSnap.docs) {
            const itinerarySnap = await tripDoc.ref.collection('itinerary').get();
            const activities = itinerarySnap.docs.map(doc => doc.data());
            
            const daysWithTargetAttraction = new Set<string>();
            activities.forEach(activity => {
                if (activity.title === attractionName) {
                    daysWithTargetAttraction.add(activity.date);
                }
            });

            if (daysWithTargetAttraction.size > 0) {
                const synergisticActivities = activities.filter(activity => 
                    daysWithTargetAttraction.has(activity.date) && activity.title !== attractionName
                );

                synergisticActivities.forEach(activity => {
                    synergyCounts[activity.title] = (synergyCounts[activity.title] || 0) + 1;
                });
            }
        }
        
        const sortedSynergies = Object.entries(synergyCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([title]) => title);

        await db.collection('attractions').doc(attractionId).update({ synergies: sortedSynergies });

        return { success: true, synergies: sortedSynergies };
    } catch (error) {
        console.error("Error analyzing synergies:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Ocorreu um erro ao analisar as sinergias.");
    }
});

export const findQueueTimesPark = onCall({ ...corsOptions }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    const { parkName } = request.data;
    if (!parkName) throw new HttpsError("invalid-argument", "Nome do parque é obrigatório.");

    try {
        const response = await axios.get("https://queue-times.com/pt-BR/api/parks.json");
        const parkData = response.data.flatMap((company: any) => company.parks);
        const lowerCaseParkName = parkName.toLowerCase();
        
        const matches = parkData.filter((park: any) => park.name.toLowerCase().includes(lowerCaseParkName));
        return matches.map((park: any) => ({ id: park.id, name: park.name }));
    } catch (error) {
        console.error("Error finding Queue-Times park:", error);
        throw new HttpsError("internal", "Falha ao buscar parques da API Queue-Times.");
    }
});

const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export const linkSubAttractions = onCall({ ...corsOptions }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    const { ourParkId } = request.data;
    if (!ourParkId) throw new HttpsError("invalid-argument", "ID do nosso parque é obrigatório.");

    try {
        const parkDoc = await db.collection("attractions").doc(ourParkId).get();
        if (!parkDoc.exists) throw new HttpsError("not-found", "Parque não encontrado em nosso sistema.");
        
        const parkData = parkDoc.data() as { queueTimesParkId?: number, name?: string };
        if (!parkData?.queueTimesParkId) throw new HttpsError("failed-precondition", "Este parque ainda não foi vinculado à API de filas.");

        const qtRidesResponse = await axios.get(`https://queue-times.com/pt-BR/api/parks/${parkData.queueTimesParkId}/rides`);
        const qtRides = qtRidesResponse.data;

        const ourRidesSnap = await db.collection("attractions").where("parentId", "==", ourParkId).get();
        const ourRides = ourRidesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as {name: string, queueTimesId?: number} }));

        const suggestions = [];
        const SIMILARITY_THRESHOLD = 0.7;

        const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

        for (const ourRide of ourRides) {
            if (ourRide.queueTimesId) continue; // Pula se já estiver vinculado

            const ourRideNameLower = normalizeName(ourRide.name);
            let bestMatch: { ride: any, score: number } | null = null;

            for (const qtRide of qtRides) {
                const qtRideNameLower = normalizeName(qtRide.name);
                const distance = levenshteinDistance(ourRideNameLower, qtRideNameLower);
                const similarity = 1 - (distance / Math.max(ourRideNameLower.length, qtRideNameLower.length));
                
                if (similarity > SIMILARITY_THRESHOLD) {
                    if (!bestMatch || similarity > bestMatch.score) {
                        bestMatch = { ride: qtRide, score: similarity };
                    }
                }
            }

            if (bestMatch) {
                suggestions.push({
                    ourAttraction: { id: ourRide.id, name: ourRide.name },
                    queueTimesAttraction: { id: bestMatch.ride.id, name: bestMatch.ride.name },
                });
            }
        }
        return suggestions;

    } catch (error) {
        console.error("Error linking sub-attractions:", error);
        throw new HttpsError("internal", "Falha ao vincular sub-atrações.");
    }
});