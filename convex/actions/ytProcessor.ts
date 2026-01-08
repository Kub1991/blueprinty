'use node';

import { action } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { PointType } from '../../types';

// Import services
import {
  resolveChannelHandle,
  fetchChannelDetails,
  fetchPlaylistVideos,
} from '../services/YoutubeService';
import { extractVideoId, fetchTranscript } from '../services/TranscriptService';
import { extractPOIsFromTranscript } from '../services/GeminiService';
import { searchPlace } from '../services/PlacesService';

// API Keys (for testApiKeys action)
const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Fetch latest videos from a YouTube channel
 */
export const fetchChannelVideos = action({
  args: {
    userId: v.id('users'),
    channelHandle: v.string(),
    loadMore: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; hasMore: boolean }> => {
    const user = await ctx.runQuery(api.users.get, { userId: args.userId });
    const pageToken = args.loadMore ? user?.nextPageToken : undefined;

    console.log(
      `[ytProcessor] Fetching videos for channel: ${args.channelHandle}${pageToken ? ` (Page: ${pageToken})` : ''}`
    );

    // 1. Resolve channel information
    let channelId = user?.youtubeChannelId || null;
    let uploadsPlaylistId: string | null = null;

    if (!channelId) {
      const channelInfo = await resolveChannelHandle(args.channelHandle);
      if (!channelInfo) {
        throw new Error(`Channel not found for handle: ${args.channelHandle}`);
      }
      channelId = channelInfo.channelId;
      uploadsPlaylistId = channelInfo.uploadsPlaylistId;

      await ctx.runMutation(api.users.connectYouTubeChannel, {
        userId: args.userId,
        channelId,
        channelHandle: args.channelHandle,
      });
    } else {
      uploadsPlaylistId = await fetchChannelDetails(channelId);
    }

    if (!uploadsPlaylistId) {
      throw new Error(`Uploads playlist not found for channel: ${args.channelHandle}`);
    }

    console.log(
      `[ytProcessor] Resolved Channel ID: ${channelId}, Uploads Playlist ID: ${uploadsPlaylistId}`
    );

    // 2. Clear old videos only if NOT loading more
    if (!args.loadMore) {
      await ctx.runMutation(api.videos.clearUserVideos, { userId: args.userId });
    }

    // 3. Fetch videos using the service
    const result = await fetchPlaylistVideos(uploadsPlaylistId, pageToken);

    // 4. Store next page token
    await ctx.runMutation(api.users.updateNextPageToken, {
      userId: args.userId,
      nextPageToken: result.nextPageToken,
    });

    // 5. Save videos to database
    let savedCount = 0;
    for (const video of result.videos) {
      await ctx.runMutation(api.videos.create, {
        userId: args.userId,
        youtubeVideoId: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        publishedAt: video.publishedAt,
      });
      savedCount++;
    }

    console.log(`[ytProcessor] Saved ${savedCount} videos to database.`);

    return {
      success: true,
      count: savedCount,
      hasMore: !!result.nextPageToken,
    };
  },
});

/**
 * Process a specific video with AI using Gemini
 */
export const processVideo = action({
  args: {
    videoId: v.id('videos'),
    youtubeUrl: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; blueprintId?: Id<'blueprints'>; pointsCount: number }> => {
    try {
      await ctx.runMutation(api.videos.updateStatus, {
        videoId: args.videoId,
        status: 'processing',
      });

      // 1. Fetch transcript
      const ytVideoId = extractVideoId(args.youtubeUrl);
      console.log(`[ytProcessor] Fetching transcript for videoId: ${ytVideoId}`);

      const { transcript } = await fetchTranscript(ytVideoId);

      await ctx.runMutation(api.videos.updateStatus, {
        videoId: args.videoId,
        status: 'processing',
        transcript: transcript,
      });

      // 2. Extract POIs using Gemini
      const rawPOIs = await extractPOIsFromTranscript(transcript);
      console.log(`[ytProcessor] Extracted ${rawPOIs.length} POIs from transcript.`);

      // 3. Enrich POIs with Google Places data
      console.log(`[ytProcessor] Enriching ${rawPOIs.length} points with Google Places...`);
      const enrichedPoints = [];

      for (const poi of rawPOIs) {
        const placeInfo = poi.searchQuery ? await searchPlace(poi.searchQuery) : {};

        enrichedPoints.push({
          id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: poi.name || 'Unknown',
          description: poi.description || '',
          type: (poi.type || 'activity') as PointType,
          day: poi.day || 1,
          timestamp:
            typeof poi.timestamp === 'number'
              ? poi.timestamp
              : parseInt(String(poi.timestamp || 0)) || 0,
          isGeneric: !!poi.isGeneric,
          lat: placeInfo.lat,
          lng: placeInfo.lng,
          address: placeInfo.address,
          googleMapsUrl: placeInfo.googleMapsUrl,
          imageUrl: undefined, // Frontend constructs this from photoReference
          photoReference: placeInfo.photoReference,
          placeId: placeInfo.placeId,
        });
      }

      // 4. Fetch video details and create blueprint
      const video = await ctx.runQuery(api.videos.get, { videoId: args.videoId });
      if (!video) throw new Error('Video not found');

      console.log(
        `[ytProcessor] Creating blueprint for video: ${video.title}. YT ID: ${video.youtubeVideoId}`
      );

      const blueprintId = await ctx.runMutation(api.blueprints.create, {
        userId: video.userId,
        videoId: video._id,
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
        description: `Plan podróży: ${video.title}`,
        thumbnailUrl: video.thumbnailUrl,
        region: 'Asia',
        tags: ['Travel', 'AI Generated'],
        price: 49,
        points: enrichedPoints,
      });

      await ctx.runMutation(api.videos.updateStatus, {
        videoId: args.videoId,
        status: 'completed',
      });

      return { success: true, blueprintId, pointsCount: enrichedPoints.length };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ytProcessor] Processing failed:', errorMessage);
      await ctx.runMutation(api.videos.updateStatus, { videoId: args.videoId, status: 'failed' });
      throw error;
    }
  },
});

/**
 * Test API key configuration
 */
export const testApiKeys = action({
  args: {},
  handler: async () => ({
    supadataConfigured: !!SUPADATA_API_KEY,
    geminiConfigured: !!GEMINI_API_KEY,
    youtubeConfigured: !!YT_API_KEY,
  }),
});
