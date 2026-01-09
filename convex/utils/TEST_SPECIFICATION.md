# Utilities Module Test Specification

**Module**: Utilities  
**Step**: 1b (IMPLEMENTATION_SEQUENCE.md Step 1)  
**Status**: Test specification only (no implementation, no test code)  
**Authority**: Single human (CEO / Engineering Lead / CTO)  
**Last Updated**: Current system state

**Context**: 
- convex/utils/README.md defines the full specification
- convex/utils/types.ts defines the public interface (Step 1a, approved and locked)
- IMPLEMENTATION_BOUNDARIES.md applies
- INVARIANTS.md (4.1, 4.2, 6.1, 6.2) applies

**Purpose**: This document defines test specifications for the Utilities module. This is NOT executable test code. This defines what must be tested, not how to test it.

**Rules**:
- No test code
- No assertions written as code
- No example values unless necessary to define boundaries
- Every test must map to an invariant or contract clause
- Tests are specifications, not implementations

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

**3. Contract Verification**
- Tests must verify function contracts are met
- Tests must verify purity (no side effects)
- Tests must verify determinism (same inputs = same outputs)
- Tests must verify statelessness (no internal state)

**4. Explicit Failure Modes**
- Tests must verify explicit error handling
- Tests must verify missing parameter errors
- Tests must verify invalid parameter errors
- Tests must verify determinism violation errors

**5. Boundary Testing**
- Tests must verify boundary conditions
- Tests must verify exposure limit boundaries (UGX 1,000,000)
- Tests must verify edge cases
- Tests must verify limit enforcement

**6. BLOCKED Test Documentation**
- Tests for BLOCKED capabilities must be explicitly marked
- BLOCKED tests must explain why they cannot be executed
- BLOCKED tests must document what would unblock them

---

## 2. Test Categories Per Function

### Function 1: generateUTID

**Test Category 1: Determinism Tests**
- **Purpose**: Verify UTID generation is deterministic
- **Invariant Protected**: INVARIANT 4.1 (UTID Immutability), INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)
- **Contract Clause**: "Must be deterministic (same inputs = same UTID)"
- **Test Specification**:
  - Verify that calling `generateUTID` with the same `context` (same `entityType`, same `timestamp`, same `additionalData`) produces the same UTID
  - Verify that calling `generateUTID` multiple times with identical inputs produces identical UTIDs
  - Verify that UTID generation does not depend on external state (no global variables, no environment variables, no current time access)
  - Verify that UTID generation does not depend on call order or call count
- **Failure Criteria**: If UTID generation produces different UTIDs for same inputs, test must fail

**Test Category 2: Uniqueness Tests**
- **Purpose**: Verify UTID generation produces unique UTIDs for different inputs
- **Invariant Protected**: INVARIANT 4.1 (UTID Immutability), INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)
- **Contract Clause**: "Must be unique (different inputs = different UTID)"
- **Test Specification**:
  - Verify that calling `generateUTID` with different `entityType` produces different UTIDs
  - Verify that calling `generateUTID` with different `timestamp` produces different UTIDs
  - Verify that calling `generateUTID` with different `additionalData` produces different UTIDs
  - Verify that UTID generation produces unique UTIDs across all input combinations
- **Failure Criteria**: If UTID generation produces same UTID for different inputs, test must fail

**Test Category 3: Purity / Side-Effect Absence Tests**
- **Purpose**: Verify UTID generation is pure (no side effects)
- **Invariant Protected**: INVARIANT 4.1 (UTID Immutability), INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)
- **Contract Clause**: "Must be pure (no side effects)"
- **Test Specification**:
  - Verify that `generateUTID` does not access database (no database queries, no database writes)
  - Verify that `generateUTID` does not perform logging (no log writes, no console output)
  - Verify that `generateUTID` does not perform network calls (no HTTP requests, no external API calls)
  - Verify that `generateUTID` does not access global state (no global variables, no environment variables)
  - Verify that `generateUTID` does not modify external state (no file writes, no state mutations)
  - Verify that calling `generateUTID` multiple times does not change system state
- **Failure Criteria**: If UTID generation creates side effects, test must fail

**Test Category 4: Statelessness Tests**
- **Purpose**: Verify UTID generation is stateless
- **Invariant Protected**: INVARIANT 4.1 (UTID Immutability), INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)
- **Contract Clause**: "Must be stateless (no internal state)"
- **Test Specification**:
  - Verify that `generateUTID` does not maintain internal state (no caching, no counters, no history)
  - Verify that calling `generateUTID` multiple times does not affect subsequent calls
  - Verify that UTID generation does not depend on previous calls
  - Verify that UTID generation does not use global state or module-level state
- **Failure Criteria**: If UTID generation maintains state, test must fail

**Test Category 5: Failure-Mode Tests (Missing Parameters)**
- **Purpose**: Verify explicit error handling for missing parameters
- **Contract Clause**: "If context is missing: throw MissingParameterError", "If entityType is missing: throw MissingParameterError", "If timestamp is missing: throw MissingParameterError"
- **Test Specification**:
  - Verify that calling `generateUTID` without `context` throws `MissingParameterError`
  - Verify that calling `generateUTID` with `context` missing `entityType` throws `MissingParameterError`
  - Verify that calling `generateUTID` with `context` missing `timestamp` throws `MissingParameterError`
  - Verify that error messages indicate which parameter is missing
- **Failure Criteria**: If missing parameters do not throw explicit errors, test must fail

**Test Category 6: Failure-Mode Tests (Invalid Parameters)**
- **Purpose**: Verify explicit error handling for invalid parameters
- **Contract Clause**: "If UTID generation fails: throw explicit error"
- **Test Specification**:
  - Verify that calling `generateUTID` with invalid `entityType` (empty string, null, undefined, non-string) throws `InvalidParameterError`
  - Verify that calling `generateUTID` with invalid `timestamp` (negative, non-number, undefined) throws `InvalidParameterError`
  - Verify that error messages indicate which parameter is invalid and why
- **Failure Criteria**: If invalid parameters do not throw explicit errors, test must fail

**Test Category 7: Return Type Tests**
- **Purpose**: Verify UTID generation returns correct type
- **Contract Clause**: "Returns: string (UTID - unique, deterministic, immutable identifier)"
- **Test Specification**:
  - Verify that `generateUTID` returns a string
  - Verify that returned UTID is not empty
  - Verify that returned UTID is immutable (cannot be modified after generation)
- **Failure Criteria**: If UTID generation returns incorrect type, test must fail

**BLOCKED Notes**: None

---

### Function 2: calculateExposure

**Test Category 1: Determinism Tests**
- **Purpose**: Verify exposure calculation is deterministic
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement), INVARIANT 6.2 (Exposure Calculation Atomicity)
- **Contract Clause**: "Must be deterministic (same inputs = same output)"
- **Test Specification**:
  - Verify that calling `calculateExposure` with the same `exposureData` (same `capitalCommitted`, same `lockedOrders`, same `inventoryValue`) produces the same result
  - Verify that calling `calculateExposure` multiple times with identical inputs produces identical results
  - Verify that exposure calculation does not depend on external state (no global variables, no environment variables, no current time access)
  - Verify that exposure calculation does not depend on call order or call count
- **Failure Criteria**: If exposure calculation produces different results for same inputs, test must fail

**Test Category 2: Purity / Side-Effect Absence Tests**
- **Purpose**: Verify exposure calculation is pure (no side effects)
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement), INVARIANT 6.2 (Exposure Calculation Atomicity)
- **Contract Clause**: "Must be pure (no side effects)"
- **Test Specification**:
  - Verify that `calculateExposure` does not access database (no database queries, no database writes)
  - Verify that `calculateExposure` does not perform logging (no log writes, no console output)
  - Verify that `calculateExposure` does not perform network calls (no HTTP requests, no external API calls)
  - Verify that `calculateExposure` does not access global state (no global variables, no environment variables)
  - Verify that `calculateExposure` does not modify external state (no file writes, no state mutations)
  - Verify that calling `calculateExposure` multiple times does not change system state
- **Failure Criteria**: If exposure calculation creates side effects, test must fail

**Test Category 3: Statelessness Tests**
- **Purpose**: Verify exposure calculation is stateless
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement), INVARIANT 6.2 (Exposure Calculation Atomicity)
- **Contract Clause**: "Must be stateless (no internal state)"
- **Test Specification**:
  - Verify that `calculateExposure` does not maintain internal state (no caching, no counters, no history)
  - Verify that calling `calculateExposure` multiple times does not affect subsequent calls
  - Verify that exposure calculation does not depend on previous calls
  - Verify that exposure calculation does not use global state or module-level state
- **Failure Criteria**: If exposure calculation maintains state, test must fail

**Test Category 4: Calculation Correctness Tests**
- **Purpose**: Verify exposure calculation is correct
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement), INVARIANT 6.2 (Exposure Calculation Atomicity)
- **Contract Clause**: "Must calculate all components (capital committed + locked orders + inventory value)"
- **Test Specification**:
  - Verify that `totalExposure` equals `capitalCommitted + lockedOrders + inventoryValue`
  - Verify that calculation includes all three components
  - Verify that calculation is mathematically correct (no rounding errors, no precision loss)
  - Verify that calculation handles zero values correctly
  - Verify that calculation handles large values correctly (up to UGX 1,000,000)
- **Failure Criteria**: If exposure calculation is incorrect, test must fail

**Test Category 5: Boundary Tests (Exposure Limits)**
- **Purpose**: Verify exposure limit enforcement (UGX 1,000,000)
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
- **Contract Clause**: "Must enforce exposure limit (UGX 1,000,000 maximum)"
- **Test Specification**:
  - Verify that `exceedsLimit` is `false` when `totalExposure` is exactly UGX 1,000,000
  - Verify that `exceedsLimit` is `false` when `totalExposure` is less than UGX 1,000,000
  - Verify that `exceedsLimit` is `true` when `totalExposure` is greater than UGX 1,000,000
  - Verify that `limit` is exactly UGX 1,000,000
  - Verify that `remainingCapacity` is `limit - totalExposure` when `totalExposure <= limit`
  - Verify that `remainingCapacity` is `0` when `totalExposure > limit`
  - Verify that `remainingCapacity` is never negative
- **Failure Criteria**: If exposure limit is not enforced correctly, test must fail

**Test Category 6: Boundary Tests (Edge Cases)**
- **Purpose**: Verify exposure calculation handles edge cases
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement), INVARIANT 6.2 (Exposure Calculation Atomicity)
- **Test Specification**:
  - Verify that exposure calculation handles zero values (all components zero)
  - Verify that exposure calculation handles maximum values (all components at maximum)
  - Verify that exposure calculation handles exactly UGX 1,000,000 (boundary case)
  - Verify that exposure calculation handles UGX 1,000,001 (just over limit)
  - Verify that exposure calculation handles very large values (beyond limit)
- **Failure Criteria**: If exposure calculation fails on edge cases, test must fail

**Test Category 7: Failure-Mode Tests (Missing Parameters)**
- **Purpose**: Verify explicit error handling for missing parameters
- **Contract Clause**: "If exposureData is missing: throw MissingParameterError"
- **Test Specification**:
  - Verify that calling `calculateExposure` without `exposureData` throws `MissingParameterError`
  - Verify that error messages indicate which parameter is missing
- **Failure Criteria**: If missing parameters do not throw explicit errors, test must fail

**Test Category 8: Failure-Mode Tests (Invalid Parameters)**
- **Purpose**: Verify explicit error handling for invalid parameters
- **Contract Clause**: "If capitalCommitted is missing or negative: throw InvalidParameterError", "If lockedOrders is missing or negative: throw InvalidParameterError", "If inventoryValue is missing or negative: throw InvalidParameterError", "If any component is not a number: throw InvalidParameterError"
- **Test Specification**:
  - Verify that calling `calculateExposure` with missing `capitalCommitted` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with negative `capitalCommitted` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with missing `lockedOrders` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with negative `lockedOrders` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with missing `inventoryValue` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with negative `inventoryValue` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with non-number `capitalCommitted` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with non-number `lockedOrders` throws `InvalidParameterError`
  - Verify that calling `calculateExposure` with non-number `inventoryValue` throws `InvalidParameterError`
  - Verify that error messages indicate which parameter is invalid and why
- **Failure Criteria**: If invalid parameters do not throw explicit errors, test must fail

**Test Category 9: Return Type Tests**
- **Purpose**: Verify exposure calculation returns correct type
- **Contract Clause**: "Returns: ExposureCalculationResult"
- **Test Specification**:
  - Verify that `calculateExposure` returns an object with `totalExposure`, `exceedsLimit`, `limit`, `remainingCapacity`
  - Verify that `totalExposure` is a number
  - Verify that `exceedsLimit` is a boolean
  - Verify that `limit` is a number (exactly UGX 1,000,000)
  - Verify that `remainingCapacity` is a number (non-negative)
- **Failure Criteria**: If exposure calculation returns incorrect type, test must fail

**BLOCKED Notes**: None

---

### Function 3: validateExposureLimit

**Test Category 1: Determinism Tests**
- **Purpose**: Verify exposure validation is deterministic
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
- **Contract Clause**: "Must be deterministic (same input = same output)"
- **Test Specification**:
  - Verify that calling `validateExposureLimit` with the same `exposure` produces the same result
  - Verify that calling `validateExposureLimit` multiple times with identical inputs produces identical results
  - Verify that exposure validation does not depend on external state (no global variables, no environment variables, no current time access)
  - Verify that exposure validation does not depend on call order or call count
- **Failure Criteria**: If exposure validation produces different results for same inputs, test must fail

**Test Category 2: Purity / Side-Effect Absence Tests**
- **Purpose**: Verify exposure validation is pure (no side effects)
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
- **Contract Clause**: "Must be pure (no side effects)"
- **Test Specification**:
  - Verify that `validateExposureLimit` does not access database (no database queries, no database writes)
  - Verify that `validateExposureLimit` does not perform logging (no log writes, no console output)
  - Verify that `validateExposureLimit` does not perform network calls (no HTTP requests, no external API calls)
  - Verify that `validateExposureLimit` does not access global state (no global variables, no environment variables)
  - Verify that `validateExposureLimit` does not modify external state (no file writes, no state mutations)
  - Verify that calling `validateExposureLimit` multiple times does not change system state
- **Failure Criteria**: If exposure validation creates side effects, test must fail

**Test Category 3: Statelessness Tests**
- **Purpose**: Verify exposure validation is stateless
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
- **Contract Clause**: "Must be stateless (no internal state)"
- **Test Specification**:
  - Verify that `validateExposureLimit` does not maintain internal state (no caching, no counters, no history)
  - Verify that calling `validateExposureLimit` multiple times does not affect subsequent calls
  - Verify that exposure validation does not depend on previous calls
  - Verify that exposure validation does not use global state or module-level state
- **Failure Criteria**: If exposure validation maintains state, test must fail

**Test Category 4: Validation Correctness Tests**
- **Purpose**: Verify exposure validation is correct
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
- **Contract Clause**: "Must enforce exposure limit (UGX 1,000,000 maximum)"
- **Test Specification**:
  - Verify that `isValid` is `true` when `exposure` is exactly UGX 1,000,000
  - Verify that `isValid` is `true` when `exposure` is less than UGX 1,000,000
  - Verify that `isValid` is `false` when `exposure` is greater than UGX 1,000,000
  - Verify that `exceedsLimit` is `false` when `exposure <= 1,000,000`
  - Verify that `exceedsLimit` is `true` when `exposure > 1,000,000`
  - Verify that `limit` is exactly UGX 1,000,000
  - Verify that `excess` is `exposure - limit` when `exposure > limit`
  - Verify that `excess` is `0` when `exposure <= limit`
  - Verify that `excess` is never negative
- **Failure Criteria**: If exposure validation is incorrect, test must fail

**Test Category 5: Boundary Tests (Exposure Limits)**
- **Purpose**: Verify exposure limit boundaries (UGX 1,000,000)
- **Invariant Protected**: INVARIANT 6.1 (Trader Exposure Limit Enforcement)
- **Test Specification**:
  - Verify that exposure validation handles exactly UGX 1,000,000 (boundary case)
  - Verify that exposure validation handles UGX 999,999 (just under limit)
  - Verify that exposure validation handles UGX 1,000,001 (just over limit)
  - Verify that exposure validation handles zero (minimum value)
  - Verify that exposure validation handles very large values (beyond limit)
- **Failure Criteria**: If exposure validation fails on boundary cases, test must fail

**Test Category 6: Failure-Mode Tests (Missing Parameters)**
- **Purpose**: Verify explicit error handling for missing parameters
- **Contract Clause**: "If exposure is missing: throw MissingParameterError"
- **Test Specification**:
  - Verify that calling `validateExposureLimit` without `exposure` throws `MissingParameterError`
  - Verify that error messages indicate which parameter is missing
- **Failure Criteria**: If missing parameters do not throw explicit errors, test must fail

**Test Category 7: Failure-Mode Tests (Invalid Parameters)**
- **Purpose**: Verify explicit error handling for invalid parameters
- **Contract Clause**: "If exposure is not a number: throw InvalidParameterError", "If exposure is negative: throw InvalidParameterError"
- **Test Specification**:
  - Verify that calling `validateExposureLimit` with non-number `exposure` throws `InvalidParameterError`
  - Verify that calling `validateExposureLimit` with negative `exposure` throws `InvalidParameterError`
  - Verify that error messages indicate which parameter is invalid and why
- **Failure Criteria**: If invalid parameters do not throw explicit errors, test must fail

**Test Category 8: Return Type Tests**
- **Purpose**: Verify exposure validation returns correct type
- **Contract Clause**: "Returns: ExposureValidationResult"
- **Test Specification**:
  - Verify that `validateExposureLimit` returns an object with `isValid`, `exceedsLimit`, `limit`, `excess`
  - Verify that `isValid` is a boolean
  - Verify that `exceedsLimit` is a boolean
  - Verify that `limit` is a number (exactly UGX 1,000,000)
  - Verify that `excess` is a number (non-negative)
- **Failure Criteria**: If exposure validation returns incorrect type, test must fail

**BLOCKED Notes**: None

---

### Function 4: calculateFarmerDeliverySLA

**Test Category 1: Determinism Tests**
- **Purpose**: Verify SLA calculation is deterministic
- **Contract Clause**: "Must be deterministic (same input = same output, if current time is passed as parameter)"
- **Test Specification**:
  - Verify that calling `calculateFarmerDeliverySLA` with the same `lockTime` produces the same result (if current time is passed as parameter)
  - Verify that calling `calculateFarmerDeliverySLA` multiple times with identical inputs produces identical results
  - Verify that SLA calculation does not depend on external state (no global variables, no environment variables, no current time access unless passed as parameter)
  - Verify that SLA calculation does not depend on call order or call count
- **Failure Criteria**: If SLA calculation produces different results for same inputs, test must fail

**Test Category 2: Purity / Side-Effect Absence Tests**
- **Purpose**: Verify SLA calculation is pure (no side effects)
- **Contract Clause**: "Must be pure (no side effects)"
- **Test Specification**:
  - Verify that `calculateFarmerDeliverySLA` does not access database (no database queries, no database writes)
  - Verify that `calculateFarmerDeliverySLA` does not perform logging (no log writes, no console output)
  - Verify that `calculateFarmerDeliverySLA` does not perform network calls (no HTTP requests, no external API calls)
  - Verify that `calculateFarmerDeliverySLA` does not access global state (no global variables, no environment variables, no current time access unless passed as parameter)
  - Verify that `calculateFarmerDeliverySLA` does not modify external state (no file writes, no state mutations)
  - Verify that calling `calculateFarmerDeliverySLA` multiple times does not change system state
- **Failure Criteria**: If SLA calculation creates side effects, test must fail

**Test Category 3: Statelessness Tests**
- **Purpose**: Verify SLA calculation is stateless
- **Contract Clause**: "Must be stateless (no internal state)"
- **Test Specification**:
  - Verify that `calculateFarmerDeliverySLA` does not maintain internal state (no caching, no counters, no history)
  - Verify that calling `calculateFarmerDeliverySLA` multiple times does not affect subsequent calls
  - Verify that SLA calculation does not depend on previous calls
  - Verify that SLA calculation does not use global state or module-level state
- **Failure Criteria**: If SLA calculation maintains state, test must fail

**Test Category 4: Calculation Correctness Tests**
- **Purpose**: Verify SLA calculation is correct (6 hours from lock time)
- **Contract Clause**: "Must calculate 6 hours from lock time"
- **Test Specification**:
  - Verify that `deadline` equals `lockTime + (6 * 60 * 60 * 1000)` (6 hours in milliseconds)
  - Verify that `slaHours` is exactly 6
  - Verify that calculation is mathematically correct (no rounding errors, no precision loss)
  - Verify that calculation handles various `lockTime` values correctly
- **Failure Criteria**: If SLA calculation is incorrect, test must fail

**Test Category 5: Failure-Mode Tests (Missing Parameters)**
- **Purpose**: Verify explicit error handling for missing parameters
- **Contract Clause**: "If lockTime is missing: throw MissingParameterError"
- **Test Specification**:
  - Verify that calling `calculateFarmerDeliverySLA` without `lockTime` throws `MissingParameterError`
  - Verify that error messages indicate which parameter is missing
- **Failure Criteria**: If missing parameters do not throw explicit errors, test must fail

**Test Category 6: Failure-Mode Tests (Invalid Parameters)**
- **Purpose**: Verify explicit error handling for invalid parameters
- **Contract Clause**: "If lockTime is not a number: throw InvalidParameterError", "If lockTime is negative: throw InvalidParameterError", "If lockTime is in the future: throw InvalidParameterError (if validation is required)"
- **Test Specification**:
  - Verify that calling `calculateFarmerDeliverySLA` with non-number `lockTime` throws `InvalidParameterError`
  - Verify that calling `calculateFarmerDeliverySLA` with negative `lockTime` throws `InvalidParameterError`
  - Verify that error messages indicate which parameter is invalid and why
  - Note: Future `lockTime` validation may or may not be required (contract says "if validation is required")
- **Failure Criteria**: If invalid parameters do not throw explicit errors, test must fail

**Test Category 7: Return Type Tests**
- **Purpose**: Verify SLA calculation returns correct type
- **Contract Clause**: "Returns: SLACalculationResult"
- **Test Specification**:
  - Verify that `calculateFarmerDeliverySLA` returns an object with `deadline`, `slaHours`, `isExpired`, `timeRemaining`
  - Verify that `deadline` is a number (timestamp in milliseconds)
  - Verify that `slaHours` is a number (exactly 6)
  - Verify that `isExpired` is a boolean
  - Verify that `timeRemaining` is a number (non-negative, in milliseconds)
- **Failure Criteria**: If SLA calculation returns incorrect type, test must fail

**BLOCKED Notes**: None

---

### Function 5: calculateBuyerPickupSLA

**Test Category 1: Determinism Tests**
- **Purpose**: Verify SLA calculation is deterministic
- **Contract Clause**: "Must be deterministic (same input = same output, if current time is passed as parameter)"
- **Test Specification**:
  - Verify that calling `calculateBuyerPickupSLA` with the same `purchaseTime` produces the same result (if current time is passed as parameter)
  - Verify that calling `calculateBuyerPickupSLA` multiple times with identical inputs produces identical results
  - Verify that SLA calculation does not depend on external state (no global variables, no environment variables, no current time access unless passed as parameter)
  - Verify that SLA calculation does not depend on call order or call count
- **Failure Criteria**: If SLA calculation produces different results for same inputs, test must fail

**Test Category 2: Purity / Side-Effect Absence Tests**
- **Purpose**: Verify SLA calculation is pure (no side effects)
- **Contract Clause**: "Must be pure (no side effects)"
- **Test Specification**:
  - Verify that `calculateBuyerPickupSLA` does not access database (no database queries, no database writes)
  - Verify that `calculateBuyerPickupSLA` does not perform logging (no log writes, no console output)
  - Verify that `calculateBuyerPickupSLA` does not perform network calls (no HTTP requests, no external API calls)
  - Verify that `calculateBuyerPickupSLA` does not access global state (no global variables, no environment variables, no current time access unless passed as parameter)
  - Verify that `calculateBuyerPickupSLA` does not modify external state (no file writes, no state mutations)
  - Verify that calling `calculateBuyerPickupSLA` multiple times does not change system state
- **Failure Criteria**: If SLA calculation creates side effects, test must fail

**Test Category 3: Statelessness Tests**
- **Purpose**: Verify SLA calculation is stateless
- **Contract Clause**: "Must be stateless (no internal state)"
- **Test Specification**:
  - Verify that `calculateBuyerPickupSLA` does not maintain internal state (no caching, no counters, no history)
  - Verify that calling `calculateBuyerPickupSLA` multiple times does not affect subsequent calls
  - Verify that SLA calculation does not depend on previous calls
  - Verify that SLA calculation does not use global state or module-level state
- **Failure Criteria**: If SLA calculation maintains state, test must fail

**Test Category 4: Calculation Correctness Tests**
- **Purpose**: Verify SLA calculation is correct (48 hours from purchase time)
- **Contract Clause**: "Must calculate 48 hours from purchase time"
- **Test Specification**:
  - Verify that `deadline` equals `purchaseTime + (48 * 60 * 60 * 1000)` (48 hours in milliseconds)
  - Verify that `slaHours` is exactly 48
  - Verify that calculation is mathematically correct (no rounding errors, no precision loss)
  - Verify that calculation handles various `purchaseTime` values correctly
- **Failure Criteria**: If SLA calculation is incorrect, test must fail

**Test Category 5: Failure-Mode Tests (Missing Parameters)**
- **Purpose**: Verify explicit error handling for missing parameters
- **Contract Clause**: "If purchaseTime is missing: throw MissingParameterError"
- **Test Specification**:
  - Verify that calling `calculateBuyerPickupSLA` without `purchaseTime` throws `MissingParameterError`
  - Verify that error messages indicate which parameter is missing
- **Failure Criteria**: If missing parameters do not throw explicit errors, test must fail

**Test Category 6: Failure-Mode Tests (Invalid Parameters)**
- **Purpose**: Verify explicit error handling for invalid parameters
- **Contract Clause**: "If purchaseTime is not a number: throw InvalidParameterError", "If purchaseTime is negative: throw InvalidParameterError", "If purchaseTime is in the future: throw InvalidParameterError (if validation is required)"
- **Test Specification**:
  - Verify that calling `calculateBuyerPickupSLA` with non-number `purchaseTime` throws `InvalidParameterError`
  - Verify that calling `calculateBuyerPickupSLA` with negative `purchaseTime` throws `InvalidParameterError`
  - Verify that error messages indicate which parameter is invalid and why
  - Note: Future `purchaseTime` validation may or may not be required (contract says "if validation is required")
- **Failure Criteria**: If invalid parameters do not throw explicit errors, test must fail

**Test Category 7: Return Type Tests**
- **Purpose**: Verify SLA calculation returns correct type
- **Contract Clause**: "Returns: SLACalculationResult"
- **Test Specification**:
  - Verify that `calculateBuyerPickupSLA` returns an object with `deadline`, `slaHours`, `isExpired`, `timeRemaining`
  - Verify that `deadline` is a number (timestamp in milliseconds)
  - Verify that `slaHours` is a number (exactly 48)
  - Verify that `isExpired` is a boolean
  - Verify that `timeRemaining` is a number (non-negative, in milliseconds)
- **Failure Criteria**: If SLA calculation returns incorrect type, test must fail

**BLOCKED Notes**: 
- **BLOCKED**: Buyer purchase function is NOT IMPLEMENTED (BLOCKED)
- **Reason**: This function may not be used until purchase function is implemented
- **What Would Unblock**: Implementation of buyer purchase function
- **Test Status**: Tests cannot be executed until purchase function is implemented
- **Test Specification**: Tests are defined but cannot be executed (BLOCKED)

---

## 3. Cross-Function Tests

### Test Category: Determinism Violation Detection

**Purpose**: Verify that all functions detect and report determinism violations
- **Invariant Protected**: INVARIANT 4.1, 4.2, 6.1, 6.2 (all require determinism)
- **Test Specification**:
  - Verify that if any function behaves non-deterministically, it throws `DeterminismViolationError`
  - Verify that determinism violations are detected and reported explicitly
  - Verify that determinism violations do not produce silent failures
- **Failure Criteria**: If determinism violations are not detected, test must fail

**BLOCKED Notes**: None

---

## 4. Invariant Protection Summary

### INVARIANT 4.1: UTID Immutability

**Protected By Tests**:
- generateUTID: Determinism Tests (Category 1)
- generateUTID: Uniqueness Tests (Category 2)
- generateUTID: Purity / Side-Effect Absence Tests (Category 3)
- generateUTID: Statelessness Tests (Category 4)
- generateUTID: Return Type Tests (Category 7)

**Test Coverage**: Complete (all test categories protect this invariant)

---

### INVARIANT 4.2: All Meaningful Actions Generate UTIDs

**Protected By Tests**:
- generateUTID: Determinism Tests (Category 1)
- generateUTID: Uniqueness Tests (Category 2)
- generateUTID: Purity / Side-Effect Absence Tests (Category 3)
- generateUTID: Statelessness Tests (Category 4)
- generateUTID: Return Type Tests (Category 7)

**Test Coverage**: Complete (all test categories protect this invariant)

---

### INVARIANT 6.1: Trader Exposure Limit Enforcement

**Protected By Tests**:
- calculateExposure: Determinism Tests (Category 1)
- calculateExposure: Calculation Correctness Tests (Category 4)
- calculateExposure: Boundary Tests - Exposure Limits (Category 5)
- calculateExposure: Boundary Tests - Edge Cases (Category 6)
- validateExposureLimit: Determinism Tests (Category 1)
- validateExposureLimit: Validation Correctness Tests (Category 4)
- validateExposureLimit: Boundary Tests - Exposure Limits (Category 5)

**Test Coverage**: Complete (all test categories protect this invariant)

---

### INVARIANT 6.2: Exposure Calculation Atomicity

**Protected By Tests**:
- calculateExposure: Determinism Tests (Category 1)
- calculateExposure: Purity / Side-Effect Absence Tests (Category 2)
- calculateExposure: Statelessness Tests (Category 3)
- calculateExposure: Calculation Correctness Tests (Category 4)

**Test Coverage**: Complete (all test categories protect this invariant)

**Note**: Atomicity is enforced by the calling module (Transaction module), not by Utilities module. Utilities module provides the calculation function, but atomicity is the responsibility of the caller. Tests verify that the function can be called atomically (pure, deterministic, stateless).

---

## 5. BLOCKED Tests Summary

### BLOCKED Test: calculateBuyerPickupSLA Usage

**Function**: calculateBuyerPickupSLA

**BLOCKED Reason**: Buyer purchase function is NOT IMPLEMENTED (BLOCKED)

**Test Status**: 
- Test specifications are defined
- Tests cannot be executed until purchase function is implemented
- Tests are BLOCKED until purchase function is unblocked

**What Would Unblock**:
- Implementation of buyer purchase function
- Authorization to use buyer purchase function
- Activation of buyer purchase function

**Test Categories Affected**:
- All test categories for calculateBuyerPickupSLA (Categories 1-7)

**BLOCKED Notes**: Tests are defined but cannot be executed. Test specifications are preserved for future use when purchase function is implemented.

---

## Final Check

### No Implementation Exists Yet

**Verified**: 
- No function implementations exist (only public interface defined in Step 1a)
- No test code exists (only test specifications defined in this document)
- No executable code exists (only contracts and specifications)

---

### Tests Do Not Assume Behavior Beyond the Contract

**Verified**:
- All tests are derived from contract clauses
- All tests map to invariants or contract requirements
- No tests assume behavior not specified in contracts
- No tests infer behavior from unspecified requirements

---

### Invariants Protected by Each Test Category

**INVARIANT 4.1 (UTID Immutability)**:
- Protected by: generateUTID Determinism Tests, Uniqueness Tests, Purity Tests, Statelessness Tests, Return Type Tests

**INVARIANT 4.2 (All Meaningful Actions Generate UTIDs)**:
- Protected by: generateUTID Determinism Tests, Uniqueness Tests, Purity Tests, Statelessness Tests, Return Type Tests

**INVARIANT 6.1 (Trader Exposure Limit Enforcement)**:
- Protected by: calculateExposure Boundary Tests, Calculation Correctness Tests, validateExposureLimit Validation Correctness Tests, Boundary Tests

**INVARIANT 6.2 (Exposure Calculation Atomicity)**:
- Protected by: calculateExposure Determinism Tests, Purity Tests, Statelessness Tests, Calculation Correctness Tests

---

### BLOCKED Tests and Why

**BLOCKED Test**: calculateBuyerPickupSLA Usage

**Why BLOCKED**:
- Buyer purchase function is NOT IMPLEMENTED (BLOCKED)
- This function may not be used until purchase function is implemented
- Tests cannot be executed until purchase function is implemented

**What Would Unblock**:
- Implementation of buyer purchase function
- Authorization to use buyer purchase function
- Activation of buyer purchase function

**Test Status**: Test specifications are defined but cannot be executed (BLOCKED)

---

**CURRENT MODULE STATUS**: **TEST SPECIFICATION DEFINED**

**Utilities module test specification is defined and ready for test implementation.**

---

*This document must be updated when test implementation begins, test requirements change, or new test categories are required. No assumptions. Only truth.*
