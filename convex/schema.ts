/**
 * Farm2Market Uganda - Convex Schema
 * 
 * This schema enforces the core business rules:
 * - User roles (farmer, trader, buyer, admin) - exactly one per user
 * - Anonymity via system-generated aliases
 * - UTID (Unique Transaction ID) for all meaningful actions
 * - Wallet system (closed loop, ledger-based)
 * - Spend cap enforcement (UGX 1,000,000 max exposure)
 * - Pay-to-lock atomicity
 * - Time-based SLAs and storage fees
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * Users table
   * - One role per user (enforced server-side)
   * - System-generated aliases for anonymity
   */
  users: defineTable({
    email: v.string(),
    role: v.union(v.literal("farmer"), v.literal("trader"), v.literal("buyer"), v.literal("admin")),
    alias: v.string(), // System-generated, stable, non-identifying
    createdAt: v.number(),
    lastActiveAt: v.number(),
    // Pilot mode: shared password for all test users
    passwordHash: v.optional(v.string()), // Simple hash for pilot (not production-grade)
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_alias", ["alias"]),

  /**
   * Wallet ledger entries
   * - All entries reference a UTID
   * - Traders have capital and profit ledgers
   * - No balance overwrites - ledger entries only
   */
  walletLedger: defineTable({
    userId: v.id("users"),
    utid: v.string(), // References the transaction that created this entry
    type: v.union(
      v.literal("capital_deposit"),
      v.literal("capital_lock"),
      v.literal("capital_unlock"),
      v.literal("profit_credit"),
      v.literal("profit_withdrawal")
    ),
    amount: v.number(), // Amount in UGX
    balanceAfter: v.number(), // Running balance after this entry
    timestamp: v.number(),
    metadata: v.optional(v.any()), // Additional context
  })
    .index("by_user", ["userId"])
    .index("by_utid", ["utid"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  /**
   * Listings from farmers
   * - Auto-split into 10kg units
   * - Units lock only on successful payment
   */
  listings: defineTable({
    farmerId: v.id("users"),
    utid: v.string(), // Generated when listing is created
    produceType: v.string(),
    totalKilos: v.number(),
    pricePerKilo: v.number(), // In UGX
    unitSize: v.number(), // Always 10kg
    totalUnits: v.number(), // totalKilos / 10
    status: v.union(
      v.literal("active"),
      v.literal("partially_locked"),
      v.literal("fully_locked"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    deliverySLA: v.number(), // Timestamp: 6 hours after payment
  })
    .index("by_farmer", ["farmerId"])
    .index("by_utid", ["utid"])
    .index("by_status", ["status"]),

  /**
   * Listing units (10kg each)
   * - Each unit can be locked independently
   * - Locking requires atomic payment
   */
  listingUnits: defineTable({
    listingId: v.id("listings"),
    unitNumber: v.number(), // 1, 2, 3, ... within the listing
    status: v.union(
      v.literal("available"),
      v.literal("locked"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    lockedBy: v.optional(v.id("users")), // Trader who locked it
    lockedAt: v.optional(v.number()),
    lockUtid: v.optional(v.string()), // UTID of the payment that locked this unit
    // Delivery SLA tracking
    deliveryDeadline: v.optional(v.number()), // Timestamp: lockedAt + 6 hours
    deliveryStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("delivered"),
      v.literal("late"),
      v.literal("cancelled")
    )), // Tracks delivery status for SLA monitoring
  })
    .index("by_listing", ["listingId"])
    .index("by_status", ["status"])
    .index("by_lock_utid", ["lockUtid"])
    .index("by_delivery_status", ["deliveryStatus"]),

  /**
   * Trader inventory
   * - Aggregates into 100kg blocks for buyers
   * - Tracks storage time for fee calculation
   */
  traderInventory: defineTable({
    traderId: v.id("users"),
    listingUnitIds: v.array(v.id("listingUnits")), // Units that make up this inventory block
    totalKilos: v.number(), // Sum of all units
    blockSize: v.number(), // Target: 100kg blocks
    produceType: v.string(),
    acquiredAt: v.number(), // When trader received delivery
    storageStartTime: v.number(), // When storage fees start
    status: v.union(
      v.literal("pending_delivery"),
      v.literal("in_storage"),
      v.literal("sold"),
      v.literal("expired")
    ),
    utid: v.string(), // References the transaction that created this inventory
  })
    .index("by_trader", ["traderId"])
    .index("by_status", ["status"])
    .index("by_utid", ["utid"]),

  /**
   * Buyer purchase windows
   * - Global state controlled by admin
   * - Buyers can only purchase during open windows
   */
  purchaseWindows: defineTable({
    isOpen: v.boolean(),
    openedBy: v.id("users"), // Admin who opened it
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    reason: v.optional(v.string()),
    utid: v.string(), // Admin action UTID
  })
    .index("by_status", ["isOpen"]),

  /**
   * Buyer purchases
   * - Buyers never see prices
   * - Only allowed during open windows
   */
  buyerPurchases: defineTable({
    buyerId: v.id("users"),
    inventoryId: v.id("traderInventory"),
    kilos: v.number(),
    utid: v.string(),
    purchasedAt: v.number(),
    pickupSLA: v.number(), // Timestamp: 48 hours after purchase
    status: v.union(
      v.literal("pending_pickup"),
      v.literal("picked_up"),
      v.literal("expired")
    ),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_utid", ["utid"])
    .index("by_status", ["status"]),

  /**
   * Storage fee deductions
   * - Deducted in kilos, not money
   * - All deductions logged with UTIDs
   */
  storageFeeDeductions: defineTable({
    inventoryId: v.id("traderInventory"),
    traderId: v.id("users"),
    kilosDeducted: v.number(),
    ratePerDay: v.number(), // Kilos per day
    daysStored: v.number(),
    deductionUtid: v.string(),
    timestamp: v.number(),
  })
    .index("by_inventory", ["inventoryId"])
    .index("by_trader", ["traderId"])
    .index("by_utid", ["deductionUtid"]),

  /**
   * Admin actions log
   * - All admin actions must be logged
   * - Includes UTID, reason, timestamp
   */
  adminActions: defineTable({
    adminId: v.id("users"),
    actionType: v.string(),
    utid: v.string(),
    reason: v.string(),
    targetUtid: v.optional(v.string()), // UTID of the affected transaction/entity
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_admin", ["adminId"])
    .index("by_utid", ["utid"])
    .index("by_target_utid", ["targetUtid"])
    .index("by_timestamp", ["timestamp"]),

  /**
   * Notifications
   * - Internal only (no SMS/email in v1.x)
   * - Admin broadcast, role-based, UTID-specific
   */
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("admin_broadcast"),
      v.literal("role_based"),
      v.literal("utid_specific"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    utid: v.optional(v.string()), // If related to a specific transaction
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"])
    .index("by_utid", ["utid"]),

  /**
   * System settings
   * - Global system configuration
   * - Admin-controlled flags
   * - Single record (singleton pattern)
   */
  systemSettings: defineTable({
    pilotMode: v.boolean(), // When true, blocks all mutations that move money or inventory
    setBy: v.id("users"), // Admin who set this flag
    setAt: v.number(), // Timestamp when flag was set
    reason: v.string(), // Reason for setting flag
    utid: v.string(), // Admin action UTID
  }),

  /**
   * Rate limit hits log
   * - Tracks all rate limit violations
   * - Admin-visible for monitoring and investigation
   * - Used to detect spam and manipulation attempts
   */
  rateLimitHits: defineTable({
    userId: v.id("users"),
    userRole: v.union(v.literal("farmer"), v.literal("trader"), v.literal("buyer"), v.literal("admin")),
    actionType: v.string(), // e.g., "lock_unit", "create_listing", "create_purchase"
    limitType: v.string(), // e.g., "negotiations_per_hour", "listings_per_day"
    limitValue: v.number(), // The limit that was exceeded
    attemptedAt: v.number(), // Timestamp of the attempt
    windowStart: v.number(), // Start of the rate limit window
    windowEnd: v.number(), // End of the rate limit window
    currentCount: v.number(), // Current count in the window
    metadata: v.optional(v.any()), // Additional context
  })
    .index("by_user", ["userId"])
    .index("by_user_role", ["userRole"])
    .index("by_action_type", ["actionType"])
    .index("by_timestamp", ["attemptedAt"])
    .index("by_user_timestamp", ["userId", "attemptedAt"]),
});
