# Rate Limiting Module Specification

**Module**: Rate Limiting  
**Step**: 4 (IMPLEMENTATION_SEQUENCE.md Step 4)  
**Status**: Specification only (no code, no interfaces, no test cases)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- IMPLEMENTATION_SEQUENCE.md Step 4 defines this module
- IMPLEMENTATION_BOUNDARIES.md defines coding constraints
- INVARIANTS.md (5.3) defines rate limiting invariants
- DOMAIN_MODEL.md defines RateLimitHit entity
- MODULARITY_GUIDE.md defines module boundaries and trust boundaries
- architecture.md defines trust boundaries and kill switches
- Utilities module (Step 1) is complete and locked
- Error Handling module (Step 2) is complete and locked
- Authorization module (Step 3) is complete and locked

**Purpose**: This document defines the Rate Limiting module specification. This is NOT an implementation guide. This defines requirements, not code or interfaces.

---

## 1. Module Purpose

### Core Purpose

**Rate Limiting Module** provides rate limit enforcement, rate limit violation logging, and rate limit configuration required by all modules that perform user actions. This module enables server-side rate limiting to prevent spam and manipulation while maintaining auditability.

**Why This Module Exists**:
- All modules that perform user actions require rate limiting (spam prevention, manipulation prevention)
- All modules require rate limit violation logging (auditability, observability)
- All modules require rate limit configuration (configurable thresholds, windows)
- Rate limiting supports invariant enforcement (INVARIANT 5.3: RateLimitHit Entry Immutability)
- Rate limiting prevents abuse and ensures fair resource usage

**Why This Module Must Be Fourth**:
- Depends on Utilities module (Step 1) for UTID generation in rate limit logs
- Depends on Error Handling module (Step 2) for standardized error responses
- Does NOT depend on Authorization module (rate limiting is independent of authorization)
- Required by all modules that perform user actions (foundational rate limiting infrastructure)
- Provides rate limiting enforcement (all user-action modules need rate limiting)
- Safe to stop after (rate limiting is independent, creates only audit logs)

**Why No Other Module Can Precede**:
- All modules that perform user actions depend on Rate Limiting (for rate limit enforcement)
- Building other modules first would violate dependency constraints
- Building other modules first would create unsafe state (missing rate limiting enforcement)
- Rate limiting must be in place before business logic modules are built

---

## 2. Owned Entities

### Entities Owned by Rate Limiting Module

**RateLimitHit**: Rate limit violation log record

**From DOMAIN_MODEL.md**:
- **Entity**: RateLimitHit
- **Owner**: System
- **Purpose**: Rate limit violation record
- **Note**: RateLimitHit is a log record, not a stateful entity. Entries are created and remain immutable.

**From convex/schema.ts**:
- **Table**: `rateLimitHits`
- **Fields**:
  - `userId`: User who exceeded limit (v.id("users"))
  - `userRole`: Role of the user (v.union(v.literal("farmer"), v.literal("trader"), v.literal("buyer"), v.literal("admin")))
  - `actionType`: Type of action (e.g., "lock_unit", "create_listing") (v.string())
  - `limitType`: Type of limit (e.g., "negotiations_per_hour") (v.string())
  - `limitValue`: The limit that was exceeded (v.number())
  - `attemptedAt`: Timestamp of the attempt (v.number())
  - `windowStart`: Start of the rate limit window (v.number())
  - `windowEnd`: End of the rate limit window (v.number())
  - `currentCount`: Current count in the window (v.number())
  - `metadata`: Additional context (v.optional(v.any()))

**From MODULARITY_GUIDE.md**:
- **Owned Entities**: RateLimitHit
- **Responsibility**: Rate limit enforcement, rate limit violation logging, rate limit configuration

**BLOCKED Notes**: None

---

## 3. Trust Boundary Classification

### Explicit Trust Boundary

**Trust Boundary Classification**: **Trusted (Server-Side)**

**From architecture.md**:
- **Backend (Convex)**: Trusted (server-side)
- **Rate Limiting Enforcement**: All rate limiting is enforced in Convex backend
- **Trust Boundary**: Server-side only (backend is trusted, frontend is untrusted)

**Trust Boundary Requirements**:
- Rate limit checks must be performed server-side only (in Convex backend)
- Rate limit checks must NOT be performed on frontend (frontend is untrusted)
- Rate limit checks must NOT be exposed to frontend (rate limiting logic is server-side only)
- Rate limit decisions must be made server-side (frontend cannot bypass rate limiting)

**Kill-Switch Points** (from architecture.md):
- Rate limiting module does not implement kill-switches (kill-switches are system-level)
- Rate limiting module supports kill-switch enforcement (rate limiting can block operations)
- Rate limiting module does not control kill-switches (kill-switches are controlled by system operator)

**Single-Human Authority Control Points** (from architecture.md):
- Rate limiting module does not implement authority control points (authority is system-level)
- Rate limiting module enforces rate limits (rate limit enforcement)
- Rate limiting module does not control authority (authority is controlled by system operator)

**BLOCKED Notes**: None

---

## 4. Allowed Operations

### Operations This Module Is Allowed to Perform

**1. Rate Limit Enforcement**:
- Check if user action exceeds rate limit threshold
- Calculate rate limit window (sliding window or fixed window)
- Count actions in the rate limit window
- Block actions that exceed rate limit threshold
- Rate limit checks must be server-side only
- Rate limit checks must be deterministic (same inputs = same rate limit decision)
- Rate limit checks must be atomic (rate limit check and action count must be atomic)

**2. Rate Limit Violation Logging**:
- Create RateLimitHit entry when rate limit is exceeded
- Log rate limit violation with UTID (from Utilities module)
- Log rate limit violation with user context (userId, userRole, actionType)
- Log rate limit violation with limit context (limitType, limitValue, windowStart, windowEnd, currentCount)
- Log rate limit violation with metadata (optional additional context)
- Rate limit violation logging must be immutable (RateLimitHit entries cannot be modified or deleted)
- Rate limit violation logging must be auditable (all violations must be logged)

**3. Rate Limit Configuration**:
- Get rate limit configuration for user role and action type
- Configure rate limit thresholds (e.g., 20 negotiations per hour for traders)
- Configure rate limit windows (e.g., 1 hour, 24 hours)
- Configure rate limit types (e.g., "negotiations_per_hour", "listings_per_day")
- Rate limit configuration must be explicit (no inferred configuration)
- Rate limit configuration must be role-based (different limits for different roles)
- Rate limit configuration must be action-based (different limits for different actions)

**4. UTID Generation for Rate Limit Logs**:
- Use Utilities module to generate UTIDs for RateLimitHit entries
- UTID generation must be deterministic (from Utilities module)
- UTID generation must be pure (from Utilities module)
- UTID generation must be stateless (from Utilities module)

**5. Error Response for Rate Limit Violations**:
- Use Error Handling module to return standardized errors when rate limit is exceeded
- Error responses must be consistent (from Error Handling module)
- Error responses must be server-side only
- Error responses must not expose sensitive information
- Error responses must include rate limit information (limit value, reset time, current count)

**6. Admin Bypass**:
- Admins are not rate limited (return early if userRole === "admin")
- Admin bypass must be explicit (no inferred admin bypass)
- Admin bypass must be server-side only

**Constraints**:
- All rate limit checks must be server-side only
- All rate limit checks must be deterministic (same inputs = same rate limit decision)
- All rate limit checks must be atomic (rate limit check and action count must be atomic)
- All rate limit violation logs must be immutable (RateLimitHit entries cannot be modified or deleted)
- All rate limit configuration must be explicit (no inferred configuration)

**BLOCKED Notes**: None

---

## 5. Forbidden Operations

### Operations This Module Must NEVER Perform

**1. Authorization**:
- **FORBIDDEN**: Perform authorization checks (authorization is separate from rate limiting)
- **FORBIDDEN**: Verify user roles for authorization (authorization is separate from rate limiting)
- **FORBIDDEN**: Enforce permission checks (authorization is separate from rate limiting)
- **FORBIDDEN**: Block operations based on authorization (authorization is separate from rate limiting)
- **Reason**: Rate limiting is separate from authorization. Rate limiting checks rate limits, not permissions. Authorization module (Step 3) handles authorization.

**2. Authentication**:
- **FORBIDDEN**: Verify user credentials (authentication is separate from rate limiting)
- **FORBIDDEN**: Manage user sessions (authentication responsibility)
- **FORBIDDEN**: Handle login/logout (authentication responsibility)
- **FORBIDDEN**: Verify user identity (authentication responsibility)
- **Reason**: Rate limiting is separate from authentication (authentication is BLOCKED - VISION.md BLOCKED #1)

**3. User Management**:
- **FORBIDDEN**: Create user accounts (User Management responsibility)
- **FORBIDDEN**: Delete user accounts (User Management responsibility)
- **FORBIDDEN**: Suspend user accounts (User Management responsibility)
- **FORBIDDEN**: Modify user data (User Management responsibility)
- **FORBIDDEN**: Assign roles to users (User Management responsibility)
- **Reason**: Rate limiting checks users, does not manage them

**4. Business Logic**:
- **FORBIDDEN**: Implement business logic (rate limiting is infrastructure, not business logic)
- **FORBIDDEN**: Make business decisions (rate limiting is infrastructure, not business logic)
- **FORBIDDEN**: Enforce business rules (rate limiting is infrastructure, not business logic)
- **FORBIDDEN**: Process transactions (rate limiting is infrastructure, not business logic)
- **Reason**: Rate limiting is infrastructure, not business logic

**5. Frontend/Client-Side Rate Limiting**:
- **FORBIDDEN**: Perform rate limit checks on frontend/client (rate limiting must be server-side only)
- **FORBIDDEN**: Trust frontend/client rate limit decisions (rate limiting must be server-side only)
- **FORBIDDEN**: Expose rate limiting logic to frontend/client (rate limiting must be server-side only)
- **FORBIDDEN**: Allow frontend/client to bypass rate limiting (rate limiting must be server-side only)
- **Reason**: Frontend/client is untrusted. Rate limiting bypass would allow abuse.

**6. RateLimitHit Entry Modification or Deletion**:
- **FORBIDDEN**: Modify RateLimitHit entries (RateLimitHit entries are immutable)
- **FORBIDDEN**: Delete RateLimitHit entries (RateLimitHit entries are immutable)
- **FORBIDDEN**: Update RateLimitHit entry fields (RateLimitHit entries are immutable)
- **Reason**: INVARIANT 5.3 requires RateLimitHit entry immutability. Modifying or deleting entries would break the audit trail.

**7. BLOCKED Capabilities**:
- **FORBIDDEN**: Depend on Authentication module (BLOCKED - production authentication NOT IMPLEMENTED)
- **FORBIDDEN**: Assume BLOCKED capabilities exist
- **FORBIDDEN**: Implement BLOCKED capabilities
- **Reason**: Rate limiting must not require BLOCKED capabilities

**8. Logging Sink Implementation**:
- **FORBIDDEN**: Implement logging sinks (database, files, network) beyond RateLimitHit creation
- **FORBIDDEN**: Choose logging destinations beyond RateLimitHit table
- **FORBIDDEN**: Configure logging infrastructure beyond RateLimitHit table
- **Reason**: Rate limiting module creates RateLimitHit entries (audit logs), but does not implement additional logging sinks

**9. Error Transformation or Filtering**:
- **FORBIDDEN**: Transform errors (errors must be preserved as-is)
- **FORBIDDEN**: Filter errors (all errors must be available)
- **FORBIDDEN**: Aggregate errors (errors must be individual)
- **Reason**: Rate limiting module uses Error Handling module for errors, does not transform them

**10. Rate Limit Configuration Inference**:
- **FORBIDDEN**: Infer rate limit configuration from user behavior (rate limit configuration must be explicit)
- **FORBIDDEN**: Infer rate limit configuration from system state (rate limit configuration must be explicit)
- **FORBIDDEN**: Infer rate limit configuration from external sources (rate limit configuration must be explicit)
- **Reason**: Rate limit configuration must be explicit, not inferred

---

## 6. Supported Invariants

### Invariants This Module Supports

**INVARIANT 5.3: RateLimitHit Entry Immutability**

**Description**: Once a RateLimitHit entry is created, it cannot be modified or deleted. The entry's `userId`, `userRole`, `actionType`, `limitType`, `limitValue`, `attemptedAt`, `windowStart`, `windowEnd`, `currentCount`, and `metadata` fields are immutable.

**Why This Invariant Exists**: Rate limit violation logs are critical for auditability. Modifying or deleting rate limit violation logs would break the audit trail.

**How Module Supports**:
- Rate limiting module creates RateLimitHit entries (immutable audit logs)
- Rate limiting module does not modify RateLimitHit entries (entries are immutable)
- Rate limiting module does not delete RateLimitHit entries (entries are immutable)
- Rate limiting module enforces RateLimitHit immutability (entries cannot be modified or deleted)

**Module Responsibility**:
- Create RateLimitHit entries when rate limit is exceeded
- Ensure RateLimitHit entries are immutable (entries cannot be modified or deleted)
- Ensure RateLimitHit entries are auditable (all violations must be logged)
- Ensure RateLimitHit entries include all required fields (userId, userRole, actionType, limitType, limitValue, attemptedAt, windowStart, windowEnd, currentCount, metadata)

**From INVARIANTS.md**:
- **Description**: Once a RateLimitHit entry is created, it cannot be modified or deleted. The entry's `userId`, `userRole`, `actionType`, `limitType`, `limitValue`, `attemptedAt`, `windowStart`, `windowEnd`, `currentCount`, and `metadata` fields are immutable.
- **Why This Invariant Exists**: Rate limit violation logs are critical for auditability. Modifying or deleting rate limit violation logs would break the audit trail.
- **How Violation Is Detected**: Check if any RateLimitHit entry has been modified (compare current state to creation state). Check if any RateLimitHit entry has been deleted (compare entry count to expected count). Database constraints should prevent modifications/deletions.
- **Mandatory System Response**: Block all rate-limited operations until RateLimitHit immutability is verified, log violation, notify system operator, investigate and verify RateLimitHit immutability before re-enabling rate-limited operations.

**BLOCKED Notes**: None

---

## 7. Dependencies

### Required Dependencies

**1. Utilities Module (Step 1)**:
- **Required For**: UTID generation for RateLimitHit entries
- **Status**: Complete and locked
- **Usage**: Generate UTIDs for RateLimitHit entries (audit trail)
- **BLOCKED Notes**: None

**2. Error Handling Module (Step 2)**:
- **Required For**: Standardized error responses for rate limit violations
- **Status**: Complete and locked
- **Usage**: Return standardized errors when rate limit is exceeded
- **BLOCKED Notes**: None

**3. User Entity**:
- **Required For**: Check user role, get user ID
- **Status**: Database schema entity (convex/schema.ts)
- **Usage**: Read user role and user ID from User entity (read-only access)
- **BLOCKED Notes**: None

---

### BLOCKED Dependencies

**1. Authorization Module**:
- **BLOCKED Reason**: Rate limiting is independent of authorization (rate limiting checks rate limits, not permissions)
- **Impact**: Rate limiting module cannot perform authorization checks (authorization is separate)
- **Workaround**: Rate limiting module works independently of authorization (rate limiting is separate from authorization)
- **BLOCKED Notes**: Authorization module (Step 3) is complete and available, but rate limiting does not depend on it. Rate limiting is independent of authorization.

**2. User Management Module**:
- **BLOCKED Reason**: User Management module is Step 5 (not yet implemented)
- **Impact**: Rate limiting module cannot create or modify users (works with existing User entity read-only)
- **Workaround**: Rate limiting module works with existing User entity (read-only access to role and ID fields)
- **BLOCKED Notes**: User Management module is not yet implemented. Rate limiting module can work with minimal User entity (read-only access to role and ID fields).

**3. Authentication Module**:
- **BLOCKED Reason**: Production authentication NOT IMPLEMENTED (VISION.md BLOCKED #1)
- **Impact**: Rate limiting module cannot verify user credentials (assumes user context is provided by calling code)
- **Workaround**: Rate limiting module works with authenticated user context (provided by calling code)
- **BLOCKED Notes**: Authentication is BLOCKED (VISION.md BLOCKED #1). Rate limiting module must work without authentication module. Rate limiting module assumes user context is provided by calling code (authentication is handled separately).

---

## 8. Safe Stopping Guarantees

### Safe Stopping Definition

**Safe Stopping**: System can be safely stopped after Rate Limiting module implementation without:
- Creating irreversible damage
- Creating data corruption
- Creating security vulnerabilities
- Violating invariants
- Requiring rollback

**Why Stopping After Rate Limiting Is Safe**:
- Rate limiting module has minimal dependencies (Utilities, Error Handling, User entity)
- Rate limiting module creates only audit logs (RateLimitHit entries are immutable audit logs)
- Rate limiting module has no side effects beyond rate limit enforcement and logging
- Rate limiting module is independently testable (can be validated independently)
- Rate limiting module does not modify business entities (only creates audit logs)

**Safe Stopping Guarantee**:
- **No Business Data Created**: Rate limiting module does not create business entities (only creates audit logs)
- **No Side Effects**: Rate limiting module has no side effects beyond rate limit enforcement and logging (no database writes beyond RateLimitHit entries)
- **Minimal Dependencies**: Rate limiting module depends only on Utilities, Error Handling, and User entity
- **Immutable Audit Logs**: RateLimitHit entries are immutable audit logs (no data corruption risk)
- **Independent Functionality**: Rate limiting module is independently testable (can be validated independently)

**BLOCKED Notes**: None (rate limiting is foundational, no BLOCKED dependencies that prevent safe stopping)

---

## 9. What This Module MUST NOT Do

### Explicit Constraints

**1. MUST NOT Perform Authorization**:
- Rate limiting module MUST NOT perform authorization checks, verify user roles for authorization, enforce permission checks, or block operations based on authorization.
- **Reason**: Rate limiting is separate from authorization. Rate limiting checks rate limits, not permissions.

**2. MUST NOT Perform Authentication**:
- Rate limiting module MUST NOT verify user credentials, manage user sessions, handle login/logout, or verify user identity.
- **Reason**: Rate limiting is separate from authentication (authentication is BLOCKED - VISION.md BLOCKED #1).

**3. MUST NOT Manage Users**:
- Rate limiting module MUST NOT create, delete, suspend, or modify user accounts, or assign roles to users.
- **Reason**: Rate limiting checks users, does not manage them.

**4. MUST NOT Implement Business Logic**:
- Rate limiting module MUST NOT implement business logic, make business decisions, enforce business rules, or process transactions.
- **Reason**: Rate limiting is infrastructure, not business logic.

**5. MUST NOT Perform Frontend/Client-Side Rate Limiting**:
- Rate limiting module MUST NOT perform rate limit checks on frontend/client, trust frontend/client rate limit decisions, expose rate limiting logic to frontend/client, or allow frontend/client to bypass rate limiting.
- **Reason**: Frontend/client is untrusted. Rate limiting bypass would allow abuse.

**6. MUST NOT Modify or Delete RateLimitHit Entries**:
- Rate limiting module MUST NOT modify, delete, or update RateLimitHit entry fields.
- **Reason**: INVARIANT 5.3 requires RateLimitHit entry immutability. Modifying or deleting entries would break the audit trail.

**7. MUST NOT Depend on BLOCKED Capabilities**:
- Rate limiting module MUST NOT depend on Authentication module (BLOCKED), assume BLOCKED capabilities exist, or implement BLOCKED capabilities.
- **Reason**: Rate limiting must not require BLOCKED capabilities.

**8. MUST NOT Implement Logging Sinks Beyond RateLimitHit**:
- Rate limiting module MUST NOT implement logging sinks (database, files, network) beyond RateLimitHit creation, choose logging destinations beyond RateLimitHit table, or configure logging infrastructure beyond RateLimitHit table.
- **Reason**: Rate limiting module creates RateLimitHit entries (audit logs), but does not implement additional logging sinks.

**9. MUST NOT Transform or Filter Errors**:
- Rate limiting module MUST NOT transform, filter, or aggregate errors.
- **Reason**: Rate limiting module uses Error Handling module for errors, does not transform them.

**10. MUST NOT Infer Rate Limit Configuration**:
- Rate limiting module MUST NOT infer rate limit configuration from user behavior, system state, or external sources.
- **Reason**: Rate limit configuration must be explicit, not inferred.

---

## 10. Cross-References

### DOMAIN_MODEL.md

**Reference**: DOMAIN_MODEL.md defines entities, ownership, and state transitions.

**Relevance**:
- Rate limiting module owns `RateLimitHit` entity.
- `RateLimitHit` entity is a log record, not a stateful entity. Entries are created and remain immutable.
- `RateLimitHit` entity is owned by System (not by users).

**BLOCKED Notes**: None

---

### INVARIANTS.md

**Reference**: INVARIANTS.md defines non-negotiable constraints.

**Relevance**:
- Rate limiting module directly supports INVARIANT 5.3 (RateLimitHit Entry Immutability).
- Rate limiting module creates RateLimitHit entries (immutable audit logs).
- Rate limiting module enforces RateLimitHit immutability (entries cannot be modified or deleted).

**BLOCKED Notes**: None

---

### MODULARITY_GUIDE.md

**Reference**: MODULARITY_GUIDE.md defines module boundaries and forbidden couplings.

**Relevance**:
- Rate limiting module: Rate limit enforcement, rate limit violation logging, rate limit configuration.
- Owned entities: RateLimitHit.
- Trust boundary: Trusted (server-side only).
- Dependencies: Utilities, Error Handling, User entity.
- Forbidden couplings: MUST NOT be tightly coupled to any specific business logic module (rate limiting is cross-cutting).

**BLOCKED Notes**: None

---

### IMPLEMENTATION_BOUNDARIES.md

**Reference**: IMPLEMENTATION_BOUNDARIES.md defines coding constraints.

**Relevance**:
- Rate limiting is an allowed module.
- Rate limiting must not implement BLOCKED capabilities.
- Rate limiting must not depend on BLOCKED capabilities.
- Rate limiting must respect forbidden couplings.

**BLOCKED Notes**: None

---

### architecture.md

**Reference**: architecture.md defines trust boundaries and kill switches.

**Relevance**:
- Rate limiting module enforces trust boundaries (Trusted Backend, Untrusted Frontend).
- Rate limiting module is part of the Trusted Backend.
- Rate limiting module ensures frontend cannot bypass rate limiting.

**BLOCKED Notes**: None

---

## 11. Module Prerequisites

### Prerequisites Check

**1. Utilities Module (Step 1)**:
- **Status**: ✅ Complete and locked
- **Required For**: UTID generation
- **Prerequisite Met**: Yes

**2. Error Handling Module (Step 2)**:
- **Status**: ✅ Complete and locked
- **Required For**: Standardized error responses
- **Prerequisite Met**: Yes

**3. Authorization Module (Step 3)**:
- **Status**: ✅ Complete and locked
- **Required For**: None (rate limiting is independent of authorization)
- **Prerequisite Met**: N/A (rate limiting does not depend on authorization)

**4. User Entity**:
- **Status**: ✅ Database schema entity exists (convex/schema.ts)
- **Required For**: Check user role and user ID
- **Prerequisite Met**: Yes

**5. RateLimitHit Entity**:
- **Status**: ✅ Database schema entity exists (convex/schema.ts)
- **Required For**: Rate limit violation logging
- **Prerequisite Met**: Yes

---

## 12. Final Check

### Module Purpose

**Verified**: This module provides:
- **Rate Limit Enforcement**: Check if user action exceeds rate limit threshold, block actions that exceed rate limit
- **Rate Limit Violation Logging**: Create RateLimitHit entry when rate limit is exceeded, log rate limit violation with UTID
- **Rate Limit Configuration**: Get rate limit configuration for user role and action type, configure rate limit thresholds and windows

**BLOCKED Notes**: None

---

### Owned Entities

**Verified**: This module owns:
- **RateLimitHit**: Rate limit violation log record (immutable audit log)

**BLOCKED Notes**: None

---

### Trust Boundary Classification

**Verified**: This module has:
- **Trusted** (Server-Side) trust boundary
- Location: Convex backend
- Enforcement: Server-side only

**BLOCKED Notes**: None

---

### Allowed Operations

**Verified**: This module is allowed to:
- Check if user action exceeds rate limit threshold
- Create RateLimitHit entry when rate limit is exceeded
- Get rate limit configuration for user role and action type
- Use Utilities module for UTID generation
- Use Error Handling module for error responses
- Bypass rate limiting for admins (explicit admin bypass)

**BLOCKED Notes**: None (allowed operations are foundational)

---

### Forbidden Operations

**Verified**: This module is forbidden from:
- Authorization (performing authorization checks, verifying user roles for authorization)
- Authentication (verifying credentials, managing sessions)
- User management (creating, deleting, suspending users)
- Business logic (implementing business logic, making business decisions)
- Frontend/client-side rate limiting (performing rate limit checks on frontend/client)
- RateLimitHit entry modification or deletion (modifying, deleting, updating RateLimitHit entries)
- BLOCKED capabilities (depending on Authentication module, assuming BLOCKED capabilities exist)
- Logging sink implementation beyond RateLimitHit (Error Handling module responsibility)
- Error transformation or filtering (Error Handling module responsibility)
- Rate limit configuration inference (rate limit configuration must be explicit)

**BLOCKED Notes**: None (forbidden operations are explicit)

---

### Supported Invariants

**Verified**: This module supports:
- **INVARIANT 5.3**: RateLimitHit Entry Immutability (RateLimitHit entries are immutable audit logs)

**BLOCKED Notes**: None

---

### Dependencies

**Verified**: This module has:
- **Required Dependencies**: Utilities module (Step 1), Error Handling module (Step 2), User entity, RateLimitHit entity
- **BLOCKED Dependencies**: Authorization module (not required, rate limiting is independent), User Management module (not yet implemented), Authentication module (BLOCKED)

**BLOCKED Notes**: Rate limiting module can proceed if User entity and RateLimitHit entity exist in schema (both exist). Rate limiting does not require Authorization module (rate limiting is independent of authorization).

---

### Safe Stopping Guarantees

**Verified**: Stopping after this step is safe because:
- Rate limiting module creates only audit logs (RateLimitHit entries are immutable audit logs)
- Rate limiting module has no side effects beyond rate limit enforcement and logging
- Rate limiting module is stateless (no internal state to preserve)
- Rate limiting module is independently testable (can be validated independently)
- Rate limiting module has minimal dependencies (Utilities, Error Handling, User entity, RateLimitHit entity)

**BLOCKED Notes**: None (rate limiting is foundational, no BLOCKED dependencies that prevent safe stopping)

---

**CURRENT MODULE STATUS**: ✅ **ALLOWED**

**Rate limiting module specification is defined. Module can proceed. User entity and RateLimitHit entity exist in schema (convex/schema.ts). Rate limiting module only reads User entity (does not manage users). Rate limiting module creates RateLimitHit entries (immutable audit logs). Rate limiting module does not require Authorization module (rate limiting is independent of authorization).**

**Justification**:
- All prerequisites are met (Utilities module Step 1 complete, Error Handling module Step 2 complete, User entity exists, RateLimitHit entity exists)
- User entity schema has role and ID fields: `role: v.union(...)`, `_id: v.id("users")` (convex/schema.ts)
- RateLimitHit entity schema exists with all required fields (convex/schema.ts)
- Rate limiting module only reads User entity (does not manage users, does not depend on User Management module)
- Rate limiting module creates RateLimitHit entries (immutable audit logs, supports INVARIANT 5.3)
- Rate limiting module does not require Authorization module (rate limiting is independent of authorization)
- Rate limiting module does not require BLOCKED capabilities to function (only requires read access to User entity and write access to RateLimitHit entity)
- Rate limiting module is safe to stop after (creates only audit logs, no business data created)
- Rate limiting module supports required invariants (INVARIANT 5.3)
- All dependencies are satisfied (Utilities, Error Handling, User entity, RateLimitHit entity)

---

*This document must be updated when implementation begins, contracts change, or new rate limiting requirements are needed. No assumptions. Only truth.*
