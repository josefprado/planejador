import { ReactNode, ElementType, FC } from 'react';

export type ModalType = 
    | 'trip' | 'login' | 'profile' | 'ticketChoice' | 'hotel' 
    | 'car' | 'insurance' | 'virtualGuiding' | 'otherServices' 
    | 'info' | 'deleteConfirmation' | 'deleteAccount' | 'followUs' | 'checklist' | 'theme' 
    | 'documents' | 'activity' | 'collaboration' | 'selectDocument' | 'coupons' | 'currencyConverter'
    | 'termsOfUse' | 'privacyPolicy' | 'consent' | 'journal' | 'onboarding' | 'assistant'
    | 'upgradeToOptimizer' | 'subAttractionLinker';
    
export type PanelType = 'expenses' | 'accommodation' | 'flights' | 'parkSelection' | 'parkOptimizer' | 'crowdCalendar' | 'magicGuide' | 'parkDetail' | 'vault' | 'events';

export type MainView = 'hoje' | 'roteiro' | 'parques' | 'cofre';
export type TripSubView = 'list' | 'dashboard' | 'itinerary' | 'countdown';
    
export type ItineraryPeriod = 'Manhã' | 'Tarde' | 'Noite' | 'Dia Todo';
export type ItineraryCategory = 'park' | 'restaurant' | 'shopping' | 'hotel' | 'transport' | 'event';
export type CollaboratorRole = 'editor' | 'viewer';
export type LeadStatus = 'Novo' | 'Em Atendimento' | 'Fechado' | 'Quente';
export type DocCategory = 'Voo' | 'Hospedagem' | 'Ingresso' | 'Aluguel de Carro' | 'Seguro' | 'Outro';
export type ExpenseCategory = 'Alimentação' | 'Transporte' | 'Compras' | 'Hospedagem' | 'Passeios' | 'Outro';
export type TravelStyle = 'Relaxar na Praia' | 'Aventura e Esportes' | 'Foco em Gastronomia' | 'Compras' | 'Viagem em Família com Crianças Pequenas' | 'Cultural e Museus' | 'Econômica';
export type BudgetLevel = 'Econômico' | 'Confortável' | 'Luxo';
export type AdminTab = 'dashboard' | 'leads' | 'coupons' | 'ticketRules' | 'itineraryRules' | 'complexes' | 'attractionTypes' | 'attractions' | 'settings' | 'parkContent' | 'futureTools' | 'events' | 'calendarSources' | 'users' | 'historicalData' | 'dataMigration' | 'eventDestinations';

// Explicitly export React types to be used across the app
export type { ReactNode, ElementType, FC };

export interface Coords {
    lat: number;
    lng: number;
}

export interface Flight {
  id: string; // uuid
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureDateTime: string; // ISO String
  arrivalAirport: string;
  arrivalDateTime: string; // ISO String
  confirmationNumber?: string;
  passengerNames?: string[];
}

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  confirmationNumber?: string;
  notes?: string;
  coords?: Coords;
}

export interface Traveler {
  id: string; // uuid for local state key
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  gender: 'Masculino' | 'Feminino' | 'Outro' | '';
}

export interface Expense {
    id: string;
    description: string;
    originalAmount: number;
    originalCurrency: 'USD' | 'BRL';
    convertedAmountBRL: number;
    exchangeRate?: number; // Rate used for conversion if originalCurrency is not BRL
    category: ExpenseCategory;
    date: string; // YYYY-MM-DD
    createdAt: string; // ISO String
}

export interface JournalEntry {
  id: string; // The date in YYYY-MM-DD format
  notes: string;
  photoIds: string[]; // Google Drive file IDs
  photoUrls?: {id: string; url: string}[]; // Temporary URLs for display
  chronicle?: string;
  chroniclePhotoId?: string; // The ID of the photo chosen for the memory card background
}

export interface Collaborator {
  role: CollaboratorRole;
  photoURL?: string;
  displayName?: string;
  email?: string;
}

export interface ItineraryActivity {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  period: ItineraryPeriod;
  category: ItineraryCategory;
  notes?: string;
  order: number;
  linkedDocumentId?: string;
  linkedDocumentName?: string;
  tripAdvisorLocationId?: string;
  tripAdvisorRating?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  phase: string;
  checked: boolean;
  order: number;
  action?: ModalType | null;
}

export interface GeminiAnalysis {
  persona: string;
  leadScore: number;
  leadScoreReasoning: string;
  sentiment: 'Animado' | 'Ansioso' | 'Neutro';
  keyInterests: string[];
  nextBestOffer: {
    service: string;
    justification: string;
  };
  dna?: string;
}

export interface VoucherInsight {
  provider?: string;
  bookingAgency?: string;
  totalPrice?: number;
  currency?: string;
  bookingReference?: string;
  documentType?: DocCategory;
  extractedAt: string; // ISO String
}

export interface ImportedAttractionData {
    id: string; // from touringplans
    name_en: string;
    name_pt: string;
    description_en: string;
    description_pt: string;
    parkName: string; // e.g., "Magic Kingdom"
    isIndoor: boolean;
    heightRequirement_cm?: number;
    coords: Coords;
    tags: string[]; // e.g., 'thrill-ride', 'small-kids'
}

export interface MagicOptimizerStep {
    startTime: string; // "HH:MM"
    endTime: string;   // "HH:MM"
    title: string;
    description: string;
}

export interface MagicOptimizerPlan {
    generatedAt: string; // ISO String
    steps: MagicOptimizerStep[];
}

export interface HistoricalAttractionStat {
    id: string; // YYYY-MM-DD
    totalSamples: number;
    avgWait: number;
    maxWait: number;
    downtimePercent: number;
}

export interface PerformancePrediction {
    analysis: string;
    bestHours: string;
    geniusTip: string;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  ownerId: string;
  memberIds: string[];
  collaborators: { [uid: string]: Collaborator };
  travelers?: Traveler[];
  accommodations?: Accommodation[];
  flights?: Flight[];
  checklist?: ChecklistItem[];
  themeId?: string;
  driveFolderId?: string;
  createdAt?: string;
  travelStyle?: TravelStyle[];
  budgetLevel?: BudgetLevel;
  coords?: Coords;
  isThemeParkTrip?: boolean;
  voucherInsights?: VoucherInsight[];
  parkWishlists?: Record<string, string[]>; // { "Magic Kingdom": ["attractionId1", "attractionId2"] }
  completedAttractions?: Record<string, string[]>; // { "2024-10-20": ["attractionId1"] }
  magicOptimizerPlans?: Record<string, MagicOptimizerPlan>; // { "Magic Kingdom": MagicOptimizerPlan }
  // CRM Fields
  status?: LeadStatus;
  agentNotes?: string;
  nextContactDate?: string; // YYYY-MM-DD
  geminiAnalysis?: GeminiAnalysis;
}

// Trip with detailed sub-collections for the dashboard
export interface DetailedTrip extends Trip {
    itinerary: ItineraryActivity[];
    expenses: Expense[];
    checklist: ChecklistItem[];
}

export interface UserIntentLog {
  timestamp: string; // ISO String
  action: string; // e.g., 'used_plan_b', 'uploaded_document', 'used_coupon'
  details: string; // e.g., 'Reason: Orçamento Apertado', 'Document: Voo GOL1234.pdf', 'Coupon: Cheesecake Factory'
}

export interface UserDetails {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  userAgent?: string;
  isAdmin?: boolean;
  termsAccepted?: {
    timestamp: string;
    termsVersion: string;
    privacyVersion: string;
    ipAddress: string;
    location: string;
    userAgent: string;
  },
  aiUsage?: {
    count: number;
    lastReset: string; // YYYY-MM-DD
  },
  intentLog?: UserIntentLog[];
  premiumAccessUntil?: string; // YYYY-MM-DD
}

export interface User extends UserDetails {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// --- START: Coupon Types ---
export type CouponType = 'code' | 'url';
export type DiscountType = 'percentage' | 'fixed' | 'other';
export type CouponCategory = 'Alimentação' | 'Compras' | 'Transporte' | 'Serviços' | 'Passeios' | 'Hospedagem' | 'Outros';

export interface Coupon {
  id: string;
  // Public Fields
  companyName: string;
  offerTitle: string;
  description: string;
  usageInstructions?: string;
  category: CouponCategory;
  logoUrl?: string;
  imageUrl?: string;
  type: CouponType;
  code?: string;
  url?: string;
  discountType: DiscountType;
  discountValue?: number;
  expiresAt?: string; // ISO String for Firestore Timestamp
  isUnlimited: boolean;
  // Admin-only Fields
  partnerName?: string;
  partnerEmail?: string;
  companyWebsite?: string;
  // Management Fields
  createdAt: string; // ISO String
  isActive: boolean;
}
// --- END: Coupon Types ---

export interface TicketRule {
  id: string;
  complexId: string;
  name: string; // Ex: "4-Day Park Hopper"
  daysOfUse: number; // Ex: 4
  validityWindowDays: number; // Ex: 7 (means 4 days must be used in a 7-day window)
  specialRules: string; // Ex: "Discovery Cove day is fixed, others can be used 14 days before or after."
  isPromo: boolean;
  promoSaleStartDate?: string;  // YYYY-MM-DD
  promoSaleEndDate?: string;    // YYYY-MM-DD
  promoUsageStartDate?: string; // YYYY-MM-DD
  promoUsageEndDate?: string;   // YYYY-MM-DD
  createdAt: string; // ISO String
}

export interface ItineraryRule {
  id: string;
  rule: string;
  type: 'Dica' | 'Restrição';
  createdAt: string; // ISO String
}

export interface Complex {
    id: string;
    name: string;
    city: string;
    state: string;
    country: string;
    isActive: boolean;
    createdAt: string; // ISO String
}

export interface AttractionType {
    id:string;
    name: string;
    createdAt: string; // ISO String
}

export interface Attraction {
    id: string;
    name: string;
    complexId: string;
    typeId: string;
    parentId?: string;
    city: string;
    state: string;
    country: string;
    fullAddress: string;
    isActive: boolean;
    createdAt: string; // ISO String

    // --- O "DNA DIGITAL" ---
    touringPlansId?: string;
    googlePlaceId?: string;
    tripAdvisorLocationId?: string;
    queueTimesParkId?: number; // For parks only
    queueTimesId?: number;     // For sub-attractions

    // --- Dados Ricos do TouringPlans ---
    what_it_is?: string;
    scope_and_scale?: string;
    when_to_go?: string;
    thrill_rating?: number;
    toddler_rating?: number;
    school_age_rating?: number;
    theming_rating?: number;
    height_restriction_cm?: number;
    single_rider_available?: boolean;
    
    // Restaurant specific
    cuisine?: string;
    service_type?: 'table' | 'quick';
    average_cost?: number;
    
    // --- Dados Ricos da ThemeParks.wiki ---
    tags?: string[]; // Ex: ['SingleRider', 'RiderSwap', 'FastPass']
    status?: 'Operating' | 'Down' | 'Refurbishment' | 'Weather';
    showtimes?: string[]; // Ex: ['14:00', '16:30', '21:00']

    // --- Conteúdo Gerado ---
    guideContent?: string;
    performancePredictions?: Record<string, PerformancePrediction>;
    synergies?: string[];
}

export interface AppSettings {
    metaPixelId?: string;
    metaCapiToken?: string;
    cloudFunctionUrl?: string;
    googleAdsTagId?: string;
    geminiApiKey?: string;
    googleMapsApiKey?: string;
    tripAdvisorApiKey?: string;
    openWeatherApiKey?: string;
    googleCalendarApiKey?: string;
    whatsappNumber?: string;
    ticketStoreUrl?: string;
    instagramUrl?: string;
    ticketmasterApiKey?: string;
}

export interface Trend {
    destination: string;
    count: number;
}

export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    countryCode: string;
    level: 'national' | 'state' | 'city' | 'school' | 'event';
    source: string;
}

export interface CalendarSource {
    id: string;
    name: string;
    calendarId: string;
    type: 'Feriado Nacional' | 'Feriado Escolar' | 'Evento Local';
    createdAt: string;
}

export interface CustomEvent {
    id: string;
    name: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    impactDescription: string;
    description?: string;
    createdAt: string; // ISO String
}

export interface CrowdPrediction {
    date: string; // YYYY-MM-DD
    score: number; // 1-10
    explanation: string;
    events: (Holiday | CustomEvent)[];
}

export interface MagicGuide {
    content: string;
    generatedAt: string;
}

export interface DailyBriefing {
  generatedAt: string; // ISO String
  hotLeads: Trip[];
  trends: Trend[];
  urgentTasks: Trip[];
}

export interface EventDestination {
    id: string;
    city: string;
    countryCode: string; // e.g., US
    isActive: boolean;
    createdAt: string;
}

export interface TicketmasterEvent {
    id: string; // Ticketmaster ID
    name: string;
    type: 'music' | 'sports' | 'theater' | 'other';
    team?: string; // e.g., orlando-magic
    city: string;
    date: string; // YYYY-MM-DDTHH:mm:ss
    imageUrl: string;
    venue: string;
    url: string;
}