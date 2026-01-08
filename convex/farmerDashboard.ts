/**
 * Farmer Dashboard Queries (Read-Only)
 * 
 * Read-only queries for farmers to view their dashboard.
 * All data is farmer-specific - no cross-user data exposure.
 * All calculations done server-side.
 * Anonymity preserved - only trader aliases shown.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get farmer's listings
 * 
 * Returns all listings created by this farmer,
 * with current status and unit counts.
 */
export const getFarmerListings = query({
  args: {
    farmerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is a farmer
    const user = await ctx.db.get(args.farmerId);
    if (!user || user.role !== "farmer") {
      throw new Error("User is not a farmer");
    }

    // Get all listings for this farmer only
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    // Enrich with unit status information
    const enrichedListings = await Promise.all(
      listings.map(async (listing) => {
        const units = await ctx.db
          .query("listingUnits")
          .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
          .collect();

        const availableCount = units.filter((u) => u.status === "available").length;
        const lockedCount = units.filter((u) => u.status === "locked").length;
        const deliveredCount = units.filter((u) => u.status === "delivered").length;
        const cancelledCount = units.filter((u) => u.status === "cancelled").length;

        return {
          listingId: listing._id,
          utid: listing.utid,
          produceType: listing.produceType,
          totalKilos: listing.totalKilos,
          pricePerKilo: listing.pricePerKilo,
          totalUnits: listing.totalUnits,
          status: listing.status,
          createdAt: listing.createdAt,
          deliverySLA: listing.deliverySLA,
          // Unit breakdown
          units: {
            available: availableCount,
            locked: lockedCount,
            delivered: deliveredCount,
            cancelled: cancelledCount,
            total: units.length,
          },
        };
      })
    );

    // Sort by most recent first
    enrichedListings.sort((a, b) => b.createdAt - a.createdAt);

    return {
      totalListings: enrichedListings.length,
      listings: enrichedListings,
    };
  },
});

/**
 * Get active negotiations (locked units awaiting delivery)
 * 
 * Returns all units from farmer's listings that are locked,
 * showing trader aliases, payment confirmations, and delivery deadlines.
 */
export const getActiveNegotiations = query({
  args: {
    farmerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is a farmer
    const user = await ctx.db.get(args.farmerId);
    if (!user || user.role !== "farmer") {
      throw new Error("User is not a farmer");
    }

    const now = Date.now();

    // Get all listings for this farmer
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const listingIds = listings.map((l) => l._id);

    // Get all locked units from these listings
    const allLockedUnits = await ctx.db
      .query("listingUnits")
      .withIndex("by_status", (q) => q.eq("status", "locked"))
      .collect();

    // Filter to only units from this farmer's listings
    const farmerLockedUnits = allLockedUnits.filter((unit) =>
      listingIds.includes(unit.listingId)
    );

    // Enrich with listing and trader information
    const negotiations = await Promise.all(
      farmerLockedUnits.map(async (unit) => {
        const listing = await ctx.db.get(unit.listingId);
        const trader = unit.lockedBy ? await ctx.db.get(unit.lockedBy) : null;

        // Server-side time calculation for delivery deadline
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
          listingUtid: listing?.utid,
          produceType: listing?.produceType,
          pricePerKilo: listing?.pricePerKilo,
          unitPrice: listing ? listing.pricePerKilo * 10 : 0, // 10kg per unit
          // Pay-to-lock confirmation
          lockUtid: unit.lockUtid, // UTID of the payment that locked this unit
          lockedAt: unit.lockedAt,
          // Trader information (anonymity preserved)
          traderAlias: trader?.alias || null, // Only alias, no real identity
          // Delivery deadline (server-calculated)
          deliveryDeadline: unit.deliveryDeadline,
          isPastDeadline,
          hoursRemaining: hoursRemaining !== null ? Math.round(hoursRemaining * 100) / 100 : null,
          hoursOverdue: Math.round(hoursOverdue * 100) / 100,
          // Delivery status
          deliveryStatus: unit.deliveryStatus || "pending",
        };
      })
    );

    // Sort by deadline (earliest first, then overdue first)
    negotiations.sort((a, b) => {
      if (!a.deliveryDeadline) return 1;
      if (!b.deliveryDeadline) return -1;
      if (a.isPastDeadline !== b.isPastDeadline) {
        return a.isPastDeadline ? -1 : 1; // Overdue first
      }
      return a.deliveryDeadline - b.deliveryDeadline;
    });

    return {
      totalNegotiations: negotiations.length,
      negotiations: negotiations,
      currentTime: now,
    };
  },
});

/**
 * Get pay-to-lock confirmations
 * 
 * Returns all units that have been locked (paid for),
 * showing payment confirmation details and UTIDs.
 */
export const getPayToLockConfirmations = query({
  args: {
    farmerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is a farmer
    const user = await ctx.db.get(args.farmerId);
    if (!user || user.role !== "farmer") {
      throw new Error("User is not a farmer");
    }

    // Get all listings for this farmer
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const listingIds = listings.map((l) => l._id);

    // Get all locked units from these listings
    const allLockedUnits = await ctx.db
      .query("listingUnits")
      .withIndex("by_status", (q) => q.eq("status", "locked"))
      .collect();

    // Filter to only units from this farmer's listings
    const farmerLockedUnits = allLockedUnits.filter((unit) =>
      listingIds.includes(unit.listingId)
    );

    // Enrich with payment confirmation details
    const confirmations = await Promise.all(
      farmerLockedUnits.map(async (unit) => {
        const listing = await ctx.db.get(unit.listingId);
        const trader = unit.lockedBy ? await ctx.db.get(unit.lockedBy) : null;

        // Get wallet ledger entry for this lock (payment confirmation)
        let walletEntry = null;
        if (unit.lockUtid) {
          const entries = await ctx.db
            .query("walletLedger")
            .withIndex("by_utid", (q) => q.eq("utid", unit.lockUtid))
            .first();
          walletEntry = entries;
        }

        return {
          unitId: unit._id,
          unitNumber: unit.unitNumber,
          listingId: unit.listingId,
          listingUtid: listing?.utid,
          produceType: listing?.produceType,
          // Pay-to-lock confirmation
          lockUtid: unit.lockUtid, // UTID of the payment
          lockedAt: unit.lockedAt,
          // Payment confirmation
          paymentConfirmed: !!walletEntry,
          paymentAmount: walletEntry?.amount || null,
          paymentTimestamp: walletEntry?.timestamp || null,
          // Trader information (anonymity preserved)
          traderAlias: trader?.alias || null, // Only alias, no real identity
        };
      })
    );

    // Sort by most recent first
    confirmations.sort((a, b) => {
      if (!a.lockedAt) return 1;
      if (!b.lockedAt) return -1;
      return b.lockedAt - a.lockedAt;
    });

    return {
      totalConfirmations: confirmations.length,
      confirmations: confirmations,
    };
  },
});

/**
 * Get delivery deadlines with countdown
 * 
 * Returns all locked units with delivery deadlines,
 * showing server-calculated countdown timers.
 */
export const getDeliveryDeadlines = query({
  args: {
    farmerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is a farmer
    const user = await ctx.db.get(args.farmerId);
    if (!user || user.role !== "farmer") {
      throw new Error("User is not a farmer");
    }

    const now = Date.now();

    // Get all listings for this farmer
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const listingIds = listings.map((l) => l._id);

    // Get all locked units from these listings
    const allLockedUnits = await ctx.db
      .query("listingUnits")
      .withIndex("by_status", (q) => q.eq("status", "locked"))
      .collect();

    // Filter to only units from this farmer's listings
    const farmerLockedUnits = allLockedUnits.filter((unit) =>
      listingIds.includes(unit.listingId) && unit.deliveryDeadline
    );

    // Enrich with deadline countdown (server-calculated)
    const deadlines = await Promise.all(
      farmerLockedUnits.map(async (unit) => {
        const listing = await ctx.db.get(unit.listingId);
        const trader = unit.lockedBy ? await ctx.db.get(unit.lockedBy) : null;

        // Server-side time calculation
        const isPastDeadline = now > unit.deliveryDeadline!;
        const hoursRemaining = Math.max(0, (unit.deliveryDeadline! - now) / (1000 * 60 * 60));
        const hoursOverdue = isPastDeadline
          ? (now - unit.deliveryDeadline!) / (1000 * 60 * 60)
          : 0;
        const minutesRemaining = Math.max(0, (unit.deliveryDeadline! - now) / (1000 * 60));
        const minutesOverdue = isPastDeadline
          ? (now - unit.deliveryDeadline!) / (1000 * 60)
          : 0;

        return {
          unitId: unit._id,
          unitNumber: unit.unitNumber,
          listingId: unit.listingId,
          listingUtid: listing?.utid,
          produceType: listing?.produceType,
          lockUtid: unit.lockUtid,
          lockedAt: unit.lockedAt,
          // Delivery deadline
          deliveryDeadline: unit.deliveryDeadline,
          // Server-calculated countdown
          isPastDeadline,
          hoursRemaining: Math.round(hoursRemaining * 100) / 100,
          hoursOverdue: Math.round(hoursOverdue * 100) / 100,
          minutesRemaining: Math.round(minutesRemaining),
          minutesOverdue: Math.round(minutesOverdue),
          // Trader information (anonymity preserved)
          traderAlias: trader?.alias || null, // Only alias, no real identity
        };
      })
    );

    // Sort by deadline (earliest first, then overdue first)
    deadlines.sort((a, b) => {
      if (a.isPastDeadline !== b.isPastDeadline) {
        return a.isPastDeadline ? -1 : 1; // Overdue first
      }
      return a.deliveryDeadline! - b.deliveryDeadline!;
    });

    // Group by status
    const pending = deadlines.filter((d) => !d.isPastDeadline);
    const overdue = deadlines.filter((d) => d.isPastDeadline);

    return {
      totalDeadlines: deadlines.length,
      pending: {
        count: pending.length,
        deadlines: pending,
      },
      overdue: {
        count: overdue.length,
        deadlines: overdue,
      },
      currentTime: now,
    };
  },
});

/**
 * Get delivery status summary
 * 
 * Returns all locked units grouped by delivery status:
 * - pending: Awaiting delivery
 * - delivered: Successfully delivered (verified)
 * - late: Past deadline, not yet delivered
 * - cancelled: Delivery cancelled/reversed
 */
export const getDeliveryStatus = query({
  args: {
    farmerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is a farmer
    const user = await ctx.db.get(args.farmerId);
    if (!user || user.role !== "farmer") {
      throw new Error("User is not a farmer");
    }

    const now = Date.now();

    // Get all listings for this farmer
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const listingIds = listings.map((l) => l._id);

    // Get all locked units from these listings
    const allLockedUnits = await ctx.db
      .query("listingUnits")
      .withIndex("by_status", (q) => q.eq("status", "locked"))
      .collect();

    // Filter to only units from this farmer's listings
    const farmerLockedUnits = allLockedUnits.filter((unit) =>
      listingIds.includes(unit.listingId)
    );

    // Group by delivery status
    const byStatus = new Map<string, any[]>();

    for (const unit of farmerLockedUnits) {
      const deliveryStatus = unit.deliveryStatus || "pending";
      if (!byStatus.has(deliveryStatus)) {
        byStatus.set(deliveryStatus, []);
      }

      const listing = await ctx.db.get(unit.listingId);
      const trader = unit.lockedBy ? await ctx.db.get(unit.lockedBy) : null;

      // Server-side time calculation
      const isPastDeadline = unit.deliveryDeadline
        ? now > unit.deliveryDeadline
        : false;

      const hoursOverdue = unit.deliveryDeadline && isPastDeadline
        ? (now - unit.deliveryDeadline) / (1000 * 60 * 60)
        : 0;

      byStatus.get(deliveryStatus)!.push({
        unitId: unit._id,
        unitNumber: unit.unitNumber,
        listingId: unit.listingId,
        listingUtid: listing?.utid,
        produceType: listing?.produceType,
        lockUtid: unit.lockUtid,
        lockedAt: unit.lockedAt,
        deliveryDeadline: unit.deliveryDeadline,
        deliveryStatus: unit.deliveryStatus,
        isPastDeadline,
        hoursOverdue: Math.round(hoursOverdue * 100) / 100,
        // Trader information (anonymity preserved)
        traderAlias: trader?.alias || null, // Only alias, no real identity
      });
    }

    // Convert to array format
    const statusGroups = Array.from(byStatus.entries()).map(([status, units]) => ({
      deliveryStatus: status,
      count: units.length,
      units: units.sort((a, b) => {
        // Sort by deadline (earliest first)
        if (!a.deliveryDeadline) return 1;
        if (!b.deliveryDeadline) return -1;
        return a.deliveryDeadline - b.deliveryDeadline;
      }),
    }));

    // Calculate totals
    const totals = {
      pending: statusGroups.find((g) => g.deliveryStatus === "pending")?.count || 0,
      delivered: statusGroups.find((g) => g.deliveryStatus === "delivered")?.count || 0,
      late: statusGroups.find((g) => g.deliveryStatus === "late")?.count || 0,
      cancelled: statusGroups.find((g) => g.deliveryStatus === "cancelled")?.count || 0,
      total: farmerLockedUnits.length,
    };

    return {
      totals,
      byStatus: statusGroups,
      currentTime: now,
    };
  },
});
