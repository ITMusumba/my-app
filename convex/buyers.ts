/**
 * Buyer Purchase System
 * 
 * - Buyers can only purchase during admin-opened windows
 * - Buyers never see prices
 * - Inventory is locked atomically on purchase
 * - Pickup SLA: 48 hours after purchase
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { generateUTID, getUgandaTime, calculateInventoryPricePerKilo, getBuyerServiceFeePercentage } from "./utils";
import { calculatePickupSLA } from "./utils";
import { checkPilotMode } from "./pilotMode";
import { checkRateLimit } from "./rateLimits";
import {
  purchaseWindowClosedError,
  invalidRoleError,
  invalidKilosError,
  inventoryNotFoundError,
  inventoryNotAvailableError,
  throwAppError,
} from "./errors";

/**
 * Create buyer purchase (buyer only)
 * 
 * ATOMIC OPERATION:
 * 1. Validate purchase window is open (FIRST VALIDATION)
 * 2. Verify buyer role
 * 3. Validate inventory exists and is available
 * 4. Validate kilos requested
 * 5. Lock inventory atomically (status → "sold")
 * 6. Create buyer purchase entry
 * 7. Generate UTID (only on success)
 * 
 * If any step fails, entire operation rolls back.
 */
export const createBuyerPurchase = mutation({
  args: {
    buyerId: v.id("users"),
    inventoryId: v.id("traderInventory"),
    kilos: v.number(),
  },
  handler: async (ctx, args) => {
    // ============================================================
    // PILOT MODE CHECK (MUST BE FIRST - BEFORE ANY OPERATIONS)
    // ============================================================
    // This mutation moves inventory (locks inventory on purchase),
    // so it must be blocked during pilot mode. The check happens FIRST
    // to fail fast and prevent any partial state changes.
    await checkPilotMode(ctx);

    // ============================================================
    // FIRST VALIDATION: PURCHASE WINDOW MUST BE OPEN
    // ============================================================
    // This is the critical first check - buyers cannot purchase
    // outside of admin-opened windows. This check happens BEFORE
    // any other validation to fail fast.
    const purchaseWindow = await ctx.db
      .query("purchaseWindows")
      .withIndex("by_status", (q) => q.eq("isOpen", true))
      .first();

    if (!purchaseWindow) {
      throwAppError(purchaseWindowClosedError());
    }

    // ============================================================
    // VERIFY BUYER ROLE
    // ============================================================
    const user = await ctx.db.get(args.buyerId);
    if (!user || user.role !== "buyer") {
      throwAppError(invalidRoleError("buyer"));
    }

    // ============================================================
    // RATE LIMIT CHECK (BEFORE OPERATIONS)
    // ============================================================
    // Check if buyer has exceeded purchase rate limit.
    // This prevents spam and manipulation attempts.
    await checkRateLimit(ctx, args.buyerId, user.role, "create_purchase", {
      inventoryId: args.inventoryId,
      kilos: args.kilos,
    });

    if (args.kilos <= 0) {
      throwAppError(invalidKilosError());
    }

    // ============================================================
    // VALIDATE INVENTORY
    // ============================================================
    const inventory = await ctx.db.get(args.inventoryId);
    if (!inventory) {
      throwAppError(inventoryNotFoundError());
    }

    // Inventory must be in_storage (available for purchase)
    if (inventory.status !== "in_storage") {
      throwAppError(inventoryNotAvailableError());
    }

    // Validate kilos requested
    if (args.kilos > inventory.totalKilos) {
      throw new Error(
        `Requested kilos (${args.kilos}) exceeds available inventory (${inventory.totalKilos} kg).`
      );
    }

    // ============================================================
    // ATOMIC OPERATION: LOCK INVENTORY AND CREATE PURCHASE
    // ============================================================
    // All operations happen in one mutation - Convex guarantees atomicity.
    // If any step fails, entire operation rolls back.

    const purchaseTime = getUgandaTime();
    const pickupDeadline = calculatePickupSLA(purchaseTime);

    // Step 1: Lock inventory (status → "sold")
    // This prevents other buyers from purchasing the same inventory
    await ctx.db.patch(args.inventoryId, {
      status: "sold",
    });

    // Step 2: Calculate purchase price
    // Calculate base price per kilo from inventory
    const basePricePerKilo = await calculateInventoryPricePerKilo(ctx, args.inventoryId);
    
    // Get service fee percentage
    const serviceFeePercentage = await getBuyerServiceFeePercentage({ db: ctx.db });
    
    // Calculate total cost
    const baseCost = basePricePerKilo * args.kilos;
    const serviceFee = (baseCost * serviceFeePercentage) / 100;
    const totalCost = baseCost + serviceFee;

    // Step 3: Generate UTID (only after all validations pass)
    // UTID is generated here, not earlier, to ensure it's only created
    // on successful purchase. If any validation fails, no UTID is created.
    const purchaseUtid = generateUTID(user.role);

    // Step 4: Check buyer wallet balance
    const currentEntries = await ctx.db
      .query("walletLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.buyerId))
      .order("desc")
      .first();

    const currentBalance = currentEntries?.balanceAfter || 0;

    if (currentBalance < totalCost) {
      throw new Error(
        `Insufficient wallet balance. Required: ${totalCost.toFixed(2)} UGX, Available: ${currentBalance.toFixed(2)} UGX`
      );
    }

    // Step 5: Create wallet ledger entry for purchase
    const balanceAfter = currentBalance - totalCost;
    await ctx.db.insert("walletLedger", {
      userId: args.buyerId,
      utid: purchaseUtid,
      type: "capital_lock", // Using capital_lock for buyer purchases
      amount: totalCost,
      balanceAfter,
      timestamp: purchaseTime,
      metadata: {
        type: "buyer_purchase",
        inventoryId: args.inventoryId,
        kilos: args.kilos,
        basePricePerKilo,
        serviceFeePercentage,
        serviceFee,
        totalCost,
      },
    });

    // Step 6: Create buyer purchase entry
    await ctx.db.insert("buyerPurchases", {
      buyerId: args.buyerId,
      inventoryId: args.inventoryId,
      kilos: args.kilos,
      utid: purchaseUtid,
      purchasedAt: purchaseTime,
      pickupSLA: pickupDeadline, // 48 hours after purchase
      status: "pending_pickup",
    });

    // Get trader information (for response, buyer never sees prices)
    const trader = await ctx.db.get(inventory.traderId);

    return {
      purchaseUtid,
      purchaseId: args.inventoryId, // Using inventoryId as purchase identifier
      buyerId: args.buyerId,
      inventoryId: args.inventoryId,
      kilos: args.kilos,
      produceType: inventory.produceType,
      traderAlias: trader?.alias || null,
      purchasedAt: purchaseTime,
      pickupDeadline: pickupDeadline,
      status: "pending_pickup",
    };
  },
});
