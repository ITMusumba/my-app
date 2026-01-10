# Utilities Module Extension Proposal — Alias Generation

**Proposal Type**: Module Extension (Re-authorization Required)  
**Target Module**: Utilities (Step 1)  
**Status**: Proposal Only (No Implementation, No Interfaces, No Test Code)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Date**: Current system state

**Context**:
- Utilities module (Step 1) is complete and locked
- User Management module (Step 5c) is approved but `createUser` is BLOCKED
- Alias generation was explicitly removed from User Management to preserve modular purity
- User aliases are required by DOMAIN_MODEL.md and BUSINESS_LOGIC.md
- Alias generation must be deterministic, stable, non-identifying, and server-side only

**Purpose**: This proposal defines an extension to the Utilities module to provide alias generation functionality, unblocking User Management module's `createUser` operation.

---

## 1. Justification: Why Alias Generation Belongs in Utilities

### Alignment with Utilities Module Purpose

**Utilities Module Purpose** (from `convex/utils/README.md`):
> "Utilities Module provides pure, deterministic, stateless utility functions required by all other modules."

**Alias Generation Characteristics**:
- ✅ **Pure function**: No side effects, no database access, no external state
- ✅ **Deterministic**: Same inputs → same alias (required for stability)
- ✅ **Stateless**: No internal state, no memory across calls
- ✅ **Foundational**: Required by User Management (and potentially other modules)
- ✅ **No dependencies**: Does not require other modules (fits Utilities' zero-dependency constraint)

### Alignment with Utilities Module Constraints

**Utilities Module Constraints** (from `convex/utils/README.md`):
- ✅ **No database access**: Alias generation does not access database
- ✅ **No side effects**: Alias generation has no side effects
- ✅ **No business logic**: Alias generation is a pure transformation function
- ✅ **No module dependencies**: Alias generation requires no other modules
- ✅ **No authorization checks**: Alias generation requires no authorization
- ✅ **No randomness** (unless deterministic): Alias generation uses deterministic hashing
- ✅ **No state management**: Alias generation is stateless

### Domain Requirements

**From DOMAIN_MODEL.md**:
- User entity requires alias field (system-generated, stable, non-identifying)
- Alias must be stable (once created, cannot be changed)

**From BUSINESS_LOGIC.md**:
- "System generates alias automatically"
- "Alias generation is NOT reversible (aliases are stable once created)"
- "Anonymity depends on alias stability"

**Conclusion**: Alias generation is a foundational utility function that fits perfectly within the Utilities module's purpose and constraints. It is a pure, deterministic transformation that requires no dependencies and serves a core system need.

---

## 2. Alias Generation Contract Specification

### Function Name
`generateUserAlias`

### Inputs

**Type**: `UserAliasGenerationContext`

```typescript
type UserAliasGenerationContext = {
  /**
   * User role (farmer, trader, buyer, admin).
   * Required: Yes
   * Type: string (must be valid UserRole)
   * Purpose: Role prefix for alias (e.g., "far" for farmer, "tra" for trader)
   */
  role: string;
  
  /**
   * User email address.
   * Required: Yes
   * Type: string (non-empty, valid email format)
   * Purpose: Source of uniqueness (hashed, not exposed in alias)
   */
  email: string;
  
  /**
   * Timestamp for alias generation (milliseconds since epoch).
   * Required: Yes
   * Type: number (non-negative, finite)
   * Purpose: Ensures uniqueness and determinism
   * Note: Must be passed as parameter (not accessed from global state)
   */
  timestamp: number;
};
```

### Outputs

**Type**: `string`

**Format**: `{rolePrefix}_{timestampHash}_{emailHash}`

**Example**: `far_a3k9x2_m7p4q1`

**Characteristics**:
- Non-empty string
- Deterministic (same inputs → same output)
- Non-identifying (no email, no real name)
- Stable (once generated, cannot be changed)
- Unique (different inputs → different output, with extremely high probability)

### Determinism Guarantees

**Contract**: Same inputs → same alias

**Requirements**:
- No randomness
- No external state access
- No time access (timestamp must be passed as parameter)
- No global variables
- Pure function (no side effects)

**Verification**: Calling `generateUserAlias` with identical `role`, `email`, and `timestamp` must produce identical alias strings.

### Uniqueness Guarantees

**Contract**: Different inputs → different alias (with extremely high probability)

**Mechanism**:
- Role prefix ensures role-based distinction
- Timestamp hash ensures time-based distinction
- Email hash ensures user-based distinction
- Combined hashing ensures collision probability is negligible

**Collision Probability**: Extremely low (hash collision probability is negligible for practical purposes)

**Note**: Collision detection is the responsibility of the calling module (User Management), not Utilities. Utilities provides the generation function only.

### Stability Guarantees

**Contract**: Once generated, alias cannot be regenerated differently

**Requirements**:
- Deterministic algorithm (same inputs always produce same output)
- No mutable state
- No time-dependent behavior (beyond timestamp parameter)
- Algorithm must be immutable (cannot change after deployment)

**Implication**: If a user is created with specific inputs, regenerating the alias with the same inputs must produce the same alias.

---

## 3. Forbidden Behaviors

### Email Leakage

**FORBIDDEN**: Exposing email address in alias

**Requirements**:
- Email must be hashed (not included as plaintext)
- Alias must not contain email domain
- Alias must not contain email prefix
- Alias must be non-identifying

**Rationale**: Aliases are for anonymity. Email addresses are sensitive and must not be exposed.

### Randomness

**FORBIDDEN**: Non-deterministic random number generation

**Requirements**:
- No `Math.random()` or equivalent
- No non-deterministic hashing
- No external random number sources

**Allowed**: Deterministic hashing (same input → same hash)

**Rationale**: Determinism is required for stability and testability.

### Retries

**FORBIDDEN**: Retry logic or collision resolution within Utilities

**Requirements**:
- Function must not attempt to resolve collisions
- Function must not modify inputs to avoid collisions
- Function must not call itself recursively

**Rationale**: Collision handling is the responsibility of the calling module. Utilities provides pure generation only.

### Input Mutation

**FORBIDDEN**: Modifying input parameters

**Requirements**:
- Inputs must be treated as readonly
- No mutation of context object
- No modification of string inputs

**Rationale**: Pure functions must not mutate inputs.

### Database Access

**FORBIDDEN**: Accessing database to check for collisions

**Requirements**:
- No database queries
- No entity lookups
- No collision checking

**Rationale**: Utilities module must remain pure and stateless. Collision checking is the calling module's responsibility.

### External Dependencies

**FORBIDDEN**: Importing from other modules

**Requirements**:
- No imports from User Management
- No imports from Authorization
- No imports from Error Handling
- No imports from any other module

**Rationale**: Utilities module must have zero dependencies.

---

## 4. Collision Handling

### Utilities Module Responsibility

**Utilities module does NOT handle collisions**.

**Rationale**: 
- Utilities is pure and stateless
- Collision checking requires database access
- Collision handling is a business logic concern

### Calling Module Responsibility

**User Management module must handle collisions**.

**Required Behavior**:
1. Generate alias using `generateUserAlias`
2. Check database for existing alias
3. If collision detected:
   - Return error (alias collision is extremely rare)
   - OR: Use deterministic collision resolution (e.g., append deterministic suffix)

**Note**: Collision probability is negligible with proper hashing. Collision handling should be defensive but not expected in normal operation.

### Deterministic Collision Resolution (If Needed)

**If User Management requires collision resolution**:
- Must be deterministic (same collision → same resolution)
- Must not modify Utilities function
- Must be implemented in User Management module

**Example** (User Management responsibility, not Utilities):
```typescript
// In User Management (NOT Utilities)
let alias = generateUserAlias(context);
let collisionCount = 0;
while (await aliasExists(alias)) {
  collisionCount++;
  // Deterministic suffix based on collision count
  alias = `${alias}_${collisionCount.toString(36)}`;
  if (collisionCount > 100) {
    return error("Alias collision resolution failed");
  }
}
```

**Note**: This is User Management's responsibility, not Utilities'.

---

## 5. UTID Interaction

### No UTID Interaction

**Alias generation does NOT interact with UTID generation**.

**Rationale**:
- Aliases are for user identity (anonymity)
- UTIDs are for transaction auditability
- Different purposes, different scopes
- No functional relationship

### Separate Operations

**Alias generation**:
- Purpose: User anonymity
- Scope: User entity
- Lifetime: Permanent (stable)
- Format: `{rolePrefix}_{timestampHash}_{emailHash}`

**UTID generation**:
- Purpose: Transaction auditability
- Scope: All meaningful actions
- Lifetime: Immutable once created
- Format: `{entityType}-{timestamp}-{hash}`

**Conclusion**: No interaction required or desired.

---

## 6. Caller Modules

### Primary Caller: User Management

**User Management module (Step 5)** is the primary and intended caller.

**Usage**:
- `createUser` function calls `generateUserAlias`
- Alias is generated before user entity creation
- Alias is stored in user entity

**Authorization**: User Management is responsible for authorization (admin-only user creation).

### Future Potential Callers

**No other modules are currently authorized to call alias generation**.

**Rationale**:
- Alias generation is specific to user creation
- Other modules should not generate user aliases
- If future modules need alias generation, they must be explicitly authorized

**Note**: This is a conservative approach. If other modules need alias generation in the future, they must be explicitly authorized and documented.

---

## 7. Safety Confirmation

### No New Authority Introduced

**Confirmation**: ✅ **SAFE**

**Rationale**:
- Alias generation is a pure transformation function
- No authorization checks
- No permission verification
- No role-based behavior (beyond role prefix extraction)
- Calling module (User Management) is responsible for authorization

### No Side Effects

**Confirmation**: ✅ **SAFE**

**Rationale**:
- Pure function (no side effects)
- No database access
- No network calls
- No file I/O
- No logging (Utilities module does not log)
- No state mutation

### No Coupling Introduced

**Confirmation**: ✅ **SAFE**

**Rationale**:
- No imports from other modules
- No dependencies on other modules
- No references to other modules
- Self-contained function
- Utilities module remains dependency-free

### No Invariant Violations

**Confirmation**: ✅ **SAFE**

**Existing Invariants** (from INVARIANTS.md):
- **INVARIANT 4.1 (UTID Immutability)**: Not applicable (aliases are not UTIDs)
- **INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)**: Not applicable (alias generation is not a meaningful action, it's a utility function)
- **INVARIANT 6.1 (Trader Exposure Limit)**: Not applicable
- **INVARIANT 6.2 (Exposure Calculation Atomicity)**: Not applicable

**New Invariants**: None introduced.

**Conclusion**: Alias generation does not violate any existing invariants.

---

## 8. What Changes in Utilities

### New Function Added

**Function**: `generateUserAlias`

**Location**: `convex/utils/index.ts` (implementation) and `convex/utils/types.ts` (interface)

**Type**: New export (additive change only)

**Breaking Changes**: None

### New Type Added

**Type**: `UserAliasGenerationContext`

**Location**: `convex/utils/types.ts`

**Type**: New type definition (additive change only)

**Breaking Changes**: None

### Documentation Updates

**Files to Update**:
- `convex/utils/README.md`: Add alias generation to "Allowed Operations" section
- `convex/utils/types.ts`: Add type definition and function signature
- `convex/utils/index.ts`: Add implementation

**Breaking Changes**: None

---

## 9. What Does NOT Change

### No Breaking Changes to Existing APIs

**Confirmed**: ✅ **NO BREAKING CHANGES**

**Existing Functions** (unchanged):
- `generateUTID`: Unchanged
- `calculateExposure`: Unchanged
- `calculateSLA`: Unchanged (if exists)

**Existing Types** (unchanged):
- `UTIDGenerationContext`: Unchanged
- `ExposureCalculationData`: Unchanged
- All other existing types: Unchanged

### No Changes to Module Dependencies

**Confirmed**: ✅ **NO DEPENDENCY CHANGES**

**Utilities module dependencies**: Still zero (no dependencies)

**Other modules' dependencies on Utilities**: Unchanged (additive only)

### No Changes to Module Boundaries

**Confirmed**: ✅ **NO BOUNDARY CHANGES**

**Utilities module boundaries**: Unchanged
- Still pure functions only
- Still no database access
- Still no side effects
- Still no business logic

### No Changes to User Management

**Confirmed**: ✅ **USER MANAGEMENT UNCHANGED**

**User Management module**: No changes required in this proposal
- User Management will consume the new function (future change)
- User Management interface unchanged
- User Management implementation unchanged (until function is available)

---

## 10. Why This Extension Is Safe to Re-Authorize

### Additive Change Only

**Rationale**: This extension adds a new function without modifying existing functionality.

**Risk**: Minimal (additive changes are low-risk)

### Aligns with Module Purpose

**Rationale**: Alias generation fits perfectly within Utilities module's purpose (pure, deterministic, stateless utilities).

**Risk**: None (function belongs in Utilities)

### No Invariant Violations

**Rationale**: Alias generation does not violate any existing invariants.

**Risk**: None (no invariant conflicts)

### No Coupling Introduced

**Rationale**: Alias generation requires no dependencies and introduces no coupling.

**Risk**: None (remains dependency-free)

### Preserves Module Purity

**Rationale**: Alias generation is a pure function with no side effects.

**Risk**: None (maintains module purity)

### Unblocks Critical Functionality

**Rationale**: This extension unblocks User Management's `createUser` operation, which is required for system operation.

**Benefit**: High (enables user creation)

**Risk**: Low (additive, pure function)

### Conservative Design

**Rationale**: 
- Deterministic algorithm
- No randomness
- No side effects
- No dependencies
- Clear contract
- Explicit forbidden behaviors

**Risk**: Minimal (conservative, well-defined)

---

## 11. Implementation Notes (For Future Reference)

### Algorithm Requirements

**Deterministic Hashing**:
- Use deterministic hash function (same input → same hash)
- Combine role, email, and timestamp for uniqueness
- Use base36 encoding for compact representation

**Format**:
- Role prefix: First 3 characters of role
- Timestamp hash: Deterministic hash of timestamp (base36, 6 chars)
- Email hash: Deterministic hash of email (base36, 6 chars)
- Separator: Underscore (`_`)

**Example Implementation Pattern** (conceptual, not code):
```
rolePrefix = role.substring(0, 3)  // "farmer" → "far"
timestampHash = hash(timestamp).toString(36).substring(0, 6)
emailHash = hash(email).toString(36).substring(0, 6)
alias = `${rolePrefix}_${timestampHash}_${emailHash}`
```

### Error Handling

**Utilities Module**:
- Throw `MissingParameterError` if required parameters missing
- Throw `InvalidParameterError` if parameters invalid
- No ErrorEnvelope (Utilities throws errors, does not return ErrorEnvelope)

**User Management Module** (calling module):
- Catch errors from Utilities
- Convert to ErrorEnvelope using Error Handling module
- Return ErrorEnvelope to caller

---

## 12. Decision

### Proposal Status

**STATUS**: ✅ **APPROVED**

### Authorization

**Utilities Module Extension (Step 1b) is AUTHORIZED to proceed**.

**Scope**:
- Add `generateUserAlias` function to Utilities module
- Add `UserAliasGenerationContext` type to Utilities module
- Update Utilities module documentation
- No changes to existing Utilities APIs
- No changes to other modules (until User Management consumes the function)

### Next Steps

1. **Step 1b (Utilities Extension)**:
   - Update `convex/utils/types.ts` to add `UserAliasGenerationContext` type and `generateUserAlias` function signature
   - Update `convex/utils/README.md` to document alias generation
   - Implement `generateUserAlias` in `convex/utils/index.ts`
   - Update `convex/utils/TEST_SPECIFICATION.md` to add alias generation tests

2. **Step 5d (User Management Update)**:
   - Update User Management's `createUser` to consume `generateUserAlias` from Utilities
   - Remove the explicit blocker error
   - Implement alias collision checking in User Management

### Conditions

**This approval is conditional on**:
- Implementation must match the contract specified in this proposal
- Implementation must preserve Utilities module purity, determinism, and statelessness
- Implementation must not introduce dependencies or coupling
- Implementation must not violate any existing invariants

---

## 13. Final Verification Checklist

- ✅ Justification provided (alias generation belongs in Utilities)
- ✅ Contract specified (inputs, outputs, guarantees)
- ✅ Forbidden behaviors defined (email leakage, randomness, retries, input mutation)
- ✅ Collision handling defined (Utilities does not handle, User Management does)
- ✅ UTID interaction defined (none)
- ✅ Caller modules defined (User Management primary, no others authorized)
- ✅ Safety confirmed (no authority, no side effects, no coupling)
- ✅ Invariant compliance confirmed (no violations)
- ✅ Changes specified (new function only, additive)
- ✅ Non-changes specified (no breaking changes)
- ✅ Re-authorization safety justified (additive, pure, low-risk)
- ✅ Decision provided (APPROVED)
- ✅ Next steps defined (Step 1b and Step 5d)

---

**Proposal Complete. Ready for Implementation Authorization.**
