---
name: doubt-driven-development
description: Subjects every non-trivial decision to a fresh-context adversarial review before it stands. Use when correctness matters more than speed, when working in unfamiliar code, when stakes are high (production, security-sensitive logic, irreversible operations), or any time a confident output would be cheaper to verify now than to debug later.
---

# Doubt-Driven Development (D3)

Doubt-Driven Development is the operational discipline of verifying assumptions before committing non-trivial logic. In complex, long-running agentic coding tasks, it is easy to let reasoning bias accumulate. D3 introduces an independent, adversarial sanity check at crucial design boundaries to disprove rather than validate code implementations.

---

## 1. Trigger Conditions (When to Doubt)

Apply this skepticism cycle whenever a decision is **non-trivial**. A decision is non-trivial if it meets one or more of the following:

- **Branching Complexity**: Introduces new decision trees or state-transition paths.
- **Boundary Crossings**: Integrates logic across separate modules, microservices, or database boundaries.
- **Invariants & Ordering**: Asserts order of execution, concurrency protections, or database transaction safety.
- **High-Impact Operations**: Relies on data migrations, schema mutations, or third-party dependency updates.
- **Blind Spots**: Modifies code that is unfamiliar or heavily coupled.

---

## 2. The 5-Step Skepticism Cycle

Each D3 audit runs through this structured validation loop:

```text
  [ Step 1: CLAIM ]  ---> State the proposed change and what goes wrong if it fails.
          │
          ▼
 [ Step 2: EXTRACT ] ---> Isolate the diff artifact and the interface contracts.
          │
          ▼
  [ Step 3: DOUBT ]  ---> Run an adversarial audit (with optional cross-model check).
          │
          ▼
[ Step 4: RECONCILE ]---> Classify each audit finding (Fix, Trade-off, Noise, Contract edit).
          │
          ▼
  [ Step 5: STOP ]   ---> Bounded stop condition (max 3 loops, or trivial findings).
```

### Step 1: CLAIM
Clearly isolate the architectural or logical assumption in a few lines.
- **Hypothesis**: What property are we claiming holds true?
- **Impact**: What happens in production if this assumption is wrong?

*Example*:
> **Claim**: The SQL database index addition supports lock-free concurrent writes under our current transaction isolation level.
> **Impact**: A lock contention here will drop client connections and exhaust connection pools.

### Step 2: EXTRACT
Prepare the audit package. Strip all justifications, assumptions, and developer commentary. Provide only:
1. **The Artifact**: The precise code snippet, database migration query, or architectural blueprint.
2. **The Contract**: The API specifications, schema boundaries, or functional criteria the artifact must fulfill.

### Step 3: DOUBT
Submit the artifact to an adversarial evaluation. The check must be explicitly configured to find errors, vulnerabilities, and missing bounds:

```text
Adversarial System Review:
Critically analyze the attached artifact against its defined contract.
Assuming the developer is overconfident, identify:
1. Unstated dependencies or environment assumptions.
2. Unhandled boundary constraints or null exceptions.
3. Concurrency races, race conditions, or state contamination risks.
4. Compliance mismatches against the strict contract requirements.

Do not write positive reviews or summarize success paths. Focus exclusively on issues and failure vectors.
```

#### Interactive Cross-Model Escalation
When pairing in interactive shells, always present the user with a choice to escalate verification:
1. **Offer Verification**: Print: *"Adversarial single-model audit completed. Would you like to run a cross-model verification? Options: Gemini CLI, Codex CLI, paste manual logs, or skip."*
2. **CLI Test**: If a CLI is selected, verify its installation (`which`) and test its execution flags before launching.
3. **Execution Safety**: Write prompts to a temporary workspace file and stream it into the CLI via stdin to prevent shell interpolation risks.

### Step 4: RECONCILE
A critique is a source of feedback, not an absolute verdict. Review each finding and group it into one of these buckets:
- **Contract Ambiguity**: The reviewer flagged an issue because our defined contract was incomplete. Fix the contract first, then re-audit.
- **Actionable Defect**: A real bug requiring a code change.
- **Acceptable Trade-off**: A real issue, but the cost/friction of resolving it exceeds the risk. Document the trade-off.
- **Auditor Noise**: The review flagged a false positive due to a lack of shared context. Disregard the warning.

### Step 5: STOP
To prevent execution stalls, terminate the doubt cycle when:
- All findings are noise or acceptable trade-offs.
- The user overrides the check (e.g. "proceed/ship").
- The loop reaches **3 iterations**. If issues are still outstanding after 3 cycles, the artifact is too complex; return to Step 2 and decompose the change.

---

## 3. Developer Anti-Patterns & Red Flags

- **Confirmation Bias**: Prompting the reviewer with validating queries (e.g., *"Is this safe?"*) rather than adversarial audits (*"Find how this fails"*).
- **Context Pollution**: Passing the initial justifications or claims to the auditor, which primes it to agree with your code.
- **Audit Stalls**: Spinning in circles past 3 iterations without raising complexity concerns to the pair partner.
- **Silent Skips**: Skipping the cross-model verification choices during interactive loops without logging the reason.
