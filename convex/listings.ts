/**
 * Listings & Inventory Management
 * 
 * - Farmers list produce → auto-split into 10kg units
 * - Units lock only on successful payment (pay-to-lock)
 * - Trader inventory aggregates into 100kg blocks for buyers
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateUTID } from "./utils";
import { LISTING_UNIT_SIZE_KG } from "./constants";
import { checkPilotMode } from "./pilotMode";
import { checkRateLimit } from "./rateLimits";
import {
  invalidRoleError,
  invalidKilosError,
  invalidAmountError,
  throwAppError,
} from "./errors";

/**
 * Create a listing (farmer only)
 * Auto-splits into 10kg units
 */
export const createListing = mutation({
  args: {
    farmerId: v.id("users"),
    produceType: v.string(),
    totalKilos: v.number(),
    pricePerKilo: v.number(), // In UGX
  },
  handler: async (ctx, args) => {
    // ============================================================
    // PILOT MODE CHECK (MUST BE FIRST - BEFORE ANY OPERATIONS)
    // ============================================================
    // This mutation creates inventory that can be purchased (moves money),
    // so it must be blocked during pilot mode. The check happens FIRST to fail fast.
    await checkPilotMode(ctx);

    // Verify user is a farmer
    const user = await ctx.db.get(args.farmerId);
    if (!user || user.role !== "farmer") {
      throwAppError(invalidRoleError("farmer"));
    }

    // ============================================================
    // RATE LIMIT CHECK (BEFORE OPERATIONS)
    // ============================================================
    // Check if farmer has exceeded listing creation rate limit.
    // This prevents spam and manipulation attempts.
    await checkRateLimit(ctx, args.farmerId, user.role, "create_listing", {
      produceType: args.produceType,
      totalKilos: args.totalKilos,
    });

    if (args.totalKilos <= 0) {
      throwAppError(invalidKilosError());
    }
    if (args.pricePerKilo <= 0) {
      throwAppError(invalidAmountError());
    }

    // Generate UTID
    const utid = generateUTID(user.role);

    // Calculate units (10kg each)
    const totalUnits = Math.floor(args.totalKilos / LISTING_UNIT_SIZE_KG);
    if (totalUnits === 0) {
      throw new Error(`Total kilos must be at least ${LISTING_UNIT_SIZE_KG}kg`);
    }

    // Create listing
    const listingId = await ctx.db.insert("listings", {
      farmerId: args.farmerId,
      utid,
      produceType: args.produceType,
      totalKilos: args.totalKilos,
      pricePerKilo: args.pricePerKilo,
      unitSize: LISTING_UNIT_SIZE_KG,
      totalUnits,
      status: "active",
      createdAt: Date.now(),
      deliverySLA: 0, // Set when payment is made
    });

    // Create individual units
    const unitIds = [];
    for (let i = 1; i <= totalUnits; i++) {
      const unitId = await ctx.db.insert("listingUnits", {
        listingId,
        unitNumber: i,
        status: "available",
      });
      unitIds.push(unitId);
    }

    return { listingId, utid, totalUnits, unitIds };
  },
});

/**
 * Get active listings (traders can view)
 */
export const getActiveListings = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Get farmer aliases (anonymity) and unit availability
    const listingsWithAliases = await Promise.all(
      listings.map(async (listing) => {
        const farmer = await ctx.db.get(listing.farmerId);
        const units = await ctx.db
          .query("listingUnits")
          .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
          .collect();
        
        const availableUnits = units.filter((u) => u.status === "available").length;
        const lockedUnits = units.filter((u) => u.status === "locked").length;

        return {
          listingId: listing._id,
          utid: listing.utid,
          produceType: listing.produceType,
          totalKilos: listing.totalKilos,
          pricePerKilo: listing.pricePerKilo,
          totalUnits: listing.totalUnits,
          availableUnits,
          lockedUnits,
          farmerAlias: farmer?.alias || "unknown",
          createdAt: listing.createdAt,
        };
      })
    );

    return listingsWithAliases;
  },
});

/**
 * Get listing details with unit status
 */
export const getListingDetails = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      return null;
    }

    const farmer = await ctx.db.get(listing.farmerId);
    const units = await ctx.db
      .query("listingUnits")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .collect();

    const availableUnits = units.filter((u) => u.status === "available").length;
    const lockedUnits = units.filter((u) => u.status === "locked").length;

    return {
      listingId: listing._id,
      utid: listing.utid,
      produceType: listing.produceType,
      totalKilos: listing.totalKilos,
      pricePerKilo: listing.pricePerKilo,
      totalUnits: listing.totalUnits,
      availableUnits,
      lockedUnits,
      status: listing.status,
      farmerAlias: farmer?.alias || "unknown",
      createdAt: listing.createdAt,
      units: units.map((u) => ({
        unitId: u._id,
        unitNumber: u.unitNumber,
        status: u.status,
        lockedBy: u.lockedBy,
        lockedAt: u.lockedAt,
      })),
    };
  },
});

/**
 * Get first available unit ID for a listing (helper for negotiations)
 */
export const getFirstAvailableUnit = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const units = await ctx.db
      .query("listingUnits")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .collect();

    const availableUnit = units.find((u) => u.status === "available");
    if (!availableUnit) {
      return null;
    }

    return {
      unitId: availableUnit._id,
      unitNumber: availableUnit.unitNumber,
    };
  },
});
