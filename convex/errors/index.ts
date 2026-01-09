/**
 * Error Handling Module - Implementation
 * 
 * Step: 2c (IMPLEMENTATION_SEQUENCE.md Step 2)
 * Status: Implementation complete
 * 
 * Context:
 * - Error Handling Module Specification (SPECIFICATION.md) defines requirements
 * - Error Handling Public Interface (types.ts, Step 2a, approved and locked)
 * - Error Handling Test Specification (TEST_SPECIFICATION.md, Step 2b, approved and locked)
 * - IMPLEMENTATION_BOUNDARIES.md applies
 * - MODULARITY_GUIDE.md applies
 * - INVARIANTS.md (indirect support only)
 * 
 * Purpose:
 * This file implements the Error Handling module functions as specified.
 * All functions are pure, deterministic, and stateless.
 * 
 * Rules:
 * - Implement ONLY what is defined in the public interface (types.ts)
 * - Do NOT introduce new exports, types, functions, or error codes
 * - Do NOT introduce business logic, retries, masking, filtering, or recovery
 * - Do NOT introduce authorization checks, persistence, or network calls
 * - Do NOT implement logging sinks
 * - Do NOT import from any other module
 * - Preserve purity, determinism, and statelessness at all times
 * - Prefer explicit failure over implicit behavior
 */

import type {
  ErrorCode,
  ErrorEnvelope,
  ErrorMetadata,
} from "./types";

// ============================================================================
// ERROR CLASS IMPLEMENTATIONS
// ============================================================================

/**
 * Error thrown when a required parameter is missing.
 * 
 * Requirements:
 * - Must extend Error
 * - Must accept optional message parameter
 * - Must set name property to "MissingParameterError"
 */
export class MissingParameterError extends Error {
  constructor(message?: string) {
    super(message || "Missing required parameter");
    this.name = "MissingParameterError";
  }
}

/**
 * Error thrown when a parameter is invalid (wrong type, invalid value, etc.).
 * 
 * Requirements:
 * - Must extend Error
 * - Must accept optional message parameter
 * - Must set name property to "InvalidParameterError"
 */
export class InvalidParameterError extends Error {
  constructor(message?: string) {
    super(message || "Invalid parameter");
    this.name = "InvalidParameterError";
  }
}

/**
 * Error thrown when non-deterministic behavior is detected.
 * 
 * Requirements:
 * - Must extend Error
 * - Must accept optional message parameter
 * - Must set name property to "DeterminismViolationError"
 */
export class DeterminismViolationError extends Error {
  constructor(message?: string) {
    super(message || "Determinism violation");
    this.name = "DeterminismViolationError";
  }
}

// ============================================================================
// ERROR ENVELOPE CREATION
// ============================================================================

/**
 * Create a standardized error envelope.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same error)
 * - Must be stateless (no internal state)
 * - Must create immutable error envelopes
 * - Must validate inputs explicitly
 * 
 * @param code - Machine-readable error code
 * @param message - Human-readable error message
 * @param metadata - Optional non-sensitive context
 * @returns Standardized error envelope
 * @throws MissingParameterError if code or message is missing
 * @throws InvalidParameterError if code or message is invalid
 */
export function createError(
  code: ErrorCode,
  message: string,
  metadata?: ErrorMetadata
): ErrorEnvelope {
  // Validate code parameter
  if (code === null || code === undefined) {
    throw new MissingParameterError("Missing required parameter: code");
  }
  if (typeof code !== "string") {
    throw new InvalidParameterError("Invalid parameter: code must be a string");
  }
  if (code.length === 0) {
    throw new InvalidParameterError("Invalid parameter: code must not be empty");
  }

  // Validate message parameter
  if (message === null || message === undefined) {
    throw new MissingParameterError("Missing required parameter: message");
  }
  if (typeof message !== "string") {
    throw new InvalidParameterError("Invalid parameter: message must be a string");
  }
  if (message.length === 0) {
    throw new InvalidParameterError("Invalid parameter: message must not be empty");
  }

  // Validate metadata parameter (if provided)
  if (metadata !== undefined) {
    if (metadata === null) {
      throw new InvalidParameterError("Invalid parameter: metadata must not be null");
    }
    if (typeof metadata !== "object") {
      throw new InvalidParameterError("Invalid parameter: metadata must be an object");
    }
    // Check if metadata is an array (arrays are objects in JavaScript)
    if (Array.isArray(metadata)) {
      throw new InvalidParameterError("Invalid parameter: metadata must be an object, not an array");
    }
  }

  // Create immutable error envelope
  // userMessage is the same as message (per specification)
  const errorDetail = {
    code: code as ErrorCode,
    message: message,
    userMessage: message,
    ...(metadata !== undefined ? { metadata: metadata as ErrorMetadata } : {}),
  } as const;

  return {
    error: errorDetail,
  } as const;
}

// ============================================================================
// ERROR CREATION HELPER FUNCTIONS
// ============================================================================

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
export function createPilotModeError(): ErrorEnvelope {
  return createError(
    "PILOT_MODE_ACTIVE",
    "System is in pilot mode. Money-moving operations are blocked."
  );
}

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
export function createRateLimitError(): ErrorEnvelope {
  return createError(
    "RATE_LIMIT_EXCEEDED",
    "Rate limit exceeded for this operation."
  );
}

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
 * @throws MissingParameterError if message is missing
 * @throws InvalidParameterError if message is invalid
 */
export function createValidationError(message: string): ErrorEnvelope {
  // Validate message parameter
  if (message === null || message === undefined) {
    throw new MissingParameterError("Missing required parameter: message");
  }
  if (typeof message !== "string") {
    throw new InvalidParameterError("Invalid parameter: message must be a string");
  }
  if (message.length === 0) {
    throw new InvalidParameterError("Invalid parameter: message must not be empty");
  }

  return createError(
    "VALIDATION_FAILED",
    message
  );
}

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
export function createAuthorizationError(): ErrorEnvelope {
  return createError(
    "NOT_AUTHORIZED",
    "Not authorized for this operation."
  );
}

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
 * @throws MissingParameterError if resource is missing
 * @throws InvalidParameterError if resource is invalid
 */
export function createNotFoundError(resource: string): ErrorEnvelope {
  // Validate resource parameter
  if (resource === null || resource === undefined) {
    throw new MissingParameterError("Missing required parameter: resource");
  }
  if (typeof resource !== "string") {
    throw new InvalidParameterError("Invalid parameter: resource must be a string");
  }
  if (resource.length === 0) {
    throw new InvalidParameterError("Invalid parameter: resource must not be empty");
  }

  // Use fixed error code (no business logic, no inference, no transformation)
  return createError(
    "LISTING_NOT_FOUND",
    `${resource} not found.`
  );
}

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
export function createInsufficientCapitalError(): ErrorEnvelope {
  return createError(
    "INSUFFICIENT_CAPITAL",
    "Insufficient available capital for this operation."
  );
}

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
 * @throws MissingParameterError if type is missing
 * @throws InvalidParameterError if type is invalid
 */
export function createSLAExpiredError(
  type: "delivery" | "pickup"
): ErrorEnvelope {
  // Validate type parameter
  if (type === null || type === undefined) {
    throw new MissingParameterError("Missing required parameter: type");
  }
  if (type !== "delivery" && type !== "pickup") {
    throw new InvalidParameterError(
      `Invalid parameter: type must be "delivery" or "pickup", got "${type}"`
    );
  }

  // Use fixed error code and message based on type (no conditional message derivation)
  // Error code selection is required by interface (type parameter determines code)
  // Message is static and literal (no semantic interpretation)
  const errorCode: ErrorCode = type === "delivery" 
    ? "DELIVERY_SLA_EXPIRED" 
    : "PICKUP_SLA_EXPIRED";
  
  // Static message (no conditional derivation, no semantic interpretation)
  return createError(errorCode, "SLA expired.");
}

// ============================================================================
// FINAL CHECK
// ============================================================================

/**
 * FINAL CHECK (REQUIRED):
 * 
 * ✅ Implementation matches interface exactly
 * ✅ All test specifications are satisfiable
 * ✅ No BLOCKED capability was activated
 * ✅ Stopping after this step is safe
 * ✅ All functions are pure (no side effects)
 * ✅ All functions are deterministic (same inputs = same outputs)
 * ✅ All functions are stateless (no internal state)
 * ✅ All error envelopes are immutable (readonly, const)
 * ✅ All inputs are validated explicitly
 * ✅ No imports from other modules
 * ✅ No business logic introduced
 * ✅ No logging sinks implemented
 * ✅ No error severity levels implemented
 * ✅ No error transformation or filtering
 * ✅ No retries, masking, or recovery
 * ✅ No authorization checks, persistence, or network calls
 * ✅ No environment variables, time, randomness, or global state
 */
