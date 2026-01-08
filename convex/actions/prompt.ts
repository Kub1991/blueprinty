'use node';

import { action } from '../_generated/server';
import { v } from 'convex/values';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const extractFromText = action({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in environment');
    }

    const modelName = 'gemini-1.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
    You are an expert travel assistant. Analyze the following travel video description or transcript.
    Identify key Points of Interest (POIs) mentioned.
    Classify them into: food, stay, activity, or insta (Instagram Spot).
    Extract a short description for each. Address the viewer directly (e.g. "Koniecznie spróbujcie...").
    IMPORTANT: Provide all descriptions in POLISH language, regardless of the input language.
    Extract the start timestamp (in seconds) if mentioned in the text.
    
    Input Text: "${args.text}"
    
    Return JSON format: Array of objects with name, type, description, timestamp (as number).
    `;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  },
});

export const enrichPoint = action({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in environment');
    }

    const modelName = 'gemini-1.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
    Znajdź szczegółowe informacje dla miejsca: "${args.name}" (${args.description}).
    Zwróć informację w formacie:
    ADDRESS: [Adres]
    RATING: [Ocena 1-5]
    WEBSITE: [URL strony]
    
    Użyj swojej wiedzy o świecie.
    `;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    const addressMatch = text.match(/ADDRESS:\s*(.+)/i);
    const ratingMatch = text.match(/RATING:\s*([\d.]+)/i);
    const websiteMatch = text.match(/WEBSITE:\s*(.+)/i);

    return {
      address: addressMatch ? addressMatch[1].trim() : '',
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : 4.5,
      website: websiteMatch ? websiteMatch[1].trim() : '',
    };
  },
});
