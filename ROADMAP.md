# OpenE8 Governance OS — Product Vision & Roadmap

## Product Vision

**OpenE8** is the premier open-source governance operating system designed to elevate cybersecurity compliance from a static, spreadsheets-based review to a **continuous, live-audited operational lifecycle**. 

The ultimate goal of OpenE8 is to provide organizations with a single, cryptographically verifiable portal that orchestrates:
$$\text{Continuous Scans} \longrightarrow \text{Automated Verification} \longrightarrow \text{Evidence Traceability} \longrightarrow \text{Exceptions Lifecycle} \longrightarrow \text{Bi-directional Remediation}$$

---

## Current Operational State

The core framework of OpenE8 is currently functional and tested, featuring the following capabilities:

### 1. Decoupled Business Rules Engine
* **Stateless calculations**: All scores and blocker analysis computed deterministically inside `maturityEngine.js`, fully isolated from Prisma and Express database side effects.
* **Exceptions override gates**: Evaluates compensating controls and approved active exception log expiries to calculate assessed maturity versus technical raw maturity postures.

### 2. Authentication & Governance Controls
* **Microsoft Entra ID SSO**: Completed integration of the OIDC authorization code flow, auto-provisioning new user records with default roles, and rendering a premium glassmorphic Microsoft button.
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
* **Zero-Dependency Audit Log Export**: streams chronological change trails as authenticated, escaped CSV payloads.

### 5. Verified Code Quality & Coverage Gates
* **Backend Coverage**: Statement coverage verified at **92.52%** and branch coverage at **80.26%**.
* **Frontend Coverage**: Statement coverage verified at **82.11%** using Vitest components testing.
* **End-to-End Validation**: Automated via Playwright browser integration tests.

---

## Future Roadmap

---

## Phase 1: SSO & Security Hardening (Current Sprint)

Focuses on verifying OIDC integrations, hardening the token authentication boundaries, and scaling the persistence layer.

### A. Microsoft Entra ID SSO Hardening
- [ ] **Configurable Tenant Mapping**: Allow configuration of custom Azure Tenant IDs instead of multi-tenant fallback modes.
- [ ] **App Roles Mapping**: Extract Active Directory security groups or Entra ID App Roles (`Assessor`, `SystemOwner`, `Auditor`) from JWT claims to assign local user permissions dynamically.
- [ ] **E2E Playwright SSO Journeys**: Implement simulated browser tests verifying authorization callbacks and credential parsing.

### B. Production Security Hardening
- [ ] **Secure Cookie Storage (`httpOnly`)**: Store session JWT tokens in `httpOnly`, `Secure`, `SameSite=Strict` cookies to block XSS vector access.
- [ ] **Revocation Registry Synchronization (Redis)**: Deploy a Redis cache layer to store revoked tokens across clustered, multi-node instances.
- [ ] **Memory-Hard Password Hashing (Argon2id)**: Migrate local user password hashing from PBKDF2 to `argon2id` to prevent ASIC/GPU parallelized brute-force attacks.

### C. Database Layer Scalability
- [ ] **PostgreSQL Migration**: Swap SQLite datasource configuration to PostgreSQL inside `schema.prisma` to support high concurrency and row-level write locking.

---

## Phase 2: Continuous Auditing & Integrations (Next 3–6 Months)

Transitions OpenE8 from manual assessments to continuous compliance pipelines and integrates with developer toolchains.

### A. Continuous Auditing Pipelines (API Hooks)
- [ ] **Scheduled Scan Sinks**: Expose dedicated webhook endpoints for automated CI/CD pipelines (e.g. GitHub Actions, GitLab CI) and agent scripts to POST Nessus, AWS Config, or Defender logs directly into assessments.
- [ ] **Live Compliance Drift Alerts**: Detect status drifts (e.g. a control test transitioning from `PASSED` to `FAILED` due to an uploaded vulnerability scan) and immediately trigger Slack, Teams, or email warnings.

### B. Bi-Directional Remediation Integration (Jira / ServiceNow / GitHub Issues)
- [ ] **Remediation Task Sync**: Automatically open Jira tickets or GitHub Issues whenever a compliance import creates a `BACKLOG` remediation task.
- [ ] **Status Pull Hooks**: Poll issue-tracking API status points (e.g., ticket closed in Jira) to automatically transition Remediation Board tasks to `DONE`.

### C. Automated Exception Lifecycle Management
- [ ] **Proactive Expiry Alerts**: Automatically notify System Owners and Assessors 30 days prior to compensating controls or approved exception expirations.
- [ ] **Automated Uplift Backlog Triggers**: If an exception expires without renewal, automatically trigger a new Remediation Task to resolve the technical control deficit.

---

## Phase 3: Enterprise Compliance & Multi-Framework Auditing (12+ Months)

Establishes OpenE8 as an enterprise compliance mesh mapping to global security frameworks.

### A. Interactive Evidence Traceability Graph
- [ ] **Auditor Explorer Node Graph**: Enhance the SVG node graph to map compliance pipelines from Requirement -> Evidence Document (including SHA-256 validation status) -> Active Exception rationale -> Active Remediation Ticket.
- [ ] **Cryptographic Compliance Verification Bundle**: Export a zipped compliance package containing signed audit trails (CSV), Markdown executive summaries, raw evidence file attachments, and cryptographic checksum validation reports.

### B. Regulatory Multi-Framework Mapping
- [ ] **Unified Control Mapping Hub**: Map core compliance checks beyond the ASD Essential Eight to:
  * **ISO/IEC 27001:2022** (Annex A Controls)
  * **NIST SP 800-53 Rev 5**
  * **SOC 2 Type II** (Trust Services Criteria)
  * **CIS Critical Security Controls v8**

### C. Enterprise Group Rollups (CISO Dashboard)
- [ ] **Cross-System Compliance Dashboards**: Allow enterprise CISOs to view compliance levels, outstanding exceptions, and residual risk indexes across dozens of organizational units and systems in a unified, hierarchical view.
