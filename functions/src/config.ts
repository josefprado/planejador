// Shared configuration for Firebase Functions

/**
 * A robust list of allowed origins for CORS.
 * Includes:
 * - Production domains (.web.app, .firebaseapp.com)
 * - All Firebase Hosting preview channels (via regex)
 * - Local development environments (via regex)
 */
export const allowedOrigins = [
    "https://contadordediaslaemorlando.web.app",
    "https://contadordediaslaemorlando.firebaseapp.com",
    /https:\/\/contadordediaslaemorlando--.+\.web\.app$/,
    /http:\/\/localhost(:\d+)?$/,
];

/**
 * Shared CORS options for onCall v2 functions.
 */
export const corsOptions = {
    cors: allowedOrigins,
};
