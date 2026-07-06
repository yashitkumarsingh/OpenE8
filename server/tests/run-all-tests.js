import { runControllerTests } from './controllers.test.js';
import { runImporterTests } from './importers.test.js';
import { runAuthTests } from './auth.test.js';
import { runEntraTests } from './entra.test.js';

console.log('--- STARTING ALL TEST SUITES ---');

async function main() {
  try {
    // 1. Run Maturity Engine tests (runs on load)
    await import('./maturity.test.js');

    // 2. Run Authentication & RBAC tests
    await runAuthTests();

    // 2.5 Run Microsoft Entra ID OIDC Integration tests
    await runEntraTests();
    
    // 3. Run Controller Integration tests (runs on explicit invocation)
    await runControllerTests();
    
    // 4. Run Importer Tests (runs on explicit invocation)
    await runImporterTests();
    
    console.log('--- ALL TEST SUITES CONCLUDED ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

main();
