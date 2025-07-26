import { HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import axios from "axios";

const db = admin.firestore();
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

interface TeamConfig {
    name: string;
    venueId: string;
    city: string;
}

const TEAMS_TO_TRACK: TeamConfig[] = [
    { name: 'orlando-magic', venueId: 'KovZpZAFFtIA', city: 'Orlando' },
    { name: 'miami-heat', venueId: 'KovZpZAFeIEA', city: 'Miami' },
    { name: 'tampa-bay-buccaneers', venueId: 'KovZpZAFnJda', city: 'Tampa' },
    { name: 'orlando-city-sc', venueId: 'KovZpZAFFElA', city: 'Orlando' },
    { name: 'orlando-solar-bears', venueId: 'KovZpZAFFtIA', city: 'Orlando' },
];

export const syncTicketmasterEvents = onSchedule({
    schedule: "every 24 hours",
    secrets: ["TICKETMASTER_API_KEY"],
}, async (event) => {
    if (!TICKETMASTER_API_KEY) {
        console.error("Erro de Configuração: A chave TICKETMASTER_API_KEY não está definida no backend. A sincronização de eventos foi abortada.");
        return;
    }

    const eventsRef = db.collection('events');
    const batch = db.batch();
    let fetchedCount = 0;

    // 1. Fetch events for active destinations
    const destinationsSnap = await db.collection('eventDestinations').where('isActive', '==', true).get();
    for (const doc of destinationsSnap.docs) {
        const dest = doc.data();
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?countryCode=${dest.countryCode}&city=${dest.city}&apikey=${TICKETMASTER_API_KEY}&sort=date,asc&classificationName=Music,Sports,Arts%26Theatre`;
        
        try {
            const response = await axios.get(url);
            const tmEvents = response.data._embedded?.events || [];
            
            for (const tmEvent of tmEvents) {
                const eventData = {
                    id: tmEvent.id,
                    name: tmEvent.name,
                    type: tmEvent.classifications[0]?.segment?.name.toLowerCase().includes('music') ? 'music' : tmEvent.classifications[0]?.segment?.name.toLowerCase().includes('sport') ? 'sports' : 'other',
                    city: dest.city,
                    date: tmEvent.dates.start.dateTime,
                    imageUrl: tmEvent.images.find((img: any) => img.ratio === '16_9')?.url,
                    venue: tmEvent._embedded?.venues[0]?.name,
                    url: tmEvent.url,
                };
                batch.set(eventsRef.doc(tmEvent.id), eventData, { merge: true });
                fetchedCount++;
            }
        } catch (error) {
            console.error(`Failed to fetch events for ${dest.city}:`, error);
        }
    }

    // 2. Fetch games for specific teams
    for (const team of TEAMS_TO_TRACK) {
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&venueId=${team.venueId}&sort=date,asc&keyword=${team.name.replace(/-/g, ' ')}`;

        try {
            const response = await axios.get(url);
            const tmEvents = response.data._embedded?.events || [];

            for (const tmEvent of tmEvents) {
                const eventData = {
                    id: tmEvent.id,
                    name: tmEvent.name,
                    type: 'sports',
                    team: team.name,
                    city: team.city,
                    date: tmEvent.dates.start.dateTime,
                    imageUrl: tmEvent.images.find((img: any) => img.ratio === '16_9')?.url,
                    venue: tmEvent._embedded?.venues[0]?.name,
                    url: tmEvent.url,
                };
                batch.set(eventsRef.doc(tmEvent.id), eventData, { merge: true });
                fetchedCount++;
            }
        } catch (error) {
            console.error(`Failed to fetch events for team ${team.name}:`, error);
        }
    }

    try {
        await batch.commit();
        console.log(`Successfully synced ${fetchedCount} events from Ticketmaster.`);
    } catch (error) {
        console.error("Failed to commit Ticketmaster events to Firestore:", error);
    }
});