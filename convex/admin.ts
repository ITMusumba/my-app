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
import { MAX_TRADER_EXPOSURE_UGX } from "./constants";

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
      .withIndex("by_status", (q: any) => q.eq("isOpen", true))
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

    const existing = await ctx.db
      .query("purchaseWindows")
      .withIndex("by_status", (q: any) => q.eq("isOpen", true))
      .first();

    if (!existing) {
      throw new Error("No open purchase window to close");
    }

    const utid = await logAdminAction(
      ctx,
      args.adminId,
      "close_purchase_window",
      args.reason
    );

    await ctx.db.patch(existing._id, {
      isOpen: false,
      closedAt: Date.now(),
    });

    return { utid, closedAt: Date.now() };
  },
});

/**
 * Verify delivery (admin only)
 * Admin marks delivery as delivered, late, or cancelled
 */
export const verifyDelivery = mutation({
  args: {
    adminId: v.id("users"),
    unitId: v.id("listingUnits"),
    outcome: v.union(v.literal("delivered"), v.literal("late"), v.literal("cancelled")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }

    if (unit.status !== "locked") {
      throw new Error("Unit is not locked");
    }

    const utid = await logAdminAction(
      ctx,
      args.adminId,
      "verify_delivery",
      args.reason,
      unit.lockUtid || undefined,
      {
        unitId: args.unitId,
        outcome: args.outcome,
        previousStatus: unit.deliveryStatus,
      }
    );

    await ctx.db.patch(args.unitId, {
      deliveryStatus: args.outcome,
    });

    return { utid, unitId: args.unitId, outcome: args.outcome };
  },
});

/**
 * Reverse delivery failure (admin only)
 * Atomic operation to reverse failed deliveries
 */
export const reverseDeliveryFailure = mutation({
  args: {
    adminId: v.id("users"),
    unitId: v.id("listingUnits"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }

    if (!unit.lockUtid) {
      throw new Error("Unit has no lock UTID");
    }

    const deliveryStatus = unit.deliveryStatus;
    if (deliveryStatus !== "late" && deliveryStatus !== "cancelled") {
      throw new Error("Unit must be late or cancelled to reverse");
    }

    const listing = await ctx.db.get(unit.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const traderId = unit.lockedBy;
    if (!traderId) {
      throw new Error("Unit has no lockedBy trader");
    }

    // Calculate refund amount (use listing's unitSize)
    const unitSize = listing.unitSize || 10;
    const unitPrice = listing.pricePerKilo * unitSize;

    // Generate UTID for reversal
    const utid = await logAdminAction(
      ctx,
      args.adminId,
      "reverse_delivery_failure",
      args.reason,
      unit.lockUtid,
      {
        unitId: args.unitId,
        unitPrice,
        deliveryStatus,
      }
    );

    // ATOMIC OPERATION: Unlock unit and reverse wallet entry
    // Step 1: Unlock the unit
    await ctx.db.patch(args.unitId, {
      status: "available",
      lockedBy: undefined,
      lockedAt: undefined,
      lockUtid: undefined,
      deliveryDeadline: undefined,
      deliveryStatus: undefined,
    });

    // Step 2: Reverse wallet ledger entry (unlock capital)
    const walletEntries = await ctx.db
      .query("walletLedger")
      .withIndex("by_user", (q: any) => q.eq("userId", traderId))
      .order("desc")
      .first();

    const currentBalance = walletEntries?.balanceAfter || 0;
    const balanceAfter = currentBalance + unitPrice;

    await ctx.db.insert("walletLedger", {
      userId: traderId,
      utid,
      type: "capital_unlock",
      amount: unitPrice,
      balanceAfter,
      timestamp: Date.now(),
      metadata: {
        unitId: args.unitId,
        listingId: listing._id,
        reversedLockUtid: unit.lockUtid,
        reason: args.reason,
      },
    });

    // Step 3: Update listing status if needed
    const allUnits = await ctx.db
      .query("listingUnits")
      .withIndex("by_listing", (q: any) => q.eq("listingId", listing._id))
      .collect();

    const availableCount = allUnits.filter((u: any) => u.status === "available").length;
    const lockedCount = allUnits.filter((u: any) => u.status === "locked").length;

    if (availableCount > 0 && lockedCount === 0) {
      await ctx.db.patch(listing._id, {
        status: "active",
      });
    } else if (lockedCount > 0) {
      await ctx.db.patch(listing._id, {
        status: "partially_locked",
      });
    }

    return {
      utid,
      unitId: args.unitId,
      refundAmount: unitPrice,
      balanceAfter,
    };
  },
});

/**
 * Reset all transactions (admin only)
 * 
 * ⚠️ DANGEROUS OPERATION - Use with extreme caution
 * 
 * This mutation resets the entire system state:
 * - Clears all wallet ledger entries
 * - Unlocks all locked units
 * - Resets all inventory
 * - Resets all buyer purchases
 * - Resets listing statuses to active
 * - Keeps users and system settings
 * 
 * All actions are logged with UTID and reason.
 */
export const resetAllTransactions = mutation({
  args: {
    adminId: v.id("users"),
    reason: v.string(), // Required reason for reset
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const utid = await logAdminAction(
      ctx,
      args.adminId,
      "reset_all_transactions",
      args.reason,
      undefined,
      {
        timestamp: Date.now(),
        warning: "All transactions have been reset",
      }
    );

    const results = {
      walletLedgerEntriesDeleted: 0,
      tradersRestored: 0,
      unitsUnlocked: 0,
      inventoryDeleted: 0,
      buyerPurchasesDeleted: 0,
      listingsReset: 0,
      errors: [] as string[],
    };

    try {
      // 1. Delete all wallet ledger entries EXCEPT capital_deposit entries
      // Then restore 1,000,000 UGX capital deposit for each trader
      const walletEntries = await ctx.db.query("walletLedger").collect();
      
      // Get all traders first
      const traders = await ctx.db
        .query("users")
        .withIndex("by_role", (q: any) => q.eq("role", "trader"))
        .collect();
      
      // Delete all wallet entries (we'll restore capital deposits after)
      for (const entry of walletEntries) {
        try {
          await ctx.db.delete(entry._id);
          results.walletLedgerEntriesDeleted++;
        } catch (error: any) {
          results.errors.push(`Failed to delete wallet entry ${entry._id}: ${error.message}`);
        }
      }
      
      // Restore 1,000,000 UGX capital deposit for each trader
      const { MAX_TRADER_EXPOSURE_UGX } = await import("./constants");
      const { generateUTID } = await import("./utils");
      
      let tradersRestored = 0;
      for (const trader of traders) {
        try {
          const utid = generateUTID("admin");
          await ctx.db.insert("walletLedger", {
            userId: trader._id,
            utid,
            type: "capital_deposit",
            amount: MAX_TRADER_EXPOSURE_UGX, // 1,000,000 UGX
            balanceAfter: MAX_TRADER_EXPOSURE_UGX,
            timestamp: Date.now(),
            metadata: {
              source: "admin_reset_restore",
              reason: args.reason,
              restored: true,
            },
          });
          tradersRestored++;
        } catch (error: any) {
          results.errors.push(`Failed to restore capital for trader ${trader.alias}: ${error.message}`);
        }
      }
      
      results.tradersRestored = tradersRestored;

      // 2. Unlock all locked units
      const lockedUnits = await ctx.db
        .query("listingUnits")
        .withIndex("by_status", (q: any) => q.eq("status", "locked"))
        .collect();
      
      for (const unit of lockedUnits) {
        try {
          await ctx.db.patch(unit._id, {
            status: "available",
            lockedBy: undefined,
            lockedAt: undefined,
            lockUtid: undefined,
            deliveryDeadline: undefined,
            deliveryStatus: undefined,
          });
          results.unitsUnlocked++;
        } catch (error: any) {
          results.errors.push(`Failed to unlock unit ${unit._id}: ${error.message}`);
        }
      }

      // 3. Delete all trader inventory
      const inventory = await ctx.db.query("traderInventory").collect();
      for (const inv of inventory) {
        try {
          await ctx.db.delete(inv._id);
          results.inventoryDeleted++;
        } catch (error: any) {
          results.errors.push(`Failed to delete inventory ${inv._id}: ${error.message}`);
        }
      }

      // 4. Delete all buyer purchases
      const purchases = await ctx.db.query("buyerPurchases").collect();
      for (const purchase of purchases) {
        try {
          await ctx.db.delete(purchase._id);
          results.buyerPurchasesDeleted++;
        } catch (error: any) {
          results.errors.push(`Failed to delete purchase ${purchase._id}: ${error.message}`);
        }
      }

      // 5. Reset all listing statuses to active
      const listings = await ctx.db.query("listings").collect();
      for (const listing of listings) {
        try {
          await ctx.db.patch(listing._id, {
            status: "active",
            deliverySLA: 0,
          });
          results.listingsReset++;
        } catch (error: any) {
          results.errors.push(`Failed to reset listing ${listing._id}: ${error.message}`);
        }
      }

      // 6. Reset all delivered/cancelled units to available
      const deliveredUnits = await ctx.db
        .query("listingUnits")
        .withIndex("by_status", (q: any) => q.eq("status", "delivered"))
        .collect();
      
      const cancelledUnits = await ctx.db
        .query("listingUnits")
        .withIndex("by_status", (q: any) => q.eq("status", "cancelled"))
        .collect();

      for (const unit of [...deliveredUnits, ...cancelledUnits]) {
        try {
          await ctx.db.patch(unit._id, {
            status: "available",
            lockedBy: undefined,
            lockedAt: undefined,
            lockUtid: undefined,
            deliveryDeadline: undefined,
            deliveryStatus: undefined,
          });
        } catch (error: any) {
          results.errors.push(`Failed to reset unit ${unit._id}: ${error.message}`);
        }
      }

      return {
        success: true,
        utid,
        results,
        summary: {
          totalWalletEntriesDeleted: results.walletLedgerEntriesDeleted,
          tradersRestored: results.tradersRestored,
          totalUnitsUnlocked: results.unitsUnlocked,
          totalInventoryDeleted: results.inventoryDeleted,
          totalPurchasesDeleted: results.buyerPurchasesDeleted,
          totalListingsReset: results.listingsReset,
          totalErrors: results.errors.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        utid,
        error: error.message,
        results,
      };
    }
  },
});
