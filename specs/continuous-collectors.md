# Spec: Continuous Evidence Collectors (Azure/AWS Config)

## 1. Goal & Context
This specification defines the endpoint interface and background daemon architecture for orchestrating automated, continuous evidence collectors (such as periodic Azure Conditional Access reports or AWS Config rule audits) into the OpenE8 database.

## 2. First Principles Analysis
- **Problem Essence**: Safely transporting external system compliance states to candidate findings in our local database via automated agents.
- **Assumptions Challenged**:
  | Assumption | Challenge | Verdict |
  |---|---|---|
  | Collectors run as active server microservices | Increases attack surface and hosting costs. | Discard. Keep collectors as lightweight client webhooks. |
  | OpenE8 must poll remote APIs | Storing tenant credentials on our local DB increases security risk. | Discard. Pulling is handled by external agents that push to OpenE8. |
- **Ground Truths**:
  1. OpenE8 server must not store third-party client credentials/keys on disk.
  2. Incoming payloads must be validated for authenticity immediately.
- **Reasoning Chain**: Pushing payloads via webhooks keeps OpenE8 stateless regarding external API tokens, satisfying security constraints.

## 3. Architecture Flow

```text
[Cloud Environment] 
       │ (Periodic Cron/Daemon Execution)
       ▼
[Collector Script / Webhook]
       │ 
       │ POST /api/importers/automated (Authenticated Token)
       ▼
[OpenE8 Collectors Controller]
       │ (Payload Boundary Validation)
       ▼
[Database finding candidates] ───► [Assessor Review Alert Trigger]
```

## 4. API Schema Contract

### Request Endpoint
`POST /api/importers/automated`

### Headers
```http
Authorization: Bearer <Dynamic_Machine_Token>
Content-Type: application/json
```

### Request Payload (`schema`)
```json
{
  "collectorName": "azure-entra-mfa-daemon",
  "systemId": "5ca657d4-0690-4824-91c8-db3722a48eb8",
  "sourceSystem": "Microsoft Entra ID",
  "collectedAt": "2026-07-11T12:00:00Z",
  "verificationHash": "cryptographic-payload-checksum",
  "results": [
    {
      "requirementId": "E8-MFA-ML1-01",
      "status": "PASS_CANDIDATE",
      "notes": "MFA CA Policies verified active for all remote and privileged user groups."
    }
  ]
}
```

---

## 5. Boundary Schema Constraints (Matt Pocock Philosophy)

1. **Authentication Gate**: Collectors must use unique cryptographically signed machine tokens (verified via dynamic public certificates or secrets).
2. **Timing-Safe Hash Audits**: The payload must supply a `verificationHash` representing the signature of the raw collector outputs. OpenE8 will match it before persisting candidates.
3. **Fail-Closed ID Resolution**: If `systemId` or `requirementId` references non-existent entities, halt imports and return `400 Bad Request`.

---

## 6. Verification Matrix (Andrej Karpathy Philosophy)

- **Test Case 1**: Webhook payload with missing parameters returns `400 Bad Request`.
- **Test Case 2**: Valid webhook payload registers `PASS_CANDIDATE` findings inside the targeted system assessment test log.
- **Test Case 3**: Invalid authentication signature logs `401 Unauthorized` and logs an audit log entry highlighting access failures.
