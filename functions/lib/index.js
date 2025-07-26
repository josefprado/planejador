"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forwardMetaEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
// O token de acesso é injetado como uma variável de ambiente pelo Secret Manager
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
// Função para hashear dados do usuário conforme especificação da Meta
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
exports.forwardMetaEvent = (0, https_1.onRequest)({ secrets: ["META_CAPI_ACCESS_TOKEN"] }, async (request, response) => {
    // Habilita CORS para permitir chamadas do seu app frontend
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
    }
    if (request.method !== "POST") {
        response.status(405).send("Method Not Allowed");
        return;
    }
    if (!ACCESS_TOKEN) {
        console.error("Meta CAPI Access Token is not configured in secrets.");
        response.status(500).send({ success: false, message: "Server configuration error." });
        return;
    }
    try {
        const { eventName, eventData, userData, eventId, settings } = request.body;
        if (!(settings === null || settings === void 0 ? void 0 : settings.metaPixelId)) {
            console.error("Meta Pixel ID is missing from the request settings.");
            response.status(400).send({ success: false, message: "Pixel ID is required." });
            return;
        }
        const PIXEL_ID = settings.metaPixelId;
        // Prepara os dados do usuário para a API, hasheando as informações sensíveis
        const formattedUserData = {
            em: userData.email ? hash(userData.email.toLowerCase()) : undefined,
            ph: userData.phone ? hash(userData.phone.replace(/\D/g, "")) : undefined,
            fn: userData.firstName ? hash(userData.firstName.toLowerCase()) : undefined,
            ln: userData.lastName ? hash(userData.lastName.toLowerCase()) : undefined,
            client_ip_address: request.ip,
            client_user_agent: request.headers["user-agent"],
        };
        // Monta o payload final para a API de Conversões da Meta
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
        const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
        // Envia o evento para a API da Meta
        await axios_1.default.post(url, payload);
        response.status(200).send({ success: true, message: "Event forwarded successfully." });
    }
    catch (error) {
        console.error("Error forwarding event to Meta:", error);
        response.status(500).send({ success: false, message: "Internal Server Error" });
    }
});
//# sourceMappingURL=index.js.map