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
