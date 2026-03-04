import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    // For simplicity, we assume the latest created cycle is the current one
    const cycle = await ctx.db.query("cycles").order("desc").first();
    if (!cycle) return null;

    const weeks = await ctx.db
      .query("weeks")
      .withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id))
      .collect();

    return { ...cycle, weeks };
  },
});

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const cycles = await ctx.db.query("cycles").order("desc").collect();
    const result = [];
    for (const cycle of cycles) {
      const weeks = await ctx.db
        .query("weeks")
        .withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id))
        .collect();
      result.push({ ...cycle, weeks });
    }
    return result;
  },
});

export const createCycle = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    creationDate: v.string(),
    weeks: v.array(
      v.object({
        name: v.string(),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        status: v.string(),
        items: v.array(v.any()), // We'll handle items separately to avoid huge payloads
      })
    ),
  },
  handler: async (ctx, args) => {
    const cycleId = await ctx.db.insert("cycles", {
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      creationDate: args.creationDate,
    });

    for (const week of args.weeks) {
      const weekId = await ctx.db.insert("weeks", {
        cycleId,
        name: week.name,
        startDate: week.startDate,
        endDate: week.endDate,
        status: week.status as any,
      });

      // Insert items for this week
      for (const item of week.items) {
        await ctx.db.insert("items", {
          weekId,
          materialId: item.id,
          description: item.description,
          manufacturerCode: item.manufacturerCode,
          category: item.category,
          location: item.location,
          systemStock: item.systemStock,
          quantity: item.quantity,
          countedDate: item.countedDate,
        });
      }
    }
    return cycleId;
  },
});

export const finalizeWeek = mutation({
  args: {
    weekId: v.id("weeks"),
    finalizedBy: v.string(),
    finalizationDate: v.string(),
    observation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.weekId, {
      status: "Finalizado",
      finalizedBy: args.finalizedBy,
      finalizationDate: args.finalizationDate,
      finalizationObservation: args.observation,
    });

    // Unlock the next week if it exists
    const currentWeek = await ctx.db.get(args.weekId);
    if (currentWeek) {
      const allWeeks = await ctx.db
        .query("weeks")
        .withIndex("by_cycle", (q) => q.eq("cycleId", currentWeek.cycleId))
        .collect();
      
      const currentIndex = allWeeks.findIndex(w => w._id === args.weekId);
      if (currentIndex !== -1 && currentIndex < allWeeks.length - 1) {
        const nextWeek = allWeeks[currentIndex + 1];
        if (nextWeek.status === "Bloqueado") {
          await ctx.db.patch(nextWeek._id, { status: "Pendiente" });
        }
      }
    }
  },
});

export const deleteCycle = mutation({
  args: { id: v.id("cycles") },
  handler: async (ctx, args) => {
    const weeks = await ctx.db
      .query("weeks")
      .withIndex("by_cycle", (q) => q.eq("cycleId", args.id))
      .collect();
    
    for (const week of weeks) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_week", (q) => q.eq("weekId", week._id))
        .collect();
      
      for (const item of items) {
        // Delete audit logs
        const logs = await ctx.db
          .query("auditLogs")
          .withIndex("by_item", (q) => q.eq("itemId", item._id))
          .collect();
        for (const log of logs) await ctx.db.delete(log._id);
        
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(week._id);
    }
    await ctx.db.delete(args.id);
  },
});
