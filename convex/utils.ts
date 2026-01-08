/**
 * Utility functions
 * 
 * - UTID generation
 * - Spend cap calculations
 * - Time-based SLA calculations
 */

import { v } from "convex/values";
import { query, DatabaseReader, DatabaseWriter } from "./_generated/server";
import { MAX_TRADER_EXPOSURE_UGX } from "./constants";
import { Id } from "./_generated/dataModel";

/**
 * Generate a human-readable UTID (Unique Transaction ID)
 * Format: YYYYMMDD-HHMMSS-ROLE-RANDOM
 * Example: 20240315-143022-trader-a3k9x2
 */
export function generateUTID(role: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const rolePrefix = role.substring(0, 3);
  const random = Math.random().toString(36).substring(2, 8);
  return `${date}-${time}-${rolePrefix}-${random}`;
}

/**
 * CANONICAL trader exposure calculation function
 * 
 * This is the SINGLE SOURCE OF TRUTH for trader exposure calculations.
 * Used consistently in:
 * - Wallet mutations (spend cap enforcement)
 * - Payment/pay-to-lock mutations (spend cap enforcement BEFORE wallet debit)
 * - Query endpoints (exposure reporting)
 * 
 * Exposure = locked capital + locked orders value + inventory value
 * Must not exceed MAX_TRADER_EXPOSURE_UGX (1,000,000 UGX)
 * 
 * @param ctx - Database context (works with both DatabaseReader and DatabaseWriter)
 * @param traderId - The trader's user ID
 * @returns Exposure breakdown and spend capacity information
 */
export async function calculateTraderExposureInternal(
  ctx: { db: DatabaseReader | DatabaseWriter },
  traderId: string
) {
  // Get locked capital from wallet ledger
  const capitalEntries = await ctx.db
    .query("walletLedger")
    .withIndex("by_user", (q: any) => q.eq("userId", traderId))
    .collect();

  let lockedCapital = 0;

  for (const entry of capitalEntries) {
    if (entry.type === "capital_lock") {
      lockedCapital += entry.amount;
    } else if (entry.type === "capital_unlock") {
      lockedCapital -= entry.amount;
    }
  }

  // Get value of locked orders (pending payments)
  const lockedUnits = await ctx.db
    .query("listingUnits")
    .withIndex("by_status", (q: any) => q.eq("status", "locked"))
    .collect();

  let lockedOrdersValue = 0;
  for (const unit of lockedUnits) {
    if (unit.lockedBy === traderId) {
      const listing = await ctx.db.get(unit.listingId);
      if (listing) {
        // Use listing's unitSize (which may be less than 10kg for small listings)
        const unitSize = listing.unitSize || 10;
        lockedOrdersValue += listing.pricePerKilo * unitSize;
      }
    }
  }

  // Get inventory value
  const inventory = await ctx.db
    .query("traderInventory")
    .withIndex("by_trader", (q: any) => q.eq("traderId", traderId))
    .collect();

  let inventoryValue = 0;
  for (const inv of inventory) {
    if (inv.status === "in_storage" && inv.listingUnitIds.length > 0) {
      const firstUnit = await ctx.db.get(inv.listingUnitIds[0]);
      if (firstUnit) {
        const listing = await ctx.db.get(firstUnit.listingId);
        if (listing) {
          inventoryValue += listing.pricePerKilo * inv.totalKilos;
        }
      }
    }
  }

  const totalExposure = lockedCapital + lockedOrdersValue + inventoryValue;

  return {
    lockedCapital,
    lockedOrdersValue,
    inventoryValue,
    totalExposure,
    spendCap: MAX_TRADER_EXPOSURE_UGX,
    canSpend: totalExposure < MAX_TRADER_EXPOSURE_UGX,
    remainingCapacity: Math.max(0, MAX_TRADER_EXPOSURE_UGX - totalExposure),
  };
}

/**
 * Calculate trader exposure (public query endpoint)
 * 
 * Wrapper around calculateTraderExposureInternal for client access.
 * The canonical calculation logic is in calculateTraderExposureInternal.
 */
export const calculateTraderExposure = query({
  args: { traderId: v.id("users") },
  handler: async (ctx, args) => {
    return await calculateTraderExposureInternal(ctx, args.traderId);
  },
});

/**
 * Calculate delivery SLA timestamp (6 hours after payment)
 */
export function calculateDeliverySLA(paymentTimestamp: number): number {
  return paymentTimestamp + 6 * 60 * 60 * 1000; // 6 hours in milliseconds
}

/**
 * Calculate pickup SLA timestamp (48 hours after purchase)
 */
export function calculatePickupSLA(purchaseTimestamp: number): number {
  return purchaseTimestamp + 48 * 60 * 60 * 1000; // 48 hours in milliseconds
}
