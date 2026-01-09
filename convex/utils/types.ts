/**
 * Utilities Module - Public Interface Only
 * 
 * Step: 1a (IMPLEMENTATION_SEQUENCE.md Step 1)
 * Status: Interface definition only (no implementation)
 * 
 * Context:
 * - convex/utils/README.md defines the full specification
 * - IMPLEMENTATION_BOUNDARIES.md applies
 * - INVARIANTS.md (4.1, 4.2, 6.1, 6.2) apply
 * 
 * Purpose:
 * This file defines ONLY the public interface (types, interfaces, function signatures).
 * This file does NOT contain implementations, logic, or behavior.
 * 
 * Rules:
 * - No function bodies
 * - No logic
 * - No constants with values
 * - No default parameters
 * - No imports from other modules
 * - No access to time, randomness, or global state
 * - No side effects
 * - No assumptions about runtime environment
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Context for UTID generation.
 * 
 * Required for: generateUTID function
 * Supports: INVARIANT 4.1 (UTID Immutability), INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)
 */
export type UTIDGenerationContext = {
  /**
   * Type of entity for which UTID is generated.
   * Examples: "listing", "transaction", "admin_action", "wallet_ledger", etc.
   * 
   * Required: Yes
   * Type: string
   * Validation: Must not be empty
   */
  entityType: string;

  /**
   * Timestamp for UTID generation (milliseconds since epoch).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative, must be passed as parameter (not accessed from global state)
   */
  timestamp: number;

  /**
   * Optional additional data for uniqueness.
   * 
   * Required: No
   * Type: object | undefined
   * Validation: If provided, must be an object
   */
  additionalData?: Record<string, unknown>;
};

/**
 * Data for exposure calculation.
 * 
 * Required for: calculateExposure function
 * Supports: INVARIANT 6.1 (Trader Exposure Limit Enforcement), INVARIANT 6.2 (Exposure Calculation Atomicity)
 */
export type ExposureCalculationData = {
  /**
   * Capital currently committed in locked units (UGX).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative
   */
  capitalCommitted: number;

  /**
   * Value of locked orders (UGX).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative
   */
  lockedOrders: number;

  /**
   * Value of inventory in storage (UGX).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative
   */
  inventoryValue: number;
};

/**
 * Result of exposure calculation.
 * 
 * Returned by: calculateExposure function
 * Supports: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
 */
export type ExposureCalculationResult = {
  /**
   * Total exposure: capitalCommitted + lockedOrders + inventoryValue (UGX).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative
   */
  totalExposure: number;

  /**
   * True if totalExposure > 1,000,000, false otherwise.
   * 
   * Required: Yes
   * Type: boolean
   */
  exceedsLimit: boolean;

  /**
   * Exposure limit: 1,000,000 (UGX).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be exactly 1,000,000
   */
  limit: number;

  /**
   * Remaining capacity: limit - totalExposure (UGX), minimum 0.
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative, maximum limit
   */
  remainingCapacity: number;
};

/**
 * Result of exposure validation.
 * 
 * Returned by: validateExposureLimit function
 * Supports: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
 */
export type ExposureValidationResult = {
  /**
   * True if exposure <= 1,000,000, false otherwise.
   * 
   * Required: Yes
   * Type: boolean
   */
  isValid: boolean;

  /**
   * True if exposure > 1,000,000, false otherwise.
   * 
   * Required: Yes
   * Type: boolean
   */
  exceedsLimit: boolean;

  /**
   * Exposure limit: 1,000,000 (UGX).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be exactly 1,000,000
   */
  limit: number;

  /**
   * Excess: exposure - limit (UGX), minimum 0.
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative
   */
  excess: number;
};

/**
 * Result of SLA calculation.
 * 
 * Returned by: calculateFarmerDeliverySLA, calculateBuyerPickupSLA functions
 * Supports: Business logic (not an invariant)
 */
export type SLACalculationResult = {
  /**
   * Deadline timestamp (milliseconds since epoch).
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative
   */
  deadline: number;

  /**
   * SLA duration in hours.
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be positive (6 for farmer delivery, 48 for buyer pickup)
   */
  slaHours: number;

  /**
   * True if current time > deadline, false otherwise.
   * 
   * Required: Yes
   * Type: boolean
   * Note: Current time must be passed as parameter (not accessed from global state)
   */
  isExpired: boolean;

  /**
   * Time remaining until deadline (milliseconds), minimum 0.
   * 
   * Required: Yes
   * Type: number
   * Validation: Must be non-negative
   */
  timeRemaining: number;
};

// ============================================================================
// FUNCTION SIGNATURES
// ============================================================================

/**
 * Generate a unique, deterministic UTID (Unique Transaction ID).
 * 
 * Contract: Pure function, deterministic, stateless, no side effects
 * Supports: INVARIANT 4.1 (UTID Immutability), INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)
 * 
 * Requirements:
 * - Must be deterministic (same inputs = same UTID)
 * - Must be unique (different inputs = different UTID)
 * - Must be immutable (UTID cannot be modified after generation)
 * - Must be pure (no side effects)
 * - Must be stateless (no internal state)
 * 
 * Failure Conditions:
 * - If context is missing: throw MissingParameterError
 * - If entityType is missing: throw MissingParameterError
 * - If timestamp is missing: throw MissingParameterError
 * - If UTID generation fails: throw UTIDGenerationError
 * 
 * @param context - Context for UTID generation (entityType, timestamp, optional additionalData)
 * @returns UTID string (unique, deterministic, immutable identifier)
 * @throws MissingParameterError if required parameters are missing
 * @throws InvalidParameterError if parameters are invalid
 * @throws DeterminismViolationError if UTID generation is non-deterministic
 */
export declare function generateUTID(
  context: UTIDGenerationContext
): string;

/**
 * Calculate trader exposure and verify it does not exceed UGX 1,000,000.
 * 
 * Contract: Pure function, deterministic, stateless, no side effects
 * Supports: INVARIANT 6.1 (Trader Exposure Limit Enforcement), INVARIANT 6.2 (Exposure Calculation Atomicity)
 * 
 * Requirements:
 * - Must be deterministic (same inputs = same output)
 * - Must be pure (no side effects)
 * - Must be stateless (no internal state)
 * - Must enforce exposure limit (UGX 1,000,000 maximum)
 * - Must calculate all components (capital committed + locked orders + inventory value)
 * 
 * Failure Conditions:
 * - If exposureData is missing: throw MissingParameterError
 * - If capitalCommitted is missing or negative: throw InvalidParameterError
 * - If lockedOrders is missing or negative: throw InvalidParameterError
 * - If inventoryValue is missing or negative: throw InvalidParameterError
 * - If any component is not a number: throw InvalidParameterError
 * 
 * @param exposureData - Exposure calculation data (capitalCommitted, lockedOrders, inventoryValue)
 * @returns Exposure calculation result (totalExposure, exceedsLimit, limit, remainingCapacity)
 * @throws MissingParameterError if required parameters are missing
 * @throws InvalidParameterError if parameters are invalid
 * @throws DeterminismViolationError if exposure calculation is non-deterministic
 */
export declare function calculateExposure(
  exposureData: ExposureCalculationData
): ExposureCalculationResult;

/**
 * Validate that exposure does not exceed UGX 1,000,000 limit.
 * 
 * Contract: Pure function, deterministic, stateless, no side effects
 * Supports: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
 * 
 * Requirements:
 * - Must be deterministic (same input = same output)
 * - Must be pure (no side effects)
 * - Must be stateless (no internal state)
 * - Must enforce exposure limit (UGX 1,000,000 maximum)
 * 
 * Failure Conditions:
 * - If exposure is missing: throw MissingParameterError
 * - If exposure is not a number: throw InvalidParameterError
 * - If exposure is negative: throw InvalidParameterError
 * 
 * @param exposure - Total exposure to validate (UGX)
 * @returns Exposure validation result (isValid, exceedsLimit, limit, excess)
 * @throws MissingParameterError if exposure is missing
 * @throws InvalidParameterError if exposure is invalid
 */
export declare function validateExposureLimit(
  exposure: number
): ExposureValidationResult;

/**
 * Calculate farmer delivery deadline (6 hours from lock time).
 * 
 * Contract: Pure function, deterministic, stateless, no side effects
 * Supports: Business logic (not an invariant)
 * 
 * Requirements:
 * - Must be deterministic (same input = same output, if current time is passed as parameter)
 * - Must be pure (no side effects)
 * - Must be stateless (no internal state)
 * - Must calculate 6 hours from lock time
 * 
 * Failure Conditions:
 * - If lockTime is missing: throw MissingParameterError
 * - If lockTime is not a number: throw InvalidParameterError
 * - If lockTime is negative: throw InvalidParameterError
 * - If lockTime is in the future: throw InvalidParameterError (if validation is required)
 * 
 * @param lockTime - Timestamp when unit was locked (milliseconds since epoch)
 * @returns SLA calculation result (deadline, slaHours, isExpired, timeRemaining)
 * @throws MissingParameterError if lockTime is missing
 * @throws InvalidParameterError if lockTime is invalid
 * @throws DeterminismViolationError if SLA calculation is non-deterministic
 */
export declare function calculateFarmerDeliverySLA(
  lockTime: number
): SLACalculationResult;

/**
 * Calculate buyer pickup deadline (48 hours from purchase time).
 * 
 * Contract: Pure function, deterministic, stateless, no side effects
 * Supports: Business logic (not an invariant)
 * 
 * BLOCKED: Buyer purchase function is NOT IMPLEMENTED (BLOCKED).
 * This function may not be used until purchase function is implemented.
 * 
 * Requirements:
 * - Must be deterministic (same input = same output, if current time is passed as parameter)
 * - Must be pure (no side effects)
 * - Must be stateless (no internal state)
 * - Must calculate 48 hours from purchase time
 * 
 * Failure Conditions:
 * - If purchaseTime is missing: throw MissingParameterError
 * - If purchaseTime is not a number: throw InvalidParameterError
 * - If purchaseTime is negative: throw InvalidParameterError
 * - If purchaseTime is in the future: throw InvalidParameterError (if validation is required)
 * 
 * @param purchaseTime - Timestamp when inventory was purchased (milliseconds since epoch)
 * @returns SLA calculation result (deadline, slaHours, isExpired, timeRemaining)
 * @throws MissingParameterError if purchaseTime is missing
 * @throws InvalidParameterError if purchaseTime is invalid
 * @throws DeterminismViolationError if SLA calculation is non-deterministic
 */
export declare function calculateBuyerPickupSLA(
  purchaseTime: number
): SLACalculationResult;

// ============================================================================
// ERROR TYPE DEFINITIONS (Names Only, No Implementations)
// ============================================================================

/**
 * Error thrown when a required parameter is missing.
 * 
 * Used by: All utility functions
 * 
 * Examples:
 * - generateUTID() without context → MissingParameterError
 * - calculateExposure() without exposureData → MissingParameterError
 * - validateExposureLimit() without exposure → MissingParameterError
 * 
 * Note: This is a type declaration only. Implementation is not provided.
 */
export declare class MissingParameterError extends Error {
  constructor(message?: string);
}

/**
 * Error thrown when a parameter is invalid (wrong type, negative value, etc.).
 * 
 * Used by: All utility functions
 * 
 * Examples:
 * - calculateExposure({ capitalCommitted: -100 }) → InvalidParameterError
 * - validateExposureLimit("invalid") → InvalidParameterError
 * - calculateFarmerDeliverySLA(-1) → InvalidParameterError
 * 
 * Note: This is a type declaration only. Implementation is not provided.
 */
export declare class InvalidParameterError extends Error {
  constructor(message?: string);
}

/**
 * Error thrown when a function behaves non-deterministically.
 * 
 * Used by: All utility functions
 * 
 * Examples:
 * - Function produces different outputs for same inputs → DeterminismViolationError
 * - Function accesses non-deterministic state (time, randomness) → DeterminismViolationError
 * - Function maintains internal state that affects output → DeterminismViolationError
 * 
 * Note: This is a type declaration only. Implementation is not provided.
 * 
 * Supports: INVARIANT 4.1 (UTID Immutability requires deterministic UTID generation),
 *          INVARIANT 4.2 (All Meaningful Actions Generate UTIDs requires deterministic UTIDs),
 *          INVARIANT 6.1 (Trader Exposure Limit Enforcement requires deterministic exposure calculation),
 *          INVARIANT 6.2 (Exposure Calculation Atomicity requires deterministic exposure calculation)
 */
export declare class DeterminismViolationError extends Error {
  constructor(message?: string);
}

// ============================================================================
// CONTRACT ENFORCEMENT NOTES
// ============================================================================

/**
 * All functions in this module are explicitly pure by contract:
 * - No side effects (no database access, no logging, no network calls)
 * - No external state (no global variables, no environment variables)
 * - No non-deterministic behavior (no random number generation, no current time access)
 * - Stateless (no internal state, no caching)
 * 
 * All parameters must be explicit:
 * - No optional parameters unless specified in contract
 * - No default values unless specified in contract
 * - No inferred types
 * 
 * All functions must fail explicitly:
 * - Missing parameters → throw explicit error
 * - Invalid parameters → throw explicit error
 * - Calculation failures → throw explicit error
 * - No silent failures
 * 
 * BLOCKED Capabilities:
 * - calculateBuyerPickupSLA: BLOCKED (buyer purchase function NOT IMPLEMENTED)
 * 
 * This file can compile but cannot run meaningful behavior (no implementations).
 * This separation protects invariants by ensuring:
 * - Functions are pure (no side effects that could violate invariants)
 * - Functions are deterministic (same inputs = same outputs, preserving invariant consistency)
 * - Functions are stateless (no state that could be corrupted)
 * - Functions are independently testable (invariants can be verified in isolation)
 */
