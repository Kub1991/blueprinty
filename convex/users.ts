import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Get user by ID
export const get = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Create a new user
export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users', {
      ...args,
      createdAt: Date.now(),
    });
    return userId;
  },
});

// Connect YouTube channel
export const connectYouTubeChannel = mutation({
  args: {
    userId: v.id('users'),
    channelId: v.string(),
    channelHandle: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      youtubeChannelId: args.channelId,
      youtubeChannelHandle: args.channelHandle,
    });
  },
});

// Disconnect YouTube channel
export const disconnectYouTubeChannel = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      youtubeChannelId: undefined,
      youtubeChannelHandle: undefined,
      nextPageToken: undefined,
    });
  },
});

// Update page token
export const updateNextPageToken = mutation({
  args: {
    userId: v.id('users'),
    nextPageToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      nextPageToken: args.nextPageToken,
    });
  },
});
