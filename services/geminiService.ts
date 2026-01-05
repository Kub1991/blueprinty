import { GoogleGenAI } from "@google/genai";
import { PointType, TripPoint, GroundingSource } from '../types';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// Helper to create a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Extracts potential trip points from a video description/transcript simulation.
 */
export const extractPointsFromText = async (text: string): Promise<TripPoint[]> => {
  if (!GEMINI_KEY) {
    console.warn("No VITE_GEMINI_API_KEY provided in .env.local");
    return [];
  }

  const prompt = `
    You are an expert travel assistant. Analyze the following travel video description or transcript.
    Identify key Points of Interest (POIs) mentioned.
    Classify them into: FOOD, STAY, ACTIVITY, or INSTA (Instagram Spot).
    Extract a short description for each. Address the viewer directly (e.g. "Koniecznie spróbujcie...").
    Extract the start timestamp (in seconds) if mentioned in the transcript as [SS] tags.
    
    Input Text: "${text}"
    
    Return JSON format: Array of objects with name, type, description, timestamp (as number).
  `;

  try {
    const response = await (ai as any).models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const rawData = JSON.parse(response.text || '[]');

    return rawData.map((item: any) => ({
      id: generateId(),
      name: item.name,
      type: item.type as PointType,
      description: item.description,
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : parseInt(String(item.timestamp || 0)) || 0,
      verified: false
    }));

  } catch (error) {
    console.error("Error extracting points:", error);
    return [];
  }
};

/**
 * Enriches a specific point with real-world data using Google Maps and Search Grounding.
 */
export const enrichPointWithMaps = async (point: TripPoint): Promise<TripPoint> => {
  if (!GEMINI_KEY) return { ...point, verified: true };

  try {
    const response = await (ai as any).models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Find detailed information for the place called "${point.name}" (${point.description}).
        
        ADDRESS: [Address]
        RATING: [Rating]
        WEBSITE: [URL]
      `,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
      }
    });

    const text = response.text || '';
    const addressMatch = text.match(/ADDRESS:\s*(.+)/i);
    const ratingMatch = text.match(/RATING:\s*([\d.]+)/i);
    const websiteMatch = text.match(/WEBSITE:\s*(.+)/i);

    const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[];
    const groundingSources: GroundingSource[] = [];

    let mapsUrl = '';

    chunks.forEach((chunk) => {
      if (chunk.web) {
        groundingSources.push({
          title: chunk.web.title || 'Web Source',
          uri: chunk.web.uri,
          sourceType: 'SEARCH'
        });
      } else if (chunk.maps) {
        if (chunk.maps.uri) {
          mapsUrl = chunk.maps.uri;
          groundingSources.push({
            title: 'Google Maps',
            uri: chunk.maps.uri,
            sourceType: 'MAPS'
          });
        }
      }
    });

    return {
      ...point,
      verified: true,
      address: addressMatch ? addressMatch[1].trim() : point.address,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : (point.rating || 4.5),
      website: websiteMatch ? websiteMatch[1].trim() : point.website,
      googleMapsUrl: mapsUrl || point.googleMapsUrl,
      groundingSources: groundingSources.length > 0 ? groundingSources : point.groundingSources,
      placeId: point.placeId // Preserve existing placeId
    };

  } catch (error) {
    console.error("Error enriching point:", error);
    return { ...point, verified: true };
  }
};