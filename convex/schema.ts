import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users (Creators)
    users: defineTable({
        name: v.string(),
        email: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        youtubeChannelId: v.optional(v.string()),
        youtubeChannelHandle: v.optional(v.string()),
        nextPageToken: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_channel", ["youtubeChannelId"]),

    // YouTube Videos
    videos: defineTable({
        userId: v.id("users"),
        youtubeVideoId: v.string(),
        title: v.string(),
        thumbnailUrl: v.string(),
        duration: v.string(),
        publishedAt: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed")
        ),
        transcript: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId", "publishedAt"])
        .index("by_youtube_id", ["youtubeVideoId"]),

    // Blueprints (Generated Travel Plans)
    blueprints: defineTable({
        userId: v.id("users"),
        videoId: v.optional(v.id("videos")),
        youtubeVideoId: v.optional(v.string()),
        title: v.string(),
        description: v.string(),
        thumbnailUrl: v.string(),
        region: v.string(),
        tags: v.array(v.string()),
        price: v.number(),
        rating: v.number(),
        reviewCount: v.number(),
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
        status: v.union(
            v.literal("draft"),
            v.literal("pending_review"),
            v.literal("published")
        ),
        creatorVerified: v.optional(v.boolean()), // true = verified by creator, false/undefined = AI only
        createdAt: v.number(),
        publishedAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_status", ["status"]),
});
