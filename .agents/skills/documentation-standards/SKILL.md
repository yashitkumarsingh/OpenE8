---
name: documentation-standards
description: Directives for writing structured codebase documentation, REST API specifications, and ASD Essential Eight compliance mapping files.
---
# Documentation Standards Skill

## Overview
This skill provides developer-centric standards for writing clean, structured, and comprehensive documentation across the OpenE8 workspace.

## Documentation Guidelines

### 1. REST API Contract Specifications
- Every endpoint registered in the express application must be documented using clear Markdown specifications.
- Specify:
  - **HTTP Method** (GET, POST, PUT, DELETE) and **Endpoint URL Path**.
  - **Request parameters** (URL path parameters, query params, JSON body payload schemas).
  - **Success Response** (HTTP status code, JSON response body structure).
  - **Error States** (HTTP status codes, payload structures).
- Include copy-pasteable JSON payload examples for testing endpoint actions.

### 2. Architecture & decoupled Engine Docs
- Document folder boundaries explicitly to maintain the Domain-Driven Design (DDD) layout:
  - Explain the decoupling of `routes/` (Express bindings) from `controllers/` (Prisma/DB execution logic).
  - Explain the `maturityEngine.js` domain logic (how the lowest-common-denominator strategy aggregates scores, and how exceptions act as temporary override gates).
- Document data model relations defined in `schema.prisma`.

### 3. ASD Essential Eight Compliance Mappings
- Maintain clean cross-references between the Essential Eight mitigation strategies and **October 2024 ISM control mapping indexes**.
- Document requirement attributes:
  - Mitigation Strategy (e.g. Restrict Admin Privileges)
  - ASD Maturity Level (ML1, ML2, ML3)
  - Target Requirement ID (e.g. `E8-RP-ML2-01`)
  - Traceability mapping descriptions.

### 4. Developer Quickstart & Dependency Gates
- Every deployment guide or README must document:
  - Prerequisites (Node.js version limits, Prisma relation quirks).
  - Database setup commands (`npm run db:setup`).
  - Strict security audits mandates (`npm audit` zero-vulnerability gate).
  - Automated unit and integration testing commands (`npm test`, `npm run test:coverage`).
