/**
 * Error Handling Module - Public Interface Only
 * 
 * Step: 2a (IMPLEMENTATION_SEQUENCE.md Step 2a)
 * Status: Public interface only (no implementations, no logic, no side effects)
 * Authority: Single human (CEO / Engineering Lead / CTO)
 * 
 * Context:
 * - Error Handling Module Specification (SPECIFICATION.md) defines requirements
 * - IMPLEMENTATION_BOUNDARIES.md defines coding constraints
 * - INVARIANTS.md defines non-negotiable constraints
 * - MODULARITY_GUIDE.md defines module boundaries
 * 
 * Purpose: This file defines the public interface for the Error Handling module.
 * This includes types, interfaces, and error code definitions ONLY.
 * No implementations, no logic, no side effects, no imports from other modules.
 * 
 * Rules:
 * - Types, interfaces, and error code definitions ONLY
 * - No implementations
 * - No logic
 * - No side effects
 * - No imports from other modules
 * - No default values
 * - No runtime assumptions
 * 
 * BLOCKED Notes:
 * - Error severity levels: NOT DEFINED (specification does not require severity levels)
 * - Logging sink implementation: BLOCKED (contract only, no implementation)
 */

// ============================================================================
// 1. Error Envelope Structure
// ============================================================================

/**
 * Error metadata shape.
 * 
 * Requirements:
 * - Must be non-sensitive (no passwords, tokens, user identities)
 * - Must be JSON-serializable
 * - Must be immutable (once created, cannot be modified)
 * - Must be optional (not required for all errors)
 */
export type ErrorMetadata = {
  readonly [key: string]: unknown;
};

/**
 * Error detail structure within the error envelope.
 * 
 * Requirements:
 * - Error code: Machine-readable string identifier (required)
 * - Error message: Human-readable error message (required)
 * - User message: User-facing error message (required, same as message for now)
 * - Metadata: Optional non-sensitive context (optional)
 */
export type ErrorDetail = {
  readonly code: ErrorCode;
  readonly message: string;
  readonly userMessage: string;
  readonly metadata?: ErrorMetadata;
};

/**
 * Standardized error envelope structure.
 * 
 * Requirements:
 * - Must be JSON-serializable
 * - Must be deterministic (same error = same envelope)
 * - Must be immutable (once created, cannot be modified)
 * - Must not expose sensitive information
 * - Must be pure (no side effects in creation)
 */
export type ErrorEnvelope = {
  readonly error: ErrorDetail;
};

// ============================================================================
// 2. Error Code Taxonomy
// ============================================================================

/**
 * Error code categories (from Error Handling Module Specification).
 * 
 * Category 1: System State Errors
 * Category 2: Rate Limiting Errors
 * Category 3: Financial Errors
 * Category 4: Availability Errors
 * Category 5: SLA Errors
 * Category 6: Authorization Errors
 * Category 7: Validation Errors
 * Category 8: State Errors
 * Category 9: Operation Errors
 */

/**
 * System State Error Codes
 * 
 * - PILOT_MODE_ACTIVE: System is in pilot mode (money-moving operations blocked)
 * - PURCHASE_WINDOW_CLOSED: Purchase window is not open
 * - SYSTEM_ERROR: Internal system error (non-recoverable)
 */
export type SystemStateErrorCode =
  | "PILOT_MODE_ACTIVE"
  | "PURCHASE_WINDOW_CLOSED"
  | "SYSTEM_ERROR";

/**
 * Rate Limiting Error Codes
 * 
 * - RATE_LIMIT_EXCEEDED: Rate limit exceeded for operation
 */
export type RateLimitingErrorCode = "RATE_LIMIT_EXCEEDED";

/**
 * Financial Error Codes
 * 
 * - SPEND_CAP_EXCEEDED: Trader spend cap exceeded
 * - INSUFFICIENT_CAPITAL: Insufficient available capital
 * - INSUFFICIENT_PROFIT: Insufficient profit balance
 * - INVALID_AMOUNT: Invalid amount specified
 */
export type FinancialErrorCode =
  | "SPEND_CAP_EXCEEDED"
  | "INSUFFICIENT_CAPITAL"
  | "INSUFFICIENT_PROFIT"
  | "INVALID_AMOUNT";

/**
 * Availability Error Codes
 * 
 * - UNIT_NOT_AVAILABLE: Unit no longer available
 * - INVENTORY_NOT_AVAILABLE: Inventory no longer available
 * - LISTING_NOT_FOUND: Listing not found
 * - UNIT_NOT_FOUND: Unit not found
 * - INVENTORY_NOT_FOUND: Inventory not found
 */
export type AvailabilityErrorCode =
  | "UNIT_NOT_AVAILABLE"
  | "INVENTORY_NOT_AVAILABLE"
  | "LISTING_NOT_FOUND"
  | "UNIT_NOT_FOUND"
  | "INVENTORY_NOT_FOUND";

/**
 * SLA Error Codes
 * 
 * - DELIVERY_SLA_EXPIRED: Delivery deadline passed
 * - PICKUP_SLA_EXPIRED: Pickup deadline passed
 */
export type SLAErrorCode = "DELIVERY_SLA_EXPIRED" | "PICKUP_SLA_EXPIRED";

/**
 * Authorization Error Codes
 * 
 * - NOT_AUTHORIZED: Not authorized for operation
 * - NOT_ADMIN: Requires admin privileges
 * - INVALID_ROLE: User role mismatch
 */
export type AuthorizationErrorCode =
  | "NOT_AUTHORIZED"
  | "NOT_ADMIN"
  | "INVALID_ROLE";

/**
 * Validation Error Codes
 * 
 * - INVALID_KILOS: Invalid kilos specified
 * - VALIDATION_FAILED: Validation failed
 * - MISSING_PARAMETER: Required parameter is missing
 * - INVALID_PARAMETER: Parameter is invalid
 */
export type ValidationErrorCode =
  | "INVALID_KILOS"
  | "VALIDATION_FAILED"
  | "MISSING_PARAMETER"
  | "INVALID_PARAMETER";

/**
 * State Error Codes
 * 
 * - ALREADY_LOCKED: Unit already locked
 * - ALREADY_VERIFIED: Already verified
 * - USER_NOT_FOUND: User account not found
 */
export type StateErrorCode =
  | "ALREADY_LOCKED"
  | "ALREADY_VERIFIED"
  | "USER_NOT_FOUND";

/**
 * Operation Error Codes
 * 
 * - OPERATION_FAILED: Operation failed (generic)
 */
export type OperationErrorCode = "OPERATION_FAILED";

/**
 * Union of all error codes.
 * 
 * Requirements:
 * - Error codes must be string constants (UPPER_SNAKE_CASE)
 * - Error codes must be immutable (once defined, cannot change)
 * - Error codes must be machine-readable (for programmatic handling)
 */
export type ErrorCode =
  | SystemStateErrorCode
  | RateLimitingErrorCode
  | FinancialErrorCode
  | AvailabilityErrorCode
  | SLAErrorCode
  | AuthorizationErrorCode
  | ValidationErrorCode
  | StateErrorCode
  | OperationErrorCode;

// ============================================================================
// 3. Error Severity Levels
// ============================================================================

/**
 * Error severity levels.
 * 
 * BLOCKED: Error severity levels are NOT DEFINED in the Error Handling Module
 * Specification. The specification does not require severity levels.
 * 
 * If severity levels are needed in the future, they must be:
 * - Explicitly defined in the specification
 * - Re-authorized before implementation
 * - Not inferred or invented
 */
// BLOCKED: Error severity levels not defined in specification

// ============================================================================
// 4. Error Context (for Logging)
// ============================================================================

/**
 * Error context metadata shape.
 * 
 * Requirements:
 * - Must be non-sensitive (no passwords, tokens, user real identities)
 * - Must be JSON-serializable
 * - Must be immutable (once created, cannot be modified)
 * - Must be optional (not required for all errors)
 */
export type ErrorContextMetadata = {
  readonly [key: string]: unknown;
};

/**
 * Error context structure for logging.
 * 
 * Requirements:
 * - UTID: Optional UTID if available (from Utilities module)
 * - User ID: Optional user ID alias if available (non-sensitive, alias only)
 * - Action: Optional action that caused error (non-sensitive)
 * - Timestamp: Required timestamp when error occurred (milliseconds since epoch)
 * - Metadata: Optional additional context (non-sensitive)
 */
export type ErrorContext = {
  readonly utid?: string;
  readonly userId?: string;
  readonly action?: string;
  readonly timestamp: number;
  readonly metadata?: ErrorContextMetadata;
};

// ============================================================================
// 5. Error Logging Contract (Interface Only, No Implementation)
// ============================================================================

/**
 * Error logging contract interface.
 * 
 * Requirements:
 * - Logging contract must be an interface (no implementation)
 * - Logging contract must be pure (no side effects in contract definition)
 * - Logging contract must be stateless (no internal state)
 * - Logging contract must be independently testable
 * 
 * What Must Be Logged:
 * - Error code (required)
 * - Error message (required)
 * - Error context (optional, if available)
 * - Timestamp (required)
 * - UTID (optional, if available from Utilities module)
 * 
 * What Must NOT Be Logged:
 * - Sensitive information (passwords, tokens, user identities)
 * - Internal system state (stack traces, internal variables)
 * - User real identities (email addresses, real names)
 * 
 * Logging Sink:
 * - Logging sink is NOT defined by this module (implementation detail)
 * - Logging sink is provided by calling code (database, file, network, etc.)
 * - Logging contract defines interface, not implementation
 */
export interface ErrorLogger {
  /**
   * Log an error with optional context.
   * 
   * Requirements:
   * - Must accept error envelope (standardized error structure)
   * - Must accept optional error context (UTID, user ID alias, action, timestamp, metadata)
   * - Must not expose sensitive information
   * - Must not modify error envelope or context
   * - Must be pure (no side effects in contract definition)
   * 
   * @param error - Standardized error envelope
   * @param context - Optional error context (UTID, user ID alias, action, timestamp, metadata)
   */
  logError(error: ErrorEnvelope, context?: ErrorContext): void;
}

// ============================================================================
// 6. Error Creation Helper Function Signatures
// ============================================================================

/**
 * Create a standardized error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelopes
 * 
 * @param code - Machine-readable error code
 * @param message - Human-readable error message
 * @param metadata - Optional non-sensitive context
 * @returns Standardized error envelope
 */
export declare function createError(
  code: ErrorCode,
  message: string,
  metadata?: ErrorMetadata
): ErrorEnvelope;

/**
 * Create a pilot mode error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelope with PILOT_MODE_ACTIVE code
 * 
 * @returns Standardized error envelope with PILOT_MODE_ACTIVE code
 */
export declare function createPilotModeError(): ErrorEnvelope;

/**
 * Create a rate limit error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelope with RATE_LIMIT_EXCEEDED code
 * 
 * @returns Standardized error envelope with RATE_LIMIT_EXCEEDED code
 */
export declare function createRateLimitError(): ErrorEnvelope;

/**
 * Create a validation error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelope with validation error code
 * 
 * @param message - Human-readable validation error message
 * @returns Standardized error envelope with validation error code
 */
export declare function createValidationError(message: string): ErrorEnvelope;

/**
 * Create an authorization error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelope with authorization error code
 * 
 * @returns Standardized error envelope with authorization error code
 */
export declare function createAuthorizationError(): ErrorEnvelope;

/**
 * Create a not found error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelope with not found error code
 * 
 * @param resource - Resource type that was not found (e.g., "listing", "unit", "inventory")
 * @returns Standardized error envelope with not found error code
 */
export declare function createNotFoundError(resource: string): ErrorEnvelope;

/**
 * Create an insufficient capital error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelope with INSUFFICIENT_CAPITAL code
 * 
 * @returns Standardized error envelope with INSUFFICIENT_CAPITAL code
 */
export declare function createInsufficientCapitalError(): ErrorEnvelope;

/**
 * Create an SLA expired error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create standardized error envelope with SLA expired error code
 * 
 * @param type - SLA type ("delivery" or "pickup")
 * @returns Standardized error envelope with SLA expired error code
 */
export declare function createSLAExpiredError(
  type: "delivery" | "pickup"
): ErrorEnvelope;

// ============================================================================
// 7. Explicit Error Types (for Misuse Cases)
// ============================================================================

/**
 * Error type for missing required parameters.
 * 
 * This error type is used when required parameters are missing.
 * No implementation is provided here (interface only).
 */
export declare class MissingParameterError extends Error {
  constructor(message?: string);
}

/**
 * Error type for invalid parameters.
 * 
 * This error type is used when parameters are invalid.
 * No implementation is provided here (interface only).
 */
export declare class InvalidParameterError extends Error {
  constructor(message?: string);
}

/**
 * Error type for non-deterministic behavior violations.
 * 
 * This error type is used when non-deterministic behavior is detected.
 * No implementation is provided here (interface only).
 */
export declare class DeterminismViolationError extends Error {
  constructor(message?: string);
}

// ============================================================================
// 8. BLOCKED Interface Decisions
// ============================================================================

/**
 * BLOCKED: Error severity levels
 * 
 * Error severity levels are NOT DEFINED in the Error Handling Module Specification.
 * The specification does not require severity levels.
 * 
 * If severity levels are needed in the future:
 * - They must be explicitly defined in the specification
 * - They must be re-authorized before implementation
 * - They must not be inferred or invented
 */

/**
 * BLOCKED: Logging sink implementation
 * 
 * Logging sink implementation is BLOCKED (contract only, no implementation).
 * The Error Handling module defines logging contracts, not implementations.
 * 
 * Logging sink must be provided by calling code (database, file, network, etc.).
 */

/**
 * BLOCKED: Error transformation or filtering
 * 
 * Error transformation or filtering is FORBIDDEN.
 * Errors must be preserved as-is, not transformed or filtered.
 * 
 * Reason: Error handling must preserve error truth, not modify it.
 */

// ============================================================================
// Final Check
// ============================================================================

/**
 * FINAL CHECK (REQUIRED):
 * 
 * ✅ No logic exists yet
 * ✅ No side effects are possible
 * ✅ This file can compile but cannot run meaningful behavior
 * ✅ This separation protects system invariants
 * ✅ All types are explicitly defined
 * ✅ All interfaces are contracts only (no implementations)
 * ✅ All error codes are defined as types (no values yet)
 * ✅ All helper functions are signatures only (no bodies)
 * ✅ All BLOCKED decisions are explicitly marked
 * ✅ No imports from other modules
 * ✅ No default values
 * ✅ No runtime assumptions
 */
