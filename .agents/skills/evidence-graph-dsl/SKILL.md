---
name: evidence-graph-dsl
description: Standardized instructions for modeling audit evidence traces, linking Requirements to Evidence files, Exceptions, and Remediation Tasks.
---

# Evidence Graph & Traceability Schema Guidelines

This skill dictates how agents trace evidence paths from technical checks to governance results.

## Traceability Rules

1. **The Core Chain**:
   Every compliance check must maintain explicit traceability through this layout:
   `Requirement` -> `Evidence Vault Upload` -> `Control Test Result` -> `Exception / Remediation`.

2. **Evidence Integrity**:
   - Every evidence item must track date collected, source system, confidence level, and review status.
   - Do not certify or declare compliance automatically without linked verification metadata.

3. **Graph Rendering**:
   - The visual trace must show connected steps.
   - Users should be able to hover or click on each node in the trace to inspect metadata or jump to the resource (like the evidence PDF, exception form, or JIRA ticket).
