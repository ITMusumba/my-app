# Authorization Module Specification

**Module**: Authorization  
**Step**: 3 (IMPLEMENTATION_SEQUENCE.md Step 3)  
**Status**: Specification only (no code, no interfaces, no test cases)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- IMPLEMENTATION_SEQUENCE.md Step 3 defines this module
- IMPLEMENTATION_BOUNDARIES.md defines coding constraints
- INVARIANTS.md (2.1, 2.2, 2.3) defines authorization invariants
- DOMAIN_MODEL.md defines User entity and role states
- MODULARITY_GUIDE.md defines module boundaries and trust boundaries
- architecture.md defines trust boundaries and kill switches
- Utilities module (Step 1) is complete and locked
- Error Handling module (Step 2) is complete and locked

**Purpose**: This document defines the Authorization module specification. This is NOT an implementation guide. This defines requirements, not code or interfaces.

---

## 1. Module Purpose

### Core Purpose

**Authorization Module** provides role-based access control, permission enforcement, and admin role verification required by all other modules. This module enables server-side authorization enforcement and prevents unauthorized access to system operations.

**Why This Module Exists**:
- All modules require authorization checks (server-side enforcement)
- All modules require admin role verification (admin-only operations)
- All modules require permission enforcement (role-based access control)
- Authorization supports invariant enforcement (INVARIANT 2.1, 2.2, 2.3)
- Authorization prevents unauthorized access to system operations

**Why This Module Must Be Third**:
- Depends on Utilities module (Step 1) for UTID generation in authorization logs
- Depends on Error Handling module (Step 2) for standardized error responses
- Required by all other modules (foundational authorization infrastructure)
- Provides authorization enforcement (all modules need authorization)
- Safe to stop after (no data created, no side effects)

**Why No Other Module Can Precede**:
- All other modules depend on Authorization (for authorization checks)
- Building other modules first would violate dependency constraints
- Building other modules first would create unsafe state (missing authorization enforcement)
- Authorization must be in place before business logic modules are built

---

## 2. Owned Entities

### Entities Owned by Authorization Module

**None**: Authorization module does not own any entities.

**Reason**: Authorization module provides infrastructure (authorization checks, role verification, permission enforcement), not business entities. Authorization checks access, does not create or modify data.

**From MODULARITY_GUIDE.md**:
- **Owned Entities**: None (authorization does not own entities, only enforces access rules)

**BLOCKED Notes**: None

---

## 3. Trust Boundary Classification

### Explicit Trust Boundary

**Trust Boundary Classification**: **Trusted (Server-Side)**

**From architecture.md**:
- **Backend (Convex)**: Trusted (server-side)
- **Authorization Enforcement**: All authorization is enforced in Convex backend
- **Trust Boundary**: Server-side only (backend is trusted, frontend is untrusted)

**Trust Boundary Requirements**:
- Authorization checks must be performed server-side only (in Convex backend)
- Authorization checks must NOT be performed on frontend (frontend is untrusted)
- Authorization checks must NOT be exposed to frontend (authorization logic is server-side only)
- Authorization decisions must be made server-side (frontend cannot bypass authorization)

**Kill-Switch Points** (from architecture.md):
- Authorization module does not implement kill-switches (kill-switches are system-level)
- Authorization module supports kill-switch enforcement (authorization checks can block operations)
- Authorization module does not control kill-switches (kill-switches are controlled by system operator)

**Single-Human Authority Control Points** (from architecture.md):
- Authorization module does not implement authority control points (authority is system-level)
- Authorization module enforces authority boundaries (admin role verification)
- Authorization module does not control authority (authority is controlled by system operator)

**BLOCKED Notes**: None

---

## 4. Allowed Operations

### Operations This Module Is Allowed to Perform

**1. Role-Based Access Control**:
- Check user role (farmer, trader, buyer, admin)
- Verify role matches operation requirements
- Enforce role-based permissions
- Role checks must be server-side only
- Role checks must be deterministic (same inputs = same authorization decision)

**2. Permission Enforcement**:
- Verify user has permission for operation
- Enforce operation-specific permissions
- Block unauthorized operations
- Permission checks must be server-side only
- Permission checks must be deterministic (same inputs = same authorization decision)

**3. Admin Role Verification**:
- Verify user has admin role
- Enforce admin-only operations
- Block non-admin access to admin operations
- Admin verification must be server-side only
- Admin verification must be deterministic (same inputs = same authorization decision)

**4. Server-Side Authorization Checks**:
- Perform authorization checks before operation execution
- Reject operations without authorization
- Log authorization decisions (if logging is available)
- Authorization checks must be server-side only
- Authorization checks must be deterministic (same inputs = same authorization decision)

**5. UTID Generation for Authorization Logs**:
- Use Utilities module to generate UTIDs for authorization logs
- UTID generation must be deterministic (from Utilities module)
- UTID generation must be pure (from Utilities module)
- UTID generation must be stateless (from Utilities module)

**6. Error Response for Authorization Failures**:
- Use Error Handling module to return standardized errors when authorization fails
- Error responses must be consistent (from Error Handling module)
- Error responses must be server-side only
- Error responses must not expose sensitive information

**Constraints**:
- All authorization checks must be server-side only
- All authorization checks must be deterministic (same inputs = same authorization decision)
- All authorization checks must be pure (no side effects beyond authorization decision)
- All authorization checks must be stateless (no internal state)
- All authorization checks must be independently testable

**BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference).

---

## 5. Forbidden Operations

### Operations This Module Must NEVER Perform

**1. Authentication**:
- **FORBIDDEN**: Verify user credentials (authentication is separate from authorization)
- **FORBIDDEN**: Manage user sessions (authentication responsibility)
- **FORBIDDEN**: Handle login/logout (authentication responsibility)
- **FORBIDDEN**: Verify user identity (authentication responsibility)
- **Reason**: Authorization is separate from authentication (authentication is BLOCKED - VISION.md BLOCKED #1)

**2. Role Assignment**:
- **FORBIDDEN**: Assign roles to users (User Management responsibility)
- **FORBIDDEN**: Infer roles from email prefix (BLOCKED FOR PRODUCTION)
- **FORBIDDEN**: Change user roles (User Management responsibility)
- **FORBIDDEN**: Create user accounts (User Management responsibility)
- **Reason**: Authorization checks roles, does not assign them. Role inference from email prefix is BLOCKED FOR PRODUCTION (DOMAIN_MODEL.md, BUSINESS_LOGIC.md).

**3. User Management**:
- **FORBIDDEN**: Create user accounts (User Management responsibility)
- **FORBIDDEN**: Delete user accounts (User Management responsibility)
- **FORBIDDEN**: Suspend user accounts (User Management responsibility)
- **FORBIDDEN**: Modify user data (User Management responsibility)
- **Reason**: Authorization checks users, does not manage them

**4. Frontend Authorization**:
- **FORBIDDEN**: Perform authorization checks on frontend (authorization must be server-side only)
- **FORBIDDEN**: Trust frontend authorization decisions (authorization must be server-side only)
- **FORBIDDEN**: Expose authorization logic to frontend (authorization must be server-side only)
- **FORBIDDEN**: Allow frontend to bypass authorization (authorization must be server-side only)
- **Reason**: INVARIANT 2.3 requires server-side authorization only. Frontend is untrusted (architecture.md).

**5. Business Logic**:
- **FORBIDDEN**: Implement business logic (authorization is infrastructure, not business logic)
- **FORBIDDEN**: Make business decisions (authorization is infrastructure, not business logic)
- **FORBIDDEN**: Enforce business rules (authorization is infrastructure, not business logic)
- **FORBIDDEN**: Process transactions (authorization is infrastructure, not business logic)
- **Reason**: Authorization is infrastructure, not business logic

**6. Database Modifications**:
- **FORBIDDEN**: Create entities (authorization does not create entities)
- **FORBIDDEN**: Modify entities (authorization does not modify entities)
- **FORBIDDEN**: Delete entities (authorization does not delete entities)
- **FORBIDDEN**: Update entity state (authorization does not update entity state)
- **Reason**: Authorization checks access, does not modify data

**7. BLOCKED Capabilities**:
- **FORBIDDEN**: Depend on Authentication module (BLOCKED - production authentication NOT IMPLEMENTED)
- **FORBIDDEN**: Use role inference from email prefix (BLOCKED FOR PRODUCTION)
- **FORBIDDEN**: Assume BLOCKED capabilities exist
- **FORBIDDEN**: Implement BLOCKED capabilities
- **Reason**: Authorization must not require BLOCKED capabilities

**8. Client-Side Authorization**:
- **FORBIDDEN**: Perform authorization checks on client (authorization must be server-side only)
- **FORBIDDEN**: Trust client authorization decisions (authorization must be server-side only)
- **FORBIDDEN**: Expose authorization logic to client (authorization must be server-side only)
- **FORBIDDEN**: Allow client to bypass authorization (authorization must be server-side only)
- **Reason**: INVARIANT 2.3 requires server-side authorization only. Client is untrusted (architecture.md).

**9. Logging Sink Implementation**:
- **FORBIDDEN**: Implement logging sinks (database, files, network)
- **FORBIDDEN**: Choose logging destinations
- **FORBIDDEN**: Configure logging infrastructure
- **Reason**: Authorization module may use logging contracts (from Error Handling module), but does not implement logging sinks

**10. Error Transformation or Filtering**:
- **FORBIDDEN**: Transform errors (errors must be preserved as-is)
- **FORBIDDEN**: Filter errors (all errors must be available)
- **FORBIDDEN**: Aggregate errors (errors must be individual)
- **Reason**: Authorization module uses Error Handling module for errors, does not transform them

---

## 6. Supported Invariants

### Invariants This Module Supports

**INVARIANT 2.1: Server-Side Authorization Enforcement**

**How Module Supports**:
- Authorization module provides server-side authorization checks
- All authorization checks are performed server-side (not client-side)
- Authorization checks are enforced before operation execution
- Authorization checks cannot be bypassed by frontend

**Module Responsibility**:
- Provide server-side authorization check functions
- Ensure authorization checks are server-side only
- Ensure authorization checks are enforced before operations
- Ensure authorization checks cannot be bypassed

**From INVARIANTS.md**:
- **Description**: All authorization checks must be performed server-side (in Convex backend). Frontend cannot bypass authorization. All mutations require server-side authorization verification.
- **Why This Invariant Exists**: Client-side authorization can be bypassed. Server-side enforcement is the only trusted authorization boundary.
- **Mandatory System Response**: Block affected mutations until authorization is added, log violation, notify system operator

**BLOCKED Notes**: None

---

**INVARIANT 2.2: Admin Role Verification**

**How Module Supports**:
- Authorization module provides admin role verification
- Admin role verification is server-side only
- Admin role verification is enforced before admin operations
- Admin role verification cannot be bypassed

**Module Responsibility**:
- Provide admin role verification function
- Ensure admin role verification is server-side only
- Ensure admin role verification is enforced before admin operations
- Ensure admin role verification cannot be bypassed

**From INVARIANTS.md**:
- **Description**: All admin actions must verify that the acting user has `role === "admin"` (verified server-side). Admin actions include: delivery verification, transaction reversal, purchase window control, pilot mode control, user role changes.
- **Why This Invariant Exists**: Admin actions have significant authority. Unauthorized admin actions could harm users or compromise system integrity.
- **Mandatory System Response**: Block affected admin actions until role verification is added, log violation, notify system operator

**BLOCKED Notes**: Delivery verification function implementation status is UNKNOWN (may not be implemented). Authorization module must still verify admin role for delivery verification operations (if implemented).

---

**INVARIANT 2.3: Frontend Cannot Bypass Authorization**

**How Module Supports**:
- Authorization module provides server-side authorization checks only
- Authorization checks are not exposed to frontend
- Authorization checks cannot be bypassed by frontend
- Authorization checks are enforced server-side before operations

**Module Responsibility**:
- Provide server-side authorization checks only
- Ensure authorization checks are not exposed to frontend
- Ensure authorization checks cannot be bypassed by frontend
- Ensure authorization checks are enforced server-side

**From INVARIANTS.md**:
- **Description**: Frontend (Next.js) cannot bypass backend authorization. All user actions must go through backend mutations that enforce authorization.
- **Why This Invariant Exists**: Frontend is untrusted. Authorization bypass would allow unauthorized actions.
- **Mandatory System Response**: Block affected frontend features until authorization bypass is removed, log violation, notify system operator

**BLOCKED Notes**: None

---

## 7. Dependencies

### Required Dependencies

**1. Utilities Module (Step 1)**:
- **Required For**: UTID generation for authorization logs
- **Status**: ✅ Complete and locked
- **Usage**: Generate UTIDs for authorization decisions (if logging is implemented)
- **Dependency Type**: Direct dependency (imports from Utilities module)
- **BLOCKED Notes**: None

**2. Error Handling Module (Step 2)**:
- **Required For**: Standardized error responses for authorization failures
- **Status**: ✅ Complete and locked
- **Usage**: Return standardized errors when authorization fails
- **Dependency Type**: Direct dependency (imports from Error Handling module)
- **BLOCKED Notes**: None

**3. User Entity**:
- **Required For**: Check user role
- **Status**: ✅ Database schema entity exists
- **Usage**: Read user role from User entity
- **Dependency Type**: Database entity dependency (reads from User entity)
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference).

**From IMPLEMENTATION_SEQUENCE.md Step 3**:
- **Dependencies**: Requires User entity (to check role), Requires Utilities (for UTID generation in authorization logs)
- **What This Step MUST NOT Depend On**: User Management module (can work with minimal User entity), Authentication module (BLOCKED - production authentication NOT IMPLEMENTED), BLOCKED capabilities (no BLOCKED dependencies)

---

### BLOCKED Dependencies

**1. Authentication Module**:
- **BLOCKED Reason**: Production authentication NOT IMPLEMENTED (VISION.md BLOCKED #1)
- **Impact**: Authorization module cannot verify user credentials
- **Workaround**: Authorization module works with authenticated user context (provided by calling code)
- **BLOCKED Notes**: Authentication is BLOCKED (VISION.md BLOCKED #1). Authorization module must work without authentication module. Authorization module assumes user context is provided by calling code (authentication is handled separately).

**2. User Management Module**:
- **BLOCKED Reason**: User Management module is Step 5 (not yet implemented)
- **Impact**: Authorization module cannot create or modify users
- **Workaround**: Authorization module works with existing User entity (read-only)
- **BLOCKED Notes**: User Management module is not yet implemented. Authorization module can work with minimal User entity (read-only access to role field).

**3. Role Assignment Mechanism**:
- **BLOCKED Reason**: Role inference from email prefix is BLOCKED FOR PRODUCTION (DOMAIN_MODEL.md, BUSINESS_LOGIC.md)
- **Impact**: Authorization module cannot infer roles from email prefix
- **Workaround**: Authorization module works with explicit role assignment (User entity has explicit role field)
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference). Authorization module requires User entity with explicit role field (not inferred).

---

## 8. Safe Stopping Guarantees

### Safe Stopping Definition

**Safe Stopping**: System can be safely stopped after Authorization module implementation without:
- Creating irreversible damage
- Creating data corruption
- Creating security vulnerabilities
- Violating invariants
- Requiring rollback

**Why Stopping After Authorization Is Safe**:
- Authorization module has minimal dependencies (Utilities, Error Handling, User entity)
- Authorization module creates no data (no entities created)
- Authorization module has no side effects (no external state modified)
- Authorization module is pure and stateless (no internal state to preserve)
- Authorization module is independently testable (can be validated independently)

**Safe Stopping Guarantee**:
- **No Data Created**: Authorization module does not create any entities or data
- **No Side Effects**: Authorization module does not create side effects (no database writes, no external state modifications)
- **No State**: Authorization module is stateless (no internal state to preserve)
- **Minimal Dependencies**: Authorization module depends only on Utilities, Error Handling, and User entity
- **Pure Functions**: All authorization checks are pure (deterministic, no side effects)
- **Independently Testable**: Authorization module can be tested independently

**From IMPLEMENTATION_SEQUENCE.md Step 3**:
- **Safe Stopping Point**: Yes (authorization is independent, no data created)

**BLOCKED Notes**: None (authorization is foundational, no BLOCKED dependencies that prevent safe stopping)

---

## 9. What This Module MUST NOT Do

### Explicit Constraints

**1. MUST NOT Perform Authentication**:
- Authorization module MUST NOT verify user credentials
- Authorization module MUST NOT manage user sessions
- Authorization module MUST NOT handle login/logout
- **Reason**: Authentication is separate from authorization (authentication is BLOCKED)

**2. MUST NOT Assign Roles**:
- Authorization module MUST NOT assign roles to users
- Authorization module MUST NOT infer roles from email prefix
- Authorization module MUST NOT change user roles
- **Reason**: Authorization checks roles, does not assign them. Role inference is BLOCKED FOR PRODUCTION.

**3. MUST NOT Manage Users**:
- Authorization module MUST NOT create user accounts
- Authorization module MUST NOT delete user accounts
- Authorization module MUST NOT suspend user accounts
- **Reason**: Authorization checks users, does not manage them

**4. MUST NOT Perform Frontend Authorization**:
- Authorization module MUST NOT perform authorization checks on frontend
- Authorization module MUST NOT trust frontend authorization decisions
- Authorization module MUST NOT expose authorization logic to frontend
- **Reason**: INVARIANT 2.3 requires server-side authorization only

**5. MUST NOT Implement Business Logic**:
- Authorization module MUST NOT implement business logic
- Authorization module MUST NOT make business decisions
- Authorization module MUST NOT enforce business rules
- **Reason**: Authorization is infrastructure, not business logic

**6. MUST NOT Modify Database**:
- Authorization module MUST NOT create entities
- Authorization module MUST NOT modify entities
- Authorization module MUST NOT delete entities
- **Reason**: Authorization checks access, does not modify data

**7. MUST NOT Depend on BLOCKED Capabilities**:
- Authorization module MUST NOT depend on Authentication module (BLOCKED)
- Authorization module MUST NOT use role inference from email prefix (BLOCKED FOR PRODUCTION)
- Authorization module MUST NOT assume BLOCKED capabilities exist
- **Reason**: Authorization must not require BLOCKED capabilities

**8. MUST NOT Implement Logging Sinks**:
- Authorization module MUST NOT implement logging sinks (database, files, network)
- Authorization module MUST NOT choose logging destinations
- Authorization module MUST NOT configure logging infrastructure
- **Reason**: Authorization module may use logging contracts (from Error Handling module), but does not implement logging sinks

---

## 10. Cross-References

### DOMAIN_MODEL.md

**Reference**: DOMAIN_MODEL.md defines User entity and role states.

**Relevance**:
- Authorization module reads User entity to check role
- Authorization module does not own User entity (User entity is owned by User)
- Authorization module does not modify User entity (read-only access to role field)
- Authorization module works with explicit role assignment (not inferred)

**BLOCKED Notes**: Role inference from email prefix is BLOCKED FOR PRODUCTION. Authorization module must work with explicit role assignment (not email inference).

---

### INVARIANTS.md

**Reference**: INVARIANTS.md defines non-negotiable constraints.

**Relevance**:
- Authorization module supports INVARIANT 2.1 (Server-Side Authorization Enforcement)
- Authorization module supports INVARIANT 2.2 (Admin Role Verification)
- Authorization module supports INVARIANT 2.3 (Frontend Cannot Bypass Authorization)
- Authorization module does not directly protect other invariants (indirect support only)

**BLOCKED Notes**: Delivery verification function implementation status is UNKNOWN (may not be implemented). Authorization module must still verify admin role for delivery verification operations (if implemented).

---

### MODULARITY_GUIDE.md

**Reference**: MODULARITY_GUIDE.md defines module boundaries and forbidden couplings.

**Relevance**:
- Authorization module: Role-based access control, permission enforcement, admin role verification
- Owned entities: None (authorization does not own entities, only enforces access rules)
- Trust boundary: Trusted (server-side only)
- Dependencies: Required by all modules that perform operations
- Forbidden couplings: MUST NOT be tightly coupled to any specific business logic module (authorization is cross-cutting)

**BLOCKED Notes**: None

---

### IMPLEMENTATION_BOUNDARIES.md

**Reference**: IMPLEMENTATION_BOUNDARIES.md defines coding constraints.

**Relevance**:
- Authorization is an allowed module (from MODULARITY_GUIDE.md)
- Authorization must not implement BLOCKED capabilities
- Authorization must not depend on BLOCKED capabilities
- Authorization must respect forbidden couplings
- Authorization must enforce invariants (INVARIANT 2.1, 2.2, 2.3)

**BLOCKED Notes**: None

---

### architecture.md

**Reference**: architecture.md defines trust boundaries, kill-switches, and single-human authority.

**Relevance**:
- Authorization module is in trusted boundary (server-side, Convex backend)
- Authorization module enforces trust boundaries (server-side authorization only)
- Authorization module does not implement kill-switches (kill-switches are system-level)
- Authorization module supports kill-switch enforcement (authorization checks can block operations)
- Authorization module enforces authority boundaries (admin role verification)
- Authorization module does not control authority (authority is controlled by system operator)

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

**3. User Entity**:
- **Status**: ✅ Database schema entity exists
- **Required For**: Check user role
- **Prerequisite Met**: Yes (User entity exists in schema)

**4. Role Assignment Mechanism**:
- **Status**: ⚠️ BLOCKED FOR PRODUCTION
- **Required For**: Explicit role assignment (not email inference)
- **Prerequisite Met**: Conditional (User entity must have explicit role field, not inferred)
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference). This is a BLOCKED dependency, but Authorization module can proceed if User entity has explicit role field.

**Prerequisites Summary**:
- **All Prerequisites Met**: ⚠️ Conditional (User entity must have explicit role field)
- **Module Status**: ⚠️ **CONDITIONALLY ALLOWED** (can proceed if User entity has explicit role field)

**BLOCKED Notes**: Authorization module can proceed if User entity has explicit role field (not inferred). Role assignment must be explicit (admin-controlled), not inferred from email prefix.

---

## 12. Final Check

### Module Purpose

**Verified**: This module provides:
- **Role-Based Access Control**: Check user role, verify role matches operation requirements, enforce role-based permissions
- **Permission Enforcement**: Verify user has permission for operation, enforce operation-specific permissions, block unauthorized operations
- **Admin Role Verification**: Verify user has admin role, enforce admin-only operations, block non-admin access to admin operations
- **Server-Side Authorization Checks**: Perform authorization checks before operation execution, reject operations without authorization, log authorization decisions (if logging is available)

**BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference).

---

### Owned Entities

**Verified**: This module owns:
- **None**: Authorization module does not own any entities

**BLOCKED Notes**: None

---

### Trust Boundary Classification

**Verified**: This module is classified as:
- **Trust Boundary**: Trusted (Server-Side)
- **Location**: Convex backend (server-side only)
- **Enforcement**: Server-side authorization checks only
- **Frontend Access**: None (authorization is not exposed to frontend)

**BLOCKED Notes**: None

---

### Allowed Operations

**Verified**: This module is allowed to:
- Check user role (farmer, trader, buyer, admin)
- Verify role matches operation requirements
- Enforce role-based permissions
- Verify user has permission for operation
- Verify user has admin role
- Enforce admin-only operations
- Perform server-side authorization checks
- Use Utilities module for UTID generation
- Use Error Handling module for standardized error responses

**BLOCKED Notes**: None (allowed operations are foundational)

---

### Forbidden Operations

**Verified**: This module is forbidden from:
- Authentication (verifying credentials, managing sessions, handling login/logout)
- Role assignment (assigning roles, inferring roles from email)
- User management (creating, deleting, suspending users)
- Frontend authorization (performing authorization checks on frontend)
- Business logic (implementing business logic, making business decisions)
- Database modifications (creating, modifying, deleting entities)
- BLOCKED capabilities (depending on Authentication module, using role inference)
- Client-side authorization (performing authorization checks on client)
- Logging sink implementation (implementing logging sinks)
- Error transformation or filtering (transforming or filtering errors)

**BLOCKED Notes**: None (forbidden operations are explicit)

---

### Supported Invariants

**Verified**: This module supports:
- **INVARIANT 2.1**: Server-Side Authorization Enforcement (authorization checks are server-side only)
- **INVARIANT 2.2**: Admin Role Verification (admin role verification is server-side only)
- **INVARIANT 2.3**: Frontend Cannot Bypass Authorization (authorization checks cannot be bypassed by frontend)

**BLOCKED Notes**: Delivery verification function implementation status is UNKNOWN (may not be implemented). Authorization module must still verify admin role for delivery verification operations (if implemented).

---

### Dependencies

**Verified**: This module has:
- **Required Dependencies**: Utilities module (Step 1), Error Handling module (Step 2), User entity
- **BLOCKED Dependencies**: Authentication module (BLOCKED), User Management module (not yet implemented), Role assignment mechanism (BLOCKED FOR PRODUCTION)

**BLOCKED Notes**: Authorization module can proceed if User entity has explicit role field (not inferred). Role assignment must be explicit (admin-controlled), not inferred from email prefix.

---

### Safe Stopping Guarantees

**Verified**: Stopping after this step is safe because:
- Authorization module creates no data (no entities created)
- Authorization module has no side effects (no external state modified)
- Authorization module is stateless (no internal state to preserve)
- Authorization module is pure (deterministic, no side effects)
- Authorization module is independently testable (can be validated independently)
- Authorization module has minimal dependencies (Utilities, Error Handling, User entity)

**BLOCKED Notes**: None (authorization is foundational, no BLOCKED dependencies that prevent safe stopping)

---

**CURRENT MODULE STATUS**: ✅ **ALLOWED**

**Authorization module specification is defined. Module can proceed. User entity has explicit role field in schema (convex/schema.ts line 25). Authorization module only reads role field (does not assign roles). Role assignment mechanism is BLOCKED FOR PRODUCTION (inference from email prefix), but this does not block Authorization module (role assignment is User Management responsibility, not Authorization responsibility).**

**Justification**:
- All prerequisites are met (Utilities module Step 1 complete, Error Handling module Step 2 complete, User entity exists with explicit role field)
- User entity schema has explicit role field: `role: v.union(v.literal("farmer"), v.literal("trader"), v.literal("buyer"), v.literal("admin"))` (convex/schema.ts)
- Authorization module only reads role field (does not assign roles, does not depend on role assignment mechanism)
- Role assignment mechanism BLOCKED FOR PRODUCTION does not block Authorization module (role assignment is separate concern, handled by User Management module)
- Authorization module does not require BLOCKED capabilities to function (only requires read access to User.role field)
- Authorization module is safe to stop after (no data created, no side effects)
- Authorization module supports required invariants (INVARIANT 2.1, 2.2, 2.3)
- All dependencies are satisfied (Utilities, Error Handling, User entity with explicit role field)

---

*This document must be updated when implementation begins, contracts change, or new authorization requirements are needed. No assumptions. Only truth.*
