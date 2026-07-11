# Essential Eight Compliance Logic & ISM Mappings

This document details the compliance logic, score aggregation, exception overrides, and ISM control mappings utilized within OpenE8.

---

## Score Aggregation Logic (Lowest Common Denominator)

Under the Australian Signals Directorate (ASD) Essential Eight Assessment Guide, an organization's maturity is not calculated by averaging scores. The maturity score is calculated using the **Lowest Common Denominator** rule. 

To achieve Maturity Level $N$ overall, you must pass **every single requirement** associated with Maturity Level $N$ across all eight strategies. The flowchart below maps the calculation logic:

```mermaid
flowchart TD
    Start([Calculate Maturity Score]) --> CheckML1{Did all strategies pass ML1?}
    
    CheckML1 -->|No| SetML0[Maturity Level = ML0]
    CheckML1 -->|Yes| CheckML2{Did all strategies pass ML2?}
    
    CheckML2 -->|No| SetML1[Maturity Level = ML1]
    CheckML2 -->|Yes| CheckML3{Did all strategies pass ML3?}
    
    CheckML3 -->|No| SetML2[Maturity Level = ML2]
    CheckML3 -->|Yes| SetML3[Maturity Level = ML3]

    SetML0 & SetML1 & SetML2 & SetML3 --> End([Output Score & Blocker List])
```

---

## Exceptions & Compensating Controls Override Gates

A major operational bottleneck for security teams is legacy systems or service accounts that cannot support modern security controls (like MFA or Application Whitelisting). 

OpenE8 resolves this bottleneck by implementing **Approved Exception Override Gates**:

1. **Approved Exception & Compensating Control Override**: If a control test fails (e.g. `E8-AC-ML1-01` is INEFFECTIVE) but there is an active, approved exception in the database, the engine treats it as a mitigating control if it satisfies the following rules:
   - **Efficacy Threshold**: The compensating control's efficacy rating must be assessor-rated as **`HIGH`**.
   - **Risk Acceptance**: A formal risk owner must accept the residual risk (`riskAcceptedBy` is signed and `riskAcceptedAt` timestamp is recorded).
   - **Expiry Verification**: The exception must be currently active (`status === 'APPROVED'` and `new Date(expiryDate) > new Date()`).
2. **Postures Split**:
   - **Technical Maturity (Raw Score)**: Computed strictly from technical passes without compensating overrides or exceptions.
   - **Assessed Maturity (Mitigated Score)**: Evaluated including CISO-approved compensating controls and active exceptions that satisfy the requirements above.

---

## Assessor Compliance Statuses

OpenE8 enforces structured, auditable statuses for requirement evaluations to ensure assessment credibility:

* **EFFECTIVE**: The control is fully verified and operating effectively.
* **INEFFECTIVE**: The control failed verification checks.
* **NOT_IMPLEMENTED**: The control is not implemented or partially configured.
* **ALTERNATE_CONTROL**: Alternate compensating controls have been verified to provide equivalent protection.
* **NO_VISIBILITY**: Insufficient evidence was gathered to verify the control.
* **NOT_APPLICABLE**: The requirement is out of scope with documented justification.
* **NOT_ASSESSED**: The requirement has not been assessed yet.

---

## Assessor Audit Logs

Every change event in the system scope is captured inside a persistent `AuditLog` table tracking:
- Action (CREATE, UPDATE, DELETE, IMPORT)
- Operator userId and Timestamp
- Affected Entity type and ID
- Diff comparison (old value vs. new value)
- Author review comment

---

## Evidence Confidence Scale

When evidence files are attached to a control review, assessors assign a confidence score:

- **HIGH (System-Generated Logs / Configuration Exports)**: Raw data extracted directly from system configurations (e.g., Active Directory policies, Entra CA JSONs, Nessus scans).
- **MEDIUM (Process Logs / Documentation)**: Written logs, system architecture screenshots, policy manuals.
- **LOW (Attestations / Email confirmations)**: Self-declarations, email threads, verbal attestations from developers.

---

## October 2024 ISM Controls Mapping Index

OpenE8 maps Essential Eight requirements directly to the **October 2024 Information Security Manual (ISM)** guidelines:

| Strategy | Req ID | Level | Mapped ISM Controls |
| :--- | :--- | :--- | :--- |
| **Application Control** | E8-AC-ML1-01 | ML1 | ISM 1655, ISM 1545 |
| **Patch Applications** | E8-PA-ML1-01 | ML1 | ISM 1500, ISM 1656 |
| **Restrict Admin Privileges** | E8-RP-ML2-01 | ML2 | ISM 1435, ISM 1436 |
| **User MFA Enforcements** | E8-MFA-ML2-01 | ML2 | ISM 1684, ISM 1700 |
| **Daily Backups** | E8-BU-ML1-01 | ML1 | ISM 1511, ISM 1515 |
