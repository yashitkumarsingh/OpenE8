---
name: debugging-and-error-recovery
description: Guides systematic root-cause debugging. Use when tests fail, builds break, behavior doesn't match expectations, or you encounter any unexpected error. Use when you need a systematic approach to finding and fixing the root cause rather than guessing.
---

# Debugging and Error Recovery (DER)

Debugging and Error Recovery is the practice of systematically identifying, isolating, and resolving defects. Guesswork during bug triages wastes execution loops. By following a structured investigation path, developers can fix root defects and implement regression guards.

---

## 1. The Stop-the-Line Rule

If a test fails, a build breaks, or an unexpected runtime error is encountered, **stop introducing new features immediately**. 
- Adding logic on top of a compromised build compounds error context and masks the original defect.
- Maintain a clean working state. Resolve the current breakage before proceeding with feature development.

---

## 2. The Systematic Debugging Lifecycle

Follow these five steps in sequence when investigating an issue:

```text
 [ 1. REPRODUCE ] ──→ [ 2. LOCALIZE ] ──→ [ 3. REDUCE ] ──→ [ 4. RESOLVE ] ──→ [ 5. GUARD ]
        │                    │                   │                  │                 │
        ▼                    ▼                   ▼                  ▼                 ▼
   Build a test         Find the exact      Strip noise to      Fix the root      Add tests to
    case that            module, layer,       find the minimal   defect, not the   prevent code
   fails reliably.       or query.           reproduction.       symptom.          regressions.
```

### Step 1: Reproduce
Establish a reliable trigger for the failure.
- **Deterministic Repros**: If a test fails, run that test in isolation (e.g. `npm test -- --grep "auth validation"`).
- **Transient Failures (Flakiness)**: If the bug is timing-dependent or environment-dependent:
  - Add execution logs with precise millisecond timestamps.
  - Review shared state, globally declared variables, or uncleaned database fixtures leaking between test scenarios.

### Step 2: Localize
Isolate the layer throwing the exception:
- **Client Side**: Check web browser console traces, API request payloads, and DOM rendering outputs.
- **Application API**: Check backend route parameters, error logs, and session headers.
- **Data Layer**: Validate SQLite schemas, prisma queries, and raw row values.
- **Build/CI Pipelines**: Check package dependency locks and environmental configuration variables.

### Step 3: Reduce
Simplify the reproducing input to the smallest possible payload.
- Remove unrelated form fields, mock states, or table relations.
- Strip test scripts to assert only the failing code path.
- Reducing noise makes the root cause self-evident and prevents you from treating secondary symptoms.

### Step 4: Resolve
Fix the underlying logical error. Do not write shallow workarounds.
- *Shallow Fix (Bad)*: Wrapping a UI render in `try { ... } catch` to hide a database query error.
- *Root Fix (Good)*: Fixing the database schema join query that returned corrupted data records.

### Step 5: Guard
Prevent the bug from returning:
- Write a unit or integration test that exercises the target edge case.
- Confirm the new test fails before applying your fix, and passes once the fix is applied.
- Run the full test suite to guarantee that no sibling components were broken by the change.
