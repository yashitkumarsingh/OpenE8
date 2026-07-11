---
name: spec-driven-development
description: Guidelines for spec-first code modifications drawing on Andrej Karpathy's Software 2.0, Martin Fowler's Agile Specifications, and Matt Pocock's API constraints.
---

# Spec-Driven Development (SDD) Guide

This skill guides the AI agent to write high-fidelity technical specifications *before* making any non-trivial modifications to the OpenE8 codebase. It draws inspiration from industry leaders on software design, API design, and compilation validation.

---

## 1. Core Philosophies

### Andrej Karpathy: "Tests as the Loss Function"
- Code is the parameterization that satisfies the specification constraints.
- Every specification must begin by defining the **Verification Matrix** (tests). The code implementation simply optimizes to satisfy this loss function without breaking existing baselines.

### Martin Fowler: "Decoupled Domain Boundaries"
- Specifications must clearly define which layer of the enterprise application architecture is affected (Domain rules, Transport/Express routes, or DB persistence).
- Keep domain calculations stateless (e.g., `maturityEngine.js`) and completely isolated from transport concerns.

### Matt Pocock: "Strict Boundary Schema Contracts"
- Errors must fail closed immediately at the validation boundary.
- Always specify strict runtime schema checks (timing-safe comparisons, whitelists, structure audits) before processing request payloads.

---

## 2. Specification Template

All specification documents created under the `specs/` directory must follow this layout:

```markdown
# Spec: [Feature Title]

## 1. Goal & Context
Brief statement describing the problem, business rules alignment, and targeted outcome.

## 2. Boundary Contracts (Inputs & Outputs)
- Document the exact JSON/Object payload structures.
- Detail the validation checks (types, size limits, whitelists).

## 3. Data Persistence Design
- If db fields change, document the Prisma schema delta.
- Outline the seeding/migration path.

## 4. Verification Matrix (The Loss Function)
- Define the unit tests to add/modify.
- Define the integration/E2E test workflow script.
```

---

## 3. Implementation Workflow

1. **Write Spec**: First, output the specification file to `specs/<feature-name>.md`.
2. **Review Spec**: Present the spec to the developer and adjust based on review feedback.
3. **Execute Spec**: Implement code satisfying the boundary contracts and data schemas.
4. **Verify**: Execute the verification tests to ensure the "loss function" converges to 100% pass rates.
