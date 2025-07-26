// This file provides ambient module declarations to satisfy the TypeScript
// compiler for modules that are loaded via an importmap at runtime.
// This resolves "Cannot find module" (TS2307) errors during the `tsc` build step.

// This namespace declaration adds the necessary types for the Google Maps Places API,
// specifically for the Autocomplete functionality used in the admin panel.
declare namespace google {
    namespace maps {
        interface MapsEventListener {
            remove(): void;
        }
        namespace places {
            interface PlaceResult {
                name?: string;
                formatted_address?: string;
                place_id?: string;
            }
            class Autocomplete {
                constructor(inputElement: HTMLInputElement, opts?: object);
                getPlace(): PlaceResult;
                addListener(eventName: string, handler: () => void): google.maps.MapsEventListener;
            }
        }
    }
}