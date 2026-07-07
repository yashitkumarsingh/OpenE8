# OpenE8 Governance OS — Product Vision & Roadmap

## Product Vision

**OpenE8** is an open-source Essential Eight assessment workspace designed to elevate cybersecurity compliance from a static, spreadsheets-based review to a structured, auditable evidence and remediation lifecycle. 

The target execution flow sequences governance validation stages cleanly:
$$\text{Evidence Imports / Candidate Findings} \longrightarrow \text{Assessor Review} \longrightarrow \text{Exceptions Lifecycle} \longrightarrow \text{Remediation Tracking} \longrightarrow \text{Dual Sign-off}$$

*Over time, OpenE8 will evolve into a continuous evidence and remediation governance platform:*
$$\text{Continuous Collectors} \longrightarrow \text{Automated Evidence Refresh} \longrightarrow \text{Compliance Drift Detection}$$

---

## Current Operational State

The core framework of OpenE8 features the following capabilities:

### 1. Decoupled Business Rules Engine
* **Stateless calculations**: All scores and blocker analysis computed deterministically inside `maturityEngine.js`, fully isolated from database or transport side effects.
* **Exceptions override gates**: Evaluates compensating controls and approved active exception log expiries to calculate assessed maturity versus technical raw maturity postures.

### 2. Authentication & Governance Controls
* **Microsoft Entra ID SSO**: Authorization-code prototype implemented; production-grade cryptographic token signature checks using JWKS dynamically configured.
* **Role-Based Access Control (RBAC)**: Middleware permissions check locking routes and frontend forms based on active roles (`ASSESSOR`, `SYSTEM_OWNER`, `AUDITOR`).
* **Session Revocation**: Local memory-based token blacklist registry and POST `/api/auth/logout` endpoint.
* **Password Hashing**: Native pbkdf2-HMAC-SHA512 hashing (310,000 iterations) with timing-safe validation comparisons.

### 3. Automated Scanning Importers
* **Entra CA Parser**: Evaluates Conditional Access export JSON files to register `PASS_CANDIDATE` verdicts on MFA requirements.
* **Nessus CSV Parser**: Scans patch vulnerability logs. Flags `FAIL_CANDIDATE` findings on CVE discoveries and automatically populates backlog Remediation Task items.
* **AWS Config & Defender Parsers**: Native config mapping candidates generator.

### 4. Regulatory Evidence Traceability & Sign-offs
* **Cryptographic Fingerprinting**: Files uploaded are hashed via SHA-256. Assessors can verify evidence integrity on-demand using timing-safe checksum recalculation checks.
* **Dual-Signature Sign-off**: Assessments are sealed and locked against modifications when both the Lead Assessor and System Owner submit signatures under Stage 6.
* **Zero-Dependency Audit Log Export**: Streams chronological change trails as authenticated, escaped CSV payloads.

---

## Sprint 0.5: Positioning Cleanup (Completed)
- [x] **SSO Experimental Posture**: Configure environment toggles to control SSO availability flags.
- [x] **Starter Catalogue Notation**: Demarcate seeded requirements as starter catalogues.
- [x] **Alpha Disclaimers**: Add disclaimers inside the UI and generated reports warning that OpenE8 is not an authoritative certification tool.
- [x] **Documentation Clarification**: Add `SECURITY_LIMITATIONS.md` or equivalent security disclosures to docs.

---

## Sprint 1: Trust & Security Hardening (Completed)
- [x] **Discovery-based Signature Verification**: Implement OIDC JWT verification using remote public keys (`jwks_uri`) and validate the `aud` (audience), `iss` (issuer), `exp` (expiry), and `nbf` (not-before) claims.
- [x] **Route-Level Role Authorization (RBAC)**: Enforce `requireRole()` checks across all state-modifying write routes (Systems, Assessments, Control Tests, Exceptions, Remediations, Importers, and Evidence).
- [x] **Fail Closed on Missing JWT Secret**: Halt server startup in production if `JWT_SECRET` is not set or matches the development fallback key.
- [x] **Restricted Evidence Access**: Remove public static serving of `/uploads` files. Provide a secure, authenticated download route that checks user ownership before sending files.
- [x] **File Control Gates**: Enforce a strict file-type allowlist (`.png`, `.jpg`, `.jpeg`, `.pdf`, `.json`, `.csv`, `.txt`) and 10MB size limits on evidence uploads.

---

## Sprint 2: Compliance Correctness & ASD Alignment (In Progress)

Enhances the fidelity of the control catalogue and aligns terminology with official ASD assessment standards.

### A. Control Catalogue Fidelity
- [x] **Starter Catalogue Demarcation**: Clearly label current controls as a "Starter control catalogue inspired by ASD guidance" rather than an authoritative reproduction.
- [ ] **Detailed Timeframe Scopes**: Incorporate explicit daily/weekly/fortnightly scanning controls and 48-hour/two-week/one-month patching windows inside the controls catalogue schema.

### B. Standardised Assessment Outcomes
- [ ] **ASD-Aligned Status Options**: Update scoring models and control tests status options to match ASD's official assessment process guide:
  - `NOT_ASSESSED`
  - `EFFECTIVE`
  - `ALTERNATE_CONTROL`
  - `INEFFECTIVE`
  - `NO_VISIBILITY`
  - `NOT_IMPLEMENTED`
  - `NOT_APPLICABLE`

### C. Stricter Exception Scoring
- [ ] **Compensating Control Validation**: Tighten `maturityEngine.js` exception gates. Require an active exception to have a documented `compensatingControlEfficacy` of `HIGH`, active risk owner approval, and a valid unexpired date before adjusting assessed maturity metrics.
- [ ] **Evidence Quality Scales**: Map evidence files to quality scores (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`) as recommended by the ASD Guide.

---

## Sprint 3: Evidence Package & Reporting Exports (Planned)

Supports assessors with packaged, cryptographically-signed compliance exports.

### A. Assessment Verification Exports
- [ ] **Evidence ZIP Packager**: Compile a ZIP file containing the unencrypted evidence documents, a `manifest.json` cataloguing hashes for each file, `assessment-summary.md`, `audit-log.csv`, and `report.md`.
- [ ] **Unified Executive Report**: Compile a comprehensive report (Markdown/JSON) embedding scope parameters, sample size, limitations, evidence quality scores, and active exception statements.
- [ ] **Signed Assessment Manifest**: Generate a signed assessment manifest containing SHA-256 hashes of assessment metadata, evidence files, and audit logs to support independent verification.

---

## Sprint 4: Open-Source Readiness (Planned)

Provides deployment manuals and community guides to prepare OpenE8 for its public `v0.1.0-alpha` release.

### A. Release Preparation
- [ ] **Sample Data Pack**: Seed the database with a pre-configured multi-stage demo system scope and mock evidence.
- [ ] **Deployment Manual**: Add guides highlighting local-only development configurations vs. production-hardened Docker Compose and PostgreSQL configurations.
- [ ] **GitHub Issues Board**: Translate these roadmap items into public repository issues.

---

## Sprint 5: Continuous Collectors and Integrations (Future Roadmap)
- [ ] **API Sinks**: Enable continuous scanner log push integrations.
- [ ] **Ticket System Sync**: Integrate bi-directionally with Jira or GitHub Issues.
- [ ] **Asymmetric manifest signatures**: Upgrade manifest signing to asymmetric key-pairs (e.g. Ed25519).

---

## v0.1.0-alpha Release Gates
A release candidate will not be published until all of the following gates pass:
1. **Zero public uploads**: Direct static directory sharing disabled.
2. **Backend RBAC active**: Every write endpoint protected by authorization checks.
3. **SSO Hardened**: Production JWT validation enabled and fully tested.
4. **Starter catalogue label**: Disclaimer warning shown on catalogue views.
5. **No check-in failures**: Unit/integration tests pass, and dependency audits report zero vulnerabilities.
6. **Walkthrough validated**: A complete assessment lifecycle (scope $\rightarrow$ evidence review $\rightarrow$ dual sign-off lockout) executes end-to-end.
