# Authentication Module — Test Specification

**Module**: Authentication  
**Step**: 6b (IMPLEMENTATION_SEQUENCE.md Step 6)  
**Status**: Test specification only (no test code, no implementation)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- PRODUCTION_AUTHENTICATION_SPECIFICATION.md defines requirements
- AUTHENTICATION_IMPLEMENTATION_DECISION.md locks stateful session model
- Authentication Public Interface (types.ts, Step 6a, approved and locked)
- IMPLEMENTATION_BOUNDARIES.md applies
- INVARIANTS.md (2.1, 2.2, 2.3) applies
- MODULARITY_GUIDE.md applies
- architecture.md applies
- User Management module (Step 5) is complete and locked
- Authorization module (Step 3) is complete and locked
- Utilities module (Step 1) is complete and locked
- Error Handling module (Step 2) is complete and locked
- Schema: users, sessions, passwordResetTokens tables are defined

**Purpose**: This document defines test specifications for the Authentication module. This is NOT executable test code. This defines what must be tested, not how to test it.

**Rules**:
- No test code
- No assertions written as code
- No example values unless necessary to define boundaries
- Every test must map to a contract clause, specification requirement, or invariant
- Tests are specifications, not implementations
- Tests validate structure, constraints, and non-behavior
- Tests must detect accidental authority introduction
- Tests must detect forbidden operations and coupling
- Tests must verify security boundaries (no sensitive data leakage)

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
- INVARIANT 2.1 (Server-Side Authorization Enforcement) must be explicitly tested
- INVARIANT 2.2 (Admin Role Verification) must be explicitly tested
- INVARIANT 2.3 (Frontend Cannot Bypass Authorization) must be explicitly tested

**3. Contract Verification**
- Tests must verify function contracts are met
- Tests must verify determinism (same inputs = same outputs, assuming same database state)
- Tests must verify statelessness (no internal state, except database effects)
- Tests must verify server-side only enforcement

**4. Security Boundary Protection**
- Tests must verify no sensitive data leakage (passwords, tokens)
- Tests must verify password hashing (never plaintext storage)
- Tests must verify token security (cryptographically secure, never logged)
- Tests must verify email existence privacy (non-existent email responses indistinguishable)

**5. Explicit Failure Modes**
- Tests must verify explicit error handling
- Tests must verify missing parameter errors
- Tests must verify invalid parameter errors
- Tests must verify authentication failure vs error distinction
- Tests must verify authorization failure vs error distinction

**6. Boundary Protection**
- Tests must detect forbidden operations
- Tests must detect coupling or dependency leakage
- Tests must detect accidental authority introduction
- Tests must detect behavior introduction (logic, side effects)
- Tests must detect role inference (BLOCKED FOR PRODUCTION)
- Tests must detect role assignment (BLOCKED)

**7. BLOCKED Test Documentation**
- Tests for BLOCKED capabilities must be explicitly marked
- BLOCKED tests must explain why they cannot be executed
- BLOCKED tests must document what would unblock them

**8. Stateful Session Model**
- Tests must verify stateful (database-backed) session behavior
- Tests must verify session creation, validation, invalidation
- Tests must verify session expiration handling
- Tests must verify immediate revocation capability

---

## 2. Interface Shape and Type Integrity Tests

### Test Category: SessionRecord Shape Integrity

**Purpose**: Ensure SessionRecord structure matches interface contract  
**Contract Protected**: Step 6a public interface (types.ts)

**Test Specification**:
- Verify that `SessionRecord` has required properties: `id`, `userId`, `token`, `expiresAt`, `createdAt`, `lastActiveAt`, `invalidated`, `invalidatedAt`
- Verify that `id` property is of type `string`
- Verify that `userId` property is of type `string`
- Verify that `token` property is of type `string` (cryptographically secure random token)
- Verify that `expiresAt` property is of type `number` (timestamp)
- Verify that `createdAt` property is of type `number` (timestamp)
- Verify that `lastActiveAt` property is of type `number` (timestamp)
- Verify that `invalidated` property is of type `boolean`
- Verify that `invalidatedAt` property is of type `number | undefined` (optional timestamp)
- Verify all fields are readonly (immutable)

**Failure Criteria**:
- Missing required fields
- Additional inferred fields
- Mutable fields
- Incorrect types

---

### Test Category: PublicSession Shape Integrity

**Purpose**: Ensure PublicSession structure matches interface contract (token excluded)  
**Contract Protected**: Step 6a public interface (types.ts)

**Test Specification**:
- Verify that `PublicSession` has required properties: `id`, `userId`, `expiresAt`, `createdAt`, `lastActiveAt`
- Verify that `PublicSession` does NOT include `token` field (token leakage prevention)
- Verify that `PublicSession` does NOT include `invalidated` or `invalidatedAt` fields (internal state only)
- Verify all fields are readonly (immutable)

**Failure Criteria**:
- Token field present (security violation)
- Invalidated fields present (internal state leakage)
- Mutable fields

---

### Test Category: AuthenticatedUserContext Shape Integrity

**Purpose**: Ensure AuthenticatedUserContext structure matches interface contract  
**Contract Protected**: Step 6a public interface (types.ts)

**Test Specification**:
- Verify that `AuthenticatedUserContext` has required properties: `userId`, `userRole`, `sessionId`
- Verify that `userId` property is of type `string`
- Verify that `userRole` property is of type `UserRole` (from Authorization module)
- Verify that `sessionId` property is of type `string`
- Verify that `AuthenticatedUserContext` does NOT include sensitive information (passwords, tokens)
- Verify all fields are readonly (immutable)

**Failure Criteria**:
- Missing required fields
- Sensitive information present (security violation)
- Mutable fields

---

### Test Category: LoginOutput Shape Integrity

**Purpose**: Ensure LoginOutput structure matches interface contract (token separated)  
**Contract Protected**: Step 6a public interface (types.ts)

**Test Specification**:
- Verify that `LoginOutput` has required properties: `session`, `token`, `userContext`
- Verify that `session` property is of type `PublicSession` (not SessionRecord, token excluded)
- Verify that `token` property is of type `string` (returned separately for explicit handling)
- Verify that `userContext` property is of type `AuthenticatedUserContext`
- Verify all fields are readonly (immutable)

**Failure Criteria**:
- Session includes token (token leakage violation)
- Token not returned separately
- Mutable fields

---

### Test Category: ChangePasswordInput Shape Integrity

**Purpose**: Ensure ChangePasswordInput does NOT include userId (authorization bypass prevention)  
**Contract Protected**: Step 6a public interface (types.ts)

**Test Specification**:
- Verify that `ChangePasswordInput` has required properties: `currentPassword`, `newPassword`
- Verify that `ChangePasswordInput` does NOT include `userId` field (userId derived from session, not client input)
- Verify that `currentPassword` property is of type `string`
- Verify that `newPassword` property is of type `string`
- Verify all fields are readonly (immutable)

**Failure Criteria**:
- userId field present (authorization bypass risk)
- Missing required fields
- Mutable fields

---

## 3. Login Function Tests

### Test Category: Login Success

**Purpose**: Verify successful authentication and session creation  
**Contract Protected**: Step 6a `login` function signature

**Preconditions**:
- User exists in database with `state: "active"`
- User has valid `passwordHash` stored
- User email matches provided email
- User password matches stored password hash

**Test Specification**:
- Call `login` with valid email and password
- Verify return type is `LoginOutput` (not ErrorEnvelope)
- Verify `LoginOutput.session` is of type `PublicSession` (token excluded)
- Verify `LoginOutput.token` is a non-empty string (cryptographically secure)
- Verify `LoginOutput.userContext.userId` matches user ID
- Verify `LoginOutput.userContext.userRole` matches user role from database (not inferred)
- Verify `LoginOutput.userContext.sessionId` matches created session ID
- Verify session created in database with:
  - `userId` matches user ID
  - `token` matches returned token
  - `expiresAt` is in the future (recommended: 24 hours from now)
  - `createdAt` is current timestamp
  - `lastActiveAt` is current timestamp
  - `invalidated: false`
  - `invalidatedAt: undefined`
- Verify UTID generated for login action (Utilities module)
- Verify password hash comparison uses constant-time algorithm (timing attack prevention)

**Failure Criteria**:
- ErrorEnvelope returned instead of LoginOutput
- Session not created in database
- Token not cryptographically secure
- Token included in session object (token leakage)
- Role inferred from email (BLOCKED FOR PRODUCTION)
- UTID not generated
- Password hash comparison not constant-time

---

### Test Category: Login Invalid Password

**Purpose**: Verify authentication failure for incorrect password  
**Contract Protected**: Step 6a `login` function signature

**Preconditions**:
- User exists in database with `state: "active"`
- User has valid `passwordHash` stored
- User email matches provided email
- User password does NOT match stored password hash

**Test Specification**:
- Call `login` with valid email and incorrect password
- Verify return type is `ErrorEnvelope` (not LoginOutput)
- Verify error code indicates authentication failure (not system error)
- Verify no session created in database
- Verify error message does NOT reveal whether email exists (security measure)
- Verify error message does NOT include password hints (security measure)
- Verify password hash comparison uses constant-time algorithm (timing attack prevention)
- Verify response time is similar to non-existent email case (timing attack prevention)

**Failure Criteria**:
- LoginOutput returned (authentication bypass)
- Session created in database
- Error message reveals email existence
- Error message includes password hints
- Timing difference reveals email existence

---

### Test Category: Login Non-Existent Email

**Purpose**: Verify authentication failure for non-existent email (indistinguishable response)  
**Contract Protected**: Step 6a `login` function signature, security boundaries

**Preconditions**:
- User does NOT exist in database with provided email

**Test Specification**:
- Call `login` with non-existent email and any password
- Verify return type is `ErrorEnvelope` (not LoginOutput)
- Verify error code indicates authentication failure (same as invalid password case)
- Verify no session created in database
- Verify error message does NOT reveal that email does not exist (security measure)
- Verify error message is identical to invalid password case (indistinguishable response)
- Verify response time is similar to invalid password case (timing attack prevention)
- Verify password hash comparison is NOT performed (no user found, no hash to compare)

**Failure Criteria**:
- LoginOutput returned (authentication bypass)
- Session created in database
- Error message reveals email does not exist
- Error message differs from invalid password case
- Timing difference reveals email existence

---

### Test Category: Login Suspended User

**Purpose**: Verify authentication failure for suspended user account  
**Contract Protected**: Step 6a `login` function signature, User Management integration

**Preconditions**:
- User exists in database with `state: "suspended"`
- User has valid `passwordHash` stored
- User email matches provided email
- User password matches stored password hash

**Test Specification**:
- Call `login` with valid email and password for suspended user
- Verify return type is `ErrorEnvelope` (not LoginOutput)
- Verify error code indicates account suspended (not authentication failure)
- Verify no session created in database
- Verify error message indicates account suspended (not password incorrect)
- Verify User Management `getUserById` is consulted (user state checked)

**Failure Criteria**:
- LoginOutput returned (authentication bypass)
- Session created in database
- Error code indicates authentication failure (should indicate account suspended)
- User state not checked

---

### Test Category: Login Deleted User

**Purpose**: Verify authentication failure for deleted user account  
**Contract Protected**: Step 6a `login` function signature, User Management integration

**Preconditions**:
- User exists in database with `state: "deleted"`
- User has valid `passwordHash` stored
- User email matches provided email
- User password matches stored password hash

**Test Specification**:
- Call `login` with valid email and password for deleted user
- Verify return type is `ErrorEnvelope` (not LoginOutput)
- Verify error code indicates account deleted (not authentication failure)
- Verify no session created in database
- Verify error message indicates account deleted (not password incorrect)
- Verify User Management `getUserById` is consulted (user state checked)

**Failure Criteria**:
- LoginOutput returned (authentication bypass)
- Session created in database
- Error code indicates authentication failure (should indicate account deleted)
- User state not checked

---

## 4. Session Validation Function Tests

### Test Category: ValidateSession Active Session

**Purpose**: Verify successful session validation for active session  
**Contract Protected**: Step 6a `validateSession` function signature

**Preconditions**:
- Session exists in database with:
  - `invalidated: false`
  - `expiresAt` is in the future
  - User exists with `state: "active"`

**Test Specification**:
- Call `validateSession` with valid session token
- Verify return type is `ValidateSessionOutput` (not ErrorEnvelope)
- Verify `ValidateSessionOutput.session` is of type `PublicSession` (token excluded)
- Verify `ValidateSessionOutput.userContext.userId` matches session userId
- Verify `ValidateSessionOutput.userContext.userRole` matches user role from database (not inferred)
- Verify `ValidateSessionOutput.userContext.sessionId` matches session ID
- Verify `lastActiveAt` timestamp updated in database (write operation, requires AuthenticationContext)
- Verify user account state checked (active, not suspended/deleted)
- Verify session expiration checked (expiresAt > now)
- Verify session invalidation checked (invalidated: false)

**Failure Criteria**:
- ErrorEnvelope returned instead of ValidateSessionOutput
- lastActiveAt not updated (write operation required)
- Token included in session object (token leakage)
- Role inferred from email (BLOCKED FOR PRODUCTION)
- User state not checked
- Session expiration not checked
- Session invalidation not checked

---

### Test Category: ValidateSession Expired Session

**Purpose**: Verify session validation failure for expired session  
**Contract Protected**: Step 6a `validateSession` function signature

**Preconditions**:
- Session exists in database with:
  - `invalidated: false`
  - `expiresAt` is in the past (expired)
  - User exists with `state: "active"`

**Test Specification**:
- Call `validateSession` with expired session token
- Verify return type is `ErrorEnvelope` (not ValidateSessionOutput)
- Verify error code indicates session expired (not invalid token)
- Verify `lastActiveAt` timestamp NOT updated (session expired, no update)
- Verify no authenticated user context returned

**Failure Criteria**:
- ValidateSessionOutput returned (authentication bypass)
- lastActiveAt updated (expired session should not be updated)
- Error code indicates invalid token (should indicate expired)

---

### Test Category: ValidateSession Invalidated Session

**Purpose**: Verify session validation failure for invalidated session  
**Contract Protected**: Step 6a `validateSession` function signature

**Preconditions**:
- Session exists in database with:
  - `invalidated: true`
  - `invalidatedAt` is set
  - `expiresAt` is in the future (not expired)
  - User exists with `state: "active"`

**Test Specification**:
- Call `validateSession` with invalidated session token
- Verify return type is `ErrorEnvelope` (not ValidateSessionOutput)
- Verify error code indicates session invalidated (not expired or invalid token)
- Verify `lastActiveAt` timestamp NOT updated (session invalidated, no update)
- Verify no authenticated user context returned

**Failure Criteria**:
- ValidateSessionOutput returned (authentication bypass)
- lastActiveAt updated (invalidated session should not be updated)
- Error code indicates expired or invalid token (should indicate invalidated)

---

### Test Category: ValidateSession Token Not Found

**Purpose**: Verify session validation failure for non-existent token  
**Contract Protected**: Step 6a `validateSession` function signature

**Preconditions**:
- Session does NOT exist in database with provided token

**Test Specification**:
- Call `validateSession` with non-existent session token
- Verify return type is `ErrorEnvelope` (not ValidateSessionOutput)
- Verify error code indicates invalid token (not system error)
- Verify `lastActiveAt` timestamp NOT updated (session not found, no update)
- Verify no authenticated user context returned
- Verify error message does NOT reveal token structure or validation details (security measure)

**Failure Criteria**:
- ValidateSessionOutput returned (authentication bypass)
- lastActiveAt updated (session not found, no update)
- Error message reveals token structure

---

### Test Category: ValidateSession LastActiveAt Update Behavior

**Purpose**: Verify lastActiveAt timestamp is updated on each validation (write operation)  
**Contract Protected**: Step 6a `validateSession` function signature, AuthenticationContext requirement

**Preconditions**:
- Session exists in database with:
  - `invalidated: false`
  - `expiresAt` is in the future
  - User exists with `state: "active"`
  - `lastActiveAt` is set to a known timestamp

**Test Specification**:
- Call `validateSession` with valid session token
- Verify `lastActiveAt` timestamp updated in database to current timestamp
- Call `validateSession` again with same token
- Verify `lastActiveAt` timestamp updated again to new current timestamp
- Verify function requires `AuthenticationContext` (DatabaseWriter, not DatabaseReader)
- Verify write operation is atomic (no race conditions)

**Failure Criteria**:
- lastActiveAt not updated
- lastActiveAt updated only once (should update on each validation)
- Function accepts AuthenticationQueryContext (should require AuthenticationContext for write)

---

## 5. Logout Function Tests

### Test Category: Logout Valid Session Invalidation

**Purpose**: Verify successful session invalidation on logout  
**Contract Protected**: Step 6a `logout` function signature

**Preconditions**:
- Session exists in database with:
  - `invalidated: false`
  - `expiresAt` is in the future
  - User exists with `state: "active"`

**Test Specification**:
- Call `logout` with valid session token
- Verify return type is `void` (not ErrorEnvelope)
- Verify session updated in database with:
  - `invalidated: true`
  - `invalidatedAt` is set to current timestamp
- Verify UTID generated for logout action (Utilities module)
- Verify session cannot be validated after logout (validateSession returns error)

**Failure Criteria**:
- ErrorEnvelope returned instead of void
- Session not invalidated in database
- invalidatedAt not set
- UTID not generated
- Session can still be validated after logout

---

### Test Category: Logout Idempotency

**Purpose**: Verify logout is idempotent (multiple calls have same effect)  
**Contract Protected**: Step 6a `logout` function signature

**Preconditions**:
- Session exists in database with:
  - `invalidated: false`
  - `expiresAt` is in the future
  - User exists with `state: "active"`

**Test Specification**:
- Call `logout` with valid session token
- Verify session invalidated in database
- Call `logout` again with same token
- Verify return type is `void` (not ErrorEnvelope, idempotent)
- Verify session remains invalidated (no error, no state change)
- Verify invalidatedAt timestamp unchanged (first invalidation timestamp preserved)

**Failure Criteria**:
- ErrorEnvelope returned on second call (should be idempotent)
- Session state changed on second call
- invalidatedAt timestamp changed on second call

---

### Test Category: Logout Invalid Token

**Purpose**: Verify logout failure for non-existent token  
**Contract Protected**: Step 6a `logout` function signature

**Preconditions**:
- Session does NOT exist in database with provided token

**Test Specification**:
- Call `logout` with non-existent session token
- Verify return type is `ErrorEnvelope` (not void)
- Verify error code indicates invalid token (not system error)
- Verify no database mutations performed (no session created or updated)
- Verify error message does NOT reveal token structure (security measure)

**Failure Criteria**:
- void returned (should return error)
- Database mutations performed
- Error message reveals token structure

---

## 6. Password Reset Initiation Function Tests

### Test Category: InitiatePasswordReset Existing Email

**Purpose**: Verify password reset token generation for existing email  
**Contract Protected**: Step 6a `initiatePasswordReset` function signature

**Preconditions**:
- User exists in database with provided email
- User has `state: "active"`

**Test Specification**:
- Call `initiatePasswordReset` with existing email
- Verify return type is `void` (not ErrorEnvelope, always succeeds)
- Verify password reset token created in `passwordResetTokens` table with:
  - `userId` matches user ID
  - `tokenHash` is hashed (never plaintext)
  - `expiresAt` is in the future (recommended: 1 hour from now)
  - `usedAt: undefined` (not yet used)
  - `createdAt` is current timestamp
- Verify UTID generated for password reset initiation (Utilities module)
- Verify reset token is cryptographically secure (random, unpredictable)
- Verify reset token is hashed before storage (never plaintext)
- Verify reset token delivery mechanism invoked (email or equivalent)

**Failure Criteria**:
- ErrorEnvelope returned (should always return void, even if email does not exist)
- Password reset token not created
- Token stored in plaintext (security violation)
- Token not cryptographically secure
- UTID not generated
- Reset token delivery not invoked

---

### Test Category: InitiatePasswordReset Non-Existent Email

**Purpose**: Verify password reset initiation for non-existent email (same observable result)  
**Contract Protected**: Step 6a `initiatePasswordReset` function signature, security boundaries

**Preconditions**:
- User does NOT exist in database with provided email

**Test Specification**:
- Call `initiatePasswordReset` with non-existent email
- Verify return type is `void` (not ErrorEnvelope, always succeeds)
- Verify no password reset token created in database (email does not exist)
- Verify observable result is identical to existing email case (no email existence leak)
- Verify response time is similar to existing email case (timing attack prevention)
- Verify no error message indicates email does not exist (security measure)

**Failure Criteria**:
- ErrorEnvelope returned (should always return void)
- Password reset token created (email does not exist)
- Observable result differs from existing email case
- Timing difference reveals email existence
- Error message reveals email does not exist

---

### Test Category: InitiatePasswordReset Token Creation and Expiration

**Purpose**: Verify password reset token creation and expiration handling  
**Contract Protected**: Step 6a `initiatePasswordReset` function signature

**Preconditions**:
- User exists in database with provided email
- User has `state: "active"`

**Test Specification**:
- Call `initiatePasswordReset` with existing email
- Verify password reset token created with `expiresAt` in the future
- Verify token expiration is time-limited (recommended: 1 hour, configurable)
- Verify token can be used before expiration
- Verify token cannot be used after expiration (expiresAt < now)
- Verify expired tokens are not returned in queries (expiration check)

**Failure Criteria**:
- Token expiration not set
- Token expiration not time-limited
- Token can be used after expiration
- Expired tokens returned in queries

---

## 7. Password Reset Completion Function Tests

### Test Category: CompletePasswordReset Valid Token

**Purpose**: Verify successful password reset with valid token  
**Contract Protected**: Step 6a `completePasswordReset` function signature

**Preconditions**:
- Password reset token exists in database with:
  - `usedAt: undefined` (not yet used)
  - `expiresAt` is in the future (not expired)
  - User exists with `state: "active"`

**Test Specification**:
- Call `completePasswordReset` with valid reset token and new password
- Verify return type is `void` (not ErrorEnvelope)
- Verify password hash updated in User entity (new password hashed and stored)
- Verify reset token marked as used (`usedAt` set to current timestamp)
- Verify all existing sessions for user invalidated (security measure)
- Verify UTID generated for password reset completion (Utilities module)
- Verify new password hash uses secure algorithm (bcrypt, argon2, or equivalent)
- Verify old password hash replaced (not appended)

**Failure Criteria**:
- ErrorEnvelope returned instead of void
- Password hash not updated
- Reset token not marked as used
- Existing sessions not invalidated
- UTID not generated
- Password hash not secure
- Old password hash not replaced

---

### Test Category: CompletePasswordReset Expired Token

**Purpose**: Verify password reset failure for expired token  
**Contract Protected**: Step 6a `completePasswordReset` function signature

**Preconditions**:
- Password reset token exists in database with:
  - `usedAt: undefined` (not yet used)
  - `expiresAt` is in the past (expired)
  - User exists with `state: "active"`

**Test Specification**:
- Call `completePasswordReset` with expired reset token and new password
- Verify return type is `ErrorEnvelope` (not void)
- Verify error code indicates token expired (not invalid token)
- Verify password hash NOT updated in User entity
- Verify reset token NOT marked as used (expired, cannot be used)
- Verify existing sessions NOT invalidated (reset failed)

**Failure Criteria**:
- void returned (should return error)
- Password hash updated (expired token should not update password)
- Reset token marked as used
- Existing sessions invalidated

---

### Test Category: CompletePasswordReset Reused Token

**Purpose**: Verify password reset failure for already-used token (single-use enforcement)  
**Contract Protected**: Step 6a `completePasswordReset` function signature

**Preconditions**:
- Password reset token exists in database with:
  - `usedAt` is set (already used)
  - `expiresAt` is in the future (not expired)
  - User exists with `state: "active"`

**Test Specification**:
- Call `completePasswordReset` with already-used reset token and new password
- Verify return type is `ErrorEnvelope` (not void)
- Verify error code indicates token already used (not expired or invalid)
- Verify password hash NOT updated in User entity
- Verify reset token `usedAt` timestamp unchanged (already used)
- Verify existing sessions NOT invalidated (reset failed)

**Failure Criteria**:
- void returned (should return error)
- Password hash updated (used token should not update password)
- Reset token usedAt timestamp changed
- Existing sessions invalidated

---

### Test Category: CompletePasswordReset Session Invalidation After Reset

**Purpose**: Verify all user sessions are invalidated after successful password reset  
**Contract Protected**: Step 6a `completePasswordReset` function signature, security boundaries

**Preconditions**:
- User has multiple active sessions in database
- Password reset token exists and is valid

**Test Specification**:
- Call `completePasswordReset` with valid reset token and new password
- Verify all sessions for user invalidated in database:
  - All sessions have `invalidated: true`
  - All sessions have `invalidatedAt` set to current timestamp
- Verify no active sessions remain for user
- Verify user cannot validate any previous sessions (all invalidated)

**Failure Criteria**:
- Some sessions not invalidated
- Active sessions remain for user
- User can validate previous sessions

---

## 8. Password Change Function Tests

### Test Category: ChangePassword Correct Current Password

**Purpose**: Verify successful password change with correct current password  
**Contract Protected**: Step 6a `changePassword` function signature

**Preconditions**:
- User has valid session (session token validated)
- User has current password hash stored
- Current password matches stored password hash

**Test Specification**:
- Call `changePassword` with validated session token, correct current password, and new password
- Verify return type is `void` (not ErrorEnvelope)
- Verify password hash updated in User entity (new password hashed and stored)
- Verify userId derived from validated session (not from client input, authorization bypass prevention)
- Verify current password verified (password hash comparison)
- Verify UTID generated for password change (Utilities module)
- Verify new password hash uses secure algorithm (bcrypt, argon2, or equivalent)
- Verify old password hash replaced (not appended)
- Verify session remains valid (password change does not invalidate session)

**Failure Criteria**:
- ErrorEnvelope returned instead of void
- Password hash not updated
- userId taken from client input (authorization bypass)
- Current password not verified
- UTID not generated
- Password hash not secure
- Old password hash not replaced
- Session invalidated (should remain valid)

---

### Test Category: ChangePassword Incorrect Current Password

**Purpose**: Verify password change failure for incorrect current password  
**Contract Protected**: Step 6a `changePassword` function signature

**Preconditions**:
- User has valid session (session token validated)
- User has current password hash stored
- Current password does NOT match stored password hash

**Test Specification**:
- Call `changePassword` with validated session token, incorrect current password, and new password
- Verify return type is `ErrorEnvelope` (not void)
- Verify error code indicates incorrect current password (not system error)
- Verify password hash NOT updated in User entity
- Verify current password verified (password hash comparison)
- Verify password hash comparison uses constant-time algorithm (timing attack prevention)
- Verify error message does NOT include password hints (security measure)

**Failure Criteria**:
- void returned (should return error)
- Password hash updated (incorrect password should not update)
- Current password not verified
- Timing difference reveals password correctness
- Error message includes password hints

---

## 9. Admin Session Invalidation Function Tests

### Test Category: InvalidateUserSessions Admin Succeeds

**Purpose**: Verify successful session invalidation by admin  
**Contract Protected**: Step 6a `invalidateUserSessions` function signature, INVARIANT 2.2

**Preconditions**:
- Acting user has `role: "admin"` (verified via Authorization module)
- Target user has multiple active sessions in database
- Target user exists with `state: "active"`

**Test Specification**:
- Call `invalidateUserSessions` with admin action context and target user ID
- Verify return type is `void` (not ErrorEnvelope)
- Verify all sessions for target user invalidated in database:
  - All sessions have `invalidated: true`
  - All sessions have `invalidatedAt` set to current timestamp
- Verify admin role verified via Authorization module (INVARIANT 2.2)
- Verify UTID generated for session invalidation (Utilities module)
- Verify no sessions for other users affected (only target user sessions invalidated)

**Failure Criteria**:
- ErrorEnvelope returned instead of void
- Sessions not invalidated
- Admin role not verified
- UTID not generated
- Sessions for other users affected

---

### Test Category: InvalidateUserSessions Non-Admin Denied

**Purpose**: Verify session invalidation failure for non-admin users  
**Contract Protected**: Step 6a `invalidateUserSessions` function signature, INVARIANT 2.2

**Preconditions**:
- Acting user has `role: "farmer" | "trader" | "buyer"` (not admin)
- Target user has active sessions in database
- Target user exists with `state: "active"`

**Test Specification**:
- Call `invalidateUserSessions` with non-admin action context and target user ID
- Verify return type is `ErrorEnvelope` (not void)
- Verify error code indicates authorization failure (not system error)
- Verify admin role verified via Authorization module (INVARIANT 2.2)
- Verify no sessions invalidated in database (authorization failure, no mutations)
- Verify error message indicates admin-only operation

**Failure Criteria**:
- void returned (should return error)
- Sessions invalidated (non-admin should not invalidate sessions)
- Admin role not verified
- Error code indicates system error (should indicate authorization failure)

---

## 10. Error Handling Tests

### Test Category: ErrorEnvelope Usage

**Purpose**: Verify all errors use Error Handling module (standardized error responses)  
**Contract Protected**: Step 6a function signatures, Error Handling module integration

**Test Specification**:
- Verify all error returns use `ErrorEnvelope` type (from Error Handling module)
- Verify error codes are from Error Handling taxonomy (not custom codes)
- Verify error messages are standardized (from Error Handling module)
- Verify error structure matches Error Handling contract
- Verify no custom error types created (Error Handling module only)

**Failure Criteria**:
- Custom error types used
- Error codes not from Error Handling taxonomy
- Error messages not standardized
- Error structure does not match Error Handling contract

---

### Test Category: No Sensitive Data Leakage

**Purpose**: Verify no sensitive information leaked in errors or responses  
**Contract Protected**: Security boundaries, PRODUCTION_AUTHENTICATION_SPECIFICATION.md

**Test Specification**:
- Verify error messages do NOT include passwords (no password in error messages)
- Verify error messages do NOT include password hints (no password hints)
- Verify error messages do NOT reveal email existence (indistinguishable responses)
- Verify error messages do NOT include tokens (no token in error messages)
- Verify error messages do NOT include password hashes (no hash in error messages)
- Verify PublicSession does NOT include token (token excluded from public session)
- Verify LoginOutput returns token separately (explicit token handling)
- Verify no sensitive data in logs (no passwords, tokens, hashes in logs)

**Failure Criteria**:
- Passwords in error messages
- Password hints in error messages
- Email existence revealed in errors
- Tokens in error messages
- Password hashes in error messages
- Token in PublicSession
- Token not returned separately in LoginOutput
- Sensitive data in logs

---

## 11. Invariant Enforcement Tests

### Test Category: INVARIANT 2.1 — Server-Side Authorization Enforcement

**Purpose**: Verify all authentication is server-side only  
**Contract Protected**: INVARIANT 2.1, Step 6a function signatures

**Test Specification**:
- Verify all authentication functions are server-side only (Convex backend)
- Verify password hashing is server-side only (no client-side hashing)
- Verify session token generation is server-side only (no client-side generation)
- Verify session validation is server-side only (no client-side validation)
- Verify password reset token generation is server-side only (no client-side generation)
- Verify no frontend authentication logic (all authentication in backend)
- Verify no client-side credential storage (no passwords, tokens in frontend)

**Failure Criteria**:
- Client-side authentication logic
- Client-side password hashing
- Client-side token generation
- Client-side session validation
- Frontend authentication bypass possible

---

### Test Category: INVARIANT 2.2 — Admin Role Verification

**Purpose**: Verify admin role verification for admin-only operations  
**Contract Protected**: INVARIANT 2.2, Step 6a `invalidateUserSessions` function signature

**Test Specification**:
- Verify `invalidateUserSessions` verifies admin role via Authorization module
- Verify admin role is read from User entity (not inferred)
- Verify admin role verification is server-side only
- Verify non-admin users cannot invalidate sessions
- Verify admin role verification happens before any mutations (fail-fast)

**Failure Criteria**:
- Admin role not verified
- Admin role inferred (not read from User entity)
- Non-admin users can invalidate sessions
- Admin role verification after mutations

---

### Test Category: INVARIANT 2.3 — Frontend Cannot Bypass Authorization

**Purpose**: Verify frontend cannot bypass authentication  
**Contract Protected**: INVARIANT 2.3, Step 6a function signatures

**Test Specification**:
- Verify all authentication functions are server-side only (no frontend access)
- Verify session validation is required for authenticated operations
- Verify no client-side session validation (all validation server-side)
- Verify no client-side credential verification (all verification server-side)
- Verify frontend cannot create sessions (session creation server-side only)
- Verify frontend cannot bypass authentication (authentication required for all operations)

**Failure Criteria**:
- Frontend authentication logic
- Client-side session validation
- Client-side credential verification
- Frontend session creation
- Authentication bypass possible

---

## 12. Security Edge Cases

### Test Category: Timing Attack Prevention

**Purpose**: Verify timing attack prevention in password comparison  
**Contract Protected**: Security boundaries, PRODUCTION_AUTHENTICATION_SPECIFICATION.md

**Test Specification**:
- Verify password hash comparison uses constant-time algorithm (timing attack prevention)
- Verify response time is similar for invalid password vs non-existent email (timing attack prevention)
- Verify no early returns in password comparison (constant-time enforcement)
- Verify password comparison does not reveal password correctness via timing

**Failure Criteria**:
- Password comparison not constant-time
- Timing difference reveals password correctness
- Timing difference reveals email existence
- Early returns in password comparison

---

### Test Category: Token Security

**Purpose**: Verify session token and reset token security  
**Contract Protected**: Security boundaries, PRODUCTION_AUTHENTICATION_SPECIFICATION.md

**Test Specification**:
- Verify session tokens are cryptographically secure (random, unpredictable)
- Verify password reset tokens are cryptographically secure (random, unpredictable)
- Verify tokens are never stored in plaintext (hashed before storage)
- Verify tokens are never logged (no token in logs)
- Verify tokens are never exposed in URLs (no token in URLs)
- Verify tokens are transmitted over HTTPS only (no HTTP transmission)

**Failure Criteria**:
- Tokens not cryptographically secure
- Tokens stored in plaintext
- Tokens in logs
- Tokens in URLs
- Tokens transmitted over HTTP

---

### Test Category: Password Hash Security

**Purpose**: Verify password hash security  
**Contract Protected**: Security boundaries, PRODUCTION_AUTHENTICATION_SPECIFICATION.md

**Test Specification**:
- Verify passwords are never stored in plaintext (always hashed)
- Verify password hashing uses secure algorithm (bcrypt, argon2, or equivalent)
- Verify password hashes are never exposed (no hash in responses or logs)
- Verify password hash comparison uses constant-time algorithm (timing attack prevention)
- Verify password hashes are stored in User entity `passwordHash` field

**Failure Criteria**:
- Passwords stored in plaintext
- Password hashing not secure
- Password hashes exposed
- Password hash comparison not constant-time
- Password hashes not stored correctly

---

## 13. BLOCKED Capability Documentation

### Authentication — BLOCKED Capabilities

**Role Assignment — BLOCKED**
- Authentication does not assign roles (User Management responsibility)
- Tests must verify no role assignment logic exists
- Tests must verify roles are read from User entity (not inferred)

**Role Inference — BLOCKED FOR PRODUCTION**
- Authentication does not infer roles from email prefix (BLOCKED FOR PRODUCTION)
- Tests must verify no role inference logic exists
- Tests must verify roles are explicit (read from User entity)

**JWT Tokens — BLOCKED**
- Authentication uses stateful sessions, not JWT (AUTHENTICATION_IMPLEMENTATION_DECISION.md)
- Tests must verify no JWT logic exists
- Tests must verify stateful session model is used

**External Identity Providers — BLOCKED**
- Authentication uses password-based authentication only (no OAuth, SSO, etc.)
- Tests must verify no external identity provider logic exists
- Tests must verify password-based authentication only

**Frontend Authentication — BLOCKED**
- All authentication is server-side only (INVARIANT 2.1)
- Tests must verify no frontend authentication logic exists
- Tests must verify all authentication is server-side only

---

## 14. Dependency Boundary Tests

### Test Category: Allowed Dependencies Only

**Allowed Dependencies**:
- User Management module (Step 5) — user account verification, user state checks
- Authorization module (Step 3) — admin role verification
- Utilities module (Step 1) — UTID generation
- Error Handling module (Step 2) — standardized error responses
- Schema: users, sessions, passwordResetTokens tables

**Forbidden Dependencies**:
- Rate Limiting module (Step 4) — authentication is independent of rate limiting
- Business modules (listings, payments, etc.) — authentication is independent
- Frontend code — authentication is server-side only
- External services — no external identity providers

**Test Specification**:
- Verify only allowed dependencies are imported
- Verify no forbidden dependencies are imported
- Verify no implied dependencies exist
- Verify module boundaries are respected

**Failure Criteria**:
- Forbidden dependencies imported
- Implied dependencies exist
- Module boundaries violated

---

## 15. Safe Stopping Tests

### Test Category: Step 6 Safe Stop

**Purpose**: Validate architectural safety (authentication is independent)  
**Contract Protected**: MODULARITY_GUIDE.md, architecture.md

**Test Specification**:
- Verify only Session and passwordResetToken entities are created/modified
- Verify no partial state (atomic operations)
- Verify no irreversible side effects beyond Session and passwordResetToken tables
- Verify authentication is independent (no business logic coupling)
- Verify safe to stop after Step 6 (authentication is independent module)

**Failure Criteria**:
- Business data created
- Partial state created
- Irreversible side effects beyond authentication tables
- Business logic coupling introduced

---

## ✅ TEST SPECIFICATION STATUS

**Authentication Module — Step 6b**

**Status**: ✅ **COMPLETE AND LOCKABLE**

---

## ▶️ Next Step

You may now proceed to:
> **Step 6c — Authentication module implementation**

Only after:
* Step 6a locked (public interface)
* Step 6b locked (test specification)
* Schema updated (sessions, passwordResetTokens tables)
* All prerequisites satisfied
