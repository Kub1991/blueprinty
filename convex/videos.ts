import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Get all videos for a user, sorted by newest first
export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('videos')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});

// Get a single video
export const get = query({
  args: { videoId: v.id('videos') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.videoId);
  },
});

// Get recent videos (for demo without auth)
export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('videos').order('desc').take(20);
  },
});

// Create a new video entry
export const create = mutation({
  args: {
    userId: v.id('users'),
    youtubeVideoId: v.string(),
    title: v.string(),
    thumbnailUrl: v.string(),
    duration: v.string(),
    publishedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if video already exists for this user
    const existing = await ctx.db
      .query('videos')
      .withIndex('by_youtube_id', (q) => q.eq('youtubeVideoId', args.youtubeVideoId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first();

    if (existing) return existing._id;

    const videoId = await ctx.db.insert('videos', {
      ...args,
      status: 'pending',
      createdAt: Date.now(),
    });
    return videoId;
  },
});

// Update video status
export const updateStatus = mutation({
  args: {
    videoId: v.id('videos'),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    transcript: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { videoId, status, transcript } = args;
    await ctx.db.patch(videoId, { status, ...(transcript && { transcript }) });
  },
});

// Clear all videos for a user
export const clearUserVideos = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query('videos')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const video of videos) {
      await ctx.db.delete(video._id);
    }
  },
});
