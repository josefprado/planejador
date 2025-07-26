import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { CalendarSource, CustomEvent } from "../types";
import { corsOptions } from "../config";

const db = admin.firestore();
const GOOGLE_CALENDAR_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
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

export const fetchAndCacheHolidays = onCall({ ...corsOptions, secrets: ["GOOGLE_CALENDAR_API_KEY"] }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    if (!GOOGLE_CALENDAR_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GOOGLE_CALENDAR_API_KEY não está definida no backend.");

    try {
        const sourcesSnap = await db.collection('calendarSources').get();
        if (sourcesSnap.empty) {
            return { success: true, message: "Nenhuma fonte de calendário configurada para sincronizar." };
        }
        const sources = sourcesSnap.docs.map(doc => doc.data() as CalendarSource);

        const allHolidays = [];
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setFullYear(timeMax.getFullYear() + 2); // Fetch events for the next 2 years

        for (const source of sources) {
            const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(source.calendarId)}/events?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;
            
            const response = await axios.get(url);
            const events = response.data.items || [];
            
            for (const event of events) {
                if (event.start.date) { // All-day event
                    allHolidays.push({
                        date: event.start.date,
                        name: event.summary,
                        countryCode: source.calendarId.includes('brazilian') ? 'BR' : 'US',
                        level: source.type === 'Feriado Escolar' ? 'school' : 'national',
                        source: source.name,
                    });
                }
            }
        }

        const batch = db.batch();
        const oldHolidaysSnap = await db.collection('holidays').get();
        oldHolidaysSnap.forEach(doc => batch.delete(doc.ref));
        
        allHolidays.forEach(holiday => {
            const docRef = db.collection('holidays').doc(`${holiday.date}_${holiday.name.replace(/ /g, "_")}`);
            batch.set(docRef, holiday);
        });
        
        await batch.commit();

        return { success: true, message: `${allHolidays.length} feriados e eventos foram sincronizados com sucesso!` };
    } catch (error: any) {
        console.error("Error fetching from Google Calendar:", error.response?.data || error.message);
        throw new HttpsError("internal", "Falha ao buscar feriados do Google Calendar. Verifique as IDs dos calendários e a chave de API.");
    }
});

export const _getSingleDayCrowdPredictionLogic = async (dateStr: string) => {
    if (!GEMINI_API_KEY) {
        throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");
    }

    const date = new Date(Date.UTC(
        parseInt(dateStr.substring(0, 4), 10),
        parseInt(dateStr.substring(5, 7), 10) - 1,
        parseInt(dateStr.substring(8, 10), 10)
    ));

    const holidaysSnap = await db.collection('holidays').where('date', '==', dateStr).get();
    const customEventsSnap = await db.collection('customEvents').get();

    const allHolidays = holidaysSnap.docs.map(doc => doc.data());
    const allCustomEvents = customEventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomEvent));

    const todaysEvents = [
        ...allHolidays,
        ...allCustomEvents.filter(e => dateStr >= e.startDate && dateStr <= e.endDate),
    ];

    const getHistoricalScore = (d: Date): number => {
        let score = 5; 
        const month = d.getUTCMonth();
        const dayOfWeek = d.getUTCDay();
    
        const monthWeights: { [key: number]: number } = { 0: -1, 1: -1, 2: 1, 3: 1, 4: 0, 5: 2, 6: 2, 7: 1, 8: -1, 9: 0, 10: 0, 11: 2 };
        score += monthWeights[month] ?? 0;
    
        const dayWeights: { [key: number]: number } = { 0: 1, 1: 0, 2: -2, 3: -2, 4: 0, 5: 1, 6: 2 };
        score += dayWeights[dayOfWeek] ?? 0;
    
        return Math.max(1, Math.min(10, Math.round(score)));
    };
    
    const historicalScore = getHistoricalScore(date);

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const eventDescriptions = todaysEvents.map(e => {
        const customEvent = e as CustomEvent;
        return customEvent.impactDescription ? `${customEvent.name}: ${customEvent.impactDescription}` : customEvent.name;
    }).join(', ');

    const prompt = `Analise a lotação para um parque em Orlando no dia ${dateStr}.
    - Score histórico base: ${historicalScore}/10.
    - Dia da semana: ${date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' })}.
    - Feriados/Eventos no dia: ${eventDescriptions || 'Nenhum'}.
    Com base nestes fatores, especialmente nas regras dos eventos, gere uma previsão JSON com: 'score' (número de 1 a 10) e 'explanation' (um texto curto e amigável em português explicando o porquê da nota, mencionando os eventos e o impacto deles).`;

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const predictionData = JSON.parse(result.text);

    return {
        date: dateStr,
        score: predictionData.score,
        explanation: predictionData.explanation,
        events: todaysEvents,
    };
};

export const getCrowdCalendarPrediction = onCall({ ...corsOptions, secrets: ["GEMINI_API_KEY"] }, async (request) => {
    if (!GEMINI_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");
    if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Você precisa estar logado.");

    const { year, month } = request.data;
    if (!year || !month) throw new HttpsError("invalid-argument", "Ano e mês são obrigatórios.");

    try {
        const daysInMonth = new Date(year, month, 0).getDate();
        const predictionPromises = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(Date.UTC(year, month - 1, day));
            const dateStr = date.toISOString().split('T')[0];
            predictionPromises.push(_getSingleDayCrowdPredictionLogic(dateStr));
        }

        const dailyPredictions = await Promise.all(predictionPromises);
        return dailyPredictions;
    } catch (error) {
        console.error("Error generating crowd calendar prediction:", error);
        throw new HttpsError("internal", "Falha ao gerar previsão de lotação.");
    }
});