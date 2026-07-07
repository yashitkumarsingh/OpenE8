import { validateIdToken, exchangeCodeForTokens } from '../src/entraService.js';
import { loginWithEntra } from '../src/controllers/authController.js';
import { prisma } from '../src/db.js';
import crypto from 'crypto';

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
  const originalFetch = global.fetch;

  // Set up mock configuration variables
  process.env.ENTRA_CLIENT_ID = 'test-client-id';
  process.env.ENTRA_CLIENT_SECRET = 'test-client-secret';
  process.env.ENTRA_TENANT_ID = 'test-tenant-id';
  process.env.ENTRA_REDIRECT_URI = 'http://localhost:3000/auth/callback';

  // 1. Generate test RSA keypair for token signatures
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048
  });

  const jwk = publicKey.export({ format: 'jwk' });

  const validHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'mock-key-id' })).toString('base64url');
  const validPayload = Buffer.from(JSON.stringify({
    email: 'entra-sso@opene8.gov.au',
    name: 'Entra SSO User',
    tid: 'test-tenant-id',
    aud: 'test-client-id',
    iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');

  const dataToSign = `${validHeader}.${validPayload}`;
  const signature = crypto.sign('sha256', Buffer.from(dataToSign), privateKey).toString('base64url');
  const mockIdToken = `${validHeader}.${validPayload}.${signature}`;

  try {
    // Mock global fetch to handle both discovery keys and token exchange
    global.fetch = async (url, options) => {
      if (url.includes('/discovery/v2.0/keys')) {
        return {
          ok: true,
          json: async () => ({
            keys: [
              {
                ...jwk,
                kid: 'mock-key-id',
                use: 'sig'
              }
            ]
          })
        };
      }
      if (url.includes('/oauth2/v2.0/token')) {
        assert(url.includes('test-tenant-id'), 'fetch token contains tenant ID');
        assert(options.method === 'POST', 'fetch token uses POST');
        return {
          ok: true,
          json: async () => ({ id_token: mockIdToken, access_token: 'mock-access-token' })
        };
      }
      return { ok: false };
    };

    // 2. validateIdToken Unit Tests
    const decoded = await validateIdToken(mockIdToken);
    assert(decoded.email === 'entra-sso@opene8.gov.au', 'validateIdToken extracts email from claim');
    assert(decoded.name === 'Entra SSO User', 'validateIdToken extracts display name from claim');
    assert(decoded.tenantId === 'test-tenant-id', 'validateIdToken extracts tenant ID from claim');

    // Test invalid segments format
    try {
      await validateIdToken('invalid-token');
      assert(false, 'Should throw error for malformed token format');
    } catch (err) {
      assert(err.message.includes('Invalid ID Token format'), 'validateIdToken throws on invalid format');
    }

    // Test missing email claim
    const payloadNoEmail = Buffer.from(JSON.stringify({
      name: 'No Email User',
      tid: 'test-tenant-id',
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const dataNoEmail = `${validHeader}.${payloadNoEmail}`;
    const sigNoEmail = crypto.sign('sha256', Buffer.from(dataNoEmail), privateKey).toString('base64url');
    const tokenNoEmail = `${validHeader}.${payloadNoEmail}.${sigNoEmail}`;
    try {
      await validateIdToken(tokenNoEmail);
      assert(false, 'Should throw error when email claim is missing');
    } catch (err) {
      assert(err.message.includes('No email found'), 'validateIdToken throws error when email is missing');
    }

    // Test signature verification failure (tampered payload)
    const tamperedPayload = Buffer.from(JSON.stringify({
      email: 'hacker-sso@opene8.gov.au',
      name: 'Entra SSO User',
      tid: 'test-tenant-id',
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const tamperedToken = `${validHeader}.${tamperedPayload}.${signature}`;
    try {
      await validateIdToken(tamperedToken);
      assert(false, 'Should throw error on signature mismatch');
    } catch (err) {
      assert(err.message.includes('signature verification'), 'validateIdToken rejects tampered signature');
    }

    // Test audience mismatch
    const payloadBadAud = Buffer.from(JSON.stringify({
      email: 'entra-sso@opene8.gov.au',
      tid: 'test-tenant-id',
      aud: 'wrong-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const tokenBadAud = `${validHeader}.${payloadBadAud}.${crypto.sign('sha256', Buffer.from(`${validHeader}.${payloadBadAud}`), privateKey).toString('base64url')}`;
    try {
      await validateIdToken(tokenBadAud);
      assert(false, 'Should throw error on audience mismatch');
    } catch (err) {
      assert(err.message.includes('Audience mismatch'), 'validateIdToken rejects wrong audience');
    }

    // Test issuer mismatch
    const payloadBadIss = Buffer.from(JSON.stringify({
      email: 'entra-sso@opene8.gov.au',
      aud: 'test-client-id',
      iss: 'https://login.evil.com/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const tokenBadIss = `${validHeader}.${payloadBadIss}.${crypto.sign('sha256', Buffer.from(`${validHeader}.${payloadBadIss}`), privateKey).toString('base64url')}`;
    try {
      await validateIdToken(tokenBadIss);
      assert(false, 'Should throw error on issuer mismatch');
    } catch (err) {
      assert(err.message.includes('Issuer mismatch'), 'validateIdToken rejects wrong issuer');
    }

    // Test token expired
    const payloadExpired = Buffer.from(JSON.stringify({
      email: 'entra-sso@opene8.gov.au',
      tid: 'test-tenant-id',
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) - 600
    })).toString('base64url');
    const tokenExpired = `${validHeader}.${payloadExpired}.${crypto.sign('sha256', Buffer.from(`${validHeader}.${payloadExpired}`), privateKey).toString('base64url')}`;
    try {
      await validateIdToken(tokenExpired);
      assert(false, 'Should throw error on expired token');
    } catch (err) {
      assert(err.message.includes('Token is expired'), 'validateIdToken rejects expired token');
    }

    // Test token not active yet
    const payloadNotActive = Buffer.from(JSON.stringify({
      email: 'entra-sso@opene8.gov.au',
      tid: 'test-tenant-id',
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
      nbf: Math.floor(Date.now() / 1000) + 600
    })).toString('base64url');
    const tokenNotActive = `${validHeader}.${payloadNotActive}.${crypto.sign('sha256', Buffer.from(`${validHeader}.${payloadNotActive}`), privateKey).toString('base64url')}`;
    try {
      await validateIdToken(tokenNotActive);
      assert(false, 'Should throw error on inactive token');
    } catch (err) {
      assert(err.message.includes('Token is not active yet'), 'validateIdToken rejects inactive token');
    }

    // Test missing JWK key matching
    const headerBadKid = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'unknown-key-id' })).toString('base64url');
    const tokenBadKid = `${headerBadKid}.${validPayload}.${crypto.sign('sha256', Buffer.from(`${headerBadKid}.${validPayload}`), privateKey).toString('base64url')}`;
    try {
      await validateIdToken(tokenBadKid);
      assert(false, 'Should throw error on unknown kid');
    } catch (err) {
      assert(err.message.includes('No matching Microsoft Key ID found'), 'validateIdToken rejects unknown key ID');
    }

    // 3. exchangeCodeForTokens Configuration Check
    process.env.ENTRA_CLIENT_ID = '';
    try {
      await exchangeCodeForTokens('some-auth-code');
      assert(false, 'Should throw error if client ID is unconfigured');
    } catch (err) {
      assert(err.message.includes('configuration is missing'), 'exchangeCodeForTokens checks for client ID configuration');
    }
    process.env.ENTRA_CLIENT_ID = 'test-client-id';

    const tokens = await exchangeCodeForTokens('mock-code');
    assert(tokens.id_token === mockIdToken, 'exchangeCodeForTokens fetches tokens payload successfully');

    // 4. loginWithEntra Controller Test - Missing auth code
    const ctrlReqNoCode = { body: {} };
    const ctrlResNoCode = mockResponse();
    await loginWithEntra(ctrlReqNoCode, ctrlResNoCode);
    assert(ctrlResNoCode.statusCode === 400, 'loginWithEntra returns 400 for missing code');

    // 5. loginWithEntra Controller Test - Auto-provisioning flow
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

    // 6. loginWithEntra Controller Test - Match existing user flow
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
    global.fetch = originalFetch;
    console.error('Entra ID tests failed:', err);
    throw err;
  }
}
