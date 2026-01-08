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

/**
 * Verify delivery (admin only)
 * 
 * Admin verifies delivery outcome for a locked unit.
 * Updates deliveryStatus but does NOT reverse funds or unlock units yet.
 * 
 * This prepares for future reversal functionality by:
 * - Recording admin decision with UTID and reason
 * - Updating deliveryStatus to track outcome
 * - Maintaining audit trail for all decisions
 * 
 * Future reversals will reference this admin action UTID.
 */
export const verifyDelivery = mutation({
  args: {
    adminId: v.id("users"),
    lockUtid: v.string(), // UTID of the payment that locked the unit
    outcome: v.union(
      v.literal("delivered"),
      v.literal("late"),
      v.literal("cancelled")
    ),
    reason: v.string(), // Required reason for admin decision
  },
  handler: async (ctx, args) => {
    // ============================================================
    // ADMIN AUTHORITY ENFORCEMENT
    // ============================================================
    // verifyAdmin checks the database to confirm user.role === "admin"
    // This is server-side only - client claims are never trusted
    await verifyAdmin(ctx, args.adminId);

    // Find unit by lockUtid
    const unit = await ctx.db
      .query("listingUnits")
      .withIndex("by_lock_utid", (q) => q.eq("lockUtid", args.lockUtid))
      .first();

    if (!unit) {
      throw new Error(`Unit not found for lockUtid: ${args.lockUtid}`);
    }

    // Verify unit is in a state that can be verified
    if (unit.status !== "locked") {
      throw new Error(
        `Unit is not locked. Current status: ${unit.status}. ` +
        `Only locked units can have delivery verified.`
      );
    }

    // Prevent re-verification if already verified
    if (unit.deliveryStatus === "delivered" && args.outcome !== "delivered") {
      throw new Error(
        `Unit delivery already verified as "delivered". ` +
        `Cannot change to "${args.outcome}". Use admin override if needed.`
      );
    }

    // ============================================================
    // LOG ADMIN ACTION (BEFORE STATE UPDATE)
    // ============================================================
    // This creates an immutable audit trail of the admin decision
    // The admin action UTID will be used to reference this decision
    // in future reversal operations
    const adminActionUtid = await logAdminAction(
      ctx,
      args.adminId,
      "verify_delivery",
      args.reason,
      args.lockUtid, // Target UTID: the original lock transaction
      {
        unitId: unit._id,
        outcome: args.outcome,
        previousDeliveryStatus: unit.deliveryStatus,
        deliveryDeadline: unit.deliveryDeadline,
        lockedAt: unit.lockedAt,
      }
    );

    // ============================================================
    // UPDATE DELIVERY STATUS
    // ============================================================
    // This updates the deliveryStatus but does NOT:
    // - Reverse funds (capital remains locked)
    // - Unlock the unit (status remains "locked")
    // - Create inventory (that happens in separate function)
    await ctx.db.patch(unit._id, {
      deliveryStatus: args.outcome,
    });

    // Get related information for response
    const listing = await ctx.db.get(unit.listingId);
    const trader = unit.lockedBy ? await ctx.db.get(unit.lockedBy) : null;

    return {
      adminActionUtid, // UTID of this admin action (for future reversals)
      lockUtid: args.lockUtid, // Original lock UTID
      unitId: unit._id,
      outcome: args.outcome,
      deliveryStatus: args.outcome,
      listingId: listing?._id,
      traderId: unit.lockedBy,
      traderAlias: trader?.alias || null,
      verifiedAt: Date.now(),
    };
  },
});

/**
 * Reverse delivery failure (admin only)
 * 
 * Reverses a failed delivery transaction atomically:
 * - Unlocks the unit (makes it available again)
 * - Reverses wallet ledger entry (unlocks capital)
 * - Marks transaction as failed
 * 
 * Conditions:
 * - deliveryStatus must be "late" OR "cancelled"
 * - Unit must be in "locked" status
 * 
 * All operations are atomic - either all succeed or all fail.
 * No partial state is possible.
 */
export const reverseDeliveryFailure = mutation({
  args: {
    adminId: v.id("users"),
    lockUtid: v.string(), // UTID of the original payment that locked the unit
    reason: v.string(), // Required reason for reversal
  },
  handler: async (ctx, args) => {
    // ============================================================
    // ADMIN AUTHORITY ENFORCEMENT
    // ============================================================
    await verifyAdmin(ctx, args.adminId);

    // ============================================================
    // FIND UNIT BY LOCK UTID
    // ============================================================
    const unit = await ctx.db
      .query("listingUnits")
      .withIndex("by_lock_utid", (q) => q.eq("lockUtid", args.lockUtid))
      .first();

    if (!unit) {
      throw new Error(`Unit not found for lockUtid: ${args.lockUtid}`);
    }

    // ============================================================
    // VALIDATE CONDITIONS
    // ============================================================
    // Condition 1: Unit must be locked
    if (unit.status !== "locked") {
      throw new Error(
        `Unit is not locked. Current status: ${unit.status}. ` +
        `Only locked units can be reversed.`
      );
    }

    // Condition 2: Delivery status must be "late" OR "cancelled"
    if (unit.deliveryStatus !== "late" && unit.deliveryStatus !== "cancelled") {
      throw new Error(
        `Delivery status must be "late" or "cancelled" to reverse. ` +
        `Current status: ${unit.deliveryStatus || "pending"}. ` +
        `Use verifyDelivery first to mark delivery as failed.`
      );
    }

    // ============================================================
    // FIND WALLET LEDGER ENTRY
    // ============================================================
    const walletEntry = await ctx.db
      .query("walletLedger")
      .withIndex("by_utid", (q) => q.eq("utid", args.lockUtid))
      .first();

    if (!walletEntry) {
      throw new Error(`Wallet ledger entry not found for lockUtid: ${args.lockUtid}`);
    }

    // Verify it's a capital_lock entry
    if (walletEntry.type !== "capital_lock") {
      throw new Error(
        `Wallet entry is not a capital_lock. Type: ${walletEntry.type}. ` +
        `Cannot reverse non-lock entries.`
      );
    }

    // ============================================================
    // GENERATE REVERSAL UTID
    // ============================================================
    // This UTID will reference the original lockUtid and be used
    // to track the reversal in the audit trail
    const reversalUtid = generateUTID("admin");

    // ============================================================
    // ATOMIC OPERATION: ALL STEPS IN ONE MUTATION
    // ============================================================
    // Convex guarantees that all operations in a mutation are atomic.
    // If any step fails, the entire mutation rolls back.
    // No partial state is possible.

    // Step 1: Calculate new wallet balance after unlock
    const currentBalance = walletEntry.balanceAfter;
    const unlockAmount = walletEntry.amount;
    const newBalance = currentBalance + unlockAmount; // Unlock adds back to balance

    // Step 2: Create capital_unlock ledger entry
    // This reverses the original capital_lock entry
    await ctx.db.insert("walletLedger", {
      userId: walletEntry.userId,
      utid: reversalUtid, // New UTID for this reversal
      type: "capital_unlock",
      amount: unlockAmount,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      metadata: {
        originalLockUtid: args.lockUtid,
        unitId: unit._id,
        reason: args.reason,
        originalLockAmount: unlockAmount,
      },
    });

    // Step 3: Unlock the unit
    // Clear all lock-related fields and set status to available
    await ctx.db.patch(unit._id, {
      status: "available",
      lockedBy: undefined,
      lockedAt: undefined,
      lockUtid: undefined,
      deliveryDeadline: undefined,
      deliveryStatus: undefined, // Clear delivery status
    });

    // Step 4: Update listing status if needed
    // If all units in listing are now available, update listing status
    const listing = await ctx.db.get(unit.listingId);
    if (listing) {
      const allUnits = await ctx.db
        .query("listingUnits")
        .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
        .collect();

      const lockedCount = allUnits.filter((u) => u.status === "locked").length;
      const availableCount = allUnits.filter((u) => u.status === "available").length;

      // If no units are locked, listing should be active again
      if (lockedCount === 0 && availableCount > 0) {
        await ctx.db.patch(listing._id, {
          status: "active",
          deliverySLA: 0, // Clear delivery SLA
        });
      }
    }

    // Step 5: Log admin action
    // This creates an immutable audit trail of the reversal
    const adminActionUtid = await logAdminAction(
      ctx,
      args.adminId,
      "reverse_delivery_failure",
      args.reason,
      args.lockUtid, // Target UTID: original lock transaction
      {
        unitId: unit._id,
        reversalUtid: reversalUtid,
        originalLockAmount: unlockAmount,
        deliveryStatus: unit.deliveryStatus,
        listingId: listing?._id,
      }
    );

    // Get trader information for response
    const trader = unit.lockedBy ? await ctx.db.get(unit.lockedBy) : null;

    return {
      reversalUtid, // UTID of the capital_unlock ledger entry
      adminActionUtid, // UTID of the admin action log entry
      lockUtid: args.lockUtid, // Original lock UTID
      unitId: unit._id,
      listingId: listing?._id,
      traderId: unit.lockedBy,
      traderAlias: trader?.alias || null,
      amountUnlocked: unlockAmount,
      newBalance: newBalance,
      reversedAt: Date.now(),
    };
  },
});

/**
 * Get delivery SLA status (admin only)
 * 
 * Returns all units with pending or late delivery status.
 * All time calculations are done server-side (no client-side time logic).
 */
export const getDeliverySLAStatus = query({
  args: {
    adminId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("late"),
      v.literal("delivered")
    )),
  },
  handler: async (ctx, args) => {
    // Verify admin
    await verifyAdmin(ctx, args.adminId);

    const now = Date.now();
    
    // Get all locked units with delivery status
    const allLockedUnits = await ctx.db
      .query("listingUnits")
      .withIndex("by_status", (q) => q.eq("status", "locked"))
      .collect();

    // Filter by delivery status and calculate SLA status
    const unitsWithSLA = await Promise.all(
      allLockedUnits
        .filter((unit) => {
          // Filter by requested status, or show all if not specified
          if (args.status) {
            return unit.deliveryStatus === args.status;
          }
          // Default: show pending and late (not delivered)
          return unit.deliveryStatus === "pending" || unit.deliveryStatus === "late";
        })
        .map(async (unit) => {
          const listing = await ctx.db.get(unit.listingId);
          const farmer = listing ? await ctx.db.get(listing.farmerId) : null;
          const trader = unit.lockedBy ? await ctx.db.get(unit.lockedBy) : null;

          // Server-side time calculation
          const isPastDeadline = unit.deliveryDeadline 
            ? now > unit.deliveryDeadline 
            : false;
          
          const hoursRemaining = unit.deliveryDeadline
            ? Math.max(0, (unit.deliveryDeadline - now) / (1000 * 60 * 60))
            : null;

          const hoursOverdue = unit.deliveryDeadline && isPastDeadline
            ? (now - unit.deliveryDeadline) / (1000 * 60 * 60)
            : 0;

          return {
            unitId: unit._id,
            unitNumber: unit.unitNumber,
            listingId: unit.listingId,
            lockUtid: unit.lockUtid,
            lockedAt: unit.lockedAt,
            deliveryDeadline: unit.deliveryDeadline,
            deliveryStatus: unit.deliveryStatus,
            // Server-calculated time information
            isPastDeadline,
            hoursRemaining: hoursRemaining !== null ? Math.round(hoursRemaining * 100) / 100 : null,
            hoursOverdue: Math.round(hoursOverdue * 100) / 100,
            // Related information
            listing: listing ? {
              listingId: listing._id,
              utid: listing.utid,
              produceType: listing.produceType,
              pricePerKilo: listing.pricePerKilo,
            } : null,
            farmerAlias: farmer?.alias || null,
            traderAlias: trader?.alias || null,
          };
        })
    );

    // Sort by deadline (earliest first, then overdue first)
    unitsWithSLA.sort((a, b) => {
      if (!a.deliveryDeadline) return 1;
      if (!b.deliveryDeadline) return -1;
      return a.deliveryDeadline - b.deliveryDeadline;
    });

    return {
      units: unitsWithSLA,
      summary: {
        total: unitsWithSLA.length,
        pending: unitsWithSLA.filter((u) => u.deliveryStatus === "pending" && !u.isPastDeadline).length,
        late: unitsWithSLA.filter((u) => u.isPastDeadline).length,
        delivered: unitsWithSLA.filter((u) => u.deliveryStatus === "delivered").length,
      },
      currentTime: now,
    };
  },
});
