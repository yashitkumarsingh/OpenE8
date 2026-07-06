# REST API Specifications

All endpoints are hosted under `/api/`. Requests and responses utilize JSON formats (`Content-Type: application/json`).

---

## 1. Authentication Module

### POST `/api/auth/register`
Creates a new user profile with cryptographically secure PBKDF2 password hashing.
- **Request Body**:
```json
{
  "email": "reviewer@opene8.gov.au",
  "password": "Password123",
  "name": "Reviewer User",
  "role": "SYSTEM_OWNER"
}
```
- **Success Response (201 Created)**:
```json
{
  "id": "usr-123",
  "email": "reviewer@opene8.gov.au",
  "name": "Reviewer User",
  "role": "SYSTEM_OWNER"
}
```

### POST `/api/auth/login`
Verifies user credentials and returns a signed custom JWT (HMAC-SHA256).
- **Request Body**:
```json
{
  "email": "assessor@opene8.gov.au",
  "password": "Password123"
}
```
- **Success Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-abc",
    "email": "assessor@opene8.gov.au",
    "name": "Lead Security Assessor",
    "role": "ASSESSOR"
  }
}
```

### GET `/api/auth/me`
Returns current session user metadata based on Bearer token in headers.
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
```json
{
  "user": {
    "id": "usr-abc",
    "email": "assessor@opene8.gov.au",
    "name": "Lead Security Assessor",
    "role": "ASSESSOR"
  }
}
```

---

## 2. Systems Module

### GET `/api/systems`
Fetches all systems in scope, including their latest assessment metadata and mitigation logs.
- **Success Response (200 OK)**:
```json
[
  {
    "id": "sys-abc",
    "name": "Records Management System",
    "businessOwner": "Finance Dept",
    "targetMaturity": "ML2",
    "exceptions": [],
    "remediations": [],
    "assessments": [
      {
        "id": "asm-123",
        "status": "IN_PROGRESS",
        "createdAt": "2026-07-05T12:00:00Z"
      }
    ]
  }
]
```

### POST `/api/systems`
Registers a new system scope.
- **Request Body**:
```json
{
  "name": "HR Core",
  "businessOwner": "HR Division",
  "technicalOwner": "SysAdmin Team",
  "environment": "Prod",
  "platform": "M365",
  "dataSensitivity": "Protected",
  "targetMaturity": "ML2",
  "outOfScopeItems": "Legacy printers",
  "scopeJustification": "Scoped to core HR database only."
}
```
- **Success Response (201 Created)**: Returns the newly created `System` object.

### GET `/api/systems/:id`
Returns full detail of a system, including calculation engines feedback.
- **Success Response (200 OK)**:
```json
{
  "id": "sys-abc",
  "name": "Records Management System",
  "businessOwner": "Finance Dept",
  "technicalOwner": "ICT Ops",
  "environment": "Prod",
  "platform": "Azure & M365",
  "dataSensitivity": "Protected",
  "targetMaturity": "ML2",
  "assessments": [],
  "exceptions": [],
  "remediations": [],
  "maturity": {
    "strategyScores": { "Application Control": "ML1" },
    "overallMaturity": "ML1",
    "blockingStrategies": ["Application Control"],
    "targetMaturity": "ML2",
    "technicalScores": { "Application Control": "ML0" },
    "technicalMaturity": "ML0",
    "technicalBlockingStrategies": ["Application Control"]
  },
  "auditLogs": [
    {
      "id": "log-xyz",
      "userId": "Assessor",
      "action": "UPDATE",
      "entityType": "ControlTest",
      "entityId": "ct-123",
      "comment": "Status updated to MET_VIA_COMPENSATING_CONTROL",
      "createdAt": "2026-07-05T12:05:00Z"
    }
  ]
}
```

### GET `/api/systems/:id/report`
Generates a markdown compliance package.
- **Success Response (200 OK)**:
```json
{
  "markdown": "# ASD Essential Eight Governance Report\n**System**: HR Core\n..."
}
```

---

## 3. Exceptions Module

### POST `/api/systems/:systemId/exceptions`
Creates a formal exception request.
- **Request Body**:
```json
{
  "requirementId": "E8-AC-ML1-01",
  "riskStatement": "Legacy app cannot restrict execution directories.",
  "compensatingControl": "Application is isolated in virtual sandbox with folder integrity scans.",
  "residualRisk": "MEDIUM",
  "approvedBy": "CISO Office",
  "reviewDate": "2026-12-01T00:00:00Z",
  "expiryDate": "2027-07-01T00:00:00Z"
}
```
- **Success Response (201 Created)**: Returns the `Exception` object with `status: "PENDING"`.

### PUT `/api/exceptions/:id`
Updates or approves an exception request.
- **Request Body**:
```json
{
  "status": "APPROVED",
  "auditComment": "Exception request approved after verifying sandbox boundaries."
}
```
- **Success Response (200 OK)**: Returns the updated `Exception` object, with the `auditComment` appended to the persistent `auditTrace` string.

---

## 4. Technical Importers Module

### POST `/api/assessments/:assessmentId/import`
Processes raw configuration exports or scan files to auto-score requirements.
- **Request Body (Standard - e.g. ENTRA_MFA, NESSUS_PATCH, DEFENDER_VULN, AWS_CONFIG)**:
```json
{
  "fileType": "ENTRA_MFA",
  "fileData": "W3sgImRpc3BsYXlOYW1lIjogIkVuZm9yY2UgTUZBIiwgInN0YXRlIjogImVuYWJsZWQiIH0gXQ==",
  "filename": "entra-policies.json"
}
```
- **Request Body (Custom CSV Mapping - CUSTOM_CSV)**:
```json
{
  "fileType": "CUSTOM_CSV",
  "fileData": "VnVsbl9JRCxUYXJnZXRfSVAsRGFuZ2VyX1JhbmssRGV0YWlscyxGaXg...",
  "filename": "scan-report.csv",
  "mapping": {
    "severity": "Danger_Rank",
    "host": "Target_IP",
    "cve": "Vuln_ID",
    "description": "Details",
    "solution": "Fix"
  }
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Technical file successfully processed.",
  "summary": "Parsed 12 Entra policies. Found 2 active MFA rules. Updated: E8-MFA-ML1-01 = PASS."
}
```

---

## 5. Error Responses

If a request fails validation or lookup, the API returns structured error codes:

### Bad Request (400)
- Triggered by missing mandatory inputs or parsing faults.
- **Response Payload**:
```json
{
  "error": "Failed to parse JSON configuration file: Unexpected token in JSON at position 12"
}
```

### Not Found (404)
- Triggered by requests for IDs that do not exist in the database.
- **Response Payload**:
```json
{
  "error": "Exception not found"
}
```
