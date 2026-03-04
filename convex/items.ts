import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByWeek = query({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();
    
    const result = [];
    for (const item of items) {
      const auditLog = await ctx.db
        .query("auditLogs")
        .withIndex("by_item", (q) => q.eq("itemId", item._id))
        .collect();
      result.push({ ...item, auditLog });
    }
    return result;
  },
});

export const updateItem = mutation({
  args: {
    itemId: v.id("items"),
    field: v.string(),
    newValue: v.any(),
    user: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const oldValue = (item as any)[args.field];
    
    // Update the item
    await ctx.db.patch(args.itemId, {
      [args.field]: args.newValue,
      countedDate: args.field === "quantity" ? args.date : item.countedDate,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      itemId: args.itemId,
      user: args.user,
      date: args.date,
      field: args.field,
      oldValue,
      newValue: args.newValue,
    });

    // Update week status if it was Pendiente
    const week = await ctx.db.get(item.weekId);
    if (week && week.status === "Pendiente") {
      await ctx.db.patch(item.weekId, { 
        status: "En Progreso",
        lastModifiedBy: args.user,
        lastModifiedDate: args.date
      });
    } else if (week) {
      await ctx.db.patch(item.weekId, {
        lastModifiedBy: args.user,
        lastModifiedDate: args.date
      });
    }
  },
});

export const bulkUpdateItems = mutation({
  args: {
    updates: v.array(v.object({
      itemId: v.id("items"),
      quantity: v.number(),
    })),
    user: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    let weekId: any = null;
    
    for (const update of args.updates) {
      const item = await ctx.db.get(update.itemId);
      if (!item) continue;
      
      if (!weekId) weekId = item.weekId;

      const oldValue = item.quantity;
      
      // Update the item
      await ctx.db.patch(update.itemId, {
        quantity: update.quantity,
        countedDate: args.date,
      });

      // Create audit log
      await ctx.db.insert("auditLogs", {
        itemId: update.itemId,
        user: args.user,
        date: args.date,
        field: "quantity",
        oldValue,
        newValue: update.quantity,
      });
    }

    // Update week status
    if (weekId) {
      const week = await ctx.db.get(weekId);
      if (week) {
        const newStatus = week.status === "Pendiente" ? "En Progreso" : week.status;
        await ctx.db.patch(weekId, { 
          status: newStatus,
          lastModifiedBy: args.user,
          lastModifiedDate: args.date
        });
      }
    }
  },
});
