
// This file serves as the main entry point for all Cloud Functions.
// It imports functions from modularized files and exports them for deployment.

import { importAndTranslateParkData, analyzeTripTrends, importHistoricalWaitTimes, upgradeExistingTrips, generateAdminBriefing, populateSubAttractions, upgradeExistingUsers } from './api/adminTasks';
import { generateMagicGuide, analyzeLeadDetails, analyzeAttractionPerformance, analyzeSynergies, findQueueTimesPark, linkSubAttractions } from './api/attractionAnalysis';
import { fetchAndCacheHolidays, getCrowdCalendarPrediction } from './api/crowdCalendar';
import { getTripAdvisorDetails, getOpenWeather, getQueueTimes, getOsmPois } from './api/externalData';
import { getMagicOptimizerPlan } from './api/magicOptimizer';
import { forwardMetaEvent } from './api/metaEvents';
import { deleteTripCascade } from './api/tripManagement';
import { syncTicketmasterEvents } from './api/eventSync';

// Export all functions for Firebase to discover and deploy.
export {
    // Admin Tasks
    importAndTranslateParkData,
    analyzeTripTrends,
    importHistoricalWaitTimes,
    upgradeExistingTrips,
    generateAdminBriefing,
    populateSubAttractions,
    upgradeExistingUsers,

    // Attraction Analysis
    generateMagicGuide,
    analyzeLeadDetails,
    analyzeAttractionPerformance,
    analyzeSynergies,
    findQueueTimesPark,
    linkSubAttractions,

    // Crowd Calendar
    fetchAndCacheHolidays,
    getCrowdCalendarPrediction,

    // External Data Fetching
    getTripAdvisorDetails,
    getOpenWeather,
    getQueueTimes,
    getOsmPois,

    // Magic Optimizer
    getMagicOptimizerPlan,

    // Meta Events
    forwardMetaEvent,

    // Trip Management
    deleteTripCascade,

    // Event Sync
    syncTicketmasterEvents,
};
