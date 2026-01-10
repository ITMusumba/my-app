# User Management Module Specification

**Module**: User Management  
**Step**: 5 (IMPLEMENTATION_SEQUENCE.md Step 5)  
**Status**: Specification only (no code, no interfaces, no test cases)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- IMPLEMENTATION_SEQUENCE.md Step 5 defines this module
- IMPLEMENTATION_BOUNDARIES.md defines coding constraints
- INVARIANTS.md (3.1, 4.2) defines user management invariants
- DOMAIN_MODEL.md defines User entity and role states
- MODULARITY_GUIDE.md defines module boundaries and trust boundaries
- architecture.md defines trust boundaries and kill switches
- BUSINESS_LOGIC.md defines user account creation workflow
- Utilities module (Step 1) is complete and locked
- Error Handling module (Step 2) is complete and locked
- Authorization module (Step 3) is complete and locked
- Rate Limiting module (Step 4) is complete and locked

**Purpose**: This document defines the User Management module specification. This is NOT an implementation guide. This defines requirements, not code or interfaces.

---

## 1. Module Purpose

### Core Purpose

**User Management Module** provides user account creation, role assignment (explicit, not inferred), user suspension/deletion, and alias generation required by all modules that need to verify user existence or manage user accounts. This module enables server-side user management and prevents unauthorized role changes.

**Why This Module Exists**:
- All modules require user account verification (user existence checks)
- All modules require role verification (role-based access control)
- Admin requires user account management (creation, suspension, deletion, role changes)
- User Management supports invariant enforcement (INVARIANT 3.1: Users Cannot Change Their Own Role, INVARIANT 4.2: All Meaningful Actions Generate UTIDs)
- User Management prevents privilege escalation (users cannot change their own roles)

**Why This Module Must Be Fifth**:
- Depends on Utilities module (Step 1) for UTID generation and alias generation
- Depends on Error Handling module (Step 2) for standardized error responses
- Depends on Authorization module (Step 3) to verify admin role for role changes
- Does NOT depend on Rate Limiting module (user management is independent of rate limiting)
- Required by all modules that need user verification (foundational user management infrastructure)
- Provides user account management (all modules need user verification)
- Safe to stop after (user management is independent, creates User entities)

**Why No Other Module Can Precede**:
- All modules that need user verification depend on User Management (for user existence checks)
- Building other modules first would violate dependency constraints
- Building other modules first would create unsafe state (missing user management enforcement)
- User Management must be in place before business logic modules are built

---

## 2. Owned Entities

### Entities Owned by User Management Module

**User**: User account with role, email, alias, and state

**From DOMAIN_MODEL.md**:
- **Entity**: User
- **Owner**: User (self)
- **Purpose**: User account with role, email, alias
- **Note**: User entity has explicit role field (not inferred). Role assignment is admin-controlled.

**From convex/schema.ts**:
- **Table**: `users`
- **Fields**:
  - `email`: User email address (v.string())
  - `role`: User role (v.union(v.literal("farmer"), v.literal("trader"), v.literal("buyer"), v.literal("admin")))
  - `alias`: System-generated alias (v.string())
  - `createdAt`: Account creation timestamp (v.number())
  - `lastActiveAt`: Last activity timestamp (v.number())
  - `passwordHash`: Password hash (v.optional(v.string())) - Pilot mode only, not production-grade

**From MODULARITY_GUIDE.md**:
- **Owned Entities**: User
- **Responsibility**: User account creation, role assignment, user suspension/deletion, alias generation

**User Entity States** (from DOMAIN_MODEL.md):
- **active**: User account is active (initial state)
- **suspended**: User account is suspended (non-terminal state)
- **deleted**: User account is deleted (terminal state)

**Role States** (from DOMAIN_MODEL.md):
- **farmer**: User can create listings
- **trader**: User can deposit capital and lock units
- **buyer**: User can purchase inventory
- **admin**: User can verify deliveries, reverse transactions, control purchase window

**BLOCKED Notes**: Role inference from email prefix is BLOCKED FOR PRODUCTION. User Management must use explicit role assignment (admin-controlled, not inferred).

---

## 3. Trust Boundary Classification

### Explicit Trust Boundary

**Trust Boundary Classification**: **Trusted (Server-Side)**

**From architecture.md**:
- **Backend (Convex)**: Trusted (server-side)
- **User Management Enforcement**: All user management is enforced in Convex backend
- **Trust Boundary**: Server-side only (backend is trusted, frontend is untrusted)

**Trust Boundary Requirements**:
- User account creation must be performed server-side only (in Convex backend)
- Role assignment must be performed server-side only (in Convex backend)
- User suspension/deletion must be performed server-side only (in Convex backend)
- Alias generation must be performed server-side only (in Convex backend)
- User management operations must NOT be performed on frontend (frontend is untrusted)
- User management operations must NOT be exposed to frontend (user management logic is server-side only)
- User management decisions must be made server-side (frontend cannot bypass user management)

**Kill-Switch Points** (from architecture.md):
- User Management module does not implement kill-switches (kill-switches are system-level)
- User Management module supports kill-switch enforcement (user management can block operations)
- User Management module does not control kill-switches (kill-switches are controlled by system operator)

**Single-Human Authority Control Points** (from architecture.md):
- User Management module does not implement authority control points (authority is system-level)
- User Management module enforces authority boundaries (admin role verification for role changes)
- User Management module does not control authority (authority is controlled by system operator)

**BLOCKED Notes**: None

---

## 4. Allowed Operations

### Operations This Module Is Allowed to Perform

**1. User Account Creation**:
- Create new User entity with email, role, alias, and timestamps
- Validate email format (server-side only)
- Check if user already exists (prevent duplicate accounts)
- Generate alias automatically (using Utilities module)
- Generate UTID for user creation action (using Utilities module)
- Set initial state to `active`
- Set `createdAt` and `lastActiveAt` timestamps
- User account creation must be server-side only
- User account creation must be deterministic (same inputs = same user account)

**2. Role Assignment (Explicit, Not Inferred)**:
- Assign role to user (admin-controlled, explicit assignment)
- Verify admin role before role assignment (using Authorization module)
- Update user role field (explicit role assignment, not inferred)
- Generate UTID for role change action (using Utilities module)
- Role assignment must be server-side only
- Role assignment must be deterministic (same inputs = same role assignment)
- Role assignment must enforce INVARIANT 3.1 (users cannot change their own role)

**3. User Suspension**:
- Suspend user account (change state from `active` to `suspended`)
- Verify admin role before suspension (using Authorization module)
- Generate UTID for suspension action (using Utilities module)
- User suspension must be server-side only
- User suspension must be deterministic (same inputs = same suspension)

**4. User Deletion**:
- Delete user account (change state from `active` or `suspended` to `deleted`)
- Verify admin role before deletion (using Authorization module)
- Generate UTID for deletion action (using Utilities module)
- User deletion must be server-side only
- User deletion must be deterministic (same inputs = same deletion)
- **Note**: User deletion is terminal state (cannot be reversed)

**5. Alias Generation**:
- Generate stable, non-identifying alias for user (using Utilities module)
- Alias must be unique (no duplicate aliases)
- Alias must be stable (once created, cannot be changed)
- Alias generation must be server-side only
- Alias generation must be deterministic (same inputs = same alias)

**6. User Verification**:
- Verify user exists (check if User entity exists)
- Verify user role (read user role from User entity)
- Verify user state (check if user is active, suspended, or deleted)
- User verification must be server-side only
- User verification must be read-only (no modifications)

**7. Error Response for Invalid Inputs**:
- Use Error Handling module to return standardized errors when inputs are invalid (e.g., missing email, invalid role, user not found)
- Error responses must be consistent (from Error Handling module)
- Error responses must be server-side only
- Error responses must not expose sensitive information

**Constraints**:
- All operations must be server-side only
- All operations must be deterministic (same inputs = same result)
- All operations must be stateless (no internal state)
- All operations must be independently testable
- Role assignment must be explicit (not inferred from email prefix)
- Role changes must verify admin role (INVARIANT 3.1 enforcement)

**BLOCKED Notes**: Role inference from email prefix is BLOCKED FOR PRODUCTION. User Management must use explicit role assignment (admin-controlled, not inferred).

---

## 5. Forbidden Operations

### Operations This Module Must NEVER Perform

**1. Authentication**:
- **FORBIDDEN**: Verify user credentials (authentication is separate from user management)
- **FORBIDDEN**: Manage user sessions (authentication responsibility)
- **FORBIDDEN**: Handle login/logout (authentication responsibility)
- **FORBIDDEN**: Verify user identity (authentication responsibility)
- **Reason**: Authentication is separate from user management (authentication is BLOCKED - VISION.md BLOCKED #1)

**2. Role Inference**:
- **FORBIDDEN**: Infer roles from email prefix (e.g., "admin@example.com" → admin role)
- **FORBIDDEN**: Automatically assign roles based on email patterns
- **FORBIDDEN**: Use email prefix to determine role
- **Reason**: Role inference from email prefix is BLOCKED FOR PRODUCTION (DOMAIN_MODEL.md, BUSINESS_LOGIC.md). User Management must use explicit role assignment (admin-controlled).

**3. Self-Role Changes**:
- **FORBIDDEN**: Allow users to change their own role
- **FORBIDDEN**: Allow users to modify their own role field
- **FORBIDDEN**: Allow users to escalate their own privileges
- **Reason**: INVARIANT 3.1 requires that users cannot change their own role. Only admin can change user roles.

**4. Authorization Logic**:
- **FORBIDDEN**: Perform authorization checks beyond admin role verification (authorization is handled by Authorization module)
- **FORBIDDEN**: Implement role-based permissions (authorization responsibility)
- **FORBIDDEN**: Call Authorization module functions beyond admin role verification (user management is independent of authorization)
- **Reason**: Authorization is handled by the Authorization module (Step 3). User Management only verifies admin role for role changes.

**5. Business Logic**:
- **FORBIDDEN**: Implement core business rules (e.g., transaction processing, inventory management)
- **FORBIDDEN**: Make economic decisions
- **FORBIDDEN**: Modify business entities (e.g., `listings`, `walletLedger`)
- **Reason**: User Management is infrastructure, not business logic. It manages user accounts, not business operations.

**6. Frontend User Management**:
- **FORBIDDEN**: Perform user management operations on frontend
- **FORBIDDEN**: Trust frontend user management decisions
- **FORBIDDEN**: Expose user management logic to frontend
- **Reason**: Frontend is untrusted (architecture.md). User management must be server-side only.

**7. Data Modification (beyond User entity)**:
- **FORBIDDEN**: Create, modify, or delete any entities other than User
- **FORBIDDEN**: Update state of existing business entities
- **Reason**: User Management manages User entities only, not business data.

**8. BLOCKED Capabilities**:
- **FORBIDDEN**: Depend on Authentication module (BLOCKED)
- **FORBIDDEN**: Use role inference from email prefix (BLOCKED FOR PRODUCTION)
- **FORBIDDEN**: Assume BLOCKED capabilities exist
- **FORBIDDEN**: Implement BLOCKED capabilities
- **Reason**: User Management must not require BLOCKED capabilities to function.

**9. Logging Sink Implementation**:
- **FORBIDDEN**: Implement logging sinks (database, files, network) for general system logs
- **FORBIDDEN**: Choose logging destinations or configure logging infrastructure
- **Reason**: User Management creates User entities (its owned entity), but uses Error Handling module for general error logging contracts.

**10. Error Transformation or Filtering**:
- **FORBIDDEN**: Transform, filter, or aggregate errors returned by Error Handling module
- **Reason**: User Management must preserve error truth, not modify it.

---

## 6. Supported Invariants

### Invariants This Module Supports

**1. INVARIANT 3.1: Users Cannot Change Their Own Role**
- **Description**: Users cannot change their own role. Only admin can change user roles. Users cannot modify the `role` field of their own User entity.
- **How Module Supports**:
  - User Management module verifies admin role before role changes (using Authorization module)
  - User Management module prevents users from changing their own role (explicit check: acting user ID !== target user ID)
  - Role change mutations require admin authorization (INVARIANT 3.1 enforcement)
- **Module Responsibility**:
  - Ensure role changes require admin authorization
  - Ensure users cannot change their own role (explicit check)
  - Ensure role changes are logged with UTID (auditability)
- **From INVARIANTS.md**:
  - **Why This Invariant Exists**: Role changes affect authorization. Users changing their own roles would allow privilege escalation.
  - **Mandatory System Response**: Immediate: Block affected role change mutations until admin authorization is added. Required: System operator must investigate and verify admin authorization is added before re-enabling role changes.
- **BLOCKED Notes**: None

---

**2. INVARIANT 4.2: All Meaningful Actions Generate UTIDs**
- **Description**: All meaningful actions (user account creation, role assignment, user suspension, user deletion) must generate UTIDs for auditability.
- **How Module Supports**:
  - User Management module generates UTID for user account creation (using Utilities module)
  - User Management module generates UTID for role assignment (using Utilities module)
  - User Management module generates UTID for user suspension (using Utilities module)
  - User Management module generates UTID for user deletion (using Utilities module)
- **Module Responsibility**:
  - Ensure all user management actions generate UTIDs
  - Ensure UTIDs are generated using Utilities module (deterministic, immutable)
  - Ensure UTIDs are logged with user management actions (auditability)
- **From INVARIANTS.md**:
  - **Why This Invariant Exists**: UTIDs enable auditability and traceability. All meaningful actions must be traceable.
  - **Mandatory System Response**: Immediate: Block affected actions until UTID generation is added. Required: System operator must investigate and verify UTID generation is added before re-enabling actions.
- **BLOCKED Notes**: None

---

## 7. Dependencies

### Required Dependencies

**1. Utilities Module (Step 1)**:
- **Required For**: UTID generation for user management actions, alias generation
- **Status**: Complete and locked
- **Usage**: 
  - Call `generateUTID` for user account creation, role assignment, suspension, deletion
  - Use Utilities module for alias generation (stable, non-identifying aliases)
- **BLOCKED Notes**: None

**2. Error Handling Module (Step 2)**:
- **Required For**: Standardized error responses for invalid inputs or system errors
- **Status**: Complete and locked
- **Usage**: Return standardized errors when user management operations fail (e.g., user not found, invalid role, missing email)
- **BLOCKED Notes**: None

**3. Authorization Module (Step 3)**:
- **Required For**: Admin role verification for role changes, user suspension, user deletion
- **Status**: Complete and locked
- **Usage**: 
  - Call `verifyAdminRole` before role assignment (INVARIANT 3.1 enforcement)
  - Call `verifyAdminRole` before user suspension
  - Call `verifyAdminRole` before user deletion
- **BLOCKED Notes**: None

**4. User Entity**:
- **Required For**: Create, read, update User entities
- **Status**: Database schema entity (convex/schema.ts)
- **Usage**: 
  - Create User entities (user account creation)
  - Read User entities (user verification, role checks)
  - Update User entities (role assignment, suspension, deletion)
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). User Management module must work with explicit role assignment (not email inference).

---

### BLOCKED Dependencies

**1. Authentication Module**:
- **BLOCKED Reason**: Production authentication NOT IMPLEMENTED (VISION.md BLOCKED #1)
- **Impact**: User Management module cannot verify user credentials (assumes user context is provided by calling code)
- **Workaround**: User Management module works with authenticated user context (provided by calling code)
- **BLOCKED Notes**: Authentication is BLOCKED (VISION.md BLOCKED #1). User Management module must work without authentication module. User Management module assumes user context is provided by calling code (authentication is handled separately).

**2. Role Inference Mechanism**:
- **BLOCKED Reason**: Role inference from email prefix is BLOCKED FOR PRODUCTION (DOMAIN_MODEL.md, BUSINESS_LOGIC.md)
- **Impact**: User Management module cannot infer roles from email prefix (requires explicit role assignment)
- **Workaround**: User Management module works with explicit role assignment (admin-controlled, not inferred)
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). User Management module must work with explicit role assignment (not email inference). User Management module requires explicit role field in User entity (not inferred).

---

## 8. Safe Stopping Guarantees

### Safe Stopping Definition

**Safe Stopping**: System can be safely stopped after User Management module implementation without:
- Creating irreversible damage
- Creating data corruption
- Creating security vulnerabilities
- Violating invariants
- Requiring rollback

**Why Stopping After User Management Is Safe**:
- User Management module has minimal dependencies (Utilities, Error Handling, Authorization, User entity)
- User Management module creates User entities only (no business data created)
- User Management module has no side effects beyond User entity creation/modification
- User Management module is independently testable (can be validated independently)
- User Management module preserves invariants (INVARIANT 3.1, INVARIANT 4.2)

**Safe Stopping Guarantee**:
- **Data Created**: User Management module creates User entities only (no business data)
- **Side Effects**: User Management module modifies User entities only (no external state modifications beyond User entity)
- **State**: User Management module is stateless (no internal state to preserve)
- **Minimal Dependencies**: User Management module depends only on Utilities, Error Handling, Authorization, and User entity
- **Pure Functions**: All user management operations are deterministic (same inputs = same result, assuming same database state)

**BLOCKED Notes**: None (user management is foundational, no BLOCKED dependencies that prevent safe stopping)

---

## 9. What This Module MUST NOT Do

### Explicit Constraints

**1. MUST NOT Perform Authentication**:
- User Management module MUST NOT verify user credentials, manage user sessions, or handle login/logout.
- **Reason**: Authentication is separate from user management (authentication is BLOCKED - VISION.md BLOCKED #1).

**2. MUST NOT Infer Roles**:
- User Management module MUST NOT infer roles from email prefix, automatically assign roles based on email patterns, or use email prefix to determine role.
- **Reason**: Role inference from email prefix is BLOCKED FOR PRODUCTION (DOMAIN_MODEL.md, BUSINESS_LOGIC.md). User Management must use explicit role assignment (admin-controlled).

**3. MUST NOT Allow Self-Role Changes**:
- User Management module MUST NOT allow users to change their own role, modify their own role field, or escalate their own privileges.
- **Reason**: INVARIANT 3.1 requires that users cannot change their own role. Only admin can change user roles.

**4. MUST NOT Perform Authorization Beyond Admin Verification**:
- User Management module MUST NOT perform authorization checks beyond admin role verification, implement role-based permissions, or call Authorization module functions beyond admin role verification.
- **Reason**: Authorization is handled by the Authorization module (Step 3). User Management only verifies admin role for role changes.

**5. MUST NOT Implement Business Logic**:
- User Management module MUST NOT implement core business rules, make economic decisions, or modify business entities.
- **Reason**: User Management is infrastructure, not business logic. It manages user accounts, not business operations.

**6. MUST NOT Perform Frontend User Management**:
- User Management module MUST NOT perform user management operations on frontend, trust frontend user management decisions, or expose user management logic to frontend.
- **Reason**: Frontend is untrusted (architecture.md). User management must be server-side only.

**7. MUST NOT Modify Data Beyond User Entity**:
- User Management module MUST NOT create, modify, or delete any entities other than User, or update state of existing business entities.
- **Reason**: User Management manages User entities only, not business data.

**8. MUST NOT Depend on BLOCKED Capabilities**:
- User Management module MUST NOT depend on Authentication module (BLOCKED), use role inference from email prefix (BLOCKED FOR PRODUCTION), assume BLOCKED capabilities exist, or implement BLOCKED capabilities.
- **Reason**: User Management must not require BLOCKED capabilities to function.

**9. MUST NOT Implement Logging Sinks**:
- User Management module MUST NOT implement logging sinks (database, files, network), choose logging destinations, or configure logging infrastructure.
- **Reason**: User Management creates User entities (its owned entity), but uses Error Handling module for general error logging contracts.

**10. MUST NOT Transform or Filter Errors**:
- User Management module MUST NOT transform, filter, or aggregate errors returned by Error Handling module.
- **Reason**: User Management must preserve error truth, not modify it.

---

## 10. Cross-References

### DOMAIN_MODEL.md

**Reference**: DOMAIN_MODEL.md defines entities, ownership, and state transitions.

**Relevance**:
- User Management module creates and modifies `User` entity.
- `User` entity has explicit `role` field (verified in `convex/schema.ts`).
- Role inference from email prefix is BLOCKED FOR PRODUCTION. User Management module must work with explicit role assignment (not email inference).
- User entity states: `active` (initial), `suspended` (non-terminal), `deleted` (terminal).

**BLOCKED Notes**: Role inference from email prefix is BLOCKED FOR PRODUCTION. User Management module must work with explicit role assignment (not email inference).

---

### INVARIANTS.md

**Reference**: INVARIANTS.md defines non-negotiable constraints.

**Relevance**:
- User Management module directly supports INVARIANT 3.1 (Users Cannot Change Their Own Role).
- User Management module directly supports INVARIANT 4.2 (All Meaningful Actions Generate UTIDs).

**BLOCKED Notes**: None

---

### MODULARITY_GUIDE.md

**Reference**: MODULARITY_GUIDE.md defines module boundaries and forbidden couplings.

**Relevance**:
- User Management module: User account creation, role assignment, user suspension/deletion, alias generation.
- Owned entities: User.
- Trust boundary: Trusted (server-side only).
- Dependencies: Utilities, Error Handling, Authorization, User entity.
- Forbidden couplings: MUST NOT be tightly coupled to any specific business logic module (user management is cross-cutting).

**BLOCKED Notes**: None

---

### IMPLEMENTATION_BOUNDARIES.md

**Reference**: IMPLEMENTATION_BOUNDARIES.md defines coding constraints.

**Relevance**:
- User Management is an allowed module.
- User Management must not implement BLOCKED capabilities.
- User Management must not depend on BLOCKED capabilities.
- User Management must respect forbidden couplings.

**BLOCKED Notes**: None

---

### architecture.md

**Reference**: architecture.md defines trust boundaries and kill switches.

**Relevance**:
- User Management module enforces trust boundaries (Trusted Backend, Untrusted Frontend).
- User Management module is part of the Trusted Backend.
- User Management module ensures frontend cannot bypass user management (all operations are server-side).

**BLOCKED Notes**: None

---

### BUSINESS_LOGIC.md

**Reference**: BUSINESS_LOGIC.md defines user account creation workflow.

**Relevance**:
- User Management module implements Workflow 1: User Account Creation.
- User account creation is reversible (admin can delete user account).
- Role assignment is reversible (admin can change user role).
- Alias generation is NOT reversible (aliases are stable once created).
- Role inference from email prefix is BLOCKED FOR PRODUCTION.

**BLOCKED Notes**: Role inference from email prefix is BLOCKED FOR PRODUCTION. User Management module must use explicit role assignment (admin-controlled, not inferred).

---

## 11. Module Prerequisites

### Prerequisites Check

**1. Utilities Module (Step 1)**:
- **Status**: ✅ Complete and locked
- **Required For**: UTID generation, alias generation
- **Prerequisite Met**: Yes

**2. Error Handling Module (Step 2)**:
- **Status**: ✅ Complete and locked
- **Required For**: Standardized error responses
- **Prerequisite Met**: Yes

**3. Authorization Module (Step 3)**:
- **Status**: ✅ Complete and locked
- **Required For**: Admin role verification for role changes
- **Prerequisite Met**: Yes

**4. Rate Limiting Module (Step 4)**:
- **Status**: ✅ Complete and locked
- **Required For**: None (user management is independent of rate limiting)
- **Prerequisite Met**: N/A (not required, but available)

**5. User Entity**:
- **Status**: ✅ Database schema entity exists (convex/schema.ts)
- **Required For**: Create, read, update User entities
- **Prerequisite Met**: Yes

**6. Role Assignment Mechanism**:
- **Status**: ⚠️ BLOCKED FOR PRODUCTION
- **Required For**: Explicit role assignment (not email inference)
- **Prerequisite Met**: No (role inference is BLOCKED, explicit role assignment required)
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). User Management module must work with explicit role assignment (not email inference). This is a BLOCKED dependency, but User Management module can proceed if explicit role assignment is implemented (admin-controlled, not inferred).

---

## 12. Final Check

### Module Purpose

**Verified**: This module provides:
- **User Account Creation**: Create new User entity with email, role, alias, and timestamps
- **Role Assignment**: Assign role to user (admin-controlled, explicit assignment)
- **User Suspension**: Suspend user account (change state from `active` to `suspended`)
- **User Deletion**: Delete user account (change state to `deleted`)
- **Alias Generation**: Generate stable, non-identifying alias for user
- **User Verification**: Verify user exists, verify user role, verify user state

**BLOCKED Notes**: Role inference from email prefix is BLOCKED FOR PRODUCTION. User Management module must work with explicit role assignment (not email inference).

---

### Owned Entities

**Verified**: This module owns:
- **User**: User account with role, email, alias, and state

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
- Create User entities (user account creation)
- Assign roles to users (admin-controlled, explicit assignment)
- Suspend user accounts (admin-controlled)
- Delete user accounts (admin-controlled)
- Generate aliases (stable, non-identifying)
- Verify user existence, role, and state (read-only)
- Use Utilities module for UTID generation and alias generation
- Use Error Handling module for error responses
- Use Authorization module for admin role verification

**BLOCKED Notes**: Role inference from email prefix is BLOCKED FOR PRODUCTION. User Management module must use explicit role assignment (not email inference).

---

### Forbidden Operations

**Verified**: This module is forbidden from:
- Authentication (verifying credentials, managing sessions)
- Role inference (inferring roles from email prefix)
- Self-role changes (allowing users to change their own role)
- Authorization logic (beyond admin role verification)
- Business logic (implementing business rules)
- Frontend user management (performing user management on frontend)
- Data modification (beyond User entity)
- BLOCKED capabilities (depending on Authentication module, using role inference)
- Logging sink implementation (Error Handling module responsibility)
- Error transformation or filtering (Error Handling module responsibility)

**BLOCKED Notes**: None (forbidden operations are explicit)

---

### Supported Invariants

**Verified**: This module supports:
- **INVARIANT 3.1**: Users Cannot Change Their Own Role (admin role verification enforced, self-role changes prevented)
- **INVARIANT 4.2**: All Meaningful Actions Generate UTIDs (UTID generation for all user management actions)

**BLOCKED Notes**: None

---

### Dependencies

**Verified**: This module has:
- **Required Dependencies**: Utilities module (Step 1), Error Handling module (Step 2), Authorization module (Step 3), User entity
- **BLOCKED Dependencies**: Authentication module (BLOCKED), Role inference mechanism (BLOCKED FOR PRODUCTION)

**BLOCKED Notes**: User Management module can proceed if explicit role assignment is implemented (admin-controlled, not inferred). Role assignment must be explicit (admin-controlled), not inferred from email prefix.

---

### Safe Stopping Guarantees

**Verified**: Stopping after this step is safe because:
- User Management module creates User entities only (no business data created)
- User Management module has no side effects beyond User entity creation/modification
- User Management module is stateless (no internal state to preserve)
- User Management module is deterministic (same inputs = same result, assuming same database state)
- User Management module is independently testable (can be validated independently)
- User Management module has minimal dependencies (Utilities, Error Handling, Authorization, User entity)

**BLOCKED Notes**: None (user management is foundational, no BLOCKED dependencies that prevent safe stopping)

---

**CURRENT MODULE STATUS**: ✅ **ALLOWED**

**User Management module specification is defined. Module can proceed. User entity has explicit role field in schema (convex/schema.ts line 25). User Management module creates and modifies User entities (explicit role assignment, not inferred). Role assignment mechanism is BLOCKED FOR PRODUCTION (inference from email prefix), but this does not block User Management module (role assignment is explicit, admin-controlled, not inferred).**

**Justification**:
- All prerequisites are met (Utilities module Step 1 complete, Error Handling module Step 2 complete, Authorization module Step 3 complete, User entity exists with explicit role field)
- User entity schema has explicit role field: `role: v.union(v.literal("farmer"), v.literal("trader"), v.literal("buyer"), v.literal("admin"))` (convex/schema.ts)
- User Management module uses explicit role assignment (admin-controlled, not inferred)
- Role assignment mechanism BLOCKED FOR PRODUCTION does not block User Management module (role assignment is explicit, admin-controlled, not inferred)
- User Management module does not require BLOCKED capabilities to function (only requires explicit role assignment, not role inference)
- User Management module is safe to stop after (creates User entities only, no business data)
- User Management module supports required invariants (INVARIANT 3.1, INVARIANT 4.2)
- All dependencies are satisfied (Utilities, Error Handling, Authorization, User entity with explicit role field)

---

*This document must be updated when implementation begins, contracts change, or new user management requirements are needed. No assumptions. Only truth.*
