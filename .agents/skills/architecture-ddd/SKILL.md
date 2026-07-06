---
name: architecture-ddd
description: Instruction guide for applying Domain-Driven Design (DDD) to governance platforms, drawing on Martin Fowler's Patterns of Enterprise Application Architecture.
---

# Domain-Driven Architecture and DDD Guidelines

This skill instructs agents on how to maintain a clean boundary between domain code, data layers, and HTTP handlers, based on principles from Martin Fowler.

## Core Rules

1. **Domain Model Isolation**:
   - The compliance and maturity engine (`maturityEngine.js`) represents our **Domain Model**. It must remain a pure JavaScript utility that does not know about HTTP requests (`req`, `res`), databases (Prisma), or file systems.
   - It takes plain objects (e.g. control results, exceptions) and returns calculated objects. This makes it highly unit-testable.

2. **Decoupled Handlers**:
   - HTTP routes must only handle incoming parsing, calling the controllers, and formatting JSON responses.
   - Database operations (Prisma query calls) belong in dedicated **Controllers** to isolate data access logic.

3. **Domain Integrity**:
   - Do not let database schema modifications bleed directly into the client. Maintain clean adapters or data mapping transformations if formatting differs.
