/**
 * System Constants
 * 
 * All non-negotiable system limits and rules
 */

/**
 * Maximum trader exposure in UGX
 * Includes: capital committed + locked orders + inventory value
 */
export const MAX_TRADER_EXPOSURE_UGX = 1_000_000;

/**
 * Unit sizes
 */
export const LISTING_UNIT_SIZE_KG = 10; // Farmers list in 10kg units
export const BUYER_BLOCK_SIZE_KG = 100; // Traders aggregate into 100kg blocks

/**
 * Time-based SLAs (in milliseconds)
 */
export const FARMER_DELIVERY_SLA_MS = 6 * 60 * 60 * 1000; // 6 hours
export const BUYER_PICKUP_SLA_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Storage fee rates (set by admin, in kilos per day)
 * Default: 0.5 kilos per day per 100kg block
 */
export const DEFAULT_STORAGE_FEE_RATE_KG_PER_DAY = 0.5;

/**
 * Rate limits (soft limits per role)
 * - These are soft limits to discourage spam and manipulation
 * - Exceeding limits fails gracefully with logged rate limit hits
 * - Limits can be adjusted by admin via system settings
 */
export const RATE_LIMITS = {
  // Trader limits
  TRADER_NEGOTIATIONS_PER_HOUR: 20, // Max unit locks per hour
  TRADER_WALLET_OPERATIONS_PER_HOUR: 10, // Max deposits/withdrawals per hour
  
  // Farmer limits
  FARMER_LISTINGS_PER_DAY: 10, // Max listings created per day
  
  // Buyer limits
  BUYER_PURCHASES_PER_HOUR: 5, // Max purchases per hour
} as const;

/**
 * Pilot Mode: Shared Password for All Test Users
 * ⚠️ PILOT ONLY - This is NOT secure for production
 * All test users share this password during pilot phase
 */
export const PILOT_SHARED_PASSWORD = "Farm2Market2024";
