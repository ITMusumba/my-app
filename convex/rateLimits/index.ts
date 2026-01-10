/**
 * Rate Limiting Module - Implementation
 * 
 * Step: 4c (IMPLEMENTATION_SEQUENCE.md Step 4)
 * Status: Implementation complete
 * 
 * Context:
 * - Rate Limiting Module Specification (SPECIFICATION.md) defines requirements
 * - Rate Limiting Public Interface (types.ts, Step 4a, approved and locked)
 * - Rate Limiting Test Specification (TEST_SPECIFICATION.md, Step 4b, approved and locked)
 * - IMPLEMENTATION_BOUNDARIES.md applies
 * - MODULARITY_GUIDE.md applies
 * - INVARIANTS.md (5.3) applies
 * - architecture.md applies
 * - Utilities module (Step 1) is complete and available
 * - Error Handling module (Step 2) is complete and available
 * 
 * Purpose:
 * This file implements the Rate Limiting module functions as specified.
 * All functions are pure, deterministic, and stateless (except for database reads/writes which are required for rate limit counting and logging).
 * 
 * Rules:
 * - Implement ONLY what is defined in the public interface (types.ts)
 * - Do NOT add new exports, helpers, or overloads
 * - Do NOT redefine ErrorEnvelope or error codes
 * - All errors MUST be returned as ErrorEnvelope via Error Handling helpers
 * - Do NOT inspect or construct ErrorEnvelope directly
 * - Rate limit blocking (allowed: false) MUST NOT return ErrorEnvelope
 * - Preserve purity, determinism, and statelessness (except required database operations)
 * - No persistence beyond RateLimitHit creation
 * - No logging sinks beyond RateLimitHit
 * - No authentication, no authorization, no business logic
 * - Prefer explicit error returns over implicit behavior
 * 
 * Note: Database access is required for counting actions in windows and creating RateLimitHit entries.
 * The database context is provided by Convex runtime but is not part of the public interface.
 */

import type {
  RateLimitContext,
  RateLimitDecision,
  RateLimitEvaluationContext,
  RateLimitRecordingContext,
  RateLimitRule,
} from "./types";

import type { ErrorEnvelope } from "../errors/types";
import { createError } from "../errors/index";
import { generateUTID } from "../utils/index";
import type { DatabaseReader, DatabaseWriter } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// ============================================================================
// INPUT VALIDATION HELPERS (Internal, Pure)
// ============================================================================

/**
 * Validate RateLimitContext.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same result)
 * - Must be stateless (no internal state)
 * 
 * @param context - Rate limit context to validate
 * @returns ErrorEnvelope if invalid, null if valid
 */
function validateRateLimitContext(
  context: RateLimitContext | null | undefined
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
  const validRoles = ["farmer", "trader", "buyer", "admin"];
  if (!validRoles.includes(context.userRole)) {
    return createError(
      "VALIDATION_FAILED",
      `Invalid parameter: context.userRole must be one of: ${validRoles.join(", ")}`
    );
  }

  // Validate actionType
  if (context.actionType === null || context.actionType === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: context.actionType"
    );
  }
  if (typeof context.actionType !== "string") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: context.actionType must be a string"
    );
  }
  if (context.actionType.length === 0) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: context.actionType must not be empty"
    );
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
 * Validate RateLimitRule.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same result)
 * - Must be stateless (no internal state)
 * 
 * @param rule - Rate limit rule to validate
 * @returns ErrorEnvelope if invalid, null if valid
 */
function validateRateLimitRule(
  rule: RateLimitRule | null | undefined
): ErrorEnvelope | null {
  // Check if rule is missing
  if (rule === null || rule === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: rule"
    );
  }

  // Check if rule is not an object
  if (typeof rule !== "object") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule must be an object"
    );
  }

  // Check if rule is an array
  if (Array.isArray(rule)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule must be an object, not an array"
    );
  }

  // Validate limitType
  if (rule.limitType === null || rule.limitType === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: rule.limitType"
    );
  }
  if (typeof rule.limitType !== "string") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.limitType must be a string"
    );
  }
  if (rule.limitType.length === 0) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.limitType must not be empty"
    );
  }

  // Validate limit
  if (rule.limit === null || rule.limit === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: rule.limit"
    );
  }
  if (typeof rule.limit !== "number") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.limit must be a number"
    );
  }
  if (rule.limit < 0) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.limit must be non-negative"
    );
  }
  if (!Number.isFinite(rule.limit)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.limit must be a finite number"
    );
  }

  // Validate window
  if (rule.window === null || rule.window === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: rule.window"
    );
  }
  if (typeof rule.window !== "object") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.window must be an object"
    );
  }
  if (Array.isArray(rule.window)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.window must be an object, not an array"
    );
  }

  // Validate window.value
  if (rule.window.value === null || rule.window.value === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: rule.window.value"
    );
  }
  if (typeof rule.window.value !== "number") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.window.value must be a number"
    );
  }
  if (rule.window.value <= 0) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.window.value must be positive"
    );
  }
  if (!Number.isFinite(rule.window.value)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.window.value must be a finite number"
    );
  }

  // Validate window.unit
  if (rule.window.unit === null || rule.window.unit === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: rule.window.unit"
    );
  }
  if (typeof rule.window.unit !== "string") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: rule.window.unit must be a string"
    );
  }
  const validUnits = ["second", "minute", "hour", "day"];
  if (!validUnits.includes(rule.window.unit)) {
    return createError(
      "VALIDATION_FAILED",
      `Invalid parameter: rule.window.unit must be one of: ${validUnits.join(", ")}`
    );
  }

  // Rule is valid
  return null;
}

// ============================================================================
// WINDOW CALCULATION HELPERS (Internal, Pure)
// ============================================================================

/**
 * Calculate window boundaries from window definition and current time.
 * 
 * Requirements:
 * - Must be pure (no side effects)
 * - Must be deterministic (same inputs = same result)
 * - Must be stateless (no internal state)
 * 
 * @param window - Rate limit window definition
 * @param currentTime - Current timestamp (milliseconds since epoch)
 * @returns Window boundaries (start, end) in milliseconds
 */
function calculateWindowBoundaries(
  window: RateLimitRule["window"],
  currentTime: number
): { windowStart: number; windowEnd: number } {
  // Convert window unit to milliseconds
  const unitMultipliers: Record<string, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
  };

  const windowSizeMs = window.value * unitMultipliers[window.unit];

  // Calculate sliding window boundaries
  // Window ends at current time, starts at (current time - window size)
  const windowEnd = currentTime;
  const windowStart = currentTime - windowSizeMs;

  return { windowStart, windowEnd };
}

// ============================================================================
// ACTION COUNTING HELPERS (Internal, Requires Database)
// ============================================================================

/**
 * Count RateLimitHit entries for a user action within a window.
 * 
 * Requirements:
 * - Must query RateLimitHit table
 * - Must count entries matching userId, actionType, and window
 * - Must be deterministic (same inputs = same count, assuming same database state)
 * 
 * @param db - Database reader
 * @param userId - User ID
 * @param actionType - Action type
 * @param windowStart - Window start timestamp
 * @param windowEnd - Window end timestamp
 * @returns Count of actions in the window
 */
async function countActionsInWindow(
  db: DatabaseReader,
  userId: string,
  actionType: string,
  windowStart: number,
  windowEnd: number
): Promise<number> {
  // Query RateLimitHit entries for this user, action type, and window
  // Use by_user_timestamp index for efficient querying
  const hits = await db
    .query("rateLimitHits")
    .withIndex("by_user_timestamp", (q) =>
      q.eq("userId", userId as Id<"users">).gte("attemptedAt", windowStart)
    )
    .collect();

  // Filter by actionType and window boundaries
  const count = hits.filter(
    (hit) =>
      hit.actionType === actionType &&
      hit.attemptedAt >= windowStart &&
      hit.attemptedAt <= windowEnd
  ).length;

  return count;
}

// ============================================================================
// PUBLIC FUNCTION IMPLEMENTATIONS
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
 * - RateLimitDecision if evaluation succeeds (allowed: true if within limit, false if exceeded)
 * - ErrorEnvelope if evaluation fails due to invalid input or system error
 * 
 * Admin bypass:
 * - If userRole === "admin", allowed must be true (no rate limiting for admins)
 * 
 * NOTE: This function requires database access to count actions in windows.
 * It must be called from a Convex mutation or query that provides database context.
 * The database context and current time are provided via the Convex runtime context.
 * 
 * @param context - Rate limit evaluation context
 * @param rule - Rate limit rule to apply
 * @returns Rate limit decision or error envelope
 */
export async function evaluateRateLimit(
  ctx: RateLimitEvaluationContext,
  context: RateLimitContext,
  rule: RateLimitRule
): Promise<RateLimitDecision | ErrorEnvelope> {
  // Validate evaluation context
  if (ctx === null || ctx === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: ctx"
    );
  }
  if (typeof ctx !== "object") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx must be an object"
    );
  }
  if (Array.isArray(ctx)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx must be an object, not an array"
    );
  }
  if (ctx.db === null || ctx.db === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: ctx.db"
    );
  }
  if (ctx.now === null || ctx.now === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: ctx.now"
    );
  }
  if (typeof ctx.now !== "number") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx.now must be a number"
    );
  }
  if (ctx.now < 0) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx.now must be non-negative"
    );
  }
  if (!Number.isFinite(ctx.now)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx.now must be a finite number"
    );
  }

  // Validate context
  const contextError = validateRateLimitContext(context);
  if (contextError !== null) {
    return contextError;
  }

  // Validate rule
  const ruleError = validateRateLimitRule(rule);
  if (ruleError !== null) {
    return ruleError;
  }

  // At this point, ctx, context, and rule are validated
  const validatedContext = context as RateLimitContext;
  const validatedRule = rule as RateLimitRule;
  const validatedCtx = ctx as RateLimitEvaluationContext;

  // Admin bypass: If userRole === "admin", always allow (no rate limiting for admins)
  if (validatedContext.userRole === "admin") {
    // Calculate window boundaries for consistency (even though we're bypassing)
    const { windowStart, windowEnd } = calculateWindowBoundaries(
      validatedRule.window,
      validatedCtx.now
    );

    return {
      allowed: true,
      currentCount: 0, // Admins don't count toward limits
      limit: validatedRule.limit,
      windowStart,
      windowEnd,
    } as const;
  }

  // Calculate window boundaries
  const { windowStart, windowEnd } = calculateWindowBoundaries(
    validatedRule.window,
    validatedCtx.now
  );

  // Count actions in the window
  const currentCount = await countActionsInWindow(
    validatedCtx.db as DatabaseReader,
    validatedContext.userId,
    validatedContext.actionType,
    windowStart,
    windowEnd
  );

  // Determine if action is allowed (within limit)
  const allowed = currentCount < validatedRule.limit;

  // Return RateLimitDecision (not ErrorEnvelope for blocking)
  // Blocking (allowed: false) is distinct from error (ErrorEnvelope)
  return {
    allowed,
    currentCount,
    limit: validatedRule.limit,
    windowStart,
    windowEnd,
  } as const;
}


/**
 * Record a rate limit violation.
 * 
 * Requirements:
 * - Creates an immutable RateLimitHit entry
 * - Must not modify or delete existing entries
 * - Must be server-side only
 * - INVARIANT 5.3: RateLimitHit entries are immutable (create-only, never modify/delete)
 * 
 * Returns:
 * - void on success
 * - ErrorEnvelope on failure
 * 
 * NOTE: This function requires database access and current time to work.
 * It must be called from a Convex mutation or query that provides these via the runtime context.
 * 
 * @param context - Rate limit evaluation context
 * @param rule - Rate limit rule that was violated
 * @param decision - Decision that triggered the violation
 * @returns void on success, error envelope on failure
 */
export async function recordRateLimitHit(
  ctx: RateLimitRecordingContext,
  context: RateLimitContext,
  rule: RateLimitRule,
  decision: RateLimitDecision
): Promise<void | ErrorEnvelope> {
  // Validate recording context
  if (ctx === null || ctx === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: ctx"
    );
  }
  if (typeof ctx !== "object") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx must be an object"
    );
  }
  if (Array.isArray(ctx)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx must be an object, not an array"
    );
  }
  if (ctx.db === null || ctx.db === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: ctx.db"
    );
  }
  if (ctx.now === null || ctx.now === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: ctx.now"
    );
  }
  if (typeof ctx.now !== "number") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx.now must be a number"
    );
  }
  if (ctx.now < 0) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx.now must be non-negative"
    );
  }
  if (!Number.isFinite(ctx.now)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: ctx.now must be a finite number"
    );
  }

  // Validate context
  const contextError = validateRateLimitContext(context);
  if (contextError !== null) {
    return contextError;
  }

  // Validate rule
  const ruleError = validateRateLimitRule(rule);
  if (ruleError !== null) {
    return ruleError;
  }

  // Validate decision
  if (decision === null || decision === undefined) {
    return createError(
      "VALIDATION_FAILED",
      "Missing required parameter: decision"
    );
  }
  if (typeof decision !== "object") {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: decision must be an object"
    );
  }
  if (Array.isArray(decision)) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: decision must be an object, not an array"
    );
  }

  // Validate decision.allowed (must be false for a violation)
  if (decision.allowed !== false) {
    return createError(
      "VALIDATION_FAILED",
      "Invalid parameter: decision.allowed must be false to record a violation"
    );
  }

  // At this point, ctx, context, rule, and decision are validated
  const validatedContext = context as RateLimitContext;
  const validatedRule = rule as RateLimitRule;
  const validatedDecision = decision as RateLimitDecision;
  const validatedCtx = ctx as RateLimitRecordingContext;

  // Generate UTID for RateLimitHit entry (from Utilities module)
  const utid = generateUTID({
    entityType: "rate_limit_hit",
    timestamp: validatedCtx.now,
    additionalData: {
      userId: validatedContext.userId,
      actionType: validatedContext.actionType,
      limitType: validatedRule.limitType,
    },
  });

  // Create RateLimitHit entry (immutable audit log)
  // INVARIANT 5.3: RateLimitHit entries are immutable (create-only, never modify/delete)
  try {
    await (validatedCtx.db as DatabaseWriter).insert("rateLimitHits", {
      userId: validatedContext.userId as Id<"users">,
      userRole: validatedContext.userRole,
      actionType: validatedContext.actionType,
      limitType: validatedRule.limitType,
      limitValue: validatedRule.limit,
      attemptedAt: validatedCtx.now,
      windowStart: validatedDecision.windowStart,
      windowEnd: validatedDecision.windowEnd,
      currentCount: validatedDecision.currentCount,
      metadata: validatedContext.metadata,
    });

    // Return void on success (no data returned, per interface)
    return;
  } catch (error) {
    // Return ErrorEnvelope on failure
    return createError(
      "OPERATION_FAILED",
      `Failed to record rate limit hit: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}


// ============================================================================
// FINAL CHECK
// ============================================================================

// ============================================================================
// FINAL CHECK (REQUIRED)
// ============================================================================

/**
 * FINAL CHECK (REQUIRED):
 * 
 * ✅ Implementation matches interface exactly (signature matches Step 4a public interface)
 * ✅ All test specifications are satisfiable (functions are functional via public interface)
 * ✅ No BLOCKED capability was activated
 * ✅ Stopping after this step is safe
 * ✅ All functions preserve determinism (same inputs = same outputs, assuming same database state)
 * ✅ All functions preserve statelessness (no internal state, no caches, no counters)
 * ✅ All inputs are validated explicitly (including database context)
 * ✅ Errors are returned as ErrorEnvelope (via Error Handling helpers)
 * ✅ Rate limit blocking (allowed: false) returns RateLimitDecision, not ErrorEnvelope
 * ✅ No inspection of ErrorEnvelope internals
 * ✅ No construction of ErrorEnvelope directly
 * ✅ No imports from business logic modules
 * ✅ No business logic introduced
 * ✅ No authorization, authentication, or user management
 * ✅ No persistence beyond RateLimitHit creation
 * ✅ INVARIANT 5.3 enforced (RateLimitHit entries are immutable, create-only)
 * ✅ Admin bypass implemented (userRole === "admin" always allows)
 * ✅ Window calculation is pure and deterministic
 * ✅ Action counting uses database queries (required for rate limiting)
 * ✅ Database context explicitly required (not ambient, matches interface)
 */
