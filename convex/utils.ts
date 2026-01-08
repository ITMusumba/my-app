/**
 * Utility functions
 * 
 * - UTID generation
 * - Spend cap calculations
 * - Time-based SLA calculations
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
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
 * Calculate trader exposure (internal helper)
 * Can be used in both queries and mutations
 * Exposure = capital committed + locked orders + inventory value
 * Must not exceed UGX 1,000,000
 */
export async function calculateTraderExposureInternal(
  ctx: any,
  traderId: string
) {
  // Get locked capital from wallet ledger
  const capitalEntries = await ctx.db
    .query("walletLedger")
    .withIndex("by_user", (q) => q.eq("userId", traderId))
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
    .withIndex("by_status", (q) => q.eq("status", "locked"))
    .collect();

  let lockedOrdersValue = 0;
  for (const unit of lockedUnits) {
    if (unit.lockedBy === traderId) {
      const listing = await ctx.db.get(unit.listingId);
      if (listing) {
        lockedOrdersValue += listing.pricePerKilo * 10; // 10kg per unit
      }
    }
  }

  // Get inventory value
  const inventory = await ctx.db
    .query("traderInventory")
    .withIndex("by_trader", (q) => q.eq("traderId", traderId))
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
  const spendCap = 1_000_000; // UGX 1,000,000

  return {
    lockedCapital,
    lockedOrdersValue,
    inventoryValue,
    totalExposure,
    spendCap,
    canSpend: totalExposure < spendCap,
    remainingCapacity: Math.max(0, spendCap - totalExposure),
  };
}

/**
 * Calculate trader exposure (query endpoint)
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
