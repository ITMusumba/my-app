# Authorization Module README

**Module**: Authorization  
**Step**: 3 (IMPLEMENTATION_SEQUENCE.md Step 3)  
**Status**: Specification only (no implementation yet)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- IMPLEMENTATION_SEQUENCE.md Step 3 defines this module
- IMPLEMENTATION_BOUNDARIES.md defines coding constraints
- INVARIANTS.md (2.1, 2.2, 2.3) defines authorization invariants
- MODULARITY_GUIDE.md defines module boundaries
- Utilities module (Step 1) is complete and locked
- Error Handling module (Step 2) specification is complete

**Purpose**: This document defines the Authorization module specification. This is NOT an implementation guide. This defines contracts, not code.

---

## 1. Module Purpose

### Core Purpose

**Authorization Module** provides role-based access control, permission enforcement, and admin role verification required by all other modules. This module depends on Utilities (for UTID generation) and requires User entity (to check role).

**Why This Module Exists**:
- All modules require authorization checks (server-side enforcement)
- All modules require admin role verification (admin-only operations)
- All modules require permission enforcement (role-based access control)
- Authorization supports invariant enforcement (INVARIANT 2.1, 2.2, 2.3)

**Why This Module Must Be Third**:
- Depends on Utilities (for UTID generation in authorization logs)
- Required by all other modules (foundational)
- Provides authorization enforcement (all modules need authorization)
- Safe to stop after (no data created, no side effects)

**Why No Other Module Can Precede**:
- All other modules depend on Authorization (for authorization checks)
- Building other modules first would violate dependency constraints
- Building other modules first would create unsafe state (missing authorization enforcement)

---

## 2. What This Module Is Allowed to Do

### Allowed Operations

**1. Role-Based Access Control**:
- Check user role (farmer, trader, buyer, admin)
- Verify role matches operation requirements
- Enforce role-based permissions
- Role checks must be server-side only

**2. Permission Enforcement**:
- Verify user has permission for operation
- Enforce operation-specific permissions
- Block unauthorized operations
- Permission checks must be server-side only

**3. Admin Role Verification**:
- Verify user has admin role
- Enforce admin-only operations
- Block non-admin access to admin operations
- Admin verification must be server-side only

**4. Server-Side Authorization Checks**:
- Perform authorization checks before operation execution
- Reject operations without authorization
- Log authorization decisions (if logging is available)
- Authorization checks must be server-side only

**5. UTID Generation for Authorization Logs**:
- Use Utilities module to generate UTIDs for authorization logs
- UTID generation must be deterministic (from Utilities module)
- UTID generation must be pure (from Utilities module)

**Constraints**:
- All authorization checks must be server-side only
- All authorization checks must be deterministic (same inputs = same authorization decision)
- All authorization checks must be pure (no side effects beyond authorization decision)
- All authorization checks must be stateless (no internal state)

**BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference).

---

## 3. What This Module Must NEVER Do

### Forbidden Operations

**1. Authentication**:
- **FORBIDDEN**: Verify user credentials (authentication is separate from authorization)
- **FORBIDDEN**: Manage user sessions (authentication responsibility)
- **FORBIDDEN**: Handle login/logout (authentication responsibility)
- **Reason**: Authorization is separate from authentication (authentication is BLOCKED)

**2. Role Assignment**:
- **FORBIDDEN**: Assign roles to users (User Management responsibility)
- **FORBIDDEN**: Infer roles from email prefix (BLOCKED FOR PRODUCTION)
- **FORBIDDEN**: Change user roles (User Management responsibility)
- **Reason**: Authorization checks roles, does not assign them

**3. User Management**:
- **FORBIDDEN**: Create user accounts (User Management responsibility)
- **FORBIDDEN**: Delete user accounts (User Management responsibility)
- **FORBIDDEN**: Suspend user accounts (User Management responsibility)
- **Reason**: Authorization checks users, does not manage them

**4. Frontend Authorization**:
- **FORBIDDEN**: Perform authorization checks on frontend (authorization must be server-side only)
- **FORBIDDEN**: Trust frontend authorization decisions (authorization must be server-side only)
- **FORBIDDEN**: Expose authorization logic to frontend (authorization must be server-side only)
- **Reason**: INVARIANT 2.3 requires server-side authorization only

**5. Business Logic**:
- **FORBIDDEN**: Implement business logic (authorization is infrastructure, not business logic)
- **FORBIDDEN**: Make business decisions (authorization is infrastructure, not business logic)
- **FORBIDDEN**: Enforce business rules (authorization is infrastructure, not business logic)
- **Reason**: Authorization is infrastructure, not business logic

**6. Database Modifications**:
- **FORBIDDEN**: Create entities (authorization does not create entities)
- **FORBIDDEN**: Modify entities (authorization does not modify entities)
- **FORBIDDEN**: Delete entities (authorization does not delete entities)
- **Reason**: Authorization checks access, does not modify data

**7. BLOCKED Capabilities**:
- **FORBIDDEN**: Depend on Authentication module (BLOCKED - production authentication NOT IMPLEMENTED)
- **FORBIDDEN**: Use role inference from email prefix (BLOCKED FOR PRODUCTION)
- **FORBIDDEN**: Assume BLOCKED capabilities exist
- **Reason**: Authorization must not require BLOCKED capabilities

**8. Client-Side Authorization**:
- **FORBIDDEN**: Perform authorization checks on client (authorization must be server-side only)
- **FORBIDDEN**: Trust client authorization decisions (authorization must be server-side only)
- **FORBIDDEN**: Expose authorization logic to client (authorization must be server-side only)
- **Reason**: INVARIANT 2.3 requires server-side authorization only

---

## 4. Supported Invariants

### INVARIANT 2.1: Server-Side Authorization Enforcement

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

**BLOCKED Notes**: None

---

### INVARIANT 2.2: Admin Role Verification

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

**BLOCKED Notes**: None

---

### INVARIANT 2.3: Frontend Cannot Bypass Authorization

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

**BLOCKED Notes**: None

---

## 5. Dependencies

### Required Dependencies

**1. Utilities Module (Step 1)**:
- **Required For**: UTID generation for authorization logs
- **Status**: Complete and locked
- **Usage**: Generate UTIDs for authorization decisions (if logging is implemented)
- **BLOCKED Notes**: None

**2. User Entity**:
- **Required For**: Check user role
- **Status**: Database schema entity (not a module)
- **Usage**: Read user role from User entity
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference).

**3. Error Handling Module (Step 2)**:
- **Required For**: Standardized error responses for authorization failures
- **Status**: Specification complete (implementation pending)
- **Usage**: Return standardized errors when authorization fails
- **BLOCKED Notes**: None (Error Handling specification is complete)

---

### BLOCKED Dependencies

**1. Authentication Module**:
- **BLOCKED Reason**: Production authentication NOT IMPLEMENTED (BLOCKED)
- **Impact**: Authorization module cannot verify user credentials
- **Workaround**: Authorization module works with authenticated user context (provided by calling code)
- **BLOCKED Notes**: Authentication is BLOCKED (VISION.md BLOCKED #1). Authorization module must work without authentication module.

**2. User Management Module**:
- **BLOCKED Reason**: User Management module is Step 5 (not yet implemented)
- **Impact**: Authorization module cannot create or modify users
- **Workaround**: Authorization module works with existing User entity (read-only)
- **BLOCKED Notes**: User Management module is not yet implemented. Authorization module can work with minimal User entity.

---

## 6. Module Prerequisites

### Prerequisites Check

**1. Utilities Module (Step 1)**:
- **Status**: ✅ Complete and locked
- **Required For**: UTID generation
- **Prerequisite Met**: Yes

**2. Error Handling Module (Step 2)**:
- **Status**: ⚠️ Specification complete, implementation pending
- **Required For**: Standardized error responses
- **Prerequisite Met**: Partial (specification exists, implementation pending)
- **BLOCKED Notes**: Authorization module can proceed with Error Handling specification (implementation can follow)

**3. User Entity**:
- **Status**: ✅ Database schema entity exists
- **Required For**: Check user role
- **Prerequisite Met**: Yes (User entity exists in schema)

**4. Role Assignment Mechanism**:
- **Status**: ❌ BLOCKED FOR PRODUCTION
- **Required For**: Explicit role assignment (not email inference)
- **Prerequisite Met**: No (role inference is BLOCKED, explicit role assignment required)
- **BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference). This is a BLOCKED dependency.

---

## 7. BLOCKED Dependencies Summary

### BLOCKED Dependency: Role Assignment Mechanism

**BLOCKED Reason**: Role inference from email prefix is BLOCKED FOR PRODUCTION

**Impact**:
- Authorization module cannot infer roles from email prefix
- Authorization module must work with explicit role assignment
- Authorization module requires User entity with explicit role field

**What Is BLOCKED**:
- Role inference from email prefix (e.g., "admin@example.com" → admin role)
- Automatic role assignment based on email
- Role assignment without explicit admin control

**What Is Required**:
- Explicit role assignment (admin-controlled)
- User entity with explicit role field
- Role assignment via User Management module (when implemented)

**BLOCKED Notes**: Authorization module can proceed if User entity has explicit role field (not inferred). Role assignment must be explicit (admin-controlled), not inferred from email prefix.

**Module Status**: ⚠️ **CONDITIONALLY ALLOWED** (can proceed if User entity has explicit role field)

---

## 8. Safe Stopping Guarantee

### Safe Stopping Definition

**Safe Stopping**: System can be safely stopped after Authorization module implementation without:
- Creating irreversible damage
- Creating data corruption
- Creating security vulnerabilities
- Violating invariants
- Requiring rollback

**Why Stopping After Authorization Is Safe**:
- Authorization module has minimal dependencies (Utilities, User entity)
- Authorization module creates no data (no entities created)
- Authorization module has no side effects (no external state modified)
- Authorization module is pure and stateless (no internal state to preserve)
- Authorization module is independently testable (can be validated independently)

**Safe Stopping Guarantee**:
- **No Data Created**: Authorization module does not create any entities or data
- **No Side Effects**: Authorization module does not create side effects (no database writes, no external state modifications)
- **No State**: Authorization module is stateless (no internal state to preserve)
- **Minimal Dependencies**: Authorization module depends only on Utilities and User entity
- **Pure Functions**: All authorization checks are pure (deterministic, no side effects)

**BLOCKED Notes**: None (authorization is foundational, no BLOCKED dependencies that prevent safe stopping)

---

## 9. How Misuse Must Fail

### Misuse Failure Modes

**1. Missing User Context**:
- **Misuse**: Performing authorization check without user context
- **Failure**: Throw explicit error (not silent failure)
- **Error Message**: Must indicate which parameter is missing

**2. Invalid Role**:
- **Misuse**: Performing authorization check with invalid role
- **Failure**: Throw explicit error (not silent failure)
- **Error Message**: Must indicate which role is invalid

**3. Frontend Authorization Check**:
- **Misuse**: Performing authorization check on frontend
- **Failure**: Authorization checks must be server-side only
- **Error Message**: N/A (contract enforcement, not runtime error)

**4. Role Inference**:
- **Misuse**: Inferring role from email prefix
- **Failure**: Role inference is BLOCKED FOR PRODUCTION
- **Error Message**: N/A (contract enforcement, not runtime error)

**5. Missing Authorization**:
- **Misuse**: Performing operation without authorization check
- **Failure**: Operation must be rejected (authorization check required)
- **Error Message**: Must indicate authorization failure

**Failure Principle**: **Explicit failure over unsafe behavior**. All misuse must fail explicitly, not silently.

---

## 10. Test Expectations

### Test Requirements

**1. Server-Side Authorization Tests**:
- Test authorization checks are server-side only
- Test authorization checks cannot be bypassed by frontend
- Test authorization checks are enforced before operations
- Test authorization checks are deterministic (same inputs = same authorization decision)

**2. Admin Role Verification Tests**:
- Test admin role verification works
- Test admin role verification is server-side only
- Test admin role verification cannot be bypassed
- Test admin role verification is enforced before admin operations

**3. Permission Enforcement Tests**:
- Test permission enforcement works
- Test permission enforcement is server-side only
- Test permission enforcement cannot be bypassed
- Test permission enforcement is enforced before operations

**4. Role-Based Access Control Tests**:
- Test role-based access control works
- Test role checks are server-side only
- Test role checks cannot be bypassed
- Test role checks are enforced before operations

**5. Misuse Failure Tests**:
- Test missing user context handling (throws explicit error)
- Test invalid role handling (throws explicit error)
- Test missing authorization handling (rejects operation)
- Test frontend authorization bypass prevention (contract enforcement)

**Test Authority**:
- System operator only
- No automated tests (human decision required)
- Tests must be documented

**BLOCKED Notes**: None (authorization tests are foundational, no BLOCKED dependencies)

---

## Final Check

### Module Purpose

**Verified**: This module provides:
- **Role-Based Access Control**: Check user role, verify role matches operation requirements
- **Permission Enforcement**: Verify user has permission for operation, enforce operation-specific permissions
- **Admin Role Verification**: Verify user has admin role, enforce admin-only operations
- **Server-Side Authorization Checks**: Perform authorization checks before operation execution, reject operations without authorization

**BLOCKED Notes**: Role assignment mechanism is BLOCKED FOR PRODUCTION (role inference from email prefix). Authorization module must work with explicit role assignment (not email inference).

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

**BLOCKED Notes**: None (allowed operations are foundational)

---

### Forbidden Operations

**Verified**: This module is forbidden from:
- Authentication (verifying credentials, managing sessions)
- Role assignment (assigning roles, inferring roles from email)
- User management (creating, deleting, suspending users)
- Frontend authorization (performing authorization checks on frontend)
- Business logic (implementing business logic, making business decisions)
- Database modifications (creating, modifying, deleting entities)
- BLOCKED capabilities (depending on Authentication module, using role inference)
- Client-side authorization (performing authorization checks on client)

**BLOCKED Notes**: None (forbidden operations are explicit)

---

### Supported Invariants

**Verified**: This module supports:
- **INVARIANT 2.1**: Server-Side Authorization Enforcement (authorization checks are server-side only)
- **INVARIANT 2.2**: Admin Role Verification (admin role verification is server-side only)
- **INVARIANT 2.3**: Frontend Cannot Bypass Authorization (authorization checks cannot be bypassed by frontend)

**BLOCKED Notes**: None (invariants are foundational)

---

### BLOCKED Dependencies

**Verified**: This module has BLOCKED dependencies:
- **Role Assignment Mechanism**: BLOCKED FOR PRODUCTION (role inference from email prefix)
  - **Impact**: Authorization module cannot infer roles from email prefix
  - **Required**: Explicit role assignment (admin-controlled)
  - **Status**: ⚠️ **CONDITIONALLY ALLOWED** (can proceed if User entity has explicit role field)

**BLOCKED Notes**: Authorization module can proceed if User entity has explicit role field (not inferred). Role assignment must be explicit (admin-controlled), not inferred from email prefix.

---

### Safe Stopping Guarantees

**Verified**: Stopping after this step is safe because:
- Authorization module creates no data (no entities created)
- Authorization module has no side effects (no external state modified)
- Authorization module is stateless (no internal state to preserve)
- Authorization module is pure (deterministic, no side effects)
- Authorization module is independently testable (can be validated independently)
- Authorization module has minimal dependencies (Utilities, User entity)

**BLOCKED Notes**: None (authorization is foundational, no BLOCKED dependencies that prevent safe stopping)

---

**CURRENT MODULE STATUS**: ⚠️ **CONDITIONALLY ALLOWED**

**Authorization module specification is defined. Module can proceed if User entity has explicit role field (not inferred). Role assignment must be explicit (admin-controlled), not inferred from email prefix.**

---

*This document must be updated when implementation begins, contracts change, or new authorization requirements are needed. No assumptions. Only truth.*
