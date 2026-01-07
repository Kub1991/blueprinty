"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// API Keys
const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// URLs
const SUPADATA_API_URL = "https://api.supadata.ai/v1/transcript";

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

/**
 * Fetch latest videos from a YouTube channel
 */
export const fetchChannelVideos = action({
    args: {
        userId: v.id("users"),
        channelHandle: v.string(),
        loadMore: v.optional(v.boolean()),
    },
    handler: async (ctx, args): Promise<{ success: boolean; count: number; hasMore: boolean }> => {
        if (!YT_API_KEY) {
            throw new Error("Missing YOUTUBE_API_KEY. Please configure it in Convex dashboard.");
        }

        const user = await ctx.runQuery(api.users.get, { userId: args.userId });
        const pageToken = args.loadMore ? user?.nextPageToken : undefined;

        console.log(`Fetching videos for channel: ${args.channelHandle}${pageToken ? ` (Page: ${pageToken})` : ''}`);

        // 1. Resolve Channel ID and Uploads Playlist ID
        const handle = args.channelHandle.startsWith('@') ? args.channelHandle.slice(1) : args.channelHandle;

        let channelId: string | null = user?.youtubeChannelId || null;
        let uploadsPlaylistId: string | null = null;

        const fetchChannelDetails = async (id: string) => {
            const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,id&id=${id}&key=${YT_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        };

        if (!channelId) {
            // Try direct forHandle lookup
            const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${YT_API_KEY}`;
            const handleRes = await fetch(handleUrl);
            const handleData = await handleRes.json();

            if (handleData.items && handleData.items.length > 0) {
                channelId = handleData.items[0].id;
                uploadsPlaylistId = handleData.items[0].contentDetails.relatedPlaylists.uploads;

                await ctx.runMutation(api.users.connectYouTubeChannel, {
                    userId: args.userId,
                    channelId: channelId!,
                    channelHandle: args.channelHandle
                });
            } else {
                // Fallback search
                const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YT_API_KEY}`;
                const searchRes = await fetch(searchUrl);
                const searchData = await searchRes.json();
                if (searchData.items && searchData.items.length > 0) {
                    channelId = searchData.items[0].id.channelId;
                    uploadsPlaylistId = await fetchChannelDetails(channelId!);

                    await ctx.runMutation(api.users.connectYouTubeChannel, {
                        userId: args.userId,
                        channelId: channelId!,
                        channelHandle: args.channelHandle
                    });
                }
            }
        } else {
            uploadsPlaylistId = await fetchChannelDetails(channelId);
        }

        if (!channelId || !uploadsPlaylistId) {
            throw new Error(`Channel or Uploads Playlist not found for handle: ${args.channelHandle}`);
        }
        console.log(`[ytProcessor] Resolved Channel ID: ${channelId}, Uploads Playlist ID: ${uploadsPlaylistId}`);

        // 3. Clear old videos only if NOT loading more
        if (!args.loadMore) {
            await ctx.runMutation(api.videos.clearUserVideos, { userId: args.userId });
        }

        // 4. Get videos using playlistItems (Efficient! 1 Quota unit vs 100 for Search)
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=15&key=${YT_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const playlistRes = await fetch(playlistUrl);
        const playlistData = await playlistRes.json();

        if (!playlistData.items) throw new Error("Failed to fetch playlist items from YouTube API");
        console.log(`[ytProcessor] Fetched ${playlistData.items.length} raw items from playlist.`);

        // 5. Store next page token
        await ctx.runMutation(api.users.updateNextPageToken, {
            userId: args.userId,
            nextPageToken: playlistData.nextPageToken
        });

        // 6. Fetch durations and Filter Shorts (> 60s)
        const videoIds = playlistData.items.map((v: any) => v.contentDetails.videoId).join(',');

        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        const durationMap: Record<string, string> = {};
        const validVideoIds = new Set<string>();
        let shortsCount = 0;

        detailsData.items?.forEach((item: any) => {
            const duration = item.contentDetails.duration;
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

            let totalSeconds = 0;
            if (match) {
                totalSeconds += (parseInt(match[1] || '0') * 3600);
                totalSeconds += (parseInt(match[2] || '0') * 60);
                totalSeconds += (parseInt(match[3] || '0'));

                const h = match[1] ? `${match[1]}:` : '';
                const m = match[2] ? match[2].padStart(2, '0') : '00';
                const s = match[3] ? match[3].padStart(2, '0') : '00';
                durationMap[item.id] = `${h}${m}:${s}`;
            }

            // Exclude videos <= 60 seconds (Shorts)
            if (totalSeconds > 60) {
                validVideoIds.add(item.id);
            } else {
                console.log(`[ytProcessor] Filtered out Short: ${item.id} (${totalSeconds}s)`);
            }
        });

        console.log(`[ytProcessor] Filtering complete. Removed ${shortsCount || 0} Shorts. Keeping ${validVideoIds.size} valid videos.`);

        // 7. Save to database
        let savedCount = 0;
        for (const item of playlistData.items) {
            const videoId = item.contentDetails.videoId;
            if (validVideoIds.has(videoId)) {
                await ctx.runMutation(api.videos.create, {
                    userId: args.userId,
                    youtubeVideoId: videoId,
                    title: item.snippet.title,
                    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                    duration: durationMap[videoId] || "0:00",
                    publishedAt: item.snippet.publishedAt,
                });
                savedCount++;
            }
        }

        return {
            success: true,
            count: savedCount,
            hasMore: !!playlistData.nextPageToken
        };
    },
});

/**
 * Process a specific video with AI using Gemini 3 Flash
 */
export const processVideo = action({
    args: {
        videoId: v.id("videos"),
        youtubeUrl: v.string(),
    },
    handler: async (ctx, args): Promise<{ success: boolean; blueprintId?: Id<"blueprints">; pointsCount: number }> => {
        if (!GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY.");
        }

        try {
            await ctx.runMutation(api.videos.updateStatus, {
                videoId: args.videoId,
                status: "processing",
            });

            let transcript = "";

            // 1. Fetch transcript from Supadata (using high-performance YouTube endpoint)
            try {
                // Extract videoId from URL if possible
                const urlObj = new URL(args.youtubeUrl);
                const ytVideoId = urlObj.searchParams.get("v") || args.youtubeUrl.split("/").pop();

                console.log(`Fetching transcript for videoId: ${ytVideoId}`);

                if (SUPADATA_API_KEY) {
                    const response = await fetch(
                        `https://api.supadata.ai/v1/youtube/transcript?videoId=${ytVideoId}&lang=pl`,
                        { headers: { "x-api-key": SUPADATA_API_KEY } }
                    );

                    console.log(`Supadata status: ${response.status}`);

                    if (response.ok || response.status === 206) {
                        const data = await response.json();
                        // console.log("Supadata full API response:", JSON.stringify(data)); // Too verbose

                        if (data.error === "transcript-unavailable" || data.message === "Transcript Unavailable") {
                            throw new Error("Transkrypcja video niedostępna na YouTube (brak napisów).");
                        }

                        // Parse segments to include timestamps
                        let segments: any[] = [];
                        if (Array.isArray(data.content)) segments = data.content;
                        else if (Array.isArray(data.segments)) segments = data.segments;
                        else if (Array.isArray(data.transcript)) segments = data.transcript;

                        if (segments.length > 0) {
                            console.log("[ytProcessor] First segment sample:", JSON.stringify(segments[0]));
                            transcript = segments.map((seg: any) => {
                                // Try multiple common field names for start time
                                let start = seg.start ?? seg.startTime ?? seg.start_time ?? seg.offset ?? seg.s ?? 0;

                                // Heuristic: if start is very large (e.g. > 10000), it's likely milliseconds. 
                                // Most POIs in a travel video won't be after 2.7 hours (10000s).
                                if (start > 10000) {
                                    start = start / 1000;
                                }

                                return `[${Math.floor(Number(start))}] ${seg.text || seg.content || seg.c || ""}`;
                            }).join("\n");
                        } else {
                            transcript = data.content || data.transcript || data.text || "";
                        }

                        if (response.status === 206) {
                            console.warn("Supadata returned partial content (206). Transcript might be truncated.");
                            if (!transcript) throw new Error(`Błąd Supadata: ${data.message || "Niepełne dane (206)"}`);
                        }

                        console.log(`Transcript found, length: ${transcript.length}`);
                    } else {
                        const errorText = await response.text();
                        console.error("Supadata error:", errorText);
                        throw new Error(`Supadata error: ${response.status}`);
                    }
                }

                if (!transcript) {
                    throw new Error("No transcript found for this video.");
                }

                await ctx.runMutation(api.videos.updateStatus, {
                    videoId: args.videoId,
                    status: "processing",
                    transcript: transcript,
                });
            } catch (transcriptError: any) {
                console.error("Transcript fetch error:", transcriptError.message);
                throw transcriptError;
            }

            // 2. Process with Gemini 3 Flash Preview
            console.log("Sending to Gemini 3 Flash Preview for analysis...");
            const modelName = "gemini-3-flash-preview";
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

            const geminiResponse = await fetch(
                geminiUrl,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
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
                            temperature: 0.2, // Lower temperature for more accurate extraction
                            maxOutputTokens: 8192,
                            responseMimeType: "application/json",
                        },
                    }),
                }
            );

            if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                console.error("Gemini API Error Response:", errorText);
                throw new Error(`Gemini API error: ${geminiResponse.status}`);
            }

            const geminiData = await geminiResponse.json();
            const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            console.log("Gemini response received, length:", aiText.length);

            // 3. Parse and save
            let points = [];
            try {
                const cleanedText = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                points = JSON.parse(cleanedText);
            } catch (parseError) {
                console.error("Failed to parse AI response:", aiText);
                throw new Error("Failed to parse AI response as JSON");
            }

            // 4. Enrich points with Google Places API
            console.log(`Enriching ${points.length} points with Google Places...`);
            const enrichedPoints = [];

            for (const point of points) {
                let enrichedInfo = {
                    lat: undefined as number | undefined,
                    lng: undefined as number | undefined,
                    address: undefined as string | undefined,
                    googleMapsUrl: undefined as string | undefined,
                    imageUrl: undefined as string | undefined,
                    photoReference: undefined as string | undefined,
                    placeId: undefined as string | undefined,
                };

                if (YT_API_KEY && point.searchQuery) {
                    try {
                        const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(point.searchQuery)}&key=${YT_API_KEY}`;
                        console.log(`Searching Google Places: ${point.searchQuery}`);
                        const placesRes = await fetch(placesUrl);
                        const placesData = await placesRes.json();

                        if (placesData.status !== "OK") {
                            console.log(`Google Places API returned status: ${placesData.status}`, placesData.error_message || "");
                        }

                        if (placesData.results && placesData.results.length > 0) {
                            const result = placesData.results[0];
                            console.log(`Debug Places Result for [${point.name}]:`, JSON.stringify({
                                has_photos: !!(result.photos && result.photos.length > 0),
                                photos_count: result.photos?.length || 0,
                                first_photo_ref: result.photos?.[0]?.photo_reference
                            }));

                            let imageUrl = undefined;
                            let photoReference = undefined;
                            if (result.photos && result.photos.length > 0) {
                                photoReference = result.photos[0].photo_reference;
                                // We do NOT store the full URL with the backend key to prevent leakage.
                                // The frontend will construct the URL using its own restricted VITE_GOOGLE_MAPS_API_KEY.
                                imageUrl = undefined;
                            }

                            enrichedInfo = {
                                lat: result.geometry?.location?.lat,
                                lng: result.geometry?.location?.lng,
                                address: result.formatted_address,
                                googleMapsUrl: result.place_id ? `https://www.google.com/maps/place/?q=place_id:${result.place_id}` : undefined,
                                imageUrl: imageUrl,
                                photoReference: photoReference,
                                placeId: result.place_id,
                            };
                            console.log(`✅ [DEBUG-V4] Ostateczne dane dla [${point.name}]:`, JSON.stringify(enrichedInfo));
                        } else {
                            console.log(`❌ No results from Google Places for: "${point.searchQuery}"`);
                        }
                    } catch (e) {
                        console.error(`💥 Error calling Google Places for ${point.name}:`, e);
                    }
                }

                enrichedPoints.push({
                    id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: point.name || "Unknown",
                    description: point.description || "",
                    type: (point.type || "activity") as any,
                    day: point.day || 1,
                    timestamp: typeof point.timestamp === 'number' ? point.timestamp : parseInt(String(point.timestamp || 0)) || 0,
                    isGeneric: !!point.isGeneric,
                    lat: enrichedInfo.lat,
                    lng: enrichedInfo.lng,
                    address: enrichedInfo.address,
                    googleMapsUrl: enrichedInfo.googleMapsUrl,
                    imageUrl: enrichedInfo.imageUrl,
                    photoReference: enrichedInfo.photoReference,
                    placeId: enrichedInfo.placeId,
                });
            }

            // Fetch video details properly
            const video = await ctx.runQuery(api.videos.get, { videoId: args.videoId });
            if (!video) throw new Error("Video not found");

            console.log(`[ytProcessor] Creating blueprint for video: ${video.title}. YT ID: ${video.youtubeVideoId}`);

            const blueprintId = await ctx.runMutation(api.blueprints.create, {
                userId: video.userId,
                videoId: video._id,
                youtubeVideoId: video.youtubeVideoId,
                title: video.title,
                description: `Plan podróży: ${video.title}`,
                thumbnailUrl: video.thumbnailUrl,
                region: "Asia",
                tags: ["Travel", "AI Generated"],
                price: 49,
                points: enrichedPoints,
            });

            await ctx.runMutation(api.videos.updateStatus, {
                videoId: args.videoId,
                status: "completed",
            });

            return { success: true, blueprintId, pointsCount: enrichedPoints.length };
        } catch (error: any) {
            console.error("Processing failed:", error.message);
            await ctx.runMutation(api.videos.updateStatus, { videoId: args.videoId, status: "failed" });
            throw error;
        }
    },
});

export const testApiKeys = action({
    args: {},
    handler: async () => ({
        supadataConfigured: !!SUPADATA_API_KEY,
        geminiConfigured: !!GEMINI_API_KEY,
        youtubeConfigured: !!YT_API_KEY,
    }),
});
