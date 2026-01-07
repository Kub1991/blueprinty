import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all blueprints with creator info
export const list = query({
    args: {},
    handler: async (ctx) => {
        const blueprints = await ctx.db
            .query("blueprints")
            .order("desc")
            .collect();

        const results = [];
        for (const bp of blueprints) {
            const user = await ctx.db.get(bp.userId);
            results.push({
                ...bp,
                creatorName: user?.name || "Anonymous",
                creatorAvatar: user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id || "anon"}`,
            });
        }
        return results;
    },
});

// Get blueprints by user
export const listByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("blueprints")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// Get a single blueprint
export const get = query({
    args: { blueprintId: v.id("blueprints") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.blueprintId);
    },
});

// Create a new blueprint (from AI processing)
export const create = mutation({
    args: {
        userId: v.id("users"),
        videoId: v.optional(v.id("videos")),
        youtubeVideoId: v.optional(v.string()),
        title: v.string(),
        description: v.string(),
        thumbnailUrl: v.string(),
        region: v.string(),
        tags: v.array(v.string()),
        price: v.number(),
        points: v.array(
            v.object({
                id: v.string(),
                name: v.string(),
                description: v.string(),
                type: v.union(
                    v.literal("food"),
                    v.literal("stay"),
                    v.literal("activity"),
                    v.literal("insta"),
                    v.literal("tip")
                ),
                day: v.optional(v.number()),
                lat: v.optional(v.number()),
                lng: v.optional(v.number()),
                address: v.optional(v.string()),
                googleMapsUrl: v.optional(v.string()),
                websiteUrl: v.optional(v.string()),
                imageUrl: v.optional(v.string()),
                photoReference: v.optional(v.string()),
                placeId: v.optional(v.string()),
                timestamp: v.optional(v.number()),
                isGeneric: v.optional(v.boolean()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const blueprintId = await ctx.db.insert("blueprints", {
            ...args,
            rating: 0,
            reviewCount: 0,
            status: "draft",
            createdAt: Date.now(),
        });
        return blueprintId;
    },
});

// Publish a blueprint
export const publish = mutation({
    args: {
        blueprintId: v.id("blueprints"),
        verified: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.blueprintId, {
            status: "published",
            creatorVerified: args.verified ?? false,
            publishedAt: Date.now(),
        });
    },
});

// Delete a blueprint
export const remove = mutation({
    args: { blueprintId: v.id("blueprints") },
    handler: async (ctx, args) => {
        const blueprint = await ctx.db.get(args.blueprintId);
        if (blueprint?.videoId) {
            await ctx.db.patch(blueprint.videoId, {
                status: "pending"
            });
        }
        await ctx.db.delete(args.blueprintId);
    },
});
// Update a blueprint
export const update = mutation({
    args: {
        blueprintId: v.id("blueprints"),
        updates: v.any()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.blueprintId, args.updates);
    },
});
