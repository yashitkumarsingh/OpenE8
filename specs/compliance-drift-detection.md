# Spec: Continuous Compliance Drift Detection & Alerting

## 1. Goal & Context
This specification defines the logical constraints and scoring analysis rules for identifying compliance drift—discrepancies between the Lead Assessor's signed-off baseline assessment and new real-time findings from automated evidence collectors.

## 2. First Principles Analysis
- **Problem Essence**: Instantly comparing the latest automated assessment scans with the lead assessor's manually verified state to flag security degradation.
- **Assumptions Challenged**:
  | Assumption | Challenge | Verdict |
  |---|---|---|
  | Drift state automatically changes the official system score | Assessor must verify collector results first to avoid false-positive downgrades. | Discard. Alert only; scores remain locked until re-assessed. |
  | Persist raw drift values in database | Creates database storage bloat for transient states. | Discard. Compute drift state dynamically at request time. |
- **Ground Truths**:
  1. Signed off assessments are immutable and database-locked.
  2. Drift state is transient and changes dynamically with new webhook inputs.
- **Reasoning Chain**: Dynamic calculations avoid database redundancy, and keeping scores locked preserves assessor dual-signature integrity.

## 3. Drift Definition & Logic

Drift is triggered when an automated collector reports a finding status for a control requirement that conflicts with the currently active assessment status.

$$\text{Active Assessed Status} = \text{EFFECTIVE} \quad \land \quad \text{New Candidate Finding} = \text{FAIL\_CANDIDATE} \quad \Longrightarrow \quad \text{Status} = \text{DRIFTED}$$

### Drift Rules Matrix
| Active Assessed Status | New Collector Status | System State Outcome |
|:---|:---|:---|
| `EFFECTIVE` | `PASS_CANDIDATE` | `STABLE` (no drift) |
| `EFFECTIVE` | `FAIL_CANDIDATE` | `DRIFTED` (Warning alert triggered) |
| `ALTERNATE_CONTROL` | `FAIL_CANDIDATE` | `DRIFTED` (Warning alert triggered) |
| `INEFFECTIVE` | `PASS_CANDIDATE` | `DRIFTED` (Potential resolution flag) |

## 4. Scoring & Calculations Engine (Martin Fowler Philosophy)

- **Domain Isolation**: Calculations evaluating drift states must reside in a stateless pure calculator `server/src/driftEngine.js`.
- **Assessed score fallback**: A `DRIFTED` state warning does *not* automatically modify the official signed-off maturity score on reports, but it flags a visible risk indicator next to the system maturity score.

---

## 5. UI Visual Layout Indicators (Premium UX Pattern)

- **Drift Indicators**: Render a glowing amber badge (`animate-pulse`) displaying `⚠ DRIFT DETECTED` next to System boundaries list view if any active requirements are in `DRIFTED` state.
- **Drift Log Table**: Expose a visual chronologic log detailing when the drift was identified, which automated collector triggered it, and the delta changes (e.g. Entra CA Policy disabled).

---

## 6. Verification Matrix (Andrej Karpathy Philosophy)

- **Test Case 1**: Evaluates conflicting collector inputs and returns correct drift mappings.
- **Test Case 2**: Ensures that the drift state displays warnings inside system profiles without mutating signed-off database columns.
