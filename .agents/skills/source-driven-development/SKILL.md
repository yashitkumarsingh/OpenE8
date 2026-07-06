---
name: source-driven-development
description: Grounds implementation patterns in official runtime and library documentation to ensure modern, compliant, and vulnerability-free code. Use when writing framework-specific constructs, database access models, or web APIs.
---

# Source-Driven Development (SDD)

Source-Driven Development is the practice of validating framework and library syntax directly against official specifications and documentation before writing code. Memorized API shapes go stale, dependencies evolve, and outdated code patterns introduce vulnerabilities or compatibility issues. SDD ensures that every implementation traces back to an authoritative, version-matched reference.

---

## 1. When to Apply SDD

Apply this skill when:
- **Framework Mechanics**: Implementing state hooks, routing layers, or component structures in React/Vite.
- **Database/ORM Interfaces**: Writing queries, models, or transactions using Prisma ORM.
- **Runtime Core Functions**: Accessing native APIs (e.g., PBKDF2/HMAC crypto modules in Node.js).
- **Styling Protocols**: Applying utility tokens or stylesheet structures.

**Do NOT apply when:**
- Working on vanilla JavaScript logic (conditionals, arrays iterations, standard math).
- Performing mechanical directory moves, line renames, or comments formatting.

---

## 2. The SDD Lifecycle

```text
  [ 1. DETECT ]  ---> Extract precise package versions from package.json or system runtime.
        │
        ▼
   [ 2. FETCH ]  ---> Query official documentation portals (React.dev, Prisma.io, Nodejs.org).
        │
        ▼
  [ 3. ALIGN ]   ---> Code using version-matched APIs, avoiding obsolete or deprecated structures.
        │
        ▼
   [ 4. CITE ]   ---> Document code changes with official markdown source links.
```

### Step 1: Detect Stack & Version
Before drafting code, inspect package logs to isolate the target engine environment:
- **Node.js**: Check the active runtime environment.
- **Client Libraries**: Open `client/package.json` to confirm React and Tailwind build versions.
- **ORM Interfaces**: Check `server/package.json` for the exact Prisma setup.

### Step 2: Query Authoritative Sources
Consult references in order of strict compliance priority:
1. **Primary Documentation**: Official API references (e.g., `react.dev/reference/react`, `prisma.io/docs`).
2. **Release Changelogs**: Verified migration logs detailing breaking changes.
3. **Web Standards Specifications**: Authoritative documentation sources (e.g., MDN, HTML/CSS specifications).

*Prohibited Sources (Do NOT use as primary authorities)*:
- Unverified technical articles, blog posts, or community threads.
- Confidently generated AI API guesses.
- Stale memory assumptions.

### Step 3: Implement & Align
Write code targeting the exact version detected. Avoid implementing deprecated polyfills or wrapper libraries when cleaner, native features exist in the current runtime version.

### Step 4: Cite Your Sources
Include a comment in the file linking to the official documentation page followed. This enables future AI agents and reviewers to quickly verify that the API shape is correct.

*Example*:
```javascript
// Verification flow matches React 19 state transitions
// Reference: https://react.dev/reference/react/useState
const [token, setToken] = useState('');
```
