# OpenE8 Governance OS - Specifications Guide

This directory houses technical specifications that guide architectural designs, schema alterations, and third-party API configurations for OpenE8.

## Principles of Spec-Driven Development

The core MVP skeleton of OpenE8 (importers, assessment workflows, status registries, and compliance dashboards) has been established. Moving forward, **all future roadmap items, database changes, and external connector features will be built strictly using a specification-first approach**:

1. **Specs before Code**: Always write or update the specification file under `specs/` BEFORE implementing major modifications to controllers, databases, or client routers.
2. **Deterministic Schemas**: All database schema adjustments must document corresponding migrations and data conversion logic in a spec file.
3. **Verification Scenarios**: Every specification must list deterministic unit, integration, and E2E test verification scripts.

## Active Specifications Index

* **[evidence-packaging-zip.md](evidence-packaging-zip.md)**: Details the design of Sprint 3 unencrypted evidence ZIP packagers, `manifest.json` generation, and assessor verification checksums.
* **[continuous-collectors.md](continuous-collectors.md)**: Guidelines for background drift scanning and real-time posture feeds.
