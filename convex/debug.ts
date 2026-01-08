import { query } from './_generated/server';

export const checkBlueprints = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('blueprints').order('desc').take(5);
  },
});
