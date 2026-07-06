# Contributing to OpenE8 Governance OS

Thank you for your interest in contributing to OpenE8! This guide outlines our architectural rules, coding standards, and repository setup to help you get started.

---

## 1. Architectural Boundaries

OpenE8 enforces a clean segregation of duties and software layers. You must respect the following boundaries when making changes:

* **Maturity Engine Decoupling**: All calculations related to maturity levels or target gaps must reside strictly inside [maturityEngine.js](server/src/maturityEngine.js) as pure, deterministic functions. Under no circumstances should maturity calculations be written directly inside database query files, controllers, or Express route handlers.
* **Delivery Independence**: Keep routers (`routes/`) strictly decoupled from query and business logic. Routing files must only parse endpoints/middlewares and delegate execution to the corresponding controller layer (`controllers/`).
* **Zero Heavy Dependencies**: Avoid adding heavy runtime dependencies unless explicitly approved. Prefer lightweight npm packages or native Node.js implementations.

---

## 2. Coding Conventions

* **JavaScript Modules (ESM)**: Use modern ES Modules (`import`/`export`) for both server and client modules. Do not mix with CommonJS (`require`).
* **Database Models**: All database models and schema adjustments must be defined in [schema.prisma](server/prisma/schema.prisma).
* **Frontend Design**: Do not inject arbitrary utility frameworks or Tailwind styles unless aligned with the existing glassmorphic styling conventions defined in [index.css](client/src/index.css). Ensure all interactive views support loading states and error boundaries.

---

## 3. Getting Started & Local Setup

### Server Setup
1. Navigate to the server folder: `cd server`
2. Install dependencies: `npm install`
3. Set up and seed the local SQLite database: `npm run db:setup`
4. Spin up the server: `npm start` (Runs on `http://localhost:5000`)

### Client Setup
1. Navigate to the client folder: `cd client`
2. Install dependencies: `npm install`
3. Spin up the dev server: `npm run dev`
4. Compile for production: `npm run build`

### Git Hooks & Pre-Commit Verification
1. Initialize Git (if not already done): `git init`
2. Install root dependencies to trigger Husky setup: `npm install`
3. This creates a pre-commit quality gate that automatically executes backend tests and client builds before allowing commits.

---

## 4. Testing & Code Quality Gates

Before submitting a Pull Request, ensure that all tests pass and that your changes do not violate our strict quality gates.

* **80% Backend Code Coverage**: All backend logic must maintain at least **80% statement and branch coverage** on the server.
* **Maturity Calculations Verification**: If you modify [maturityEngine.js](server/src/maturityEngine.js), immediately run `npm test` inside the `server/` directory to validate maturity engine compliance.
* **Vulnerability Audits**: Whenever updating packages, run `npm audit`. We enforce a strict **Zero Security Vulnerabilities** policy (including Low/Moderate warnings).

### Command Checklist

```bash
# Run backend test suite
cd server
npm test

# Run backend coverage analysis (must be >= 80%)
npm run test:coverage

# Audit dependencies for security vulnerabilities
npm audit
```

---

## 5. Pull Request Checklist

Before submitting a PR, verify:
- [ ] All unit and integration tests run and pass successfully.
- [ ] `npm run test:coverage` reports statement and branch coverage $\ge 80\%$.
- [ ] `npm audit` reports zero vulnerabilities in both client and server.
- [ ] Code adheres to the ESM modules convention.
- [ ] Client changes compile clean via `npm run build`.
