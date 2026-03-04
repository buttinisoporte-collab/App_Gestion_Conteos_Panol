import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const create = mutation({
  args: {
    username: v.string(),
    fullName: v.string(),
    dni: v.string(),
    employeeId: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("operario")),
    status: v.union(v.literal("active"), v.literal("inactive")),
    mustChangePassword: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) {
      throw new Error("Username already exists");
    }
    return await ctx.db.insert("users", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    updates: v.object({
      fullName: v.optional(v.string()),
      dni: v.optional(v.string()),
      employeeId: v.optional(v.string()),
      password: v.optional(v.string()),
      role: v.optional(v.union(v.literal("admin"), v.literal("operario"))),
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
      mustChangePassword: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.updates);
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const seedInitialAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existingAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), "Admin"))
      .unique();

    if (existingAdmin) {
      return { success: true, message: "Admin user already exists.", userId: existingAdmin._id };
    }

    const adminId = await ctx.db.insert("users", {
      username: "Admin",
      fullName: "Administrador del Sistema",
      dni: "00000000",
      employeeId: "ADMIN-01",
      password: "Admin",
      role: "admin",
      status: "active",
      mustChangePassword: true,
    });

    const existingSettings = await ctx.db.query("settings").unique();
    if (!existingSettings) {
      await ctx.db.insert("settings", {
        companyName: "Gestión de Pañol",
        logoUrl: "",
        loginLogoUrl: "",
      });
    }

    return { success: true, message: "Initial Admin user and settings created.", userId: adminId };
  },
});
