# OpenE8 Governance OS - Documentation Center

Welcome to the **OpenE8 Governance OS Documentation Center**. This portal serves as a comprehensive developer and administrator guide for understanding, configuring, and contributing to OpenE8.

---

## What is OpenE8?

**OpenE8** is an open-source Essential Eight governance, evidence, exceptions, and remediation management operating system. Instead of treating ASD compliance as a static spreadsheet checklist, OpenE8 treats compliance as an active lifecycle integrated directly with systems, evidence logs, approved exceptions, and developer tracking boards.

---

## Documentation Modules

Explore the documentation sections to understand the technical details and compliance structures:

### 1. [Architecture & Design Guide](architecture.md)
*Technical blueprints of the decoupled layers.*
- Model-View-Controller & Domain-Driven Design layout.
- Mermaid system flowchart tracing how technical scan logs convert to calculated compliance scores.
- Database relations schemas (Prisma & SQLite).

### 2. [REST API Contract Specifications](api-spec.md)
*Developer documentation for all endpoint routes.*
- Endpoint tables for Systems, Assessments, Exceptions, and Remediations.
- Copy-pasteable JSON payload models.
- Structured success response logs and error handlers.

### 3. [Essential Eight Compliance Rules Engine](essential-eight.md)
*Functional rules translating ASD guidelines into code logic.*
- Lowest-common-denominator score calculation models (Mermaid logic diagram).
- Exception governance, risk acceptance thresholds, and compensating control bypass rules.
- Traceability mappings to the **October 2024 ASD ISM controls**.
- Evidence confidence scale specifications.

### 4. [Developer Onboarding & Setup Manual](setup.md)
*Practical quickstart guides for booting the application.*
- NVM paths environment overrides.
- Concurrently dev server booting and database seeder migrations.
- Strict security vulnerability audit procedures (`npm audit`).
- Code coverage validations (`npm run test:coverage`).
