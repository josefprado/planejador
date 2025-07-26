// metaConfig.ts
// IMPORTANTE: Insira suas credenciais da Meta aqui.
// Estes valores são essenciais para o funcionamento do rastreamento híbrido (Pixel + API de Conversões).

export const metaConfig = {
    // Encontrado no seu Gerenciador de Eventos da Meta (ex: 123456789012345).
    PIXEL_ID: "SEU_PIXEL_ID_AQUI", 

    // Gerado no Gerenciador de Eventos ao configurar a API de Conversões.
    // ATENÇÃO: Este token é SECRETO. O ideal é armazená-lo como um "secret" no Google Cloud.
    CAPI_ACCESS_TOKEN: "SEU_TOKEN_DE_ACESSO_CAPI_AQUI",

    // URL da sua Firebase Cloud Function que será criada para encaminhar os eventos.
    // O nome 'forwardMetaEvent' deve corresponder ao nome da função exportada em `functions/src/index.ts`.
    // A região (ex: 'us-central1') deve ser a mesma onde você fará o deploy da função.
    CLOUD_FUNCTION_URL: "https://us-central1-contadordediaslaemorlando.cloudfunctions.net/forwardMetaEvent"
};
