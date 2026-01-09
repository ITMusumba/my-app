/**
 * Authorization Module - Implementation
 * 
 * Step: 3c (IMPLEMENTATION_SEQUENCE.md Step 3)
 * Status: Implementation complete
 * 
 * Context:
 * - Authorization Module Specification (SPECIFICATION.md) defines requirements
 * - Authorization Public Interface (types.ts, Step 3a, approved and locked)
 * - Authorization Test Specification (TEST_SPECIFICATION.md, Step 3b, approved and locked)
 * - IMPLEMENTATION_BOUNDARIES.md applies
 * - MODULARITY_GUIDE.md applies
 * - INVARIANTS.md (2.1, 2.2, 2.3) applies
 * - architecture.md applies
 * - Error Handling module (Step 2) is complete and available
 * 
 * Purpose:
 * This file implements the Authorization module functions as specified.
 * All functions are pure, deterministic, and stateless.
 * 
 * Rules:
 * - Implement ONLY what is defined in the public interface (types.ts)
 * - Do NOT add new exports, helpers, or overloads
 * - Do NOT redefine ErrorEnvelope or error codes
 * - All errors MUST be returned as ErrorEnvelope via Error Handling helpers
 * - Do NOT inspect or construct ErrorEnvelope directly
 * - Authorization denial (allowed: false) MUST NOT return ErrorEnvelope
 * - Preserve purity, determinism, and statelessness
 * - No persistence, no logging sinks, no network calls
 * - No authentication, no role assignment, no inference
 * - Prefer explicit error returns over implicit behavior
 */

import type {
  AuthorizationContext,
  AuthorizationDecision,
  UserRole,
} from "./types";

import type { ErrorEnvelope } from "../errors/types";
import { createError } from "../errors/index";

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
 * 
 * NOTE: This class is exported for interface compatibility (declared in types.ts).
 * It is never thrown by this module - all errors are returned as ErrorEnvelope.
 * This is an interface-compatibility artifact.
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
 * 
 * NOTE: This class is exported for interface compatibility (declared in types.ts).
 * It is never thrown by this module - all errors are returned as ErrorEnvelope.
 * This is an interface-compatibility artifact.
 */
export class InvalidParameterError extends Error {
  constructor(message?: string) {
    super(message || "Invalid parameter");
    this.name = "InvalidParameterError";
  }
}

// ============================================================================
// INPUT VALIDATION HELPERS (Internal, Pure)
// ============================================================================

/**
 * Validate AuthorizationContext.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same result)
 * - Must be stateless (no internal state)
 * 
 * @param context - Authorization context to validate
 * @returns ErrorEnvelope if invalid, null if valid
 */
function validateAuthorizationContext(
  context: AuthorizationContext | null | undefined
): ErrorEnvelope | null {
  // Check if context is missing
  if (context === null || context === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: context"
    );
  }

  // Check if context is not an object
  if (typeof context !== "object") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: context must be an object"
    );
  }

  // Check if context is an array (arrays are objects in JavaScript)
  if (Array.isArray(context)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: context must be an object, not an array"
    );
  }

  // Validate userId
  if (context.userId === null || context.userId === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: context.userId"
    );
  }
  if (typeof context.userId !== "string") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: context.userId must be a string"
    );
  }
  if (context.userId.length === 0) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: context.userId must not be empty"
    );
  }

  // Validate userRole
  if (context.userRole === null || context.userRole === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: context.userRole"
    );
  }
  if (typeof context.userRole !== "string") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: context.userRole must be a string"
    );
  }
  // Validate userRole is a valid UserRole
  const validRoles: UserRole[] = ["farmer", "trader", "buyer", "admin"];
  if (!validRoles.includes(context.userRole as UserRole)) {
    return createError(
      "INVALID_ROLE",
      `Invalid parameter: context.userRole must be one of: ${validRoles.join(", ")}`
    );
  }

  // Validate optional operation (if present)
  if (context.operation !== undefined) {
    if (context.operation === null) {
      return createError(
        "VALIDATION_FAILED",
        "Invalid parameter: context.operation must not be null"
      );
    }
    if (typeof context.operation !== "string") {
      return createError(
        "VALIDATION_FAILED",
        "Invalid parameter: context.operation must be a string"
      );
    }
  }

  // Validate optional resource (if present)
  if (context.resource !== undefined) {
    if (context.resource === null) {
      return createError(
        "VALIDATION_FAILED",
        "Invalid parameter: context.resource must not be null"
      );
    }
    if (typeof context.resource !== "string") {
      return createError(
        "VALIDATION_FAILED",
        "Invalid parameter: context.resource must be a string"
      );
    }
  }

  // Validate optional metadata (if present)
  if (context.metadata !== undefined) {
    if (context.metadata === null) {
      return createError(
        "VALIDATION_FAILED",
        "Invalid parameter: context.metadata must not be null"
      );
    }
    if (typeof context.metadata !== "object") {
      return createError(
        "VALIDATION_FAILED",
        "Invalid parameter: context.metadata must be an object"
      );
    }
    if (Array.isArray(context.metadata)) {
      return createError(
        "VALIDATION_FAILED",
        "Invalid parameter: context.metadata must be an object, not an array"
      );
    }
  }

  // Context is valid
  return null;
}

/**
 * Validate requiredRole parameter.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same result)
 * - Must be stateless (no internal state)
 * 
 * @param requiredRole - Required role to validate
 * @returns ErrorEnvelope if invalid, null if valid
 */
function validateRequiredRole(
  requiredRole: UserRole | null | undefined
): ErrorEnvelope | null {
  // Check if requiredRole is missing
  if (requiredRole === null || requiredRole === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: requiredRole"
    );
  }

  // Check if requiredRole is not a string
  if (typeof requiredRole !== "string") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: requiredRole must be a string"
    );
  }

  // Validate requiredRole is a valid UserRole
  const validRoles: UserRole[] = ["farmer", "trader", "buyer", "admin"];
  if (!validRoles.includes(requiredRole)) {
    return createError(
      "INVALID_ROLE",
      `Invalid parameter: requiredRole must be one of: ${validRoles.join(", ")}`
    );
  }

  // RequiredRole is valid
  return null;
}

// ============================================================================
// AUTHORIZATION FUNCTION IMPLEMENTATIONS
// ============================================================================

/**
 * Perform general authorization check.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same result)
 * - Must be stateless (no internal state)
 * - Must not assign roles (only checks roles)
 * - Must not persist data (only returns decision)
 * - Must enforce INVARIANT 2.1 (Server-Side Authorization Enforcement)
 * 
 * Returns:
 * - AuthorizationDecision if authorization check succeeds (allowed: true if authorized, false if denied)
 * - ErrorEnvelope if authorization check fails due to invalid input or system error
 * 
 * @param context - Authorization context (userId, userRole, operation, resource, metadata)
 * @param requiredRole - Required role for operation
 * @returns Authorization decision or error envelope
 */
export function authorize(
  context: AuthorizationContext,
  requiredRole: UserRole
): AuthorizationDecision | ErrorEnvelope {
  // Validate context
  const contextError = validateAuthorizationContext(context);
  if (contextError !== null) {
    return contextError;
  }

  // Validate requiredRole
  const roleError = validateRequiredRole(requiredRole);
  if (roleError !== null) {
    return roleError;
  }

  // At this point, context and requiredRole are validated
  // TypeScript narrowing: context is non-null and has valid userRole
  const validatedContext = context as AuthorizationContext;
  const validatedRole = requiredRole as UserRole;

  // Perform authorization check (pure, deterministic, stateless)
  // INVARIANT 2.1: Server-Side Authorization Enforcement (enforced by server-side execution)
  const allowed = validatedContext.userRole === validatedRole;

  // Return AuthorizationDecision (not ErrorEnvelope for denial)
  // Denial (allowed: false) is distinct from error (ErrorEnvelope)
  return {
    allowed,
    reason: allowed
      ? undefined
      : `User role '${validatedContext.userRole}' does not match required role '${validatedRole}'`,
  } as const;
}

/**
 * Verify user has admin role.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same result)
 * - Must be stateless (no internal state)
 * - Must not assign roles (only checks roles)
 * - Must not persist data (only returns decision)
 * - Must enforce INVARIANT 2.2 (Admin Role Verification)
 * 
 * Returns:
 * - AuthorizationDecision if admin role verification succeeds (allowed: true if userRole === "admin", false otherwise)
 * - ErrorEnvelope if admin role verification fails due to invalid input or system error
 * 
 * @param context - Authorization context (userId, userRole, operation, resource, metadata)
 * @returns Authorization decision or error envelope
 */
export function verifyAdminRole(
  context: AuthorizationContext
): AuthorizationDecision | ErrorEnvelope {
  // Validate context
  const contextError = validateAuthorizationContext(context);
  if (contextError !== null) {
    return contextError;
  }

  // At this point, context is validated
  // TypeScript narrowing: context is non-null and has valid userRole
  const validatedContext = context as AuthorizationContext;

  // Perform admin role verification (pure, deterministic, stateless)
  // INVARIANT 2.2: Admin Role Verification (enforced by server-side execution)
  const allowed = validatedContext.userRole === "admin";

  // Return AuthorizationDecision (not ErrorEnvelope for denial)
  // Denial (allowed: false) is distinct from error (ErrorEnvelope)
  return {
    allowed,
    reason: allowed
      ? undefined
      : `User role '${validatedContext.userRole}' is not admin`,
  } as const;
}

// ============================================================================
// FINAL CHECK
// ============================================================================

// ============================================================================
// OBSERVATIONS (Recorded, Non-Blocking)
// ============================================================================

/**
 * OBSERVATION 1: Error Code Usage
 * 
 * This module uses "VALIDATION_FAILED" for all validation errors (missing/invalid parameters).
 * 
 * Error Handling taxonomy includes:
 * - "VALIDATION_FAILED": Validation failed (used by this module)
 * - "MISSING_PARAMETER": Required parameter is missing (exists but not used)
 * - "INVALID_PARAMETER": Parameter is invalid (exists but not used)
 * - "INVALID_ROLE": User role mismatch (used by this module)
 * 
 * Rationale: "VALIDATION_FAILED" is a valid ValidationErrorCode and is appropriate
 * for all validation failures (missing parameters, invalid parameters, invalid types).
 * This is acceptable as "VALIDATION_FAILED" exists in the Error Handling taxonomy.
 * 
 * Status: ACCEPTABLE - "VALIDATION_FAILED" is a valid error code in Error Handling module.
 */

/**
 * OBSERVATION 2: Error Classes Are Interface-Compatibility Artifacts
 * 
 * MissingParameterError and InvalidParameterError are implemented but never thrown.
 * 
 * Rationale:
 * - These classes are declared in the public interface (types.ts)
 * - Tests do not require throwing these classes
 * - All errors are correctly returned as ErrorEnvelope
 * - These classes are exported for interface compatibility only
 * 
 * Status: ACCEPTABLE - Interface-compatibility artifacts. May be removed later if interface evolves.
 */

// ============================================================================
// FINAL CHECK (REQUIRED)
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
 * ✅ All authorization decisions are immutable (readonly, const)
 * ✅ All inputs are validated explicitly
 * ✅ Errors are returned as ErrorEnvelope (via Error Handling helpers)
 * ✅ Authorization denial (allowed: false) returns AuthorizationDecision, not ErrorEnvelope
 * ✅ No inspection of ErrorEnvelope internals
 * ✅ No construction of ErrorEnvelope directly
 * ✅ No imports from other modules (except Error Handling and types)
 * ✅ No business logic introduced
 * ✅ No role assignment, inference, or authentication
 * ✅ No persistence or side effects
 * ✅ INVARIANT 2.1 enforced (server-side authorization)
 * ✅ INVARIANT 2.2 enforced (admin role verification)
 * ✅ INVARIANT 2.3 enforced (explicit role usage, no inference)
 * ✅ Error code usage verified ("VALIDATION_FAILED" is valid)
 * ✅ Error classes documented as interface-compatibility artifacts
 */
