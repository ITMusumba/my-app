# Utilities Module README

**Module**: Utilities  
**Step**: 1 (IMPLEMENTATION_SEQUENCE.md)  
**Status**: Specification only (no implementation yet)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- IMPLEMENTATION_SEQUENCE.md Step 1 defines this module
- IMPLEMENTATION_BOUNDARIES.md defines coding constraints
- INVARIANTS.md defines non-negotiable guarantees (4.1, 4.2, 6.1, 6.2)

**Purpose**: This document defines the Utilities module specification. This is NOT an implementation guide. This defines contracts, not code.

---

## 1. Module Purpose

### Core Purpose

**Utilities Module** provides pure, deterministic, stateless utility functions required by all other modules. This module has no dependencies and must be built first.

**Why This Module Exists**:
- All modules require UTID generation (INVARIANT 4.1, 4.2)
- Transaction module requires exposure calculation (INVARIANT 6.1, 6.2)
- All modules require SLA calculation (time-based rules)
- No other module can function without these utilities

**Why This Module Must Be First**:
- No dependencies (can be built independently)
- Required by all other modules (foundational)
- Provides core invariants (UTID immutability, exposure limits)
- Safe to stop after (no data created, no side effects)

---

## 2. What This Module Is Allowed to Do

### Allowed Operations

**1. UTID Generation**:
- Generate unique, deterministic UTIDs
- UTIDs must be immutable once generated
- UTIDs must be traceable and auditable
- UTID generation must be pure (no side effects)

**2. Exposure Calculation**:
- Calculate trader exposure (capital committed + locked orders + inventory value)
- Enforce exposure limit (UGX 1,000,000 maximum)
- Exposure calculation must be deterministic (same inputs = same output)
- Exposure calculation must be pure (no side effects)

**3. SLA Calculation**:
- Calculate farmer delivery SLA (6 hours from lock time)
- Calculate buyer pickup SLA (48 hours from purchase time)
- SLA calculation must be deterministic (same inputs = same output)
- SLA calculation must be pure (no side effects)

**4. Common Utilities**:
- Time-based calculations (deadlines, expiration)
- Unit conversions (if needed)
- Validation helpers (if needed)
- All utilities must be pure and deterministic

**Constraints**:
- All functions must be pure (no side effects)
- All functions must be deterministic (same input = same output)
- All functions must be stateless (no internal state)
- All functions must be independently testable

**BLOCKED Notes**: None (utilities are foundational, no BLOCKED dependencies)

---

## 3. What This Module Must NEVER Do

### Forbidden Operations

**1. Database Access**:
- **FORBIDDEN**: Access database (read or write)
- **FORBIDDEN**: Query entities
- **FORBIDDEN**: Create, update, or delete entities
- **Reason**: Utilities must be pure and stateless

**2. Side Effects**:
- **FORBIDDEN**: Create side effects (logging, network calls, file I/O)
- **FORBIDDEN**: Modify external state
- **FORBIDDEN**: Access global state
- **Reason**: Utilities must be pure and deterministic

**3. Business Logic**:
- **FORBIDDEN**: Implement business logic
- **FORBIDDEN**: Make business decisions
- **FORBIDDEN**: Enforce business rules (beyond exposure limits)
- **Reason**: Utilities are pure functions, not business logic

**4. Module Dependencies**:
- **FORBIDDEN**: Depend on other modules
- **FORBIDDEN**: Import from other modules
- **FORBIDDEN**: Reference other modules
- **Reason**: Utilities must be foundational (no dependencies)

**5. Authorization or Activation Checks**:
- **FORBIDDEN**: Check authorization status
- **FORBIDDEN**: Check activation status
- **FORBIDDEN**: Assume authorization or activation exists
- **Reason**: Utilities are pure functions, not authorization logic

**6. BLOCKED Capabilities**:
- **FORBIDDEN**: Implement BLOCKED capabilities
- **FORBIDDEN**: Depend on BLOCKED capabilities
- **FORBIDDEN**: Assume BLOCKED capabilities exist
- **Reason**: Utilities must not require BLOCKED capabilities

**7. Non-Deterministic Behavior**:
- **FORBIDDEN**: Use random number generation (unless deterministic)
- **FORBIDDEN**: Use current time (unless passed as parameter)
- **FORBIDDEN**: Use external state (unless passed as parameter)
- **Reason**: Utilities must be deterministic

**8. State Management**:
- **FORBIDDEN**: Maintain internal state
- **FORBIDDEN**: Use global variables
- **FORBIDDEN**: Cache results (unless deterministic)
- **Reason**: Utilities must be stateless

---

## 4. Public Utility Functions (Names + Contracts Only)

### Function 1: generateUTID

**Name**: `generateUTID`

**Purpose**: Generate a unique, deterministic UTID (Unique Transaction ID) for auditability and traceability.

**Contract**:
```
generateUTID(context: UTIDGenerationContext): string
```

**Parameters**:
- `context`: UTIDGenerationContext (object containing context for UTID generation)
  - `entityType`: string (type of entity: "listing", "transaction", "admin_action", etc.)
  - `timestamp`: number (timestamp for UTID generation, must be passed as parameter)
  - `additionalData?`: object (optional additional data for uniqueness)

**Returns**: `string` (UTID - unique, deterministic, immutable identifier)

**Invariants Supported**:
- INVARIANT 4.1: UTID Immutability (UTID is immutable once generated)
- INVARIANT 4.2: All Meaningful Actions Generate UTIDs (UTID generation available)

**Requirements**:
- Must be deterministic (same inputs = same UTID)
- Must be unique (different inputs = different UTID)
- Must be immutable (UTID cannot be modified after generation)
- Must be pure (no side effects)
- Must be stateless (no internal state)

**Failure Conditions**:
- If `context` is missing: throw explicit error
- If `entityType` is missing: throw explicit error
- If `timestamp` is missing: throw explicit error
- If UTID generation fails: throw explicit error

**BLOCKED Notes**: None

---

### Function 2: calculateExposure

**Name**: `calculateExposure`

**Purpose**: Calculate trader exposure (capital committed + locked orders + inventory value) and verify it does not exceed UGX 1,000,000.

**Contract**:
```
calculateExposure(exposureData: ExposureCalculationData): ExposureCalculationResult
```

**Parameters**:
- `exposureData`: ExposureCalculationData (object containing exposure components)
  - `capitalCommitted`: number (capital currently committed in locked units, in UGX)
  - `lockedOrders`: number (value of locked orders, in UGX)
  - `inventoryValue`: number (value of inventory in storage, in UGX)

**Returns**: `ExposureCalculationResult` (object containing exposure calculation)
  - `totalExposure`: number (total exposure: capitalCommitted + lockedOrders + inventoryValue, in UGX)
  - `exceedsLimit`: boolean (true if totalExposure > 1,000,000, false otherwise)
  - `limit`: number (exposure limit: 1,000,000, in UGX)
  - `remainingCapacity`: number (limit - totalExposure, in UGX, minimum 0)

**Invariants Supported**:
- INVARIANT 6.1: Trader Exposure Limit Enforcement (exposure limit: UGX 1,000,000)
- INVARIANT 6.2: Exposure Calculation Atomicity (exposure calculation must be atomic with unit lock)

**Requirements**:
- Must be deterministic (same inputs = same output)
- Must be pure (no side effects)
- Must be stateless (no internal state)
- Must enforce exposure limit (UGX 1,000,000 maximum)
- Must calculate all components (capital committed + locked orders + inventory value)

**Failure Conditions**:
- If `exposureData` is missing: throw explicit error
- If `capitalCommitted` is missing or negative: throw explicit error
- If `lockedOrders` is missing or negative: throw explicit error
- If `inventoryValue` is missing or negative: throw explicit error
- If any component is not a number: throw explicit error

**BLOCKED Notes**: None

---

### Function 3: calculateFarmerDeliverySLA

**Name**: `calculateFarmerDeliverySLA`

**Purpose**: Calculate farmer delivery deadline (6 hours from lock time).

**Contract**:
```
calculateFarmerDeliverySLA(lockTime: number): SLACalculationResult
```

**Parameters**:
- `lockTime`: number (timestamp when unit was locked, in milliseconds since epoch)

**Returns**: `SLACalculationResult` (object containing SLA calculation)
  - `deadline`: number (delivery deadline timestamp, in milliseconds since epoch)
  - `slaHours`: number (SLA duration: 6 hours)
  - `isExpired`: boolean (true if current time > deadline, false otherwise)
  - `timeRemaining`: number (time remaining until deadline, in milliseconds, minimum 0)

**Invariants Supported**: None (SLA calculation supports business logic, not an invariant)

**Requirements**:
- Must be deterministic (same input = same output, if current time is passed as parameter)
- Must be pure (no side effects)
- Must be stateless (no internal state)
- Must calculate 6 hours from lock time

**Failure Conditions**:
- If `lockTime` is missing: throw explicit error
- If `lockTime` is not a number: throw explicit error
- If `lockTime` is negative: throw explicit error
- If `lockTime` is in the future: throw explicit error (if validation is required)

**BLOCKED Notes**: None

---

### Function 4: calculateBuyerPickupSLA

**Name**: `calculateBuyerPickupSLA`

**Purpose**: Calculate buyer pickup deadline (48 hours from purchase time).

**Contract**:
```
calculateBuyerPickupSLA(purchaseTime: number): SLACalculationResult
```

**Parameters**:
- `purchaseTime`: number (timestamp when inventory was purchased, in milliseconds since epoch)

**Returns**: `SLACalculationResult` (object containing SLA calculation)
  - `deadline`: number (pickup deadline timestamp, in milliseconds since epoch)
  - `slaHours`: number (SLA duration: 48 hours)
  - `isExpired`: boolean (true if current time > deadline, false otherwise)
  - `timeRemaining`: number (time remaining until deadline, in milliseconds, minimum 0)

**Invariants Supported**: None (SLA calculation supports business logic, not an invariant)

**Requirements**:
- Must be deterministic (same input = same output, if current time is passed as parameter)
- Must be pure (no side effects)
- Must be stateless (no internal state)
- Must calculate 48 hours from purchase time

**Failure Conditions**:
- If `purchaseTime` is missing: throw explicit error
- If `purchaseTime` is not a number: throw explicit error
- If `purchaseTime` is negative: throw explicit error
- If `purchaseTime` is in the future: throw explicit error (if validation is required)

**BLOCKED Notes**: Buyer purchase function is NOT IMPLEMENTED (BLOCKED). This function may not be used until purchase function is implemented.

---

### Function 5: validateExposureLimit

**Name**: `validateExposureLimit`

**Purpose**: Validate that exposure does not exceed UGX 1,000,000 limit.

**Contract**:
```
validateExposureLimit(exposure: number): ExposureValidationResult
```

**Parameters**:
- `exposure`: number (total exposure to validate, in UGX)

**Returns**: `ExposureValidationResult` (object containing validation result)
  - `isValid`: boolean (true if exposure <= 1,000,000, false otherwise)
  - `exceedsLimit`: boolean (true if exposure > 1,000,000, false otherwise)
  - `limit`: number (exposure limit: 1,000,000, in UGX)
  - `excess`: number (exposure - limit, in UGX, minimum 0)

**Invariants Supported**:
- INVARIANT 6.1: Trader Exposure Limit Enforcement (exposure limit: UGX 1,000,000)

**Requirements**:
- Must be deterministic (same input = same output)
- Must be pure (no side effects)
- Must be stateless (no internal state)
- Must enforce exposure limit (UGX 1,000,000 maximum)

**Failure Conditions**:
- If `exposure` is missing: throw explicit error
- If `exposure` is not a number: throw explicit error
- If `exposure` is negative: throw explicit error

**BLOCKED Notes**: None

---

## 5. Invariants This Module Directly Supports

### INVARIANT 4.1: UTID Immutability

**How Module Supports**:
- `generateUTID` function generates immutable UTIDs
- UTIDs are deterministic (same inputs = same UTID)
- UTIDs cannot be modified after generation (immutability enforced by function contract)

**Module Responsibility**:
- Generate UTIDs that are immutable
- Ensure UTID generation is deterministic
- Ensure UTID generation is pure (no side effects)

**BLOCKED Notes**: None

---

### INVARIANT 4.2: All Meaningful Actions Generate UTIDs

**How Module Supports**:
- `generateUTID` function provides UTID generation capability
- All modules can use `generateUTID` to generate UTIDs for meaningful actions
- UTID generation is available before any other module is built

**Module Responsibility**:
- Provide UTID generation function
- Ensure UTID generation is available to all modules
- Ensure UTID generation is pure and deterministic

**BLOCKED Notes**: None

---

### INVARIANT 6.1: Trader Exposure Limit Enforcement

**How Module Supports**:
- `calculateExposure` function calculates trader exposure
- `validateExposureLimit` function validates exposure does not exceed UGX 1,000,000
- Exposure calculation enforces limit (UGX 1,000,000 maximum)

**Module Responsibility**:
- Calculate exposure correctly (capital committed + locked orders + inventory value)
- Enforce exposure limit (UGX 1,000,000 maximum)
- Provide exposure validation function

**BLOCKED Notes**: None

---

### INVARIANT 6.2: Exposure Calculation Atomicity

**How Module Supports**:
- `calculateExposure` function provides exposure calculation capability
- Exposure calculation is pure and deterministic (can be called atomically)
- Exposure calculation does not depend on external state (can be called in atomic transaction)

**Module Responsibility**:
- Provide exposure calculation function that can be called atomically
- Ensure exposure calculation is pure (no side effects)
- Ensure exposure calculation is deterministic (same inputs = same output)

**BLOCKED Notes**: Atomicity is enforced by the calling module (Transaction module), not by Utilities module. Utilities module provides the calculation function, but atomicity is the responsibility of the caller.

---

## 6. How Misuse Must Fail

### Misuse Failure Modes

**1. Missing Parameters**:
- **Misuse**: Calling function without required parameters
- **Failure**: Throw explicit error (not silent failure)
- **Error Message**: Must indicate which parameter is missing
- **Example**: `generateUTID()` without `context` → throw error "Missing required parameter: context"

**2. Invalid Parameters**:
- **Misuse**: Calling function with invalid parameters (wrong type, negative values, etc.)
- **Failure**: Throw explicit error (not silent failure)
- **Error Message**: Must indicate which parameter is invalid and why
- **Example**: `calculateExposure({ capitalCommitted: -100 })` → throw error "Invalid parameter: capitalCommitted must be non-negative"

**3. Missing Dependencies**:
- **Misuse**: Function requires dependencies that are not available
- **Failure**: Throw explicit error (not silent failure)
- **Error Message**: Must indicate which dependency is missing
- **BLOCKED Notes**: Utilities module has no dependencies, so this should not occur

**4. Non-Deterministic Behavior**:
- **Misuse**: Function behaves non-deterministically (different outputs for same inputs)
- **Failure**: Function must be deterministic (same inputs = same output)
- **Error Message**: N/A (function must not allow non-deterministic behavior)

**5. Side Effects**:
- **Misuse**: Function creates side effects (database access, logging, network calls)
- **Failure**: Function must be pure (no side effects)
- **Error Message**: N/A (function must not allow side effects)

**Failure Principle**: **Explicit failure over unsafe behavior**. All misuse must fail explicitly, not silently.

---

## 7. Test Expectations

### Test Requirements

**1. UTID Generation Tests**:
- Test UTID generation is deterministic (same inputs = same UTID)
- Test UTID generation is unique (different inputs = different UTID)
- Test UTID generation handles missing parameters (throws explicit error)
- Test UTID generation handles invalid parameters (throws explicit error)
- Test UTID generation is pure (no side effects)

**2. Exposure Calculation Tests**:
- Test exposure calculation is correct (capital committed + locked orders + inventory value)
- Test exposure limit enforcement (UGX 1,000,000 maximum)
- Test exposure calculation handles missing parameters (throws explicit error)
- Test exposure calculation handles invalid parameters (throws explicit error)
- Test exposure calculation is pure (no side effects)
- Test exposure calculation is deterministic (same inputs = same output)

**3. SLA Calculation Tests**:
- Test farmer delivery SLA calculation (6 hours from lock time)
- Test buyer pickup SLA calculation (48 hours from purchase time)
- Test SLA calculation handles missing parameters (throws explicit error)
- Test SLA calculation handles invalid parameters (throws explicit error)
- Test SLA calculation is pure (no side effects)
- Test SLA calculation is deterministic (same inputs = same output, if current time is passed as parameter)

**4. Exposure Validation Tests**:
- Test exposure validation enforces limit (UGX 1,000,000 maximum)
- Test exposure validation handles missing parameters (throws explicit error)
- Test exposure validation handles invalid parameters (throws explicit error)
- Test exposure validation is pure (no side effects)
- Test exposure validation is deterministic (same inputs = same output)

**5. Integration Tests**:
- Test all functions work together (if applicable)
- Test functions are independently testable
- Test functions have no dependencies on other modules

**Test Authority**:
- System operator only
- No automated tests (human decision required)
- Tests must be documented

**BLOCKED Notes**: Some tests may not be possible for BLOCKED capabilities (buyer pickup SLA if purchase function is BLOCKED). Tests must document BLOCKED status.

---

## 8. Safe Stopping Guarantee

### Safe Stopping Definition

**Safe Stopping**: System can be safely stopped after Utilities module implementation without:
- Creating irreversible damage
- Creating data corruption
- Creating security vulnerabilities
- Violating invariants
- Requiring rollback

**Why Stopping After Utilities Is Safe**:
- Utilities module has no dependencies (can be stopped independently)
- Utilities module creates no data (no entities created)
- Utilities module has no side effects (no external state modified)
- Utilities module is pure and stateless (no internal state to preserve)
- Utilities module is independently testable (can be validated independently)

**Safe Stopping Guarantee**:
- **No Data Created**: Utilities module does not create any entities or data
- **No Side Effects**: Utilities module does not create side effects (no database access, no logging, no network calls)
- **No State**: Utilities module is stateless (no internal state to preserve)
- **No Dependencies**: Utilities module has no dependencies (can be stopped without affecting other modules)
- **Pure Functions**: All functions are pure (no side effects, deterministic)

**BLOCKED Notes**: None (utilities are foundational, no BLOCKED dependencies)

---

## Final Check

### Why This Module Must Exist First

**Verified**: This module must exist first because:
- All other modules depend on Utilities (for UTID generation, exposure calculation, SLA calculation)
- No other module can function without Utilities
- Building other modules first would violate dependency constraints
- Building other modules first would create unsafe state (missing UTID generation, missing exposure calculation)

**BLOCKED Notes**: None

---

### Why It Has No Dependencies

**Verified**: This module has no dependencies because:
- Utilities are foundational (provide core capabilities, not consume them)
- Utilities are pure functions (no need for external state or services)
- Utilities are stateless (no need for database or external storage)
- Utilities are deterministic (no need for external inputs beyond function parameters)

**BLOCKED Notes**: None

---

### Why Stopping After This Step Is Safe

**Verified**: Stopping after this step is safe because:
- Utilities module creates no data (no entities created)
- Utilities module has no side effects (no external state modified)
- Utilities module is stateless (no internal state to preserve)
- Utilities module is pure (no side effects, deterministic)
- Utilities module is independently testable (can be validated independently)

**BLOCKED Notes**: None

---

### Why Misuse Here Would Be Catastrophic

**Verified**: Misuse here would be catastrophic because:
- **UTID Generation Misuse**: If UTID generation is non-deterministic or non-unique, all audit trails would be compromised (INVARIANT 4.1, 4.2 violated)
- **Exposure Calculation Misuse**: If exposure calculation is incorrect, traders could exceed limits, causing financial risk (INVARIANT 6.1 violated)
- **Exposure Atomicity Misuse**: If exposure calculation is not atomic, concurrent transactions could bypass limits (INVARIANT 6.2 violated)
- **Side Effects Misuse**: If utilities create side effects, all dependent modules would be affected (purity violated)
- **State Management Misuse**: If utilities maintain state, all dependent modules would be affected (statelessness violated)

**BLOCKED Notes**: None

---

**CURRENT MODULE STATUS**: **SPECIFICATION DEFINED**

**Utilities module specification is defined and ready for implementation.**

---

*This document must be updated when implementation begins, contracts change, or new utility functions are required. No assumptions. Only truth.*
