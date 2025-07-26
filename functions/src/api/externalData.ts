import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import { corsOptions } from "../config";

const db = admin.firestore();
const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const ensureAdmin = async (uid: string | undefined) => {
    if (!uid) {
        throw new HttpsError("unauthenticated", "Acesso negado. Você precisa estar autenticado.");
    }
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        throw new HttpsError("permission-denied", "Acesso negado. Apenas administradores podem executar esta operação.");
    }
};

export const getTripAdvisorDetails = onCall({ ...corsOptions, secrets: ["TRIPADVISOR_API_KEY"] }, async (request) => {
  await ensureAdmin(request.auth?.uid);
  if (!TRIPADVISOR_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave TRIPADVISOR_API_KEY não está definida no backend.");
  
  const { locationId } = request.data;
  if (!locationId) throw new HttpsError("invalid-argument", "O ID do local é obrigatório.");

  const url = `https://api.tripadvisor.com/api/v1/location/${locationId}/details?key=${TRIPADVISOR_API_KEY}&language=pt_BR`;
  try {
    const response = await axios.get(url, { headers: { "accept": "application/json" } });
    const data = response.data;
    if (!data) return null;
    return {
      rating: data.rating ? parseFloat(data.rating) : null,
      num_reviews: data.num_reviews ? parseInt(data.num_reviews, 10) : null,
    };
  } catch (error) {
    console.error(`Error fetching TripAdvisor details for location ${locationId}:`, error);
    return null;
  }
});

export const getOpenWeather = onCall({ ...corsOptions, secrets: ["OPENWEATHER_API_KEY"] }, async (request) => {
    if (!OPENWEATHER_API_KEY) throw new HttpsError("failed-precondition", "Erro de Configuração: A chave OPENWEATHER_API_KEY não está definida no backend.");
    if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Você precisa estar logado.");

    const { lat, lng } = request.data;
    if (lat === undefined || lng === undefined) throw new HttpsError("invalid-argument", "Latitude e longitude são obrigatórias.");

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=minutely,hourly,alerts&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        const responseData = response.data;
        if (!responseData) return null;
        return {
            current: { temp: responseData.current.temp, weather: responseData.current.weather },
            daily: responseData.daily.slice(0, 5).map((d: any) => ({ dt: d.dt, temp: { day: d.temp.day, min: d.temp.min, max: d.temp.max }, weather: d.weather })),
        };
    } catch (error) {
        console.error(`Error fetching OpenWeather data for lat: ${lat}, lng: ${lng}:`, error);
        return null;
    }
});

export const getQueueTimes = onCall({ ...corsOptions }, async (request) => {
    // This function is public and doesn't require admin, but requires auth
    if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Você precisa estar logado.");
    
    const { queueTimesParkId } = request.data;
    if (!queueTimesParkId) throw new HttpsError("invalid-argument", "O ID do parque da API de filas é obrigatório.");

    try {
        const qtResponse = await axios.get(`https://queue-times.com/pt-BR/api/parks/${queueTimesParkId}/queue_times.json`);
        const qtData = qtResponse.data.lands.flatMap((l: any) => l.rides);
        const finalWaitTimes: Record<string, number> = {};
        qtData.forEach((item: any) => {
            finalWaitTimes[item.name] = item.wait_time;
        });
        return finalWaitTimes;
    } catch (error) {
        console.error("Error fetching wait times:", error);
        throw new HttpsError("internal", "Falha ao buscar tempos de fila.");
    }
});


export const getOsmPois = onCall({ ...corsOptions }, async (request) => {
    await ensureAdmin(request.auth?.uid);
    const { lat, lng } = request.data;
    if (!lat || !lng) throw new HttpsError("invalid-argument", "Latitude e longitude são obrigatórias.");
    
    const bbox = `${lat-0.05},${lng-0.05},${lat+0.05},${lng+0.05}`;
    const query = `[out:json];(node["tourism"="attraction"](${bbox});way["tourism"="attraction"](${bbox});relation["tourism"="attraction"](${bbox});node["tourism"="museum"](${bbox});way["tourism"="museum"](${bbox});relation["tourism"="museum"](${bbox});node["amenity"="restaurant"](${bbox});way["amenity"="restaurant"](${bbox});relation["amenity"="restaurant"](${bbox}););out center;`;
    
    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`);
        return response.data.elements.map((el: any) => ({
            id: el.id,
            name: el.tags.name,
            type: el.tags.tourism || el.tags.amenity,
        })).filter((el: any) => el.name);
    } catch (error) {
        console.error("Error fetching from Overpass API:", error);
        throw new HttpsError("internal", "Falha ao buscar pontos de interesse.");
    }
});