/**
 * Google Places Service
 * Handles Google Places API interactions for POI enrichment
 */

const GOOGLE_API_KEY = process.env.YOUTUBE_API_KEY; // Reusing the same key for Places

export interface PlaceInfo {
    lat?: number;
    lng?: number;
    address?: string;
    googleMapsUrl?: string;
    photoReference?: string;
    placeId?: string;
}

/**
 * Search for a place and return enriched location data
 */
export async function searchPlace(searchQuery: string): Promise<PlaceInfo> {
    if (!GOOGLE_API_KEY) {
        console.warn("[PlacesService] No API key configured, skipping enrichment");
        return {};
    }

    try {
        const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`;
        console.log(`[PlacesService] Searching Google Places: ${searchQuery}`);

        const placesRes = await fetch(placesUrl);
        const placesData = await placesRes.json();

        if (placesData.status !== "OK") {
            console.log(`[PlacesService] Google Places API returned status: ${placesData.status}`, placesData.error_message || "");
            return {};
        }

        if (!placesData.results || placesData.results.length === 0) {
            console.log(`[PlacesService] No results from Google Places for: "${searchQuery}"`);
            return {};
        }

        const result = placesData.results[0];
        console.log(`[PlacesService] Debug Places Result for [${searchQuery}]:`, JSON.stringify({
            has_photos: !!(result.photos && result.photos.length > 0),
            photos_count: result.photos?.length || 0,
            first_photo_ref: result.photos?.[0]?.photo_reference
        }));

        let photoReference: string | undefined;
        if (result.photos && result.photos.length > 0) {
            photoReference = result.photos[0].photo_reference;
            // We do NOT store the full URL with the backend key to prevent leakage.
            // The frontend will construct the URL using its own restricted VITE_GOOGLE_MAPS_API_KEY.
        }

        const placeInfo: PlaceInfo = {
            lat: result.geometry?.location?.lat,
            lng: result.geometry?.location?.lng,
            address: result.formatted_address,
            googleMapsUrl: result.place_id ? `https://www.google.com/maps/place/?q=place_id:${result.place_id}` : undefined,
            photoReference,
            placeId: result.place_id,
        };

        console.log(`[PlacesService] Enriched data for [${searchQuery}]:`, JSON.stringify(placeInfo));
        return placeInfo;

    } catch (e) {
        console.error(`[PlacesService] Error calling Google Places for ${searchQuery}:`, e);
        return {};
    }
}
