/**
 * Buyer Dashboard Queries
 * 
 * Read-only queries for buyers to view:
 * - Available inventory in 100kg blocks
 * - Purchase window status
 * - Their orders and pickup deadlines
 * 
 * CRITICAL RULES:
 * - Buyers NEVER see prices
 * - No trader identities exposed (only aliases)
 * - All queries are read-only (no mutations)
 * - Server-side filtering by buyerId
 * 
 * How this discourages side trading:
 * - No price visibility prevents price negotiation outside platform
 * - Purchase windows create controlled access (admin-controlled)
 * - All transactions tracked with UTIDs (audit trail)
 * - Platform is the only way to purchase (no alternative paths)
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { BUYER_BLOCK_SIZE_KG, BUYER_PICKUP_SLA_MS } from "./constants";

/**
 * Get available inventory for buyers
 * 
 * Shows only inventory with status "in_storage" (available for purchase).
 * Buyers see:
 * - Produce type
 * - Total kilos available
 * - Block size (target: 100kg)
 * - Trader alias (anonymity preserved)
 * - Inventory UTID
 * 
 * Buyers DO NOT see:
 * - Prices (never shown to buyers)
 * - Trader real identity
 * - Other buyers' purchases
 * - Storage fees
 */
export const getAvailableInventory = query({
  args: {
    buyerId: v.id("users"), // Buyer must provide their ID (for role verification)
  },
  handler: async (ctx, args) => {
    // Verify user is a buyer
    const user = await ctx.db.get(args.buyerId);
    if (!user || user.role !== "buyer") {
      throw new Error("User is not a buyer");
    }

    // Get all inventory with status "in_storage" (available for purchase)
    const availableInventory = await ctx.db
      .query("traderInventory")
      .withIndex("by_status", (q) => q.eq("status", "in_storage"))
      .collect();

    // Enrich with trader aliases (anonymity preserved)
    const enriched = await Promise.all(
      availableInventory.map(async (inventory) => {
        const trader = await ctx.db.get(inventory.traderId);

        return {
          inventoryId: inventory._id,
          produceType: inventory.produceType,
          totalKilos: inventory.totalKilos,
          blockSize: inventory.blockSize, // Target: 100kg blocks
          traderAlias: trader?.alias || null, // Only alias, no real identity
          inventoryUtid: inventory.utid, // UTID of the transaction that created this inventory
          acquiredAt: inventory.acquiredAt, // When trader received delivery
          storageStartTime: inventory.storageStartTime, // When storage fees started
          // NO PRICES - buyers never see prices
        };
      })
    );

    // Sort by most recent first (newest inventory first)
    enriched.sort((a, b) => b.acquiredAt - a.acquiredAt);

    // Group by produce type for easier browsing
    const byProduceType = new Map<string, typeof enriched>();
    for (const inv of enriched) {
      if (!byProduceType.has(inv.produceType)) {
        byProduceType.set(inv.produceType, []);
      }
      byProduceType.get(inv.produceType)!.push(inv);
    }

    return {
      totalAvailable: enriched.length,
      totalKilos: enriched.reduce((sum, inv) => sum + inv.totalKilos, 0),
      byProduceType: Object.fromEntries(byProduceType),
      inventory: enriched,
    };
  },
});

/**
 * Get purchase window status
 * 
 * Buyers can check if purchase window is open.
 * This is critical - buyers can only purchase during open windows.
 * 
 * Returns:
 * - isOpen: Whether purchase window is currently open
 * - openedAt: When window was opened (if open)
 * - openedBy: Admin alias who opened it (if open)
 * - utid: Admin action UTID (if open)
 */
export const getPurchaseWindowStatus = query({
  args: {
    buyerId: v.id("users"), // Buyer must provide their ID (for role verification)
  },
  handler: async (ctx, args) => {
    // Verify user is a buyer
    const user = await ctx.db.get(args.buyerId);
    if (!user || user.role !== "buyer") {
      throw new Error("User is not a buyer");
    }

    // Get current purchase window (if open)
    const purchaseWindow = await ctx.db
      .query("purchaseWindows")
      .withIndex("by_status", (q) => q.eq("isOpen", true))
      .first();

    if (!purchaseWindow) {
      return {
        isOpen: false,
        openedAt: null,
        openedBy: null,
        openedByAlias: null,
        utid: null,
        closedAt: null,
        reason: null,
      };
    }

    // Get admin alias (anonymity preserved, though admin identity may be known)
    const admin = await ctx.db.get(purchaseWindow.openedBy);

    return {
      isOpen: purchaseWindow.isOpen,
      openedAt: purchaseWindow.openedAt,
      openedBy: purchaseWindow.openedBy,
      openedByAlias: admin?.alias || null, // Only alias
      utid: purchaseWindow.utid, // Admin action UTID
      closedAt: purchaseWindow.closedAt || null,
      reason: purchaseWindow.reason || null,
    };
  },
});

/**
 * Get buyer's orders and pickup deadlines
 * 
 * Shows all purchases made by this buyer:
 * - Purchase UTID
 * - Produce type and kilos
 * - Trader alias (anonymity preserved)
 * - Purchase timestamp
 * - Pickup deadline (48 hours after purchase)
 * - Server-calculated countdown (hours remaining or overdue)
 * - Status (pending_pickup, picked_up, expired)
 * 
 * Buyers DO NOT see:
 * - Prices (never shown)
 * - Other buyers' purchases
 * - Trader real identity
 */
export const getBuyerOrders = query({
  args: {
    buyerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is a buyer
    const user = await ctx.db.get(args.buyerId);
    if (!user || user.role !== "buyer") {
      throw new Error("User is not a buyer");
    }

    // Get all purchases for this buyer
    const purchases = await ctx.db
      .query("buyerPurchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    // Enrich with inventory and trader information
    const now = Date.now(); // Server time
    const enriched = await Promise.all(
      purchases.map(async (purchase) => {
        const inventory = await ctx.db.get(purchase.inventoryId);
        const trader = inventory ? await ctx.db.get(inventory.traderId) : null;

        // Calculate pickup deadline status (server-side)
        const isPastDeadline = now > purchase.pickupSLA;
        const hoursRemaining = Math.max(0, (purchase.pickupSLA - now) / (1000 * 60 * 60));
        const hoursOverdue = isPastDeadline
          ? (now - purchase.pickupSLA) / (1000 * 60 * 60)
          : 0;

        return {
          purchaseId: purchase._id,
          purchaseUtid: purchase.utid, // Purchase transaction UTID
          inventoryId: purchase.inventoryId,
          inventoryUtid: inventory?.utid || null, // Inventory creation UTID
          produceType: inventory?.produceType || null,
          kilos: purchase.kilos,
          traderAlias: trader?.alias || null, // Only alias, no real identity
          purchasedAt: purchase.purchasedAt,
          pickupSLA: purchase.pickupSLA, // Deadline timestamp (48 hours after purchase)
          status: purchase.status,
          // Server-calculated countdown (no client-side time logic)
          isPastDeadline,
          hoursRemaining: Math.round(hoursRemaining * 100) / 100, // Rounded to 2 decimals
          hoursOverdue: Math.round(hoursOverdue * 100) / 100, // Rounded to 2 decimals
          // NO PRICES - buyers never see prices
        };
      })
    );

    // Sort by pickup deadline (earliest first, then overdue first)
    enriched.sort((a, b) => {
      if (a.isPastDeadline !== b.isPastDeadline) {
        return a.isPastDeadline ? -1 : 1; // Overdue first
      }
      return a.pickupSLA - b.pickupSLA; // Earliest deadline first
    });

    // Group by status
    const byStatus = new Map<string, typeof enriched>();
    for (const purchase of enriched) {
      const status = purchase.status;
      if (!byStatus.has(status)) {
        byStatus.set(status, []);
      }
      byStatus.get(status)!.push(purchase);
    }

    // Calculate totals
    const totals = {
      total: enriched.length,
      pending_pickup: enriched.filter((p) => p.status === "pending_pickup").length,
      picked_up: enriched.filter((p) => p.status === "picked_up").length,
      expired: enriched.filter((p) => p.status === "expired").length,
      overdue: enriched.filter((p) => p.isPastDeadline && p.status === "pending_pickup").length,
      totalKilos: enriched.reduce((sum, p) => sum + p.kilos, 0),
    };

    return {
      totals,
      byStatus: Object.fromEntries(byStatus),
      orders: enriched,
    };
  },
});

/**
 * Get buyer's active orders (pending pickup only)
 * 
 * Convenience query for buyers to see only orders that need pickup.
 * Shows same information as getBuyerOrders but filtered to pending_pickup status.
 */
export const getBuyerActiveOrders = query({
  args: {
    buyerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is a buyer
    const user = await ctx.db.get(args.buyerId);
    if (!user || user.role !== "buyer") {
      throw new Error("User is not a buyer");
    }

    // Get all pending pickup purchases for this buyer
    const purchases = await ctx.db
      .query("buyerPurchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    // Filter to pending_pickup only
    const pendingPurchases = purchases.filter((p) => p.status === "pending_pickup");

    // Enrich with inventory and trader information
    const now = Date.now(); // Server time
    const enriched = await Promise.all(
      pendingPurchases.map(async (purchase) => {
        const inventory = await ctx.db.get(purchase.inventoryId);
        const trader = inventory ? await ctx.db.get(inventory.traderId) : null;

        // Calculate pickup deadline status (server-side)
        const isPastDeadline = now > purchase.pickupSLA;
        const hoursRemaining = Math.max(0, (purchase.pickupSLA - now) / (1000 * 60 * 60));
        const hoursOverdue = isPastDeadline
          ? (now - purchase.pickupSLA) / (1000 * 60 * 60)
          : 0;

        return {
          purchaseId: purchase._id,
          purchaseUtid: purchase.utid,
          inventoryId: purchase.inventoryId,
          inventoryUtid: inventory?.utid || null,
          produceType: inventory?.produceType || null,
          kilos: purchase.kilos,
          traderAlias: trader?.alias || null, // Only alias, no real identity
          purchasedAt: purchase.purchasedAt,
          pickupSLA: purchase.pickupSLA,
          status: purchase.status,
          // Server-calculated countdown
          isPastDeadline,
          hoursRemaining: Math.round(hoursRemaining * 100) / 100,
          hoursOverdue: Math.round(hoursOverdue * 100) / 100,
          // NO PRICES - buyers never see prices
        };
      })
    );

    // Sort by pickup deadline (earliest first, then overdue first)
    enriched.sort((a, b) => {
      if (a.isPastDeadline !== b.isPastDeadline) {
        return a.isPastDeadline ? -1 : 1; // Overdue first
      }
      return a.pickupSLA - b.pickupSLA; // Earliest deadline first
    });

    return {
      total: enriched.length,
      overdue: enriched.filter((p) => p.isPastDeadline).length,
      orders: enriched,
    };
  },
});
