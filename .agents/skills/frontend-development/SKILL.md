---
name: frontend-development
description: Vite/React visual framework assembly, Tailwind CSS component design, and zero NPM package vulnerability requirements.
---
# Frontend Development Skill

## Overview
This skill guides the construction of responsive, high-performance, and secure user interfaces using React, Vite, and Tailwind CSS. It enforces strict compliance and security practices.

## Core Directives

### 1. Framework Assembly & ES Modules (ESM)
- Always use modern ES Module standard imports (`import`) and exports (`export`).
- Ensure code bundling remains lightweight and follows the bundler guidelines. Run production builds (`npm run build`) to verify there are no compilation warnings.

### 2. Dependency Audit & 0 Vulnerabilities Mandate
- **Mandatory Policy**: All NPM packages added to the client or server projects must have **0 vulnerabilities** (0 warnings of Low, Moderate, High, or Critical severity).
- Whenever adding a new package:
  1. Propose the package to the user.
  2. Run `npm install <package>`.
  3. Run `npm audit` immediately to inspect the package vulnerability tree.
  4. If any warning exists, run `npm audit fix --force` or remove the package. Do not check in packages with active vulnerabilities.

### 3. Glassmorphic Styling & Tailwinds Design System
- Utilize existing class themes defined in `client/src/index.css` (e.g. `glass-panel`, `glass-card`).
- Avoid introducing inline static style objects unless computing coordinates (such as SVG nodes positions).
- Support loading spinners and graceful empty states for all async actions.
