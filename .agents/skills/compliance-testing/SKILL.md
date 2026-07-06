---
name: compliance-testing
description: Principles for writing reproducible compliance unit tests, asserting boundary levels, and mocking expiries.
---

# Deterministic Compliance Testing Guidelines

This skill guides agents in writing reliable compliance test cases and tracking code coverage metrics.

## Testing Rules

1. **No External Flakiness**:
   - Tests for the maturity engine must be fully local and database-agnostic.
   - Inject input parameters directly rather than query database engines in tests.

2. **Temporal Mocking**:
   - Exceptions have review and expiry dates. When testing, mock the current timestamp or inject explicit dates rather than rely on the system clock to avoid flaky test results.

3. **Maturity Calculation Boundaries**:
   - Always assert that the calculation matches the lowest-common-denominator strategy (e.g. if 7 strategies pass at ML2 but 1 is at ML0, overall is ML0).
   - Assert calculations with active approved exceptions versus expired exceptions to verify bypassing safety guards.

4. **80% Code Coverage Standard**:
   - The server code must maintain at least 80% coverage using `c8`.
   - Run `npm run test:coverage` to output statement, branch, function, and line coverage metrics. Ensure all new handlers, routers, and controllers are verified under test suites.

5. **Dependency Audit Verification**:
   - As part of validation, ensure that security vulnerability reports (`npm audit`) show **0 vulnerabilities**. Run security scanning alongside unit tests to guarantee clean compliance.
