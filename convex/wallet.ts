/**
 * Wallet System (Closed Loop)
 * 
 * - Internal ledger only (NOT a bank)
 * - Traders have capital and profit ledgers
 * - No balance overwrites - ledger entries only
 * - All entries reference UTIDs
 * - Spend cap enforcement (UGX 1,000,000 max exposure)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateUTID, calculateTraderExposureInternal } from "./utils";
import { MAX_TRADER_EXPOSURE_UGX } from "./constants";
import { checkPilotMode } from "./pilotMode";
import { checkRateLimit } from "./rateLimits";

/**
 * Get wallet balance for a trader
 * Returns capital and profit balances separately
 */
export const getWalletBalance = query({
  args: { traderId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user is a trader
    const user = await ctx.db.get(args.traderId);
    if (!user || user.role !== "trader") {
      throw new Error("User is not a trader");
    }

    // Get all ledger entries
    const entries = await ctx.db
      .query("walletLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.traderId))
      .order("desc")
      .collect();

    let capitalBalance = 0;
    let profitBalance = 0;
    let lockedCapital = 0;

    for (const entry of entries) {
      if (entry.type === "capital_deposit") {
        capitalBalance += entry.amount;
      } else if (entry.type === "capital_lock") {
        capitalBalance -= entry.amount;
        lockedCapital += entry.amount;
      } else if (entry.type === "capital_unlock") {
        capitalBalance += entry.amount;
        lockedCapital -= entry.amount;
      } else if (entry.type === "profit_credit") {
        profitBalance += entry.amount;
      } else if (entry.type === "profit_withdrawal") {
        profitBalance -= entry.amount;
      }
    }

    // Calculate exposure
    const exposure = await calculateTraderExposureInternal(ctx, args.traderId);

    return {
      capitalBalance,
      profitBalance,
      lockedCapital,
      availableCapital: capitalBalance - lockedCapital,
      exposure: exposure.totalExposure,
      spendCap: MAX_TRADER_EXPOSURE_UGX,
      remainingCapacity: exposure.remainingCapacity,
    };
  },
});

/**
 * Deposit capital (trader only)
 * Creates a ledger entry with UTID
 */
export const depositCapital = mutation({
  args: {
    traderId: v.id("users"),
    amount: v.number(), // In UGX
  },
  handler: async (ctx, args) => {
    // Verify user is a trader
    const user = await ctx.db.get(args.traderId);
    if (!user || user.role !== "trader") {
      throw new Error("User is not a trader");
    }

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Generate UTID
    const utid = generateUTID(user.role);

    // Get current balance
    const currentEntries = await ctx.db
      .query("walletLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.traderId))
      .order("desc")
      .first();

    const balanceAfter = currentEntries
      ? currentEntries.balanceAfter + args.amount
      : args.amount;

    // Create ledger entry
    await ctx.db.insert("walletLedger", {
      userId: args.traderId,
      utid,
      type: "capital_deposit",
      amount: args.amount,
      balanceAfter,
      timestamp: Date.now(),
      metadata: { source: "manual_deposit" },
    });

    return { utid, balanceAfter };
  },
});

/**
 * Withdraw profit (trader only)
 * Profit ledger is always withdrawable
 */
export const withdrawProfit = mutation({
  args: {
    traderId: v.id("users"),
    amount: v.number(), // In UGX
  },
  handler: async (ctx, args) => {
    // ============================================================
    // PILOT MODE CHECK (MUST BE FIRST - BEFORE ANY OPERATIONS)
    // ============================================================
    // This mutation moves money (withdraws profit), so it must be blocked
    // during pilot mode. The check happens FIRST to fail fast.
    await checkPilotMode(ctx);

    // Verify user is a trader
    const user = await ctx.db.get(args.traderId);
    if (!user || user.role !== "trader") {
      throw new Error("User is not a trader");
    }

    // ============================================================
    // RATE LIMIT CHECK (BEFORE OPERATIONS)
    // ============================================================
    // Check if trader has exceeded wallet operations rate limit.
    // This prevents spam and manipulation attempts.
    await checkRateLimit(ctx, args.traderId, user.role, "withdraw_profit", {
      amount: args.amount,
    });

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Get current profit balance
    const entries = await ctx.db
      .query("walletLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.traderId))
      .collect();

    let profitBalance = 0;
    for (const entry of entries) {
      if (entry.type === "profit_credit") {
        profitBalance += entry.amount;
      } else if (entry.type === "profit_withdrawal") {
        profitBalance -= entry.amount;
      }
    }

    if (profitBalance < args.amount) {
      throw new Error("Insufficient profit balance");
    }

    // Generate UTID
    const utid = generateUTID(user.role);

    // Get current balance after
    const lastEntry = await ctx.db
      .query("walletLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.traderId))
      .order("desc")
      .first();

    const balanceAfter = lastEntry
      ? lastEntry.balanceAfter - args.amount
      : -args.amount;

    // Create ledger entry
    await ctx.db.insert("walletLedger", {
      userId: args.traderId,
      utid,
      type: "profit_withdrawal",
      amount: args.amount,
      balanceAfter,
      timestamp: Date.now(),
      metadata: { source: "manual_withdrawal" },
    });

    return { utid, balanceAfter };
  },
});
