/**
 * Admin Authority
 * 
 * - Admin decisions are final in v1.x
 * - No automated dispute resolution
 * - Admin actions must be logged with UTID, reason, timestamp
 * - Admin controls purchase windows
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateUTID } from "./utils";

/**
 * Verify user is admin
 */
async function verifyAdmin(ctx: any, adminId: string) {
  const user = await ctx.db.get(adminId);
  if (!user || user.role !== "admin") {
    throw new Error("User is not an admin");
  }
  return user;
}

/**
 * Log an admin action
 */
async function logAdminAction(
  ctx: any,
  adminId: string,
  actionType: string,
  reason: string,
  targetUtid?: string,
  metadata?: any
) {
  const utid = generateUTID("admin");
  await ctx.db.insert("adminActions", {
    adminId,
    actionType,
    utid,
    reason,
    targetUtid,
    metadata,
    timestamp: Date.now(),
  });
  return utid;
}

/**
 * Open purchase window (admin only)
 * Buyers can only purchase during open windows
 */
export const openPurchaseWindow = mutation({
  args: {
    adminId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    // Close any existing open window
    const existing = await ctx.db
      .query("purchaseWindows")
      .withIndex("by_status", (q) => q.eq("isOpen", true))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOpen: false,
        closedAt: Date.now(),
      });
    }

    // Open new window
    const utid = await logAdminAction(
      ctx,
      args.adminId,
      "open_purchase_window",
      args.reason
    );

    await ctx.db.insert("purchaseWindows", {
      isOpen: true,
      openedBy: args.adminId,
      openedAt: Date.now(),
      reason: args.reason,
      utid,
    });

    return { utid, openedAt: Date.now() };
  },
});

/**
 * Close purchase window (admin only)
 */
export const closePurchaseWindow = mutation({
  args: {
    adminId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const window = await ctx.db
      .query("purchaseWindows")
      .withIndex("by_status", (q) => q.eq("isOpen", true))
      .first();

    if (!window) {
      throw new Error("No open purchase window found");
    }

    const utid = await logAdminAction(
      ctx,
      args.adminId,
      "close_purchase_window",
      args.reason,
      window.utid
    );

    await ctx.db.patch(window._id, {
      isOpen: false,
      closedAt: Date.now(),
    });

    return { utid, closedAt: Date.now() };
  },
});

/**
 * Check if purchase window is open
 */
export const isPurchaseWindowOpen = query({
  args: {},
  handler: async (ctx) => {
    const window = await ctx.db
      .query("purchaseWindows")
      .withIndex("by_status", (q) => q.eq("isOpen", true))
      .first();

    return {
      isOpen: !!window,
      openedAt: window?.openedAt,
      openedBy: window?.openedBy,
    };
  },
});

/**
 * Get admin action log
 */
export const getAdminActions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const actions = await ctx.db
      .query("adminActions")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    return actions.map((action) => ({
      actionId: action._id,
      adminId: action.adminId,
      actionType: action.actionType,
      utid: action.utid,
      reason: action.reason,
      targetUtid: action.targetUtid,
      timestamp: action.timestamp,
      metadata: action.metadata,
    }));
  },
});
