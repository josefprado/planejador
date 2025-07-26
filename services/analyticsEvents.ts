import { trackMetaEvent, trackGoogleEvent } from './analytics';
import { Coupon, ChecklistItem, User, AppSettings } from '../src/types';

const CURRENCY = 'BRL';

/**
 * High-value conversion event. Triggers when a user shows strong commitment,
 * such as uploading a flight or hotel voucher.
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 * @param tripId The ID of the associated trip.
 * @param documentType A descriptor for the type of commitment (e.g., 'document_upload', 'document_attached_to_itinerary').
 */
export const trackPurchase = (appSettings: AppSettings, user: User | null, tripId: string, documentType: string) => {
  const params = { 
    value: 1.00, // Using a nominal value to signify a high-value action
    currency: CURRENCY, 
    content_ids: [tripId], 
    content_name: documentType, 
    content_type: 'product' 
  };
  trackMetaEvent(appSettings, 'Purchase', params, user);
  trackGoogleEvent('purchase', { ...params, items: [{ item_id: tripId, item_name: documentType }] });
};

/**
 * Triggers when a user initiates contact for a service quotation or registers.
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 * @param serviceType A descriptor for the service (e.g., 'Hotel Quotation', 'Ticket Assistance', 'NewTrip', 'CompleteRegistration').
 * @param tripId Optional ID of the associated trip.
 */
export const trackGenerateLead = (appSettings: AppSettings, user: User | null, serviceType: string, tripId?: string) => {
  const params = { value: 1, currency: CURRENCY, service_type: serviceType, content_ids: tripId ? [tripId] : [] };
  // Standard event for Google Analytics
  trackGoogleEvent('generate_lead', params);
  
  // Standard events for Meta Pixel
  if (serviceType === 'CompleteRegistration') {
    trackMetaEvent(appSettings, 'CompleteRegistration', { content_name: 'User Profile' }, user);
  } else {
    trackMetaEvent(appSettings, 'Lead', params, user);
    trackMetaEvent(appSettings, 'Contact', { content_name: serviceType }, user);
  }
};

/**
 * Tracks when a user shares the countdown image.
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 * @param tripId The ID of the shared trip.
 * @param themeId The ID of the theme used for the image.
 */
export const trackShare = (appSettings: AppSettings, user: User | null, tripId: string, themeId: string | null | undefined) => {
  const params = { 
    content_type: 'countdown_image', 
    item_id: tripId, 
    method: 'web_share_api', 
    theme_id: themeId || 'default' 
  };
  trackMetaEvent(appSettings, 'Share', params, user);
  trackGoogleEvent('share', params);
};

/**
 * Tracks when a user selects a visual theme for their trip.
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 * @param tripId The ID of the trip being customized.
 * @param themeId The ID of the selected theme.
 */
export const trackSelectTheme = (appSettings: AppSettings, user: User | null, tripId: string, themeId: string) => {
    const params = { content_type: 'theme', item_id: themeId, trip_id: tripId };
    trackMetaEvent(appSettings, 'CustomizeProduct', params, user); // Using a standard event for customization
    trackGoogleEvent('select_content', params);
};

/**
 * Tracks when a user checks or unchecks an item in the checklist.
 * @param item The checklist item being interacted with.
 * @param tripId The ID of the associated trip.
 * @param isChecked The new state of the checkbox.
 */
export const trackChecklistItemToggle = (item: ChecklistItem, tripId: string, isChecked: boolean) => {
    const params = {
        item_id: item.id,
        item_name: item.text,
        item_category: item.phase,
        trip_id: tripId,
        checked: isChecked,
    };
    trackGoogleEvent('update_checklist_item', params); // Custom event for internal analysis
};

// --- Coupon Club Engagement ---

/**
 * Tracks when the user opens the coupon club modal.
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 */
export const trackViewCouponList = (appSettings: AppSettings, user: User | null) => {
     trackGoogleEvent('view_item_list', { item_list_name: 'coupon_club' });
     trackMetaEvent(appSettings, 'ViewContent', { content_name: 'Coupon Club List' }, user);
};

/**
 * Tracks when a user filters coupons by a specific category.
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 * @param category The category being filtered.
 */
export const trackFilterCoupon = (appSettings: AppSettings, user: User | null, category: string) => {
    trackGoogleEvent('view_item_list', { item_list_name: 'coupon_club', items: [{ item_list_name: category }] });
    trackMetaEvent(appSettings, 'Search', { search_string: category, content_category: 'Coupon' }, user);
};

/**
 * Tracks when a user interacts with a coupon (copies code or clicks link).
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 * @param coupon The coupon object.
 */
export const trackCouponUse = (appSettings: AppSettings, user: User | null, coupon: Coupon) => {
    const params = {
        content_type: coupon.type,
        item_id: coupon.id,
        item_name: coupon.companyName,
        item_category: coupon.category,
        promotion_id: coupon.id,
        promotion_name: coupon.offerTitle,
    };
    trackMetaEvent(appSettings, 'Lead', params, user); // A coupon use is a strong lead signal
    trackGoogleEvent('select_promotion', params);
};

// --- Itinerary Engagement ---

/**
 * Tracks when the user exports their itinerary.
 * @param appSettings The application settings containing tracking IDs.
 * @param user The current user object for CAPI enrichment.
 * @param tripId The ID of the trip.
 * @param format The format of the export (e.g., 'pdf').
 */
export const trackExport = (appSettings: AppSettings, user: User | null, tripId: string, format: 'pdf') => {
    trackGoogleEvent('export_content', {
        content_type: `itinerary_${format}`,
        item_id: tripId,
    });
    trackMetaEvent(appSettings, 'ViewContent', { content_name: `itinerary_${format}`, content_ids: [tripId] }, user);
};