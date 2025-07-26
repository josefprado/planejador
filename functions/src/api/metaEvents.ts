import {onRequest} from "firebase-functions/v2/https";
import { Response } from "express";
import axios from "axios";
import * as crypto from "crypto";

const META_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

// Função para hashear dados do usuário conforme especificação da Meta
const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const forwardMetaEvent = onRequest({ secrets: ["META_CAPI_ACCESS_TOKEN"], cors: true }, async (request, response: Response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  if (!META_ACCESS_TOKEN) {
      console.error("Meta CAPI Access Token is not configured in secrets.");
      response.status(500).send({ success: false, message: "Erro de Configuração: O token META_CAPI_ACCESS_TOKEN não está definido no backend." });
      return;
  }
  
  try {
    const { eventName, eventData, userData, eventId, settings } = request.body;

    if (!settings?.metaPixelId) {
        console.error("Meta Pixel ID is missing from the request settings.");
        response.status(400).send({ success: false, message: "Pixel ID is required." });
        return;
    }
    const PIXEL_ID = settings.metaPixelId;

    const formattedUserData = {
      em: userData.email ? hash(userData.email.toLowerCase()) : undefined,
      ph: userData.phone ? hash(userData.phone.replace(/\D/g, "")) : undefined,
      fn: userData.firstName ? hash(userData.firstName.toLowerCase()) : undefined,
      ln: userData.lastName ? hash(userData.lastName.toLowerCase()) : undefined,
      client_ip_address: request.ip,
      client_user_agent: request.headers["user-agent"] as string,
    };
    
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: eventId,
          user_data: formattedUserData,
          custom_data: eventData,
        },
      ],
    };

    const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;
    await axios.post(url, payload);

    response.status(200).send({ success: true, message: "Event forwarded successfully." });
  } catch (error) {
    console.error("Error forwarding event to Meta:", error);
    response.status(500).send({ success: false, message: "Internal Server Error" });
  }
});