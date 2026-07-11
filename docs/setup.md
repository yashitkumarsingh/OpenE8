# Developer Onboarding & Setup Manual

This guide describes the steps required to configure the development workspace, seed databases, verify package security, and execute coverage verification tests.

---

## 1. Prerequisites & Environment Paths

### Node.js Compatibility
- **Server and Client Environment**: Ensure Node.js version **v22.14.0** or newer is used (NVM can manage local version switches).
- **Environment Path Override**: In custom shells, prepend the NVM binaries paths:
  ```bash
  export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"
  ```

---

## 2. Workspace Initialization

Initialize and seed the local database:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup SQLite Database**:
   Runs the Prisma migration engine, pushes schemas to SQLite (`server/prisma/dev.db`), and seeds initial mock assessments (including control tests, exceptions, and evidence logs):
   ```bash
   npm run db:setup
   ```
3. **Launch Concurrently Dev Server**:
   Boots the Express API server (port 5001) and Vite client dev server (port 3000) concurrently:
   ```bash
   npm run dev
   ```

---

## 3. Dependency Security Auditing

OpenE8 enforces a strict **0 vulnerabilities policy** for all packages used in production and development:

- **Run Security Scan**:
  Scan both server and client package trees:
  ```bash
  # Audit server
  cd server && npm audit
  
  # Audit client
  cd client && npm audit
  ```
- **Handling Vulnerabilities**:
  - If a package warning is reported, utilize `npm audit fix` or add custom resolutions under the `"overrides"` key in the client/server `package.json` to enforce safe versions.
  - Do **not** commit package additions without resolving audits.

---

## 4. Test Verification & Code Coverage

OpenE8 maintains a target of **80% statement and branch code coverage** on all server controller endpoints, engines logic, and frontend components:

### Backend Testing (Server)
- **Run Unified Test Suite**:
  Executes all calculations tests and mock DB integration tests:
  ```bash
  npm test
  ```
- **Execute Coverage Report**:
  Runs `c8` analysis checks to print detailed file coverage metrics:
  ```bash
  npm run test:coverage
  ```

### Frontend Testing (Client)
- **Run Component Unit Tests**:
  Executes all Vitest unit tests inside the client workspace:
  ```bash
  cd client && npm run test
  ```
- **Execute Client Coverage Report**:
  Runs Vitest coverage analysis checks to print detailed client coverage metrics:
  ```bash
  cd client && npm run test:coverage
  ```

### End-to-End Integration Testing (Playwright)
- **Run Playwright Browser Journeys**:
  Executes full-lifecycle browser tests testing logins, scoping changes, exceptions additions, and dual sign-off locks:
  ```bash
  npm run test:e2e
  ```
