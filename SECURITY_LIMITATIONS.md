# Security Limitations & Assumptions - OpenE8 Governance OS

This document details the security constraints, threat boundaries, and architectural limitations of OpenE8 `v0.1.0-alpha`. 

---

## 1. Regulatory Status & Assessor Disclaimer
* **Non-Authoritative Interpretation**: OpenE8 is not an official tool of the Australian Signals Directorate (ASD) or the Australian Cyber Security Centre (ACSC). It does not certify compliance, replace official assessment documentation, or act as a substitute for a qualified, registered IRAP Assessor.
* **Starter Catalog**: The seeded controls database is a community-sourced "Starter Catalogue" based on interpretations of the ASD Essential Eight guidelines (October 2024 framework update). It should not be used as a final compliance checklist without professional legal and security review.

---

## 2. Cryptographic & Session Limits
* **JWT Secret Integrity**: JWT signatures verify server-issued session identity. In production environments, a cryptographically random, custom `JWT_SECRET` must be set. The server is configured to fail closed and crash at launch if default keys are detected.
* **Token Blacklist Persistence**: The active session logout/revocation log uses an in-memory database registry. When the Express backend service is restarted, the blacklist is cleared. Expired blacklisted tokens remain invalid due to standard JWT expiry validations, but active revoked tokens will theoretically be accepted again if the server bounces before their natural expiry.
* **Signature Verifications**:
  * OIDC SSO relies on public keys dynamically fetched from Microsoft Azure JWKS endpoints. A compromised or custom tenant could spoof identities if the configuration tenant filters (`ENTRA_TENANT_ID`) are configured incorrectly or set to public values.
  * Evidence integrity recalculation matches SHA-256 hashes using a constant-time comparison helper `crypto.timingSafeEqual` to mitigate timing analysis attacks.

---

## 3. Storage & Infrastructure Risks
* **SQLite Persistence**: By default, local deployments utilize SQLite stored on-disk. SQLite does not support advanced row-level access permissions or multi-user file locks. For production enterprise deployments, transition to PostgreSQL is recommended.
* **Evidence Directory Protection**: 
  * Direct public static access to `/uploads` has been disabled. Evidence downloads require session authentication headers.
  * Files uploaded are sanitized to alphanumeric filenames, capped at 10MB, and restricted to allowed extensions (`.png`, `.jpg`, `.jpeg`, `.pdf`, `.json`, `.csv`, `.txt`). However, OpenE8 does not perform binary antivirus or malware inspections on evidence files. System administrators must configure endpoint protection on the host OS storage drives.
