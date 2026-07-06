import { decodeIdToken, exchangeCodeForTokens } from '../src/entraService.js';
import { loginWithEntra } from '../src/controllers/authController.js';
import { prisma } from '../src/db.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

function mockResponse() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

export async function runEntraTests() {
  console.log('\nRunning Entra ID OIDC Service & Controller Tests...');

  try {
    // 1. decodeIdToken Unit Tests
    const validHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const validPayload = Buffer.from(JSON.stringify({
      email: 'entra-sso@opene8.gov.au',
      name: 'Entra SSO User',
      tid: 'microsoft-tenant-id'
    })).toString('base64url');
    const mockIdToken = `${validHeader}.${validPayload}.mocksignature`;

    const decoded = decodeIdToken(mockIdToken);
    assert(decoded.email === 'entra-sso@opene8.gov.au', 'decodeIdToken extracts email from claim');
    assert(decoded.name === 'Entra SSO User', 'decodeIdToken extracts display name from claim');
    assert(decoded.tenantId === 'microsoft-tenant-id', 'decodeIdToken extracts tenant ID from claim');

    // Test invalid segments
    try {
      decodeIdToken('invalid-token');
      assert(false, 'Should throw error for malformed token format');
    } catch (err) {
      assert(err.message.includes('Invalid ID Token format'), 'decodeIdToken throws on invalid format');
    }

    // Test missing email claim
    const payloadNoEmail = Buffer.from(JSON.stringify({
      name: 'No Email User',
      tid: 'tenant-id'
    })).toString('base64url');
    const tokenNoEmail = `${validHeader}.${payloadNoEmail}.mocksignature`;
    try {
      decodeIdToken(tokenNoEmail);
      assert(false, 'Should throw error when email claim is missing');
    } catch (err) {
      assert(err.message.includes('No email found'), 'decodeIdToken throws error when email is missing');
    }

    // 2. exchangeCodeForTokens Configuration Check
    process.env.ENTRA_CLIENT_ID = '';
    try {
      await exchangeCodeForTokens('some-auth-code');
      assert(false, 'Should throw error if client ID is unconfigured');
    } catch (err) {
      assert(err.message.includes('configuration is missing'), 'exchangeCodeForTokens checks for client ID configuration');
    }

    // Restore environment values for tests
    process.env.ENTRA_CLIENT_ID = 'test-client-id';
    process.env.ENTRA_CLIENT_SECRET = 'test-client-secret';
    process.env.ENTRA_TENANT_ID = 'test-tenant-id';
    process.env.ENTRA_REDIRECT_URI = 'http://localhost:3000/auth/callback';

    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      assert(url.includes('test-tenant-id'), 'fetch target url contains configured tenant ID');
      assert(options.method === 'POST', 'fetch target method is POST');
      assert(options.headers['Content-Type'].includes('x-www-form-urlencoded'), 'headers content type is form-urlencoded');
      return {
        ok: true,
        json: async () => ({ id_token: mockIdToken, access_token: 'mock-access-token' })
      };
    };

    const tokens = await exchangeCodeForTokens('mock-code');
    assert(tokens.id_token === mockIdToken, 'exchangeCodeForTokens fetches tokens payload successfully');

    // 3. loginWithEntra Controller Test - Missing auth code
    const ctrlReqNoCode = { body: {} };
    const ctrlResNoCode = mockResponse();
    await loginWithEntra(ctrlReqNoCode, ctrlResNoCode);
    assert(ctrlResNoCode.statusCode === 400, 'loginWithEntra returns 400 for missing code');

    // 4. loginWithEntra Controller Test - Auto-provisioning flow
    const ctrlReqValid = { body: { code: 'mock-code' } };
    const ctrlResValid = mockResponse();
    await loginWithEntra(ctrlReqValid, ctrlResValid);
    assert(ctrlResValid.statusCode === 200, 'loginWithEntra returns 200 on successful OIDC flow');
    assert(ctrlResValid.body.token !== undefined, 'loginWithEntra response body contains local auth token');
    assert(ctrlResValid.body.user.email === 'entra-sso@opene8.gov.au', 'provisioned user profile contains token email');
    assert(ctrlResValid.body.user.role === 'AUDITOR', 'auto-provisioned user defaults to AUDITOR role');

    // Verify user is provisioned in the database
    const dbUser = await prisma.user.findUnique({ where: { email: 'entra-sso@opene8.gov.au' } });
    assert(dbUser !== null, 'SSO user record auto-created in database successfully');

    // 5. loginWithEntra Controller Test - Match existing user flow
    // Change provisioned user's role to SYSTEM_OWNER to test that existing users keep their roles
    await prisma.user.update({
      where: { email: 'entra-sso@opene8.gov.au' },
      data: { role: 'SYSTEM_OWNER' }
    });

    const ctrlResExisting = mockResponse();
    await loginWithEntra(ctrlReqValid, ctrlResExisting);
    assert(ctrlResExisting.statusCode === 200, 'loginWithEntra matches existing users');
    assert(ctrlResExisting.body.user.role === 'SYSTEM_OWNER', 'existing SSO users retain their database roles');

    // Cleanup and restore
    await prisma.user.delete({ where: { email: 'entra-sso@opene8.gov.au' } });
    global.fetch = originalFetch;

    console.log('All Entra ID OIDC Tests passed successfully!');
  } catch (err) {
    console.error('Entra ID tests failed:', err);
    throw err;
  }
}
