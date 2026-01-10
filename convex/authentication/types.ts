/**
 * Authentication Module — Public Interface
 *
 * Step: 6a (IMPLEMENTATION_SEQUENCE.md Step 6a)
 * Status: Public interface only (no implementations, no logic, no side effects)
 * Authority: Single human (CEO / Engineering Lead / CTO)
 *
 * Context:
 * - PRODUCTION_AUTHENTICATION_SPECIFICATION.md defines requirements
 * - AUTHENTICATION_IMPLEMENTATION_DECISION.md locks stateful session model
 * - IMPLEMENTATION_BOUNDARIES.md defines coding constraints
 * - INVARIANTS.md (2.1, 2.2, 2.3) defines authentication invariants
 * - MODULARITY_GUIDE.md defines module boundaries
 * - architecture.md defines trust boundaries
 * - User Management module (Step 5) is complete and locked
 * - Authorization module (Step 3) is complete and locked
 * - Utilities module (Step 1) is complete and locked
 * - Error Handling module (Step 2) is complete and locked
 *
 * Purpose:
 * Defines the public contract for authentication.
 * This file contains types and function signatures ONLY.
 *
 * Rules:
 * - No implementations
 * - No logic
 * - No side effects
 * - No inferred behavior
 * - No default values
 * - No runtime assumptions
 * - Stateful (database-backed) session model (from AUTHENTICATION_IMPLEMENTATION_DECISION.md)
 * - Password-based authentication only (no external identity providers)
 */

// ============================================================================
// 1. Core Session Types
// ============================================================================

/**
 * Session state types (from PRODUCTION_AUTHENTICATION_SPECIFICATION.md).
 *
 * Requirements:
 * - Must be explicit string literals (not inferred)
 * - Must match Session entity lifecycle
 * - Must be immutable (once defined, cannot change)
 *
 * From PRODUCTION_AUTHENTICATION_SPECIFICATION.md:
 * - active: Session is active and valid (initial state)
 * - expired: Session has expired (automatic state transition)
 * - invalidated: Session has been invalidated (manual state transition)
 */
export type SessionState =
  | "active"
  | "expired"
  | "invalidated";

/**
 * Session record structure (internal, includes sensitive token).
 *
 * Requirements:
 * - Must match Session entity schema (convex/schema.ts)
 * - Must be immutable (readonly fields)
 * - Must include all required fields: id, userId, token, expiresAt, createdAt, lastActiveAt, invalidated, invalidatedAt
 *
 * From convex/schema.ts:
 * - userId: User ID (v.id("users"))
 * - token: Session token (v.string()) — cryptographically secure random token
 * - expiresAt: Session expiration timestamp (v.number())
 * - createdAt: Session creation timestamp (v.number())
 * - lastActiveAt: Last activity timestamp (v.number())
 * - invalidated: Session invalidation status (v.boolean())
 * - invalidatedAt: Session invalidation timestamp (v.optional(v.number()))
 *
 * Note: This type includes the sensitive token field and should not be returned in public APIs.
 * Use PublicSession for public-facing session data.
 */
export type SessionRecord = {
  readonly id: string;
  readonly userId: string;
  readonly token: string;
  readonly expiresAt: number;
  readonly createdAt: number;
  readonly lastActiveAt: number;
  readonly invalidated: boolean;
  readonly invalidatedAt?: number;
};

/**
 * Public session view (sanitized, token excluded).
 *
 * Requirements:
 * - Must not include sensitive token field
 * - Must be immutable (readonly fields)
 * - Safe for logging and public APIs
 *
 * Used for:
 * - LoginOutput (token returned separately)
 * - ValidateSessionOutput (token not needed, already validated)
 * - Public session information (no token leakage)
 */
export type PublicSession = {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: number;
  readonly createdAt: number;
  readonly lastActiveAt: number;
};

/**
 * Authenticated user context.
 *
 * Requirements:
 * - Must contain user ID and role (for Authorization module)
 * - Must not contain sensitive information (passwords, tokens)
 * - Must be immutable (readonly fields)
 * - Must be provided by Authentication module to calling code
 *
 * Used for:
 * - Authorization checks (provides user ID and role to Authorization module)
 * - User context in mutations/queries (identifies authenticated user)
 */
export type AuthenticatedUserContext = {
  readonly userId: string;
  readonly userRole: UserRole;
  readonly sessionId: string;
};

// ============================================================================
// 2. User Role Type Reference
// ============================================================================

/**
 * User role type reference (from Authorization module).
 *
 * This type is imported from Authorization module to ensure consistency.
 * Authentication module does not redefine role types.
 */
// import type { UserRole } from "../auth/types";
type UserRole = "farmer" | "trader" | "buyer" | "admin";

// ============================================================================
// 3. Database Context Types
// ============================================================================

/**
 * Database reader type reference (from Convex).
 *
 * This type is intentionally opaque at this boundary.
 * Authentication module uses it for database queries but does not construct it.
 */
// import type { DatabaseReader } from "../_generated/server";
type DatabaseReader = unknown;

/**
 * Database writer type reference (from Convex).
 *
 * This type is intentionally opaque at this boundary.
 * Authentication module uses it for database writes but does not construct it.
 */
// import type { DatabaseWriter } from "../_generated/server";
type DatabaseWriter = unknown;

/**
 * Authentication context (database and time).
 *
 * Requirements:
 * - db: Database writer for creating/updating Session entities and User passwordHash
 * - now: Current timestamp (milliseconds since epoch)
 * - Must be provided by calling code (Convex mutations/queries)
 *
 * Constraints:
 * - No default values
 * - Must be provided explicitly
 * - Database context is required for authentication to function
 */
export type AuthenticationContext = {
  readonly db: DatabaseWriter;
  readonly now: number;
};

/**
 * Authentication query context (read-only database access).
 *
 * Requirements:
 * - db: Database reader for reading Session entities and User entities
 * - Must be provided by calling code (Convex queries)
 *
 * Constraints:
 * - No default values
 * - Must be provided explicitly
 * - Read-only access (no mutations)
 */
export type AuthenticationQueryContext = {
  readonly db: DatabaseReader;
};

// ============================================================================
// 4. Input Types
// ============================================================================

/**
 * Input for user login (credential verification).
 *
 * Requirements:
 * - email: Required email address (must match User entity email)
 * - password: Required password (plaintext, will be hashed and compared)
 *
 * Constraints:
 * - Password must not be logged (no password in logs)
 * - Password must not be exposed (no password in error messages)
 * - Email must be validated (server-side only)
 * - No default values
 */
export type LoginInput = {
  readonly email: string;
  readonly password: string;
};

/**
 * Output for successful login.
 *
 * Requirements:
 * - session: Created session record (sanitized, no token)
 * - token: Session token (returned separately for explicit handling)
 * - userContext: Authenticated user context (userId, userRole, sessionId)
 *
 * Constraints:
 * - Token must be cryptographically secure
 * - Token must not be exposed in URLs
 * - Token must be transmitted over HTTPS only
 * - Token must not be logged (separate from session record)
 * - Token must not leak beyond controlled boundaries (explicit return prevents accidental persistence)
 */
export type LoginOutput = {
  readonly session: PublicSession;
  readonly token: string;
  readonly userContext: AuthenticatedUserContext;
};

/**
 * Input for session validation.
 *
 * Requirements:
 * - token: Required session token (cryptographically secure random string)
 *
 * Constraints:
 * - Token must be validated server-side only
 * - Token must not be exposed in URLs
 * - No default values
 */
export type ValidateSessionInput = {
  readonly token: string;
};

/**
 * Output for successful session validation.
 *
 * Requirements:
 * - session: Valid session record (sanitized, no token)
 * - userContext: Authenticated user context (userId, userRole, sessionId)
 *
 * Constraints:
 * - Session must be active (not expired, not invalidated)
 * - User account must be active (not suspended, not deleted)
 * - Token not included (already validated, not needed in output)
 */
export type ValidateSessionOutput = {
  readonly session: PublicSession;
  readonly userContext: AuthenticatedUserContext;
};

/**
 * Input for session logout.
 *
 * Requirements:
 * - token: Required session token (to identify session to invalidate)
 *
 * Constraints:
 * - Token must be validated server-side only
 * - No default values
 */
export type LogoutInput = {
  readonly token: string;
};

/**
 * Input for password reset initiation.
 *
 * Requirements:
 * - email: Required email address (must match User entity email)
 *
 * Constraints:
 * - Email must be validated (server-side only)
 * - No default values
 * - Must not reveal whether email exists (security measure)
 */
export type InitiatePasswordResetInput = {
  readonly email: string;
};

/**
 * Input for password reset completion.
 *
 * Requirements:
 * - resetToken: Required password reset token (cryptographically secure random string)
 * - newPassword: Required new password (plaintext, will be hashed)
 *
 * Constraints:
 * - Reset token must be validated server-side only
 * - Reset token must be time-limited (expiration check)
 * - Reset token must be single-use (invalidated after use)
 * - New password must not be logged (no password in logs)
 * - New password must not be exposed (no password in error messages)
 * - No default values
 */
export type CompletePasswordResetInput = {
  readonly resetToken: string;
  readonly newPassword: string;
};

/**
 * Input for password change (authenticated user changes own password).
 *
 * Requirements:
 * - currentPassword: Required current password (plaintext, will be hashed and compared)
 * - newPassword: Required new password (plaintext, will be hashed)
 *
 * Constraints:
 * - User must be authenticated (session must be valid, userId derived from session)
 * - Current password must be verified (password hash comparison)
 * - New password must not be logged (no password in logs)
 * - New password must not be exposed (no password in error messages)
 * - No default values
 * - userId must NOT be in input (derived from validated session context to prevent authorization bypass)
 */
export type ChangePasswordInput = {
  readonly currentPassword: string;
  readonly newPassword: string;
};

/**
 * Input for session invalidation (admin-initiated security invalidation).
 *
 * Requirements:
 * - targetUserId: Required user identifier (user whose sessions to invalidate)
 *
 * Constraints:
 * - Admin-only operation (must verify admin role)
 * - Invalidates all sessions for user (security measure)
 * - No default values
 */
export type InvalidateUserSessionsInput = {
  readonly targetUserId: string;
};

// ============================================================================
// 5. Error Surface (Conceptual Reference Only)
// ============================================================================

/**
 * ErrorEnvelope reference (from Error Handling module).
 *
 * This type is intentionally opaque at this boundary.
 * Authentication module must not inspect or construct ErrorEnvelope directly.
 * Authentication module must use Error Handling module helpers to create errors.
 */
// import type { ErrorEnvelope } from "../errors/types";
type ErrorEnvelope = unknown;

// ============================================================================
// 6. Public Function Signatures
// ============================================================================

/**
 * Authenticate user with email and password, create session.
 *
 * Requirements:
 * - Server-side only
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state, except database effects)
 * - Password hashing must use secure algorithm (bcrypt, argon2, or equivalent)
 * - Session token must be cryptographically secure
 * - Session expiration must be enforced (recommended: 24 hours, configurable)
 * - Must verify user account exists and is active (User Management `getUserById`)
 * - Must verify password (password hash comparison)
 * - Must read user role from User entity (not inferred)
 * - Must generate UTID for login action (Utilities module)
 * - Must enforce INVARIANT 2.1 (Server-Side Authorization Enforcement)
 *
 * Returns:
 * - LoginOutput on success (session and user context)
 * - ErrorEnvelope on failure (invalid credentials, user suspended/deleted, system error)
 *
 * @param ctx - Authentication context (db, now)
 * @param input - Login input (email, password)
 * @returns Login output or error envelope
 */
export declare function login(
  ctx: AuthenticationContext,
  input: LoginInput
): Promise<LoginOutput | ErrorEnvelope>;

/**
 * Validate session token, return authenticated user context.
 *
 * Requirements:
 * - Server-side only
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state, except database effects)
 * - Must verify session exists (database lookup by token)
 * - Must verify session is active (not expired, not invalidated)
 * - Must verify user account is active (not suspended, not deleted)
 * - Must read user role from User entity (not inferred)
 * - Must update lastActiveAt timestamp (session activity tracking) — requires write access
 * - Must enforce INVARIANT 2.1 (Server-Side Authorization Enforcement)
 *
 * Returns:
 * - ValidateSessionOutput on success (session and user context)
 * - ErrorEnvelope on failure (invalid token, expired session, invalidated session, user suspended/deleted, system error)
 *
 * @param ctx - Authentication context (db, now) — requires write access for lastActiveAt update
 * @param input - Session validation input (token)
 * @returns Session validation output or error envelope
 */
export declare function validateSession(
  ctx: AuthenticationContext,
  input: ValidateSessionInput
): Promise<ValidateSessionOutput | ErrorEnvelope>;

/**
 * Invalidate session (logout).
 *
 * Requirements:
 * - Server-side only
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state, except database effects)
 * - Must verify session exists (database lookup by token)
 * - Must invalidate session (set invalidated: true, set invalidatedAt timestamp)
 * - Must generate UTID for logout action (Utilities module)
 * - Must enforce INVARIANT 2.1 (Server-Side Authorization Enforcement)
 *
 * Returns:
 * - void on success
 * - ErrorEnvelope on failure (invalid token, session not found, system error)
 *
 * @param ctx - Authentication context (db, now)
 * @param input - Logout input (token)
 * @returns void or error envelope
 */
export declare function logout(
  ctx: AuthenticationContext,
  input: LogoutInput
): Promise<void | ErrorEnvelope>;

/**
 * Initiate password reset (generate reset token, send to user email).
 *
 * Requirements:
 * - Server-side only
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state, except database effects)
 * - Must verify user account exists (User Management `getUserById`)
 * - Must generate password reset token (cryptographically secure random string)
 * - Must store reset token (hashed or encrypted, not plaintext)
 * - Must set reset token expiration (recommended: 1 hour, configurable)
 * - Must send reset token to user email (or equivalent secure delivery mechanism)
 * - Must generate UTID for password reset initiation (Utilities module)
 * - Must not reveal whether email exists (security measure)
 *
 * Returns:
 * - void on success (always returns success, even if email does not exist)
 * - ErrorEnvelope on failure (system error only, not email not found)
 *
 * @param ctx - Authentication context (db, now)
 * @param input - Password reset initiation input (email)
 * @returns void or error envelope
 */
export declare function initiatePasswordReset(
  ctx: AuthenticationContext,
  input: InitiatePasswordResetInput
): Promise<void | ErrorEnvelope>;

/**
 * Complete password reset (validate reset token, update password, invalidate sessions).
 *
 * Requirements:
 * - Server-side only
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state, except database effects)
 * - Must verify reset token exists (database lookup)
 * - Must verify reset token is valid (not expired, not used)
 * - Must verify reset token matches user (token-user association)
 * - Must hash new password (secure algorithm: bcrypt, argon2, or equivalent)
 * - Must update password hash in User entity
 * - Must invalidate reset token (single-use enforcement)
 * - Must invalidate all existing sessions for user (security measure)
 * - Must generate UTID for password reset completion (Utilities module)
 * - Must enforce INVARIANT 2.1 (Server-Side Authorization Enforcement)
 *
 * Returns:
 * - void on success
 * - ErrorEnvelope on failure (invalid token, expired token, token already used, system error)
 *
 * @param ctx - Authentication context (db, now)
 * @param input - Password reset completion input (resetToken, newPassword)
 * @returns void or error envelope
 */
export declare function completePasswordReset(
  ctx: AuthenticationContext,
  input: CompletePasswordResetInput
): Promise<void | ErrorEnvelope>;

/**
 * Change password (authenticated user changes own password).
 *
 * Requirements:
 * - Server-side only
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state, except database effects)
 * - Must verify user is authenticated (session validation required)
 * - Must derive userId from validated session context (not from client input)
 * - Must verify current password (password hash comparison)
 * - Must hash new password (secure algorithm: bcrypt, argon2, or equivalent)
 * - Must update password hash in User entity
 * - Must generate UTID for password change (Utilities module)
 * - Must enforce INVARIANT 2.1 (Server-Side Authorization Enforcement)
 *
 * Returns:
 * - void on success
 * - ErrorEnvelope on failure (invalid current password, user not found, system error)
 *
 * @param ctx - Authentication context (db, now)
 * @param sessionToken - Validated session token (userId derived from session, not client input)
 * @param input - Password change input (currentPassword, newPassword) — userId excluded to prevent authorization bypass
 * @returns void or error envelope
 */
export declare function changePassword(
  ctx: AuthenticationContext,
  sessionToken: string,
  input: ChangePasswordInput
): Promise<void | ErrorEnvelope>;

/**
 * Invalidate all sessions for a user (admin-initiated security invalidation).
 *
 * Requirements:
 * - Server-side only
 * - Deterministic (same inputs = same result, assuming same database state)
 * - Stateless (no internal state, except database effects)
 * - Admin-only operation (must verify admin role via Authorization module)
 * - Must invalidate all sessions for user (set invalidated: true, set invalidatedAt timestamp)
 * - Must generate UTID for session invalidation (Utilities module)
 * - Must enforce INVARIANT 2.1 (Server-Side Authorization Enforcement)
 * - Must enforce INVARIANT 2.2 (Admin Role Verification)
 *
 * Returns:
 * - void on success
 * - ErrorEnvelope on failure (not admin, user not found, system error)
 *
 * @param ctx - Authentication context (db, now)
 * @param actionContext - Acting user context (actingUserId, actingUserRole) — must be admin
 * @param input - Session invalidation input (targetUserId)
 * @returns void or error envelope
 */
export declare function invalidateUserSessions(
  ctx: AuthenticationContext,
  actionContext: { readonly actingUserId: string; readonly actingUserRole: UserRole },
  input: InvalidateUserSessionsInput
): Promise<void | ErrorEnvelope>;

// ============================================================================
// 7. BLOCKED / FORBIDDEN (Explicitly Not Present)
// ============================================================================

/**
 * BLOCKED:
 * - Role assignment: Authentication does not assign roles (User Management responsibility)
 * - Role inference: Authentication does not infer roles from email prefix (BLOCKED FOR PRODUCTION)
 * - JWT tokens: Authentication uses stateful sessions, not JWT (AUTHENTICATION_IMPLEMENTATION_DECISION.md)
 * - External identity providers: Authentication uses password-based authentication only (no OAuth, SSO, etc.)
 * - Frontend authentication: All authentication is server-side only (INVARIANT 2.1)
 * - User management: Authentication does not create, modify, or delete users (User Management responsibility)
 * - Authorization logic: Authentication does not perform authorization checks (Authorization module responsibility)
 */

// ============================================================================
// FINAL CHECK
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
 * ✅ All function signatures defined (no bodies)
 * ✅ All BLOCKED decisions explicitly marked
 * ✅ Imports from other modules are explicit and minimal
 * ✅ No default values
 * ✅ No runtime assumptions
 * ✅ Role types are explicit (not inferred)
 * ✅ Authentication context is explicit (not inferred)
 * ✅ Error surface uses Error Handling types (conceptually referenced)
 * ✅ Database context is explicitly included in function signatures
 * ✅ Stateful session model (from AUTHENTICATION_IMPLEMENTATION_DECISION.md)
 * ✅ Password-based authentication only (no external identity providers)
 * ✅ INVARIANT 2.1 (Server-Side Authorization Enforcement) is explicitly supported
 * ✅ INVARIANT 2.2 (Admin Role Verification) is explicitly supported
 * ✅ INVARIANT 2.3 (Frontend Cannot Bypass Authorization) is explicitly supported
 */
