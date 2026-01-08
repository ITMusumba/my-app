/**
 * Pay-to-Lock System (CRITICAL)
 * 
 * - Unit locking and wallet debit must be atomic
 * - First successful payment wins
 * - Race conditions must be impossible
 * - Partial state changes are forbidden
 * - Spend cap enforcement happens BEFORE payment
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { generateUTID, calculateTraderExposureInternal } from "./utils";
import { calculateDeliverySLA } from "./utils";
import { MAX_TRADER_EXPOSURE_UGX, LISTING_UNIT_SIZE_KG } from "./constants";
import { checkPilotMode } from "./pilotMode";
import { checkRateLimit } from "./rateLimits";
import {
  spendCapExceededError,
  insufficientCapitalError,
  unitNotAvailableError,
  listingNotFoundError,
  unitNotFoundError,
  invalidRoleError,
  throwAppError,
} from "./errors";

/**
 * Internal helper function to lock a unit (shared logic)
 */
import { Id } from "./_generated/dataModel";

async function lockUnitInternal(
  ctx: any,
  traderId: Id<"users">,
  unitId: Id<"listingUnits">
) {
  // Verify user is a trader
  const user = await ctx.db.get(traderId);
  if (!user || user.role !== "trader") {
    throw new Error("User is not a trader");
  }

  // Rate limit check
  await checkRateLimit(ctx, traderId, user.role, "lock_unit", {
    unitId: unitId,
  });

  // Get unit and verify it's available
  const unit = await ctx.db.get(unitId);
  if (!unit) {
    throw new Error("Unit not found");
  }
  if (unit.status !== "available") {
    throw new Error("Unit is not available");
  }

  // Get listing to calculate price
  const listing = await ctx.db.get(unit.listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  const unitPrice = listing.pricePerKilo * LISTING_UNIT_SIZE_KG;

  // Spend cap enforcement
  const exposure = await calculateTraderExposureInternal(ctx, traderId);
  const newExposure = exposure.totalExposure + unitPrice;

  if (newExposure > MAX_TRADER_EXPOSURE_UGX) {
    throwAppError(spendCapExceededError());
  }

  // Get current wallet balance
  const walletEntries = await ctx.db
    .query("walletLedger")
    .withIndex("by_user", (q: any) => q.eq("userId", traderId))
    .order("desc")
    .first();

  const currentBalance = walletEntries?.balanceAfter || 0;
  const availableCapital = currentBalance - exposure.lockedCapital;

  if (availableCapital < unitPrice) {
    throwAppError(insufficientCapitalError());
  }

  // Generate UTID
  const utid = generateUTID(user.role);

  // ATOMIC OPERATION: Lock capital and unit together
  const balanceAfter = currentBalance - unitPrice;
  await ctx.db.insert("walletLedger", {
    userId: traderId,
    utid,
    type: "capital_lock",
    amount: unitPrice,
    balanceAfter,
    timestamp: Date.now(),
    metadata: {
      unitId: unitId,
      listingId: listing._id,
      produceType: listing.produceType,
    },
  });

  // Lock the unit
  const paymentTime = Date.now();
  const deliveryDeadline = calculateDeliverySLA(paymentTime);
  
  await ctx.db.patch(unitId, {
    status: "locked",
    lockedBy: traderId,
    lockedAt: paymentTime,
    lockUtid: utid,
    deliveryDeadline: deliveryDeadline,
    deliveryStatus: "pending",
  });

  // Update listing status if needed
  const allUnits = await ctx.db
    .query("listingUnits")
    .withIndex("by_listing", (q: any) => q.eq("listingId", listing._id))
    .collect();

  const availableCount = allUnits.filter((u: any) => u.status === "available").length;
  const lockedCount = allUnits.filter((u: any) => u.status === "locked").length;

  if (availableCount === 0 && lockedCount > 0) {
    await ctx.db.patch(listing._id, {
      status: "fully_locked",
      deliverySLA: calculateDeliverySLA(Date.now()),
    });
  } else if (lockedCount > 0) {
    await ctx.db.patch(listing._id, {
      status: "partially_locked",
      deliverySLA: calculateDeliverySLA(Date.now()),
    });
  }

  return {
    utid,
    unitId: unitId,
    listingId: listing._id,
    unitPrice,
    balanceAfter,
    newExposure,
  };
}

/**
 * Lock a unit by payment (trader only)
 * 
 * ATOMIC OPERATION:
 * 1. Verify spend cap (enforcement BEFORE payment)
 * 2. Check unit is available
 * 3. Lock capital in wallet
 * 4. Lock unit
 * 5. Update listing status if needed
 * 
 * If any step fails, entire operation rolls back
 */
export const lockUnit = mutation({
  args: {
    traderId: v.id("users"),
    unitId: v.id("listingUnits"),
  },
  handler: async (ctx, args) => {
    await checkPilotMode(ctx);
    return await lockUnitInternal(ctx, args.traderId, args.unitId);
  },
});

/**
 * Lock a unit by listing ID (finds first available unit)
 * Convenience mutation for UI - finds first available unit and locks it
 */
export const lockUnitByListing = mutation({
  args: {
    traderId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    await checkPilotMode(ctx);

    // Get listing
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Find first available unit
    const units = await ctx.db
      .query("listingUnits")
      .withIndex("by_listing", (q: any) => q.eq("listingId", args.listingId))
      .collect();

    const availableUnit = units.find((u: any) => u.status === "available");
    if (!availableUnit) {
      throw new Error("No available units in this listing");
    }

    // Use the shared lock logic
    return await lockUnitInternal(ctx, args.traderId, availableUnit._id);
  },
});
