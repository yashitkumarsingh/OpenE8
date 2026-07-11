# Spec: Evidence ZIP Packager & Unified Verification Manifest

This specification documents the requirements, endpoint architectures, and schema design for packaging all evidence files and audit trails of an assessment into a secure, unencrypted, self-contained ZIP archive.

---

## 1. Directory Structure of Packed ZIP

When an assessor requests a package download for a completed assessment, the system must build a zip archive with the following layout:

```text
/
├── manifest.json                  # Cryptographic catalogue of all contents
├── assessment-summary.md          # Markdown executive summary report
├── audit-log.csv                  # Escaped, verified chronological change trail
└── evidence/                      # Directory containing source evidence files
    ├── entra-ca-policy.json
    └── backup-schedules.txt
```

---

## 2. Manifest Schema (`manifest.json`)

The manifest contains metadata, overall scores, and a hash validation table mapping every evidence file to its filename and SHA-256 fingerprint:

```json
{
  "assessmentId": "5ca657d4-0690-4824-91c8-db3722a48eb8",
  "systemName": "RMS System 1",
  "assessedMaturity": "ML2",
  "assessorSignature": "Assessor Name Check",
  "signedOffAt": "2026-07-11T12:00:00Z",
  "checksums": [
    {
      "filename": "entra-ca-policy.json",
      "requirementId": "E8-MFA-ML1-01",
      "sha256": "87eb23e800c..."
    }
  ]
}
```

---

## 3. Unified Executive Report Requirements

The generated `assessment-summary.md` executive report must incorporate:
1. Boundary scope parameters and justifications.
2. Complete test outcomes matching standard assessor vocabulary (`EFFECTIVE`, `ALTERNATE_CONTROL`, etc.).
3. A table detailing active exception requests, approved risktakers, and compensating control efficacy levels.
4. Ratings on Evidence Quality (`EXCELLENT`, `GOOD`, etc.).
