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
    // Verify user is a trader
    const user = await ctx.db.get(args.traderId);
    if (!user || user.role !== "trader") {
      throw new Error("User is not a trader");
    }

    // Get unit and verify it's available
    const unit = await ctx.db.get(args.unitId);
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

    // ENFORCEMENT: Check spend cap BEFORE payment
    const exposure = await calculateTraderExposureInternal(ctx, args.traderId);
    const newExposure = exposure.totalExposure + unitPrice;

    if (newExposure > MAX_TRADER_EXPOSURE_UGX) {
      throw new Error(
        `Spend cap exceeded. Current exposure: ${exposure.totalExposure} UGX, ` +
        `would be: ${newExposure} UGX (cap: ${MAX_TRADER_EXPOSURE_UGX} UGX)`
      );
    }

    // Get current wallet balance
    const walletEntries = await ctx.db
      .query("walletLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.traderId))
      .order("desc")
      .first();

    const currentBalance = walletEntries?.balanceAfter || 0;
    const availableCapital = currentBalance - exposure.lockedCapital;

    if (availableCapital < unitPrice) {
      throw new Error("Insufficient available capital");
    }

    // Generate UTID for this transaction
    const utid = generateUTID(user.role);

    // ATOMIC OPERATION: Lock capital and unit together
    // Step 1: Lock capital in wallet
    const balanceAfter = currentBalance - unitPrice;
    await ctx.db.insert("walletLedger", {
      userId: args.traderId,
      utid,
      type: "capital_lock",
      amount: unitPrice,
      balanceAfter,
      timestamp: Date.now(),
      metadata: {
        unitId: args.unitId,
        listingId: listing._id,
        produceType: listing.produceType,
      },
    });

    // Step 2: Lock the unit (first payment wins)
    await ctx.db.patch(args.unitId, {
      status: "locked",
      lockedBy: args.traderId,
      lockedAt: Date.now(),
      lockUtid: utid,
    });

    // Step 3: Update listing status if needed
    const allUnits = await ctx.db
      .query("listingUnits")
      .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
      .collect();

    const availableCount = allUnits.filter((u) => u.status === "available").length;
    const lockedCount = allUnits.filter((u) => u.status === "locked").length;

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
      unitId: args.unitId,
      listingId: listing._id,
      unitPrice,
      balanceAfter,
      newExposure,
    };
  },
});
