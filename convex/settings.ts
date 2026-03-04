import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("settings").first();
  },
});

export const update = mutation({
  args: {
    companyName: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    loginLogoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    if (settings) {
      await ctx.db.patch(settings._id, args);
    } else {
      await ctx.db.insert("settings", {
        companyName: args.companyName ?? "Gestión de Pañol",
        logoUrl: args.logoUrl ?? "",
        loginLogoUrl: args.loginLogoUrl ?? "",
      });
    }
  },
});

export const resetAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all data
    const users = await ctx.db.query("users").collect();
    for (const u of users) await ctx.db.delete(u._id);

    const cycles = await ctx.db.query("cycles").collect();
    for (const c of cycles) {
      const weeks = await ctx.db.query("weeks").withIndex("by_cycle", q => q.eq("cycleId", c._id)).collect();
      for (const w of weeks) {
        const items = await ctx.db.query("items").withIndex("by_week", q => q.eq("weekId", w._id)).collect();
        for (const i of items) {
          const logs = await ctx.db.query("auditLogs").withIndex("by_item", q => q.eq("itemId", i._id)).collect();
          for (const l of logs) await ctx.db.delete(l._id);
          await ctx.db.delete(i._id);
        }
        await ctx.db.delete(w._id);
      }
      await ctx.db.delete(c._id);
    }

    const settings = await ctx.db.query("settings").collect();
    for (const s of settings) await ctx.db.delete(s._id);
  },
});
