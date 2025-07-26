import { User, AppSettings } from '../src/types';

declare const fbq: (type: string, event: string, params?: any, eventId?: { eventID: string }) => void;
declare const gtag: (type: string, event: string, params?: any) => void;


// Helper to generate a unique ID for event deduplication
const generateEventId = (): string => {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

export const trackMetaEvent = (settings: AppSettings, eventName: string, params: any = {}, user: User | null): void => {
  if (!settings.metaPixelId) {
    console.warn("Meta Pixel ID is not configured. Skipping event.");
    return;
  }
  const eventId = generateEventId();

  // 1. Track with Browser Pixel (will be blocked by iOS, but works for others)
  if (typeof fbq === 'function') {
    fbq('track', eventName, params, { eventID: eventId });
  } else {
    console.log(`Meta Pixel event blocked (browser): ${eventName}`);
  }

  // 2. Track with Server-Side Conversions API (CAPI) via Cloud Function
  if (!settings.cloudFunctionUrl) {
    console.warn("Cloud Function URL for CAPI is not configured. Skipping server-side event.");
    return;
  }

  const userData = user ? {
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
  } : {};
  
  const payload = {
    eventName,
    eventId,
    eventData: params,
    userData,
    settings,
  };

  // Use navigator.sendBeacon for reliability on page exit, or fetch as fallback
  try {
      if (navigator.sendBeacon) {
          navigator.sendBeacon(settings.cloudFunctionUrl, JSON.stringify(payload));
      } else {
          fetch(settings.cloudFunctionUrl, {
              method: 'POST',
              body: JSON.stringify(payload),
              headers: { 'Content-Type': 'application/json' },
              keepalive: true,
          });
      }
  } catch (error) {
      console.error('Failed to send event to CAPI:', error);
  }
};


export const trackGoogleEvent = (eventName: string, params: any = {}): void => {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  } else {
    console.log(`Google Tag event blocked: ${eventName}`);
  }
};
