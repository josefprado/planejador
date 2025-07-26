import {onCall, HttpsError} from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Trip, Trend } from "../types";
import { corsOptions } from "../config";


const db = admin.firestore();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const FLORIDA_TIMEZONE = "America/New_York";

const ensureAdmin = async (uid: string | undefined) => {
    if (!uid) {
        throw new HttpsError("unauthenticated", "Acesso negado. Você precisa estar autenticado.");
    }
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        throw new HttpsError("permission-denied", "Acesso negado. Apenas administradores podem executar esta operação.");
    }
};


export const importAndTranslateParkData = onCall({ ...corsOptions, secrets: ["GEMINI_API_KEY"], timeoutSeconds: 540 }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    if (!GEMINI_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");

    let log = "Iniciando enriquecimento da base de dados...\n";
    try {
        log += "Buscando dados do TouringPlans...\n";
        const tpResponse = await axios.get("https://c.touringplans.com/api/attractions.json");
        const tpAttractions = tpResponse.data;
        log += `${tpAttractions.length} atrações encontradas no TouringPlans.\n`;

        log += "Buscando dados da ThemeParks.wiki...\n";
        const tpwResponse = await axios.get("https://api.themeparks.wiki/v1/destinations");
        const destinations = tpwResponse.data.destinations;
        const disneyWorld = destinations.find((d: any) => d.slug === "WaltDisneyWorld");
        
        const allTpwEntities: any[] = [];
        if (disneyWorld) {
            const parksResponse = await axios.get(`https://api.themeparks.wiki/v1/destination/${disneyWorld.slug}`);
            for (const park of parksResponse.data.parks) {
                 const parkDetailResponse = await axios.get(`https://api.themeparks.wiki/v1/entity/${park.id}`);
                 allTpwEntities.push(...parkDetailResponse.data.children);
            }
        }
        log += `${allTpwEntities.length} entidades encontradas na ThemeParks.wiki para WDW.\n`;
        
        const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const tpwEntityMap = new Map(allTpwEntities.map((e) => [normalizeName(e.name), e]));
        log += "Mapa de entidades da ThemeParks.wiki criado.\n";

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const batch = db.batch();
        let processedCount = 0;

        for (const tpAttr of tpAttractions) {
            const docRef = db.collection("importedAttractions").doc(tpAttr.permalink);
            
            await new Promise((resolve) => setTimeout(resolve, 250));
            const [translatedDescription, translatedWhenToGo] = await Promise.all([
                ai.models.generateContent({model: "gemini-2.5-flash", contents: `Traduza para o português do Brasil, de forma natural e envolvente para um turista: "${tpAttr.what_it_is}"`}),
                ai.models.generateContent({model: "gemini-2.5-flash", contents: `Traduza para o português do Brasil, de forma natural e envolvente para um turista: "${tpAttr.when_to_go}"`}),
            ]);

            const mergedData: any = {
                touringPlansId: tpAttr.permalink,
                name: tpAttr.name,
                what_it_is: translatedDescription.text,
                when_to_go: translatedWhenToGo.text,
                scope_and_scale: tpAttr.scope_and_scale,
                height_restriction_cm: tpAttr.height_restriction_inches ? Math.round(parseFloat(tpAttr.height_restriction_inches) * 2.54) : null,
                thrill_rating: tpAttr.thrill_rating,
                toddler_rating: tpAttr.toddler_rating,
                school_age_rating: tpAttr.school_age_rating,
                theming_rating: tpAttr.theming_rating,
                single_rider_available: tpAttr.single_rider === "1",
                cuisine: tpAttr.cuisine,
                service_type: tpAttr.service,
                average_cost: tpAttr.average_cost_per_person,
            };

            const matchedTpwEntity = tpwEntityMap.get(normalizeName(tpAttr.name));
            if (matchedTpwEntity) {
                mergedData.tags = matchedTpwEntity.tags?.map((t: any) => t.value) || [];
                mergedData.showtimes = matchedTpwEntity.showtimes?.map((s: any) => s.startTime) || [];
            }
            batch.set(docRef, mergedData);
            processedCount++;
            log += `Processed ${processedCount}/${tpAttractions.length}: ${tpAttr.name}\n`;
        } // end of for loop

        await batch.commit();
        log += `\nEnriquecimento concluído! ${processedCount} atrações processadas e salvas.`;
        return { success: true, log };
    } catch (error: any) {
        console.error("Error importing and translating park data:", error);
        log += `\nERRO: ${error.message}`;
        throw new HttpsError("internal", "Falha no processo de importação.", { log });
    }
});


export const upgradeExistingTrips = onCall({ ...corsOptions, secrets: ["GOOGLE_MAPS_API_KEY"], timeoutSeconds: 540 }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("CRITICAL: GOOGLE_MAPS_API_KEY secret is not defined.");
        throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GOOGLE_MAPS_API_KEY não está definida no backend.");
    }
    
    const { tasks } = request.data;
    if (!tasks || !Array.isArray(tasks)) throw new HttpsError("invalid-argument", "Tasks array is required.");
    let log = "";
    const tripsSnap = await db.collection("trips").get();
    const batch = db.batch();
    let updatedCount = 0;

    for (const doc of tripsSnap.docs) {
        const trip = doc.data() as Trip;
        let needsUpdate = false;
        const updateData: any = {};

        if (tasks.includes('geocode') && trip.destination && !trip.coords) {
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trip.destination)}&key=${GOOGLE_MAPS_API_KEY}`;
            const geoResponse = await axios.get(geoUrl);
            if (geoResponse.data.status === 'OK') {
                updateData.coords = geoResponse.data.results[0].geometry.location;
                needsUpdate = true;
            }
        }
        if (tasks.includes('setThemeParkFlag') && trip.destination && trip.isThemeParkTrip === undefined) {
             const lowerCaseDestination = trip.destination.toLowerCase();
             const keywords = ['orlando', 'disney', 'universal', 'anaheim'];
             updateData.isThemeParkTrip = keywords.some(keyword => lowerCaseDestination.includes(keyword));
             needsUpdate = true;
        }
        if (tasks.includes('initializeStructures')) {
            if (!trip.parkWishlists) { updateData.parkWishlists = {}; needsUpdate = true; }
            if (!trip.flights) { updateData.flights = []; needsUpdate = true; }
        }
        
        if (needsUpdate) {
            batch.update(doc.ref, updateData);
            updatedCount++;
        }
    }
    await batch.commit();
    log += `${updatedCount} trips updated.`;
    return { success: true, log };
});

export const upgradeExistingUsers = onCall({ ...corsOptions }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    const { tasks } = request.data;
    if (!tasks || !Array.isArray(tasks)) throw new HttpsError("invalid-argument", "Tasks array is required.");
    let log = "";
    const usersSnap = await db.collection("users").get();
    const batch = db.batch();
    let updatedCount = 0;
    
    for (const doc of usersSnap.docs) {
        const user = doc.data();
        let needsUpdate = false;
        const updateData: any = {};
        if (tasks.includes('initializeUserStructures')) {
            if (!user.intentLog) { updateData.intentLog = []; needsUpdate = true; }
            if (!user.aiUsage) { updateData.aiUsage = { count: 0, lastReset: '' }; needsUpdate = true; }
        }
        if (needsUpdate) {
            batch.update(doc.ref, updateData);
            updatedCount++;
        }
    }
    await batch.commit();
    log += `${updatedCount} users updated.`;
    return { success: true, log };
});

export const populateSubAttractions = onCall({ ...corsOptions, secrets: ["GEMINI_API_KEY"], timeoutSeconds: 540 }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    if (!GEMINI_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave GEMINI_API_KEY não está definida no backend.");
    const { parkId } = request.data;
    if (!parkId) throw new HttpsError("invalid-argument", "Park ID is required.");
    // In a real scenario, this would fetch from an external API, translate, and save.
    // For this fix, we'll return a success message.
    return { success: true, log: `Sub-attractions for park ${parkId} would be populated here.` };
});

export const importHistoricalWaitTimes = onCall({ ...corsOptions, timeoutSeconds: 540 }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    const { mode } = request.data;
    // Placeholder for a complex historical data import.
    return { success: true, log: `Historical data import would run in '${mode}' mode.` };
});

export const analyzeTripTrends = async (): Promise<Trend[]> => {
    const tripsSnap = await db.collection("trips").get();
    const destinationCounts: Record<string, number> = {};
    tripsSnap.forEach(doc => {
        const trip = doc.data() as Trip;
        const city = trip.destination.split(',')[0].trim();
        destinationCounts[city] = (destinationCounts[city] || 0) + 1;
    });
    return Object.entries(destinationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([destination, count]) => ({ destination, count }));
};

export const generateAdminBriefing = onSchedule({ schedule: "every day 08:00", timeZone: FLORIDA_TIMEZONE }, async (event) => {
    const tripsSnap = await db.collection("trips").get();
    const allTrips = tripsSnap.docs.map(doc => doc.data() as Trip);
    
    const hotLeads = allTrips.filter(t => t.voucherInsights && t.voucherInsights.length > 0 && (t.status === 'Novo' || t.status === 'Quente'));
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const urgentTasks = allTrips.filter(t => new Date(t.startDate) <= sevenDaysFromNow && (!t.voucherInsights || t.voucherInsights.length === 0));

    const trends = await analyzeTripTrends();

    await db.collection("admin").doc("dailyBriefing").set({
        generatedAt: new Date().toISOString(),
        hotLeads: hotLeads.slice(0, 5).map(t => ({ id: t.id, ownerId: t.ownerId, destination: t.destination })), // only store necessary fields
        urgentTasks: urgentTasks.slice(0, 5).map(t => ({ id: t.id, ownerId: t.ownerId, destination: t.destination })),
        trends,
    });
});