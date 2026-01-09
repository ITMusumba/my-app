/**
 * Authorization Module - Public Interface Only
 * 
 * Step: 3a (IMPLEMENTATION_SEQUENCE.md Step 3a)
 * Status: Public interface only (no implementations, no logic, no side effects)
 * Authority: Single human (CEO / Engineering Lead / CTO)
 * 
 * Context:
 * - Authorization Module Specification (SPECIFICATION.md) defines requirements
 * - IMPLEMENTATION_BOUNDARIES.md defines coding constraints
 * - INVARIANTS.md (2.1, 2.2, 2.3) defines authorization invariants
 * - MODULARITY_GUIDE.md defines module boundaries
 * - architecture.md defines trust boundaries
 * 
 * Purpose: This file defines the public interface for the Authorization module.
 * This includes types, interfaces, and function signatures ONLY.
 * No implementations, no logic, no side effects.
 * 
 * Rules:
 * - Types, interfaces, and function signatures ONLY
 * - No implementations
 * - No logic
 * - No side effects
 * - No imports from other modules (Error Handling types referenced conceptually)
 * - No default values
 * - No runtime assumptions
 * 
 * BLOCKED Notes:
 * - Role assignment: BLOCKED (Authorization checks roles, does not assign them)
 * - Authentication: BLOCKED (Authorization is separate from authentication)
 * - Role inference: BLOCKED FOR PRODUCTION (must use explicit role field)
 */

// ============================================================================
// 1. Role Types
// ============================================================================

/**
 * User role types (from DOMAIN_MODEL.md and convex/schema.ts).
 * 
 * Requirements:
 * - Must be explicit string literals (not inferred)
 * - Must match schema definition exactly
 * - Must be immutable (once defined, cannot change)
 * - Must not be inferred from email prefix (BLOCKED FOR PRODUCTION)
 * 
 * From DOMAIN_MODEL.md:
 * - farmer: User can create listings
 * - trader: User can deposit capital and lock units
 * - buyer: User can purchase inventory
 * - admin: User can verify deliveries, reverse transactions, control purchase window
 */
export type UserRole =
  | "farmer"
  | "trader"
  | "buyer"
  | "admin";

// ============================================================================
// 2. Authorization Context
// ============================================================================

/**
 * Authorization context metadata shape.
 * 
 * Requirements:
 * - Must be non-sensitive (no passwords, tokens, user real identities)
 * - Must be JSON-serializable
 * - Must be immutable (once created, cannot be modified)
 * - Must be optional (not required for all authorization checks)
 */
export type AuthorizationContextMetadata = {
  readonly [key: string]: unknown;
};

/**
 * Authorization context input structure.
 * 
 * Requirements:
 * - User ID: Required user identifier (non-sensitive, alias or system ID)
 * - User role: Required user role (explicit, not inferred)
 * - Operation: Optional operation identifier (non-sensitive)
 * - Resource: Optional resource identifier (non-sensitive)
 * - Metadata: Optional additional context (non-sensitive)
 * 
 * Constraints:
 * - Must not contain sensitive information (passwords, tokens, real identities)
 * - Must not infer role (role must be explicit)
 * - Must not contain authentication data (authentication is separate)
 */
export type AuthorizationContext = {
  readonly userId: string;
  readonly userRole: UserRole;
  readonly operation?: string;
  readonly resource?: string;
  readonly metadata?: AuthorizationContextMetadata;
};

// ============================================================================
// 3. Authorization Decision Result
// ============================================================================

/**
 * Authorization decision result structure.
 * 
 * Requirements:
 * - Allowed: Boolean indicating if operation is allowed
 * - Reason: Optional human-readable reason for decision
 * - Metadata: Optional non-sensitive context
 * 
 * Constraints:
 * - Must be deterministic (same inputs = same decision)
 * - Must be pure (no side effects)
 * - Must be immutable (once created, cannot be modified)
 */
export type AuthorizationDecision = {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly metadata?: AuthorizationContextMetadata;
};

// ============================================================================
// 4. Error Surface (Using Error Handling Types Conceptually)
// ============================================================================

/**
 * Error envelope type reference (from Error Handling module).
 * 
 * Note: The actual ErrorEnvelope type is defined in the Error Handling module
 * (convex/errors/types.ts). Authorization module will import and use this type.
 * 
 * Authorization failures must return ErrorEnvelope (from Error Handling module).
 * Error messages must not expose sensitive information.
 * 
 * This is a conceptual reference for interface clarity only.
 * The actual type will be imported during implementation.
 */
// Type reference (conceptual, actual type imported from Error Handling module)
// import type { ErrorEnvelope } from "../errors/types";

/**
 * Authorization-related error codes are defined in the Error Handling module:
 * - NOT_AUTHORIZED: Not authorized for operation
 * - NOT_ADMIN: Requires admin privileges
 * - INVALID_ROLE: User role mismatch
 * 
 * These codes are part of AuthorizationErrorCode union type in Error Handling module.
 * Authorization module must consume these codes, never redefine them.
 * 
 * No type alias. No union. No shadow definition.
 */

// ============================================================================
// 5. Authorization Function Signatures
// ============================================================================

/**
 * Error envelope type reference (for return type).
 * 
 * Note: The actual ErrorEnvelope type is imported from Error Handling module.
 * This is a conceptual reference for the return type signature.
 * 
 * 🔒 LOCKED: ErrorEnvelope is intentionally opaque at the Authorization interface level.
 * 
 * The Authorization module treats ErrorEnvelope as a pass-through error surface owned
 * entirely by the Error Handling module. No fields may be accessed, inspected, or
 * constructed here except via Error Handling helpers.
 * 
 * This prevents:
 * - Structural coupling between Authorization and Error Handling modules
 * - Error introspection creep (Authorization logic branching on error internals)
 * - Authorization module constructing ErrorEnvelope directly (must use Error Handling helpers)
 * 
 * ErrorEnvelope is a black box to Authorization module. Authorization module:
 * - Returns ErrorEnvelope from Error Handling module (via helpers)
 * - Does NOT inspect ErrorEnvelope structure
 * - Does NOT construct ErrorEnvelope directly
 * - Does NOT access ErrorEnvelope fields
 * 
 * This is a deliberate design decision, not a placeholder. The opacity is intentional
 * and preserves module independence.
 */
// Type reference (conceptual, actual type imported from Error Handling module)
// import type { ErrorEnvelope } from "../errors/types";
type ErrorEnvelope = unknown; // Intentionally opaque - Authorization module does not inspect or construct ErrorEnvelope

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
export declare function authorize(
  context: AuthorizationContext,
  requiredRole: UserRole
): AuthorizationDecision | ErrorEnvelope;

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
export declare function verifyAdminRole(
  context: AuthorizationContext
): AuthorizationDecision | ErrorEnvelope;

// ============================================================================
// 6. Explicit Error Types (for Misuse Cases)
// ============================================================================

/**
 * Error type for missing required parameters.
 * 
 * This error type is used when required parameters are missing.
 * No implementation is provided here (interface only).
 * 
 * Note: Actual error types are from Error Handling module.
 * This is a conceptual reference for interface clarity.
 */
export declare class MissingParameterError extends Error {
  constructor(message?: string);
}

/**
 * Error type for invalid parameters.
 * 
 * This error type is used when parameters are invalid.
 * No implementation is provided here (interface only).
 * 
 * Note: Actual error types are from Error Handling module.
 * This is a conceptual reference for interface clarity.
 */
export declare class InvalidParameterError extends Error {
  constructor(message?: string);
}

// ============================================================================
// 7. BLOCKED Interface Decisions
// ============================================================================

/**
 * BLOCKED: Role Assignment
 * 
 * Role assignment is FORBIDDEN.
 * Authorization module checks roles, does not assign them.
 * 
 * Reason: Authorization is separate from role assignment (User Management responsibility).
 */

/**
 * BLOCKED: Authentication
 * 
 * Authentication is FORBIDDEN.
 * Authorization module does not verify user credentials.
 * 
 * Reason: Authorization is separate from authentication (authentication is BLOCKED - VISION.md BLOCKED #1).
 */

/**
 * BLOCKED: Role Inference
 * 
 * Role inference from email prefix is BLOCKED FOR PRODUCTION.
 * Authorization module must use explicit role field, not inferred roles.
 * 
 * Reason: Role inference from email prefix is BLOCKED FOR PRODUCTION (DOMAIN_MODEL.md, BUSINESS_LOGIC.md).
 */

/**
 * BLOCKED: Permission Inference
 * 
 * Permission inference is FORBIDDEN.
 * Authorization module must use explicit permissions, not inferred permissions.
 * 
 * Reason: Permissions must be explicit, not inferred from context or business rules.
 */

/**
 * BLOCKED: Business Rules
 * 
 * Business rules are FORBIDDEN.
 * Authorization module does not implement business logic.
 * 
 * Reason: Authorization is infrastructure, not business logic.
 */

/**
 * BLOCKED: Data Persistence
 * 
 * Data persistence is FORBIDDEN.
 * Authorization module does not create, modify, or delete entities.
 * 
 * Reason: Authorization checks access, does not modify data.
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
 * ✅ All function signatures are defined (no bodies)
 * ✅ All BLOCKED decisions are explicitly marked
 * ✅ No imports from other modules (Error Handling types referenced conceptually)
 * ✅ No default values
 * ✅ No runtime assumptions
 * ✅ Role types are explicit (not inferred)
 * ✅ Authorization context is explicit (not inferred)
 * ✅ Authorization decisions are explicit (allow/deny outcomes)
 * ✅ Error surface uses Error Handling types (conceptually referenced)
 */
