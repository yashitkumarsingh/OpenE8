## Description

Please include a summary of the change, the reasoning behind it, and which issue or requirement it addresses. 

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update (no code changes)

## QA Gate & Validation Checklist

Please verify the following guidelines are met before requesting review:

### Server & Engine Quality
- [ ] Backend test suite passes successfully (`npm test`).
- [ ] Statement and branch coverage is at or above **80%** (`npm run test:coverage`).
- [ ] All compliance calculations remain isolated in `server/src/maturityEngine.js`.

### Client & Build Quality
- [ ] Frontend compiles clean without any syntax or Rolldown errors (`npm run build:client`).
- [ ] User Interface adheres to the established glassmorphic theme styling rules in `client/src/index.css`.

### Security & Dependency Quality
- [ ] `npm audit` was executed and returns **zero vulnerabilities** for both client and server packages.
- [ ] No hardcoded secrets, test credentials, or development keys are present in this commit.

## Screenshots / Recording (if UI changes are made)

Please attach screenshots or recordings demonstrating the visual flow or interface adjustments.
