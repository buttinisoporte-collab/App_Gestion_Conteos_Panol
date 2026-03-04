import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    fullName: v.string(),
    dni: v.string(),
    employeeId: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("operario")),
    status: v.union(v.literal("active"), v.literal("inactive")),
    mustChangePassword: v.optional(v.boolean()),
  }).index("by_username", ["username"]),

  cycles: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    creationDate: v.string(),
  }),

  weeks: defineTable({
    cycleId: v.id("cycles"),
    name: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.union(
      v.literal("Bloqueado"),
      v.literal("Pendiente"),
      v.literal("En Progreso"),
      v.literal("Finalizado")
    ),
    lastModifiedBy: v.optional(v.string()),
    lastModifiedDate: v.optional(v.string()),
    finalizedBy: v.optional(v.string()),
    finalizationDate: v.optional(v.string()),
    finalizationObservation: v.optional(v.string()),
  }).index("by_cycle", ["cycleId"]),

  items: defineTable({
    weekId: v.id("weeks"),
    materialId: v.string(), // The original ID from the CSV/system
    description: v.string(),
    manufacturerCode: v.string(),
    category: v.string(),
    location: v.string(),
    systemStock: v.number(),
    quantity: v.union(v.number(), v.null()),
    countedDate: v.optional(v.string()),
  }).index("by_week", ["weekId"]),

  auditLogs: defineTable({
    itemId: v.id("items"),
    user: v.string(),
    date: v.string(),
    field: v.string(),
    oldValue: v.any(),
    newValue: v.any(),
  }).index("by_item", ["itemId"]),

  settings: defineTable({
    companyName: v.string(),
    logoUrl: v.string(),
    loginLogoUrl: v.string(),
  }),
});
