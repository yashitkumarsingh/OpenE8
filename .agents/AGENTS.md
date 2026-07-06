# Workspace Agent Rules

These rules govern the development, execution, and enhancement of the OpenE8 Governance OS workspace. Any AI developer agent or assistant loaded into this project must strictly adhere to these directives.

---

## 1. Core Architectural Boundaries

- **Maturity Calculation Separation**: Any calculation related to the maturity calculations or levels must reside in `server/src/maturityEngine.js`. Never embed maturity level calculations inside database queries or Express route handlers directly.
- **Delivery Independence**: Keep routers (`routes/`) separate from the database query logic (`controllers/`).
- **Zero Heavy Dependencies**: Avoid adding heavy runtime dependencies unless explicitly approved by the user. Prefer simple NPM utility packages if absolutely required.

---

## 2. Coding Conventions

- **JavaScript Modules (ESM)**: Use modern ES module imports/exports (`import`/`export`) for both server and client components. Do not mix with CommonJS (`require`).
- **Database Schema**: All database models must be defined in `server/prisma/schema.prisma`. After any modification to the schema, you must run `npm run db:setup` to sync the local SQLite database.
- **Frontend Design System**: Do not inject arbitrary utility frameworks or Tailwind styles unless aligned with the existing glassmorphic look-and-feel specified in `client/src/index.css`. All interactive views should support loading states and error boundaries.

---

## 3. Testing & Coverage Constraints

- **80% Code Coverage**: All backend logic must maintain at least **80% statement and branch coverage** on the server.
- **Coverage Checks**: Verify test coverage metrics by running `npm run test:coverage` before submitting code.
- Any changes to `maturityEngine.js` must be immediately validated by running `npm test`.
- Do not check in code with failing tests.
- When creating new features, append corresponding deterministic tests under `server/tests/`.

---

## 4. Dependency & Vulnerability Constraints

- **Zero Security Vulnerabilities**: All NPM packages added to either client or server must have **zero vulnerabilities**.
- **Mandatory Audits**: Whenever you run `npm install` or update any dependency, you **MUST** run `npm audit` immediately after. If any vulnerabilities (Low, Moderate, High, or Critical) are detected, you must fix them or remove/replace the package before submitting changes.
