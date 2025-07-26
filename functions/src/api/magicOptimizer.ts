import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { _getSingleDayCrowdPredictionLogic } from "./crowdCalendar";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { corsOptions } from "../config";

const db = admin.firestore();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const FLORIDA_TIMEZONE = "America/New_York";

export const getMagicOptimizerPlan = onCall({ ...corsOptions, secrets: ["GEMINI_API_KEY", "OPENWEATHER_API_KEY"] }, async (request) => {
    if (!GEMINI_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");
    if (!OPENWEATHER_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave OPENWEATHER_API_KEY não está definida no backend.");
    
    const uid = request.auth?.uid;
    const { tripId, parkName, date } = request.data; // date in YYYY-MM-DD

    if (!uid) throw new HttpsError("unauthenticated", "Você precisa estar logado.");
    if (!tripId || !parkName || !date) throw new HttpsError("invalid-argument", "ID da Viagem, Nome do Parque e Data são obrigatórios.");

    const userRef = db.collection("users").doc(uid);
    const tripRef = db.collection("trips").doc(tripId);

    try {
        const [userDoc, tripDoc] = await Promise.all([userRef.get(), tripRef.get()]);

        if (!userDoc.exists) throw new HttpsError("not-found", "Usuário não encontrado.");
        if (!tripDoc.exists) throw new HttpsError("not-found", "Viagem não encontrada.");
        
        const user = userDoc.data();
        const trip = tripDoc.data();

        const today = new Date().toISOString().split('T')[0];
        if (!user?.premiumAccessUntil || user.premiumAccessUntil < today) {
            throw new HttpsError("permission-denied", "Esta é uma funcionalidade exclusiva para clientes. Fale com seu agente!");
        }

        if (trip?.magicOptimizerPlans && trip.magicOptimizerPlans[parkName]) {
            return trip.magicOptimizerPlans[parkName];
        }

        // 1. Crowd Calendar & Events
        const dayPrediction = await _getSingleDayCrowdPredictionLogic(date);

        // 2. Weather (ENHANCED with hourly forecast)
        let weatherContext = "Não foi possível obter a previsão do tempo detalhada.";
        if (trip?.coords) {
            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${trip.coords.lat}&lon=${trip.coords.lng}&exclude=minutely,daily,alerts&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;
            try {
                const weatherResponse = await axios.get(weatherUrl);
                const hourlyForecast = weatherResponse.data.hourly
                    .filter((h: any) => formatInTimeZone(fromZonedTime(new Date(h.dt * 1000), FLORIDA_TIMEZONE), FLORIDA_TIMEZONE, 'yyyy-MM-dd') === date)
                    .map((h: any) => ({
                        time: formatInTimeZone(fromZonedTime(new Date(h.dt * 1000), FLORIDA_TIMEZONE), FLORIDA_TIMEZONE, 'HH:mm'),
                        temp: Math.round(h.temp),
                        description: h.weather[0].description,
                        rain: h.pop > 0.3 // Probability of precipitation > 30%
                    }));
                
                if (hourlyForecast.length > 0) {
                    weatherContext = `Previsão horária para hoje: ${hourlyForecast.map((h: any) => `${h.time} - ${h.temp}°C, ${h.description}${h.rain ? ' (chance de chuva)' : ''}`).join('; ')}.`;
                }
            } catch (e) {
                console.error("Failed to get hourly weather:", e);
            }
        }
        
        // 3. User & Trip Profile
        const travelerDetails = trip?.travelers ? `O grupo é composto por: ${trip.travelers.map((t: any) => `${t.firstName} (${new Date().getFullYear() - new Date(t.dob).getFullYear()} anos)`).join(', ')}.` : '';
        const wishlist = trip?.parkWishlists?.[parkName] || [];
        const wishlistAttractions = wishlist.length > 0 ? `A lista de desejos deles para o ${parkName} inclui: ${wishlist.join(', ')}.` : 'Eles não pré-selecionaram atrações.';

        // --- Construct the "God Prompt" ---
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `
            Você é um guia VIP da Disney, especialista em logística e otimização de parques. Sua tarefa é criar o roteiro diário perfeito.
            Definições:
            - Single Rider: Fila separada para visitantes individuais ocuparem assentos vazios. O grupo pode ser separado.
            - Rider Switch: Serviço para pais com crianças pequenas se revezarem em uma atração sem pegar a fila duas vezes.

            **Contexto do Dia:**
            - Data: ${date}
            - Parque: ${parkName}
            - Previsão de Lotação: ${dayPrediction?.score || 'N/A'}/10. Motivo: ${dayPrediction?.explanation || 'N/A'}.
            - Clima: ${weatherContext}

            **Contexto do Grupo:**
            - ${travelerDetails}
            - ${wishlistAttractions}

            **Sua Missão:**
            Crie um roteiro otimizado em blocos de horário, começando às 9h e terminando às 21h.
            1.  **Priorize a Lista de Desejos**.
            2.  **Minimize Filas:** Use o conhecimento geral de que filas são menores no início da manhã e no final da noite. Agende atrações populares para esses horários.
            3.  **Crie uma Rota Lógica:** Agrupe as atividades por áreas do parque para minimizar a caminhada.
            4.  **Adapte-se ao Contexto:** Leve em conta a idade e altura das crianças para o ritmo e as pausas. Considere a previsão horária de chuva para agendar atrações cobertas e pausas estratégicas durante esses períodos. Sugira pausas para refeições em horários estratégicos.
            5.  **Dê Dicas VIP:** Para cada bloco, adicione uma justificativa curta e inteligente (a "Dica da IA"), mencionando 'Single Rider' ou 'Rider Switch' quando aplicável.

            **Formato de Saída OBRIGATÓRIO:**
            Retorne um objeto JSON com uma única chave "steps", que é um array de objetos. Cada objeto deve ter as chaves "startTime", "endTime", "title" e "description".
            Exemplo: { "steps": [{ "startTime": "09:00", "endTime": "10:00", "title": "Corra para a Space Mountain!", "description": "Dica da IA: As filas aqui são menores na primeira hora. Aproveite!" }] }
        `;

         const result = await ai.models.generateContent({
             model: "gemini-2.5-flash",
             contents: prompt,
             config: { responseMimeType: "application/json" }
         });

         if (!result || !result.text) {
             throw new HttpsError("internal", "A IA não retornou um resultado válido.");
         }
         
         const plan = JSON.parse(result.text);

         await tripRef.set({
             magicOptimizerPlans: {
                 ...trip?.magicOptimizerPlans,
                 [parkName]: {
                     generatedAt: new Date().toISOString(),
                     steps: plan.steps,
                 }
             }
         }, { merge: true });

        return plan;
    } catch (error) {
        console.error(`Error generating magic optimizer plan for trip ${tripId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Ocorreu um erro inesperado ao gerar o roteiro mágico.");
    }
});