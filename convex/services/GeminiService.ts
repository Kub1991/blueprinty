/**
 * Gemini AI Service
 * Handles all Gemini API interactions for travel POI extraction
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System prompt for travel extraction
const TRAVEL_EXTRACTION_PROMPT = `You are an expert travel content analyzer. 
I will provide a YouTube transcript where every line begins with a timestamp in brackets, for example: "[120] This is a beautiful beach".
The number inside the brackets [120] represents the total seconds from the start of the video.

CRITICAL TASK:
For each Point of Interest (POI), you MUST extract the exact number from the brackets [ ] corresponding to when that place is first mentioned.

Output a JSON array of objects with these fields:
- "name": Name of the place.
- "description": A short tip (1-2 sentences). Address the viewer directly. IMPORTANT: Provide all descriptions in POLISH language.
- "type": "food", "stay", "activity", "insta", or "tip".
- "day": Trip day (number).
- "timestamp": The start time as an INTEGER (e.g., 120). This is the number from the brackets.
- "searchQuery": String for Google Maps.
- "isGeneric": boolean.

Example Input:
[10] Hello!
[45] Look at the Eiffel Tower.

Example Output:
[{"name": "Eiffel Tower", "type": "activity", "description": "Beautiful view!", "day": 1, "timestamp": 45, "searchQuery": "Eiffel Tower", "isGeneric": false}]

Return ONLY valid JSON.`;

export interface RawPOI {
  name: string;
  description: string;
  type: string;
  day: number;
  timestamp: number;
  searchQuery: string;
  isGeneric: boolean;
}

/**
 * Analyze a transcript and extract Points of Interest using Gemini
 */
export async function extractPOIsFromTranscript(transcript: string): Promise<RawPOI[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  console.log('[GeminiService] Sending to Gemini 3 Flash Preview for analysis...');
  const modelName = 'gemini-3-flash-preview';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: TRAVEL_EXTRACTION_PROMPT }],
      },
      contents: [
        {
          parts: [
            {
              text: `Analyze this travel video transcript and extract all POIs:\n\n${transcript}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GeminiService] Gemini API Error Response:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const geminiData = await response.json();
  const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('[GeminiService] Gemini response received, length:', aiText.length);

  try {
    const cleanedText = aiText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleanedText);
  } catch (_parseError) {
    console.error('[GeminiService] Failed to parse AI response:', aiText);
    throw new Error('Failed to parse AI response as JSON');
  }
}
