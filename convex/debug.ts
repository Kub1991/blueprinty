
import { query } from "./_generated/server";
import { v } from "convex/values";

export const checkBlueprints = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("blueprints").order("desc").take(5);
    },
});
