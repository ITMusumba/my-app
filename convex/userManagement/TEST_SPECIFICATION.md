# User Management Module — Test Specification

**Module**: User Management  
**Step**: 5b (IMPLEMENTATION_SEQUENCE.md Step 5)  
**Status**: Test specification only (no test code, no implementation)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- User Management Module Specification (SPECIFICATION.md) defines requirements
- User Management Public Interface (types.ts, Step 5a, approved and locked)
- IMPLEMENTATION_BOUNDARIES.md applies
- INVARIANTS.md (3.1, 4.2) applies
- MODULARITY_GUIDE.md applies
- architecture.md applies
- DOMAIN_MODEL.md defines User entity and role states
- BUSINESS_LOGIC.md defines user account creation workflow
- Utilities module (Step 1) is complete and locked
- Error Handling module (Step 2) is complete and locked
- Authorization module (Step 3) is complete and locked
- Rate Limiting module (Step 4) is complete and locked

**Purpose**: This document defines test specifications for the User Management module. This is NOT executable test code. This defines what must be tested, not how to test it.

**Rules**:
- No test code
- No assertions written as code
- No example values unless necessary to define boundaries
- Every test must map to a contract clause, specification requirement, or invariant
- Tests are specifications, not implementations
- Tests validate structure, constraints, and non-behavior
- Tests must detect accidental authority introduction
- Tests must detect forbidden operations and coupling

---

## 1. Test Principles

### Core Principles

**1. Test Specifications, Not Code**
- Tests are described as specifications
- No executable code is provided
- No assertions are written as code
- Test descriptions define what must be verified

**2. Invariant Protection**
- Every test must map to an invariant or contract clause
- Tests must verify invariants are preserved
- Tests must detect invariant violations
- Tests must fail if invariants are violated
- INVARIANT 3.1 (Users Cannot Change Their Own Role) must be explicitly tested
- INVARIANT 4.2 (All Meaningful Actions Generate UTIDs) must be explicitly tested

**3. Contract Verification**
- Tests must verify function contracts are met
- Tests must verify determinism (same inputs = same outputs, assuming same database state)
- Tests must verify statelessness (no internal state)
- Tests must verify server-side only enforcement

**4. Explicit Failure Modes**
- Tests must verify explicit error handling
- Tests must verify missing parameter errors
- Tests must verify invalid parameter errors
- Tests must verify authorization failure vs error distinction

**5. Boundary Protection**
- Tests must detect forbidden operations
- Tests must detect coupling or dependency leakage
- Tests must detect accidental authority introduction
- Tests must detect behavior introduction (logic, side effects)
- Tests must detect role inference (BLOCKED FOR PRODUCTION)
- Tests must detect self-role changes (BLOCKED)

**6. BLOCKED Test Documentation**
- Tests for BLOCKED capabilities must be explicitly marked
- BLOCKED tests must explain why they cannot be executed
- BLOCKED tests must document what would unblock them

**7. Authority Separation**
- Tests must detect authority leakage
- Acting user vs target user separation is mandatory
- Admin-only operations must be explicitly verified
- Self-role change prevention must be explicitly verified

---

## 2. Interface Shape and Type Integrity Tests

### Test Category: UserRecord Shape Integrity

**Purpose**: Ensure UserRecord structure matches interface contract  
**Contract Protected**: Step 5a public interface (types.ts)

**Test Specification**:
- Verify that `UserRecord` has required properties: `id`, `email`, `role`, `alias`, `state`, `createdAt`, `lastActiveAt`
- Verify that `id` property is of type `string`
- Verify that `email` property is of type `string`
- Verify that `role` property is of type `UserRole` (from Authorization module)
- Verify that `alias` property is of type `string`
- Verify that `state` property is of type `UserState` (`"active" | "suspended" | "deleted"`)
- Verify that `createdAt` property is of type `number`
- Verify that `lastActiveAt` property is of type `number`
- Verify that `UserRecord` is readonly (immutable)
- Verify that no additional inferred fields exist

**Failure Criteria**:
- Missing required fields
- Additional undocumented fields
- Mutable fields
- Type mismatches

---

### Test Category: UserState Type Integrity

**Purpose**: Ensure UserState type matches interface contract  
**Contract Protected**: Step 5a public interface (types.ts), DOMAIN_MODEL.md

**Test Specification**:
- Verify that `UserState` is a union type of string literals: `"active" | "suspended" | "deleted"`
- Verify that all state values are string literal types (not string)
- Verify that state values match DOMAIN_MODEL.md definition exactly
- Verify that `"deleted"` is terminal state (no transitions out of deleted)
- Verify that state values are immutable (cannot be modified)
- Verify that no additional state values are defined

**Failure Criteria**:
- Invalid state values
- Missing state values
- Transition out of `"deleted"` state
- Mutable state values

---

### Test Category: UserRole Type Integrity

**Purpose**: Ensure UserRole type matches Authorization module contract  
**Contract Protected**: Authorization module (Step 3a), Step 5a public interface

**Test Specification**:
- Verify that `UserRole` is imported from Authorization module (not redefined)
- Verify that `UserRole` is union type: `"farmer" | "trader" | "buyer" | "admin"`
- Verify that role values match schema definition exactly (convex/schema.ts)
- Verify that role values are immutable (cannot be modified)
- Verify that no additional role values are defined

**Failure Criteria**:
- UserRole redefined (not imported)
- Role value mismatches
- Additional role values

---

### Test Category: UserManagementContext Structure Integrity

**Purpose**: Ensure UserManagementContext structure matches interface contract  
**Contract Protected**: Step 5a public interface (types.ts)

**Test Specification**:
- Verify that `UserManagementContext` has required properties: `db`, `now`
- Verify that `db` property is of type `DatabaseWriter` (opaque, from Convex)
- Verify that `now` property is of type `number` (milliseconds since epoch)
- Verify that `UserManagementContext` is readonly (immutable)
- Verify that no additional inferred fields exist

**Failure Criteria**:
- Missing required fields
- Additional undocumented fields
- Mutable fields
- Type mismatches

---

### Test Category: UserActionContext Structure Integrity

**Purpose**: Ensure UserActionContext structure matches interface contract  
**Contract Protected**: Step 5a public interface (types.ts)

**Test Specification**:
- Verify that `UserActionContext` has required properties: `actingUserId`, `actingUserRole`
- Verify that `actingUserId` property is of type `string`
- Verify that `actingUserRole` property is of type `UserRole`
- Verify that `UserActionContext` is readonly (immutable)
- Verify that no additional inferred fields exist

**Failure Criteria**:
- Missing required fields
- Additional undocumented fields
- Mutable fields
- Type mismatches

---

### Test Category: Input Type Integrity

**Purpose**: Ensure input types match interface contract  
**Contract Protected**: Step 5a public interface (types.ts)

**Test Specification**:
- Verify that `CreateUserInput` has required properties: `email`, `role`
- Verify that `ChangeUserRoleInput` has required properties: `targetUserId`, `newRole`
- Verify that `SuspendUserInput` has required properties: `targetUserId`
- Verify that `DeleteUserInput` has required properties: `targetUserId`
- Verify that all input types are readonly (immutable)
- Verify that no additional inferred fields exist

**Failure Criteria**:
- Missing required fields
- Additional undocumented fields
- Mutable fields
- Type mismatches

---

## 3. Function Signature Verification Tests

### Test Category: createUser Signature

**Purpose**: Ensure createUser matches interface  
**Contract Protected**: Step 5a public interface

**Test Specification**:
- Accepts:
  - `UserManagementContext` (database and time)
  - `UserActionContext` (acting user)
  - `CreateUserInput` (email, role)
- Returns:
  - `Promise<UserRecord | ErrorEnvelope>`
- No default parameters
- No overloads
- No additional parameters

**Failure Criteria**:
- Additional parameters
- Missing context
- Different return type
- Default parameters
- Overloads

---

### Test Category: changeUserRole Signature

**Purpose**: Protect INVARIANT 3.1 (prevent self-role changes)  
**Contract Protected**: Step 5a public interface, INVARIANT 3.1

**Test Specification**:
- Accepts:
  - `UserManagementContext` (database and time)
  - `UserActionContext` (acting user - required for admin verification)
  - `ChangeUserRoleInput` (targetUserId, newRole)
- Returns:
  - `Promise<UserRecord | ErrorEnvelope>`
- Requires acting user context (for admin verification)
- Explicit admin verification required (INVARIANT 3.1 enforcement)
- Self-role change explicitly forbidden (actingUserId !== targetUserId)

**Failure Criteria**:
- Missing acting context
- Implicit admin assumption
- Self-role change path exists
- Missing admin verification

---

### Test Category: suspendUser Signature

**Purpose**: Ensure suspendUser matches interface  
**Contract Protected**: Step 5a public interface

**Test Specification**:
- Accepts:
  - `UserManagementContext` (database and time)
  - `UserActionContext` (acting user - required for admin verification)
  - `SuspendUserInput` (targetUserId)
- Returns:
  - `Promise<UserRecord | ErrorEnvelope>`
- Requires acting user context (for admin verification)
- Explicit admin verification required

**Failure Criteria**:
- Missing acting context
- Missing admin verification
- Additional parameters
- Different return type

---

### Test Category: deleteUser Signature

**Purpose**: Ensure deleteUser matches interface  
**Contract Protected**: Step 5a public interface

**Test Specification**:
- Accepts:
  - `UserManagementContext` (database and time)
  - `UserActionContext` (acting user - required for admin verification)
  - `DeleteUserInput` (targetUserId)
- Returns:
  - `Promise<void | ErrorEnvelope>`
- Requires acting user context (for admin verification)
- Explicit admin verification required
- Terminal action (returns void on success, not UserRecord)

**Failure Criteria**:
- Missing acting context
- Missing admin verification
- Returns UserRecord (should return void)
- Additional parameters

---

### Test Category: getUserById Signature

**Purpose**: Ensure getUserById matches interface  
**Contract Protected**: Step 5a public interface

**Test Specification**:
- Accepts:
  - `{ readonly db: DatabaseReader; readonly now: number }` (read-only context)
  - `userId` (string)
- Returns:
  - `Promise<UserRecord | ErrorEnvelope>`
- Read-only operation (no UserActionContext required)
- Uses DatabaseReader (not DatabaseWriter)

**Failure Criteria**:
- Requires UserActionContext (should not require it)
- Uses DatabaseWriter (should use DatabaseReader)
- Additional parameters
- Different return type

---

## 4. Invariant Protection Tests

### Test Category: INVARIANT 3.1 — No Self-Role Change

**Purpose**: Prevent privilege escalation  
**Contract Protected**: INVARIANT 3.1, SPECIFICATION.md Section 6

**Test Specification**:
- If `actingUserId === targetUserId`:
  - Operation must fail (return ErrorEnvelope)
  - Error code must indicate self-role change forbidden
  - No bypass path allowed
- Even if acting user is admin:
  - Self-role change must still fail
  - Admin status does not bypass self-role change prevention
- Explicit check required:
  - `actingUserId !== targetUserId` must be verified before role change
  - Check must occur before admin verification (fail fast)

**Failure Criteria**:
- Any successful self-role change
- Self-role change succeeds for admin users
- No explicit self-role change check
- Bypass path exists

---

### Test Category: INVARIANT 3.1 — Admin-Only Role Mutation

**Purpose**: Enforce authority boundaries  
**Contract Protected**: INVARIANT 3.1, SPECIFICATION.md Section 6

**Test Specification**:
- If `actingUserRole !== "admin"`:
  - Role change must fail (return ErrorEnvelope)
  - Error code must indicate authorization failure
  - Authorization module must be consulted (verifyAdminRole called)
- No role hierarchy inference allowed:
  - Only explicit `"admin"` role allowed
  - No inferred admin status
  - No permission-based role change

**Failure Criteria**:
- Non-admin role change succeeds
- Authorization bypass detected
- Role hierarchy inference
- Permission-based role change

---

### Test Category: INVARIANT 4.2 — UTID Generation for User Creation

**Purpose**: Ensure auditability  
**Contract Protected**: INVARIANT 4.2, SPECIFICATION.md Section 6

**Test Specification**:
- UTID must be generated for user creation:
  - UTID generation must use Utilities module (generateUTID)
  - UTID must be generated before User entity creation
  - UTID must be logged or stored with user creation action
- UTID generation context must include:
  - `entityType`: "user" or "user_creation"
  - `timestamp`: Current timestamp (from context)
  - `additionalData`: User email, role (non-sensitive)
- No silent mutations:
  - User creation without UTID must fail
  - UTID generation failure must be detected

**Failure Criteria**:
- Missing UTID generation
- UTID generated outside Utilities module
- UTID generation failure not detected
- Silent user creation

---

### Test Category: INVARIANT 4.2 — UTID Generation for Role Change

**Purpose**: Ensure auditability  
**Contract Protected**: INVARIANT 4.2, SPECIFICATION.md Section 6

**Test Specification**:
- UTID must be generated for role change:
  - UTID generation must use Utilities module (generateUTID)
  - UTID must be generated before User entity update
  - UTID must be logged or stored with role change action
- UTID generation context must include:
  - `entityType`: "user_role_change" or "role_change"
  - `timestamp`: Current timestamp (from context)
  - `additionalData`: Target user ID, old role, new role (non-sensitive)
- No silent mutations:
  - Role change without UTID must fail
  - UTID generation failure must be detected

**Failure Criteria**:
- Missing UTID generation
- UTID generated outside Utilities module
- UTID generation failure not detected
- Silent role change

---

### Test Category: INVARIANT 4.2 — UTID Generation for Suspension

**Purpose**: Ensure auditability  
**Contract Protected**: INVARIANT 4.2, SPECIFICATION.md Section 6

**Test Specification**:
- UTID must be generated for user suspension:
  - UTID generation must use Utilities module (generateUTID)
  - UTID must be generated before User entity update
  - UTID must be logged or stored with suspension action
- UTID generation context must include:
  - `entityType`: "user_suspension" or "suspension"
  - `timestamp`: Current timestamp (from context)
  - `additionalData`: Target user ID (non-sensitive)
- No silent mutations:
  - Suspension without UTID must fail
  - UTID generation failure must be detected

**Failure Criteria**:
- Missing UTID generation
- UTID generated outside Utilities module
- UTID generation failure not detected
- Silent suspension

---

### Test Category: INVARIANT 4.2 — UTID Generation for Deletion

**Purpose**: Ensure auditability  
**Contract Protected**: INVARIANT 4.2, SPECIFICATION.md Section 6

**Test Specification**:
- UTID must be generated for user deletion:
  - UTID generation must use Utilities module (generateUTID)
  - UTID must be generated before User entity update
  - UTID must be logged or stored with deletion action
- UTID generation context must include:
  - `entityType`: "user_deletion" or "deletion"
  - `timestamp`: Current timestamp (from context)
  - `additionalData`: Target user ID (non-sensitive)
- No silent mutations:
  - Deletion without UTID must fail
  - UTID generation failure must be detected

**Failure Criteria**:
- Missing UTID generation
- UTID generated outside Utilities module
- UTID generation failure not detected
- Silent deletion

---

## 5. User Lifecycle Behavior Tests

### Test Category: User Creation — Duplicate Email Prevention

**Purpose**: Validate controlled creation  
**Contract Protected**: SPECIFICATION.md Section 4

**Test Specification**:
- Duplicate email must fail:
  - If user with same email exists, creation must fail
  - Error code must indicate duplicate email
  - No duplicate users created
- Email comparison must be case-sensitive or case-insensitive (explicitly defined)
- Email validation must occur before User entity creation

**Failure Criteria**:
- Duplicate user created
- No duplicate email check
- Case-sensitivity ambiguity

---

### Test Category: User Creation — Alias Generation

**Purpose**: Validate alias generation  
**Contract Protected**: SPECIFICATION.md Section 4

**Test Specification**:
- Alias must be generated:
  - Alias generation must use Utilities module
  - Alias must be unique (no duplicate aliases)
  - Alias must be stable (once created, cannot be changed)
  - Alias must be non-identifying (no email, no real name)
- Alias must be present in UserRecord:
  - `alias` field must be populated
  - Alias must be string (non-empty)
- Alias generation failure must be detected:
  - If alias generation fails, user creation must fail

**Failure Criteria**:
- Missing alias
- Duplicate alias
- Alias contains identifying information
- Alias generation failure not detected

---

### Test Category: User Creation — Initial State

**Purpose**: Validate initial state  
**Contract Protected**: SPECIFICATION.md Section 4, DOMAIN_MODEL.md

**Test Specification**:
- Initial state must be `"active"`:
  - New users must have `state: "active"`
  - No other initial state allowed
- Timestamps must be set:
  - `createdAt` must be set to current timestamp (from context)
  - `lastActiveAt` must be set to current timestamp (from context)
- Role must be explicit:
  - Role must be provided in input (not inferred)
  - Role must match input exactly

**Failure Criteria**:
- Initial state not `"active"`
- Missing timestamps
- Role inferred from email

---

### Test Category: User Creation — Role Assignment (Explicit, Not Inferred)

**Purpose**: Prevent role inference  
**Contract Protected**: SPECIFICATION.md Section 4, BLOCKED Notes

**Test Specification**:
- Role must be explicit:
  - Role must be provided in `CreateUserInput`
  - Role must not be inferred from email prefix
  - Role must not be inferred from email domain
  - Role must match input exactly
- No role inference logic:
  - No email pattern matching
  - No domain-based role assignment
  - No default role assignment

**Failure Criteria**:
- Role inferred from email prefix
- Role inferred from email domain
- Default role assignment
- Email pattern matching

---

### Test Category: User Suspension — Admin-Only

**Purpose**: Enforce authority boundaries  
**Contract Protected**: SPECIFICATION.md Section 4, INVARIANT 3.1

**Test Specification**:
- Only admin may suspend:
  - If `actingUserRole !== "admin"`, suspension must fail
  - Authorization module must be consulted (verifyAdminRole called)
  - No bypass path allowed
- State transition must be valid:
  - `active → suspended` (valid)
  - `suspended → suspended` (no-op, but must not fail)
  - `deleted → suspended` (invalid, must fail)

**Failure Criteria**:
- Non-admin suspension succeeds
- Authorization bypass detected
- Invalid state transition succeeds

---

### Test Category: User Suspension — State Transition

**Purpose**: Enforce reversible state change  
**Contract Protected**: SPECIFICATION.md Section 4, DOMAIN_MODEL.md

**Test Specification**:
- Valid state transitions:
  - `active → suspended` (valid)
  - `suspended → suspended` (no-op, but must not fail)
- Invalid state transitions:
  - `deleted → suspended` (invalid, must fail)
  - No transition out of `deleted` state

**Failure Criteria**:
- Invalid state transition succeeds
- Transition out of `deleted` state

---

### Test Category: User Deletion — Admin-Only

**Purpose**: Enforce authority boundaries  
**Contract Protected**: SPECIFICATION.md Section 4, INVARIANT 3.1

**Test Specification**:
- Only admin may delete:
  - If `actingUserRole !== "admin"`, deletion must fail
  - Authorization module must be consulted (verifyAdminRole called)
  - No bypass path allowed
- State transition must be valid:
  - `active → deleted` (valid)
  - `suspended → deleted` (valid)
  - `deleted → deleted` (no-op, but must not fail)

**Failure Criteria**:
- Non-admin deletion succeeds
- Authorization bypass detected
- Invalid state transition succeeds

---

### Test Category: User Deletion — Terminal State

**Purpose**: Enforce terminal state  
**Contract Protected**: SPECIFICATION.md Section 4, DOMAIN_MODEL.md

**Test Specification**:
- Deletion is terminal:
  - User state must be set to `"deleted"`
  - No transition out of `"deleted"` state allowed
  - Alias cannot be reused (stable alias requirement)
- Deletion is irreversible:
  - Deleted users cannot be re-activated
  - Deleted users cannot be suspended
  - Deleted users cannot have role changed

**Failure Criteria**:
- Re-activation after deletion
- Alias reuse
- Transition out of `"deleted"` state

---

### Test Category: User Verification — Read-Only

**Purpose**: Validate read-only operation  
**Contract Protected**: SPECIFICATION.md Section 4

**Test Specification**:
- `getUserById` is read-only:
  - No User entity modifications
  - No side effects
  - Returns UserRecord or ErrorEnvelope only
- User not found must return ErrorEnvelope:
  - If user does not exist, must return ErrorEnvelope
  - Error code must indicate user not found
  - No null returns

**Failure Criteria**:
- User entity modified
- Side effects detected
- Null returns

---

## 6. Forbidden Behavior Detection Tests

### Test Category: Authentication Leakage Detection

**Purpose**: Enforce separation of concerns  
**Contract Protected**: SPECIFICATION.md Section 5

**Test Specification**:
- No password checks:
  - No password verification logic
  - No password hash validation
  - No credential validation
- No session logic:
  - No session management
  - No session validation
  - No session creation
- No authentication assumptions:
  - No assumed authenticated state
  - No assumed user identity verification

**Failure Criteria**:
- Password check logic detected
- Session logic detected
- Authentication assumptions detected

---

### Test Category: Role Inference Detection

**Purpose**: Prevent production foot-guns  
**Contract Protected**: SPECIFICATION.md Section 5, BLOCKED Notes

**Test Specification**:
- No email-based role inference:
  - No email prefix pattern matching (e.g., "admin@example.com" → admin)
  - No email domain-based role assignment
  - No email substring matching
- No domain-based role assignment:
  - No domain pattern matching
  - No domain-based role lookup
- Role must be explicit:
  - Role must come from input only
  - No default role assignment
  - No inferred role assignment

**Failure Criteria**:
- Role inferred from email pattern
- Role inferred from email domain
- Default role assignment
- Email pattern matching logic

---

### Test Category: Self-Role Change Detection

**Purpose**: Prevent privilege escalation  
**Contract Protected**: INVARIANT 3.1, SPECIFICATION.md Section 5

**Test Specification**:
- Self-role change must be prevented:
  - If `actingUserId === targetUserId`, operation must fail
  - Check must occur before admin verification (fail fast)
  - No bypass path allowed
- Even for admin users:
  - Admin users cannot change their own role
  - Self-role change prevention applies to all users

**Failure Criteria**:
- Self-role change succeeds
- Self-role change bypass exists
- No self-role change check

---

### Test Category: Business Logic Contamination Detection

**Purpose**: Preserve modular purity  
**Contract Protected**: SPECIFICATION.md Section 5

**Test Specification**:
- No business entity modification:
  - No modifications to `listings`, `walletLedger`, `traderInventory`, etc.
  - No business entity creation
  - No business entity deletion
- No transaction logic:
  - No transaction processing
  - No payment logic
  - No economic rules
- No business rules:
  - No listing rules
  - No wallet rules
  - No inventory rules

**Failure Criteria**:
- Business entity modification detected
- Transaction logic detected
- Business rules detected

---

### Test Category: Frontend Access Detection

**Purpose**: Enforce server-side only  
**Contract Protected**: SPECIFICATION.md Section 5, architecture.md

**Test Specification**:
- No frontend user management:
  - No user management operations on frontend
  - No frontend-exposed user management logic
  - No frontend-trusted user management decisions
- Server-side only:
  - All operations must be server-side
  - All logic must be server-side
  - All decisions must be server-side

**Failure Criteria**:
- Frontend user management detected
- Frontend-exposed logic detected
- Frontend-trusted decisions detected

---

## 7. Dependency Boundary Tests

### Test Category: Allowed Dependencies Only

**Purpose**: Enforce dependency boundaries  
**Contract Protected**: SPECIFICATION.md Section 7, MODULARITY_GUIDE.md

**Test Specification**:
- Allowed dependencies:
  - Utilities module (Step 1) - for UTID generation, alias generation
  - Error Handling module (Step 2) - for error responses
  - Authorization module (Step 3) - for admin role verification only
  - User entity (database schema) - for User entity operations
- Forbidden dependencies:
  - Authentication module (BLOCKED)
  - Rate Limiting module (not required)
  - Business logic modules (Listing, Transaction, Wallet, etc.)
  - External services

**Failure Criteria**:
- Forbidden import detected
- Implied dependency detected
- Unauthorized module access

---

### Test Category: Authorization Module Usage

**Purpose**: Verify correct Authorization module usage  
**Contract Protected**: SPECIFICATION.md Section 7

**Test Specification**:
- Authorization module used only for admin verification:
  - `verifyAdminRole` called for role changes
  - `verifyAdminRole` called for suspensions
  - `verifyAdminRole` called for deletions
- No other Authorization module functions called:
  - No `authorize` function calls
  - No permission checks
  - No role-based access control beyond admin verification

**Failure Criteria**:
- Authorization module used for non-admin verification
- Unauthorized Authorization module functions called
- Permission checks detected

---

### Test Category: Utilities Module Usage

**Purpose**: Verify correct Utilities module usage  
**Contract Protected**: SPECIFICATION.md Section 7

**Test Specification**:
- Utilities module used for UTID generation:
  - `generateUTID` called for user creation
  - `generateUTID` called for role change
  - `generateUTID` called for suspension
  - `generateUTID` called for deletion
- Utilities module used for alias generation:
  - Alias generation uses Utilities module (if applicable)
  - Alias generation is deterministic
- No other Utilities module functions called:
  - No exposure calculation
  - No SLA calculation

**Failure Criteria**:
- UTID generation not using Utilities module
- Alias generation not using Utilities module
- Unauthorized Utilities module functions called

---

### Test Category: Error Handling Module Usage

**Purpose**: Verify correct Error Handling module usage  
**Contract Protected**: SPECIFICATION.md Section 7

**Test Specification**:
- Error Handling module used for error responses:
  - Errors returned as ErrorEnvelope (via Error Handling helpers)
  - Error codes from Error Handling module taxonomy
  - No ErrorEnvelope inspection or construction
- No error transformation:
  - Errors preserved as-is
  - No error filtering
  - No error aggregation

**Failure Criteria**:
- ErrorEnvelope constructed directly
- ErrorEnvelope inspected
- Error transformation detected

---

## 8. Purity, Determinism, and Statelessness Tests

### Test Category: Determinism Tests

**Purpose**: Verify deterministic behavior  
**Contract Protected**: SPECIFICATION.md Section 4

**Test Specification**:
- Same inputs + same database state → same outputs:
  - `createUser` with same inputs and same database state produces same result
  - `changeUserRole` with same inputs and same database state produces same result
  - `suspendUser` with same inputs and same database state produces same result
  - `deleteUser` with same inputs and same database state produces same result
  - `getUserById` with same inputs and same database state produces same result
- No dependency on time, randomness, or external state:
  - Timestamp from context only (not global time)
  - No random number generation
  - No external API calls

**Failure Criteria**:
- Non-deterministic behavior detected
- Time dependency (global time access)
- Randomness dependency
- External state dependency

---

### Test Category: Statelessness Tests

**Purpose**: Verify stateless behavior  
**Contract Protected**: SPECIFICATION.md Section 4

**Test Specification**:
- No internal state:
  - No module-level variables
  - No caches
  - No counters
  - No call history
- No memory across calls:
  - Each function call is independent
  - No state preserved between calls
  - No side effects beyond database operations

**Failure Criteria**:
- Internal state detected
- Memory across calls detected
- Caches or counters detected

---

### Test Category: Server-Side Only Tests

**Purpose**: Verify server-side only enforcement  
**Contract Protected**: SPECIFICATION.md Section 3, architecture.md

**Test Specification**:
- All operations server-side only:
  - No frontend user management
  - No client-side user management
  - No exposed user management logic
- Trust boundary enforcement:
  - Backend is trusted
  - Frontend is untrusted
  - All logic in Convex backend

**Failure Criteria**:
- Frontend user management detected
- Client-side user management detected
- Exposed user management logic detected

---

## 9. Missing Parameter and Invalid Parameter Handling Tests

### Test Category: Missing Parameter Tests

**Purpose**: Verify explicit error handling  
**Contract Protected**: SPECIFICATION.md Section 4

**Test Specification**:
- Missing context parameters:
  - Missing `UserManagementContext` must return ErrorEnvelope
  - Missing `UserActionContext` must return ErrorEnvelope (for mutations)
  - Missing `db` in context must return ErrorEnvelope
  - Missing `now` in context must return ErrorEnvelope
- Missing input parameters:
  - Missing `CreateUserInput` must return ErrorEnvelope
  - Missing `email` in input must return ErrorEnvelope
  - Missing `role` in input must return ErrorEnvelope
  - Missing `targetUserId` in input must return ErrorEnvelope
  - Missing `newRole` in input must return ErrorEnvelope

**Failure Criteria**:
- Missing parameters not detected
- Missing parameters return null or undefined
- Missing parameters cause exceptions

---

### Test Category: Invalid Parameter Tests

**Purpose**: Verify explicit error handling  
**Contract Protected**: SPECIFICATION.md Section 4

**Test Specification**:
- Invalid context parameters:
  - Invalid `db` type must return ErrorEnvelope
  - Invalid `now` type (non-number) must return ErrorEnvelope
  - Invalid `now` value (negative, non-finite) must return ErrorEnvelope
  - Invalid `actingUserId` type must return ErrorEnvelope
  - Invalid `actingUserRole` type must return ErrorEnvelope
- Invalid input parameters:
  - Invalid `email` format must return ErrorEnvelope
  - Invalid `role` value must return ErrorEnvelope
  - Invalid `targetUserId` type must return ErrorEnvelope
  - Invalid `newRole` value must return ErrorEnvelope
  - Invalid `state` value must return ErrorEnvelope

**Failure Criteria**:
- Invalid parameters not detected
- Invalid parameters return null or undefined
- Invalid parameters cause exceptions

---

## 10. Error Surface Tests

### Test Category: ErrorEnvelope Return-Path Tests

**Purpose**: Verify error handling contract  
**Contract Protected**: SPECIFICATION.md Section 4, Error Handling module

**Test Specification**:
- Errors returned as ErrorEnvelope:
  - All errors must be returned as ErrorEnvelope (via Error Handling helpers)
  - No thrown errors escaping module boundary
  - No ErrorEnvelope inspection or construction
- Error codes from Error Handling taxonomy:
  - Validation errors use `VALIDATION_FAILED`
  - Authorization errors use `NOT_AUTHORIZED` or `NOT_ADMIN`
  - Not found errors use appropriate not found codes
  - System errors use `SYSTEM_ERROR` or `OPERATION_FAILED`

**Failure Criteria**:
- Errors thrown (not returned)
- ErrorEnvelope constructed directly
- ErrorEnvelope inspected
- Invalid error codes

---

### Test Category: Success vs Error Distinction

**Purpose**: Verify explicit success/error distinction  
**Contract Protected**: Step 5a public interface

**Test Specification**:
- Success returns UserRecord or void:
  - `createUser` returns `UserRecord` on success
  - `changeUserRole` returns `UserRecord` on success
  - `suspendUser` returns `UserRecord` on success
  - `deleteUser` returns `void` on success
- Error returns ErrorEnvelope:
  - All errors return `ErrorEnvelope`
  - No null returns
  - No undefined returns

**Failure Criteria**:
- Null returns
- Undefined returns
- Success/error ambiguity

---

## 11. Safe Stopping Guarantee Tests

### Test Category: Step-5 Safe Stop

**Purpose**: Validate architectural safety  
**Contract Protected**: SPECIFICATION.md Section 8, IMPLEMENTATION_SEQUENCE.md

**Test Specification**:
- Only User entities created/modified:
  - No business data created (listings, walletLedger, etc.)
  - No cross-module coupling introduced
  - No partial state created
- No irreversible side effects beyond User table:
  - User creation is reversible (admin can delete)
  - User suspension is reversible (admin can unsuspend, if implemented)
  - User deletion is terminal (but only affects User table)
  - Alias generation is NOT reversible (but only affects User table)

**Failure Criteria**:
- Business data created
- Cross-module coupling introduced
- Irreversible side effects beyond User table

---

### Test Category: Independent Testability

**Purpose**: Verify module independence  
**Contract Protected**: SPECIFICATION.md Section 8

**Test Specification**:
- Module is independently testable:
  - Can be tested without other modules (except dependencies)
  - Can be tested without business logic modules
  - Can be tested without external services
- Dependencies are explicit:
  - Utilities module (explicit dependency)
  - Error Handling module (explicit dependency)
  - Authorization module (explicit dependency)
  - User entity (explicit dependency)

**Failure Criteria**:
- Module requires business logic modules for testing
- Module requires external services for testing
- Implicit dependencies detected

---

## 12. BLOCKED Capability Tests

### Test Category: Authentication — BLOCKED

**Purpose**: Document why authentication tests are BLOCKED  
**Contract Protected**: SPECIFICATION.md Section 5, VISION.md BLOCKED #1

**BLOCKED Notes**:
- Authentication module is BLOCKED (VISION.md BLOCKED #1)
- User Management module does not perform authentication
- Authentication tests are not applicable to User Management module
- What would unblock: Implementation of Authentication module (BLOCKED)

**Test Specification**: N/A (authentication is FORBIDDEN, not part of User Management module)

---

### Test Category: Role Inference — BLOCKED FOR PRODUCTION

**Purpose**: Detect role inference attempts  
**Contract Protected**: SPECIFICATION.md Section 5, BLOCKED Notes

**Test Specification**:
- Role inference must fail if detected:
  - Email prefix pattern matching must be detected and fail
  - Email domain-based role assignment must be detected and fail
  - Default role assignment must be detected and fail
- Role must be explicit:
  - Role must come from input only
  - No inference logic allowed

**Failure Criteria**:
- Role inference logic detected
- Role inference succeeds
- Default role assignment

---

## 13. Final Check

### Test Coverage Summary

**Verified Test Categories**:
- ✅ Interface Shape and Type Integrity Tests (6 categories)
- ✅ Function Signature Verification Tests (5 categories)
- ✅ Invariant Protection Tests (6 categories)
- ✅ User Lifecycle Behavior Tests (9 categories)
- ✅ Forbidden Behavior Detection Tests (5 categories)
- ✅ Dependency Boundary Tests (4 categories)
- ✅ Purity, Determinism, and Statelessness Tests (3 categories)
- ✅ Missing Parameter and Invalid Parameter Handling Tests (2 categories)
- ✅ Error Surface Tests (2 categories)
- ✅ Safe Stopping Guarantee Tests (2 categories)
- ✅ BLOCKED Capability Tests (2 categories)

**Total Test Categories**: 46

---

### Final Check (REQUIRED)

**Before completing, restate**:
- ✅ All test categories are defined
- ✅ All tests map to contract clauses, specification requirements, or invariants
- ✅ All BLOCKED tests are explicitly marked
- ✅ No test assumes behavior beyond the contract
- ✅ No test introduces logic or side effects
- ✅ All tests validate structure, constraints, and non-behavior
- ✅ All tests detect forbidden operations and coupling
- ✅ All tests protect invariants (INVARIANT 3.1, INVARIANT 4.2)
- ✅ Purity, determinism, and statelessness are verified
- ✅ Explicit error surfacing is verified (UserRecord | ErrorEnvelope or void | ErrorEnvelope)
- ✅ Safe stopping guarantees are verified
- ✅ Admin-only operations are explicitly verified
- ✅ Self-role change prevention is explicitly verified
- ✅ Role inference prevention is explicitly verified

---

**CURRENT MODULE STATUS**: ✅ **TEST SPECIFICATION COMPLETE**

**User Management module test specification is defined. All test categories are specified. Tests validate structure, constraints, and non-behavior. All BLOCKED tests are explicitly marked.**

---

## 14. Test Specification Completeness Confirmation

### Required Test Coverage Verification

**✅ Interface Integrity**:
- Function signatures unchanged (createUser, changeUserRole, suspendUser, deleteUser, getUserById)
- Return types explicitly `Promise<UserRecord | ErrorEnvelope>` or `Promise<void | ErrorEnvelope>`
- No additional exports beyond interface
- Database context explicitly required (not ambient)

**✅ Purity, Determinism, Statelessness**:
- Same inputs + same database state → same outputs (all functions)
- No dependency on time, randomness, or external state (timestamp from context only)
- No internal memory or call history

**✅ Invariant Enforcement**:
- INVARIANT 3.1: Users Cannot Change Their Own Role (explicitly tested - self-role change prevention, admin-only verification)
- INVARIANT 4.2: All Meaningful Actions Generate UTIDs (explicitly tested - UTID generation for all user management actions)

**✅ UserRecord Semantics**:
- UserRecord returned on success (createUser, changeUserRole, suspendUser)
- void returned on success (deleteUser)
- ErrorEnvelope returned on failure (all functions)

**✅ Error Surface**:
- Errors returned only as ErrorEnvelope (verified)
- No thrown errors escaping module boundary (verified)
- No inspection of ErrorEnvelope internals (verified - ErrorEnvelope is opaque)

**✅ BLOCKED Behavior Detection**:
- Authentication assumptions (verified - forbidden)
- Role inference (verified - BLOCKED FOR PRODUCTION)
- Self-role changes (verified - BLOCKED, INVARIANT 3.1)
- Business logic leakage (verified - forbidden)
- Frontend access (verified - forbidden)

**✅ Coupling & Dependency Guards**:
- No dependency on Authentication (verified - BLOCKED)
- No dependency on Rate Limiting (verified - not required)
- No dependency on Business Logic modules (verified - forbidden)
- Correct usage of Utilities, Error Handling, Authorization modules (verified)

---

### Final Check (REQUIRED)

**Before completing, restate**:
- ✅ All invariants covered (INVARIANT 3.1, INVARIANT 4.2)
- ✅ All BLOCKED areas tested defensively
- ✅ No test introduces new authority
- ✅ No test assumes system readiness or activation
- ✅ User Management remains focused on User entity operations only
- ✅ All test categories have explicit structure (Name, Purpose, Inputs, Expected outcome, Invariants protected, BLOCKED notes)
- ✅ All tests specify WHAT must be verified, not HOW
- ✅ No executable tests, no mock behavior, no inferred authority
- ✅ User management failures are distinguishable from errors
- ✅ All BLOCKED areas explicitly marked
- ✅ Admin-only operations explicitly verified
- ✅ Self-role change prevention explicitly verified
- ✅ Role inference prevention explicitly verified

---

**TEST SPECIFICATION COMPLETENESS**: ✅ **CONFIRMED**

**Statement**: The User Management module may proceed to Step 5c (implementation) ONLY if the implementation satisfies all test specifications defined in this document. Implementation must:

1. Satisfy all interface integrity requirements
2. Preserve determinism and statelessness (same inputs + same database state → same outputs)
3. Enforce all invariants (INVARIANT 3.1, INVARIANT 4.2)
4. Correctly implement UserRecord semantics (success vs error distinction)
5. Return errors only as ErrorEnvelope (opaque, via Error Handling helpers)
6. Detect and prevent all BLOCKED behaviors (authentication, role inference, self-role changes)
7. Maintain proper coupling and dependency boundaries
8. Create/modify User entities only (no business data, no cross-module coupling)
9. Enforce admin-only operations (role changes, suspensions, deletions)
10. Prevent self-role changes (INVARIANT 3.1)
11. Generate UTIDs for all user management actions (INVARIANT 4.2)
12. Use explicit role assignment (not inferred)

**If any test specification cannot be satisfied by the implementation, the implementation must be BLOCKED until the specification is updated or the implementation is corrected.**

---

*This document must be updated when implementation begins, contracts change, or new user management requirements are needed. No assumptions. Only truth.*
