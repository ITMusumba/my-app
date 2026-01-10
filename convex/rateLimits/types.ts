/**
 * Rate Limiting Module - Public Interface Only
 *
 * Step: 4a (IMPLEMENTATION_SEQUENCE.md Step 4a)
 * Status: Public interface only (no implementations, no logic, no side effects)
 * Authority: Single human (CEO / Engineering Lead / CTO)
 *
 * Context:
 * - Rate Limiting Module Specification (SPECIFICATION.md) defines requirements
 * - IMPLEMENTATION_BOUNDARIES.md defines coding constraints
 * - INVARIANTS.md (5.3) defines rate limiting invariants
 * - MODULARITY_GUIDE.md defines module boundaries
 * - architecture.md defines trust boundaries
 *
 * Purpose:
 * This file defines the public interface for the Rate Limiting module.
 * It includes types, interfaces, and function signatures ONLY.
 *
 * Rules:
 * - Types, interfaces, and function signatures ONLY
 * - No implementations
 * - No logic
 * - No side effects
 * - No imports from business logic modules
 * - Error Handling types referenced conceptually only
 * - No default values
 * - No runtime assumptions
 *
 * BLOCKED Notes:
 * - Authorization: BLOCKED (rate limiting is independent of authorization)
 * - Authentication: BLOCKED (authentication not implemented)
 * - User management: BLOCKED (read-only user context only)
 */

// ============================================================================
// 1. Rate Limit Context Types
// ============================================================================

/**
 * Rate limit context metadata.
 *
 * Requirements:
 * - Must be non-sensitive
 * - Must be JSON-serializable
 * - Must be immutable
 */
export type RateLimitMetadata = {
  readonly [key: string]: unknown;
};

/**
 * Rate limit evaluation context.
 *
 * Requirements:
 * - userId: Required user identifier
 * - userRole: Required explicit user role
 * - actionType: Required action identifier
 * - metadata: Optional non-sensitive metadata
 *
 * Constraints:
 * - No authentication data
 * - No inferred fields
 * - Must be provided by calling code
 */
export type RateLimitContext = {
  readonly userId: string;
  readonly userRole: "farmer" | "trader" | "buyer" | "admin";
  readonly actionType: string;
  readonly metadata?: RateLimitMetadata;
};

// ============================================================================
// 2. Rate Limit Configuration Types
// ============================================================================

/**
 * Rate limit window definition.
 *
 * Example (conceptual):
 * - value: 1
 * - unit: "hour"
 *
 * No defaults.
 */
export type RateLimitWindow = {
  readonly value: number;
  readonly unit: "second" | "minute" | "hour" | "day";
};

/**
 * Rate limit rule definition.
 *
 * Requirements:
 * - limit: Maximum allowed count
 * - window: Time window definition
 * - limitType: Explicit identifier for the limit
 */
export type RateLimitRule = {
  readonly limitType: string;
  readonly limit: number;
  readonly window: RateLimitWindow;
};

// ============================================================================
// 3. Rate Limit Evaluation Result
// ============================================================================

/**
 * Rate limit decision result.
 *
 * Requirements:
 * - allowed: Explicit allow / block decision
 * - currentCount: Count within the window
 * - limit: Configured limit
 * - windowStart: Window start timestamp
 * - windowEnd: Window end timestamp
 *
 * Constraints:
 * - Immutable
 * - Deterministic
 * - No side effects
 */
export type RateLimitDecision = {
  readonly allowed: boolean;
  readonly currentCount: number;
  readonly limit: number;
  readonly windowStart: number;
  readonly windowEnd: number;
};

// ============================================================================
// 4. Database Context Types
// ============================================================================

/**
 * Database reader type reference (from Convex).
 *
 * This type is intentionally opaque at this boundary.
 * Rate Limiting module uses it for database queries but does not construct it.
 */
// import type { DatabaseReader } from "../_generated/server";
type DatabaseReader = unknown;

/**
 * Database writer type reference (from Convex).
 *
 * This type is intentionally opaque at this boundary.
 * Rate Limiting module uses it for database writes but does not construct it.
 */
// import type { DatabaseWriter } from "../_generated/server";
type DatabaseWriter = unknown;

/**
 * Rate limit evaluation context (database and time).
 *
 * Requirements:
 * - db: Database reader for querying RateLimitHit entries
 * - now: Current timestamp (milliseconds since epoch)
 * - Must be provided by calling code (Convex mutations/queries)
 *
 * Constraints:
 * - No default values
 * - Must be provided explicitly
 * - Database context is required for rate limiting to function
 */
export type RateLimitEvaluationContext = {
  readonly db: DatabaseReader;
  readonly now: number;
};

/**
 * Rate limit recording context (database and time).
 *
 * Requirements:
 * - db: Database writer for creating RateLimitHit entries
 * - now: Current timestamp (milliseconds since epoch)
 * - Must be provided by calling code (Convex mutations/queries)
 *
 * Constraints:
 * - No default values
 * - Must be provided explicitly
 * - Database context is required for rate limiting to function
 */
export type RateLimitRecordingContext = {
  readonly db: DatabaseWriter;
  readonly now: number;
};

// ============================================================================
// 5. Error Surface (Conceptual Reference Only)
// ============================================================================

/**
 * ErrorEnvelope reference (from Error Handling module).
 *
 * This type is intentionally opaque at this boundary.
 * Rate Limiting module must not inspect or construct ErrorEnvelope directly.
 */
// import type { ErrorEnvelope } from "../errors/types";
type ErrorEnvelope = unknown;

// ============================================================================
// 6. Public Function Signatures
// ============================================================================

/**
 * Evaluate rate limit for a user action.
 *
 * Requirements:
 * - Pure (no side effects beyond database reads)
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state)
 * - Server-side only
 *
 * Returns:
 * - RateLimitDecision if evaluation succeeds
 * - ErrorEnvelope if evaluation fails due to invalid input or system error
 *
 * Admin bypass:
 * - If userRole === "admin", allowed must be true
 *
 * @param ctx - Rate limit evaluation context (database and time)
 * @param context - Rate limit evaluation context (user and action)
 * @param rule - Rate limit rule to apply
 */
export declare function evaluateRateLimit(
  ctx: RateLimitEvaluationContext,
  context: RateLimitContext,
  rule: RateLimitRule
): Promise<RateLimitDecision | ErrorEnvelope>;

/**
 * Record a rate limit violation.
 *
 * Requirements:
 * - Creates an immutable RateLimitHit entry
 * - Must not modify or delete existing entries
 * - Must be server-side only
 *
 * Returns:
 * - void on success
 * - ErrorEnvelope on failure
 *
 * @param ctx - Rate limit recording context (database and time)
 * @param context - Rate limit evaluation context (user and action)
 * @param rule - Rate limit rule that was violated
 * @param decision - Decision that triggered the violation
 */
export declare function recordRateLimitHit(
  ctx: RateLimitRecordingContext,
  context: RateLimitContext,
  rule: RateLimitRule,
  decision: RateLimitDecision
): Promise<void | ErrorEnvelope>;

// ============================================================================
// FINAL CHECK
// ============================================================================

/**
 * FINAL CHECK (REQUIRED):
 *
 * ✅ Types and interfaces only
 * ✅ No implementations
 * ✅ No logic
 * ✅ No side effects
 * ✅ No runtime assumptions
 * ✅ ErrorEnvelope treated as opaque
 * ✅ Database context types are opaque (from Convex)
 * ✅ Explicit admin bypass documented
 * ✅ RateLimitHit immutability preserved
 * ✅ Database context explicitly required (not ambient)
 * ✅ No authorization, authentication, or business logic
 * ✅ All BLOCKED areas explicitly respected
 */
