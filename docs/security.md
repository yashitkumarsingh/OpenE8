# Security Design — OpenE8 Governance OS

This document describes the security design decisions, known limitations, threat model, and production hardening checklist for OpenE8.

---

> [!IMPORTANT]
> OpenE8 is a governance evidence management tool, not a certified security product.
> This document is provided for transparency so that operators can make informed decisions
> about their deployment posture.

---

## 1. Password Hashing

**Implementation**: Native Node.js `crypto.pbkdf2Sync` (PBKDF2-HMAC-SHA512)

| Parameter | Value | Reference |
|---|---|---|
| Digest | SHA-512 | NIST SP 800-132 |
| Iterations | 310,000 | NIST SP 800-63B §5.1.1.2 |
| Salt length | 32 bytes | NIST SP 800-132 §5.1 |
| Output length | 64 bytes (512-bit) | — |
| Storage format | `hex_salt:hex_hash` | — |

**What is protected**: Passwords are never stored in plaintext. An attacker who obtains the database file cannot recover passwords without brute-force effort proportional to the iteration count.

**Known limitations**:
- PBKDF2 is parallelisable on GPU hardware; Argon2id provides stronger resistance. For production deployments handling highly sensitive data, consider replacing with `argon2` (one additional dependency).
- No password complexity policy is enforced server-side. Organisations should supplement with their own identity provider policies.

---

## 2. Token Authentication (JWT)

**Implementation**: Native Node.js `crypto.createHmac` (HMAC-SHA256), custom base64url encoding.

| Feature | Status |
|---|---|
| Expiry (`exp`) validation | ✅ Enforced |
| Signature tamper rejection | ✅ Enforced via `timingSafeEqual` |
| Timing attack mitigation | ✅ `crypto.timingSafeEqual` on all comparisons |
| `none` algorithm attack | ✅ Not possible — hardcoded to HS256 |
| Token revocation | ✅ Implemented (in-memory blacklist via `/logout`) |
| Secret rotation | ❌ Not implemented |
| Refresh token flow | ❌ Not implemented |
| Issuer/audience validation | ❌ Not implemented |
| Clock skew tolerance | ❌ Not implemented |

**Known limitations**:
- Issued tokens remain valid until expiry (24 hours) even if a user's account is deactivated.
- JWT secret defaults to a hardcoded fallback if `JWT_SECRET` env var is not set. **Always set `JWT_SECRET` in production.**
- For production environments requiring token revocation or OIDC federation, replace with a mature JWT library (`jose`) or an identity provider (Keycloak, Entra ID, Auth0).

**Recommended additional tests for production hardening**:
```
✅ Expired token rejected (implemented in auth.test.js)
✅ Tampered signature rejected (implemented in auth.test.js)
❌ Wrong issuer rejected (not tested — not implemented)
❌ Wrong audience rejected (not tested — not implemented)
❌ Missing exp rejected (not tested)
❌ Algorithm confusion (alg:none) impossible (not directly tested)
❌ Secret rotation path tested (not tested)
```

---

## 3. Evidence Integrity Verification

**Implementation**: SHA-256 hash of file bytes, stored in `Evidence.contentHash`. Verification uses `crypto.timingSafeEqual` to compare current and baseline hashes.

**What this provides**:
- Integrity-verifiable evidence during assessment review — detects if a file was modified after upload.
- Post-upload tamper detection for assessors and auditors.

**What this does not provide**:
- Legal chain of custody
- Non-repudiation
- Timestamping with a trusted third-party time authority

Do not describe this feature as "legally defensible evidence." Use "integrity-verifiable during assessment review."

---

## 4. Importer Findings Model

Automated importers (Entra ID CA Policy, Nessus CSV) produce **candidate findings**, not compliance verdicts.

| Status | Meaning |
|---|---|
| `PASS_CANDIDATE` | Automated scan suggests compliance — assessor confirmation required |
| `FAIL_CANDIDATE` | Automated scan suggests non-compliance — assessor confirmation required |
| `PASSED` | Assessor-confirmed compliance decision |
| `FAILED` | Assessor-confirmed non-compliance decision |

Importers set `reviewedBy: null` to indicate no human has reviewed the result.

**Why**: Conditional Access policies can appear compliant but still have exclusions, report-only mode, break-glass bypasses, or guest account gaps. Nessus results may include out-of-scope hosts. Machine-parsed results are evidence input, not compliance truth.

---

## 5. Production Deployment Checklist

Before deploying OpenE8 outside of a local development context:

- [ ] Set `JWT_SECRET` environment variable to a cryptographically random 256-bit value
- [ ] Switch Prisma datasource from SQLite to PostgreSQL (update `DATABASE_URL` and run `npx prisma migrate deploy`)
- [ ] Serve behind HTTPS — never expose plain HTTP to users
- [ ] Set `NODE_ENV=production`
- [ ] Review and restrict CORS origins in `server.js`
- [ ] Run `npm audit` on both `client/` and `server/` before deployment
- [ ] Review access controls: ensure Auditor accounts cannot invoke write endpoints
- [ ] Consider adding rate limiting to authentication endpoints (`/api/auth/login`)
- [ ] For multi-tenant use, scope all database queries by organisation or tenancy identifier

---

## 6. Database

| Environment | Recommended Database | Notes |
|---|---|---|
| Local development | SQLite (`dev.db`) | Zero config, included by default |
| Staging / Production | PostgreSQL | Update `DATABASE_URL` in `.env` and run `npx prisma migrate deploy` |

SQLite is not suitable for concurrent multi-user production use. It does not support row-level locking and has limitations with high write concurrency.

---

## 7. Disclaimer

OpenE8 is an independent open-source governance and evidence management platform. It is not an official ASD tool, does not certify compliance, and does not replace a qualified assessor. Current npm audit reports zero known vulnerabilities at release time. Security posture should be verified by operators before deployment.
