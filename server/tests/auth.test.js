import { hashPassword, verifyPassword, generateToken, verifyToken, requireAuth, requireRole } from '../src/authMiddleware.js';
import { register, login, logout } from '../src/controllers/authController.js';
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

export async function runAuthTests() {
  console.log('\nRunning Authentication & RBAC Tests...');

  try {
    // 1. Password Hashing & Verification unit tests
    const pass = 'SuperSecret123';
    const hashed = await hashPassword(pass);
    assert(hashed !== pass, 'Hash should not match raw password');
    assert(hashed.includes(':'), 'Hash structure must contain salt separator');
    assert(await verifyPassword(pass, hashed) === true, 'Valid password verification must pass');
    assert(await verifyPassword('wrongpass', hashed) === false, 'Invalid password verification must fail');

    // 2. Token Generation & Verification unit tests
    const payload = { id: 'u-1', email: 'test@opene8.gov.au', name: 'Tester', role: 'ASSESSOR' };
    const token = generateToken(payload);
    assert(token.split('.').length === 3, 'Signed token must contain header, body, and signature segments');
    
    const decoded = verifyToken(token);
    assert(decoded !== null, 'Token verification must succeed for unexpired, signed tokens');
    assert(decoded.email === payload.email, 'Decoded email should match payload');
    assert(decoded.role === payload.role, 'Decoded role should match payload');

    const invalidDecoded = verifyToken('invalid.token.signature');
    assert(invalidDecoded === null, 'Malformed tokens must fail validation');

    // 3. Register controller validation
    const randEmail = `user-${Date.now()}@opene8.gov.au`;
    const regReq = {
      body: {
        email: randEmail,
        password: 'Password123',
        name: 'Register User',
        role: 'SYSTEM_OWNER'
      }
    };
    const regRes = mockResponse();
    await register(regReq, regRes);
    assert(regRes.statusCode === 201, 'Signup endpoint should return status 201');
    assert(regRes.body.email === randEmail, 'Returned email should match registration inputs');
    assert(regRes.body.role === 'SYSTEM_OWNER', 'Returned role should match input');

    // Test duplicate registration error
    const dupRes = mockResponse();
    await register(regReq, dupRes);
    assert(dupRes.statusCode === 400, 'Duplicate registrations should trigger Bad Request 400');

    // 4. Login controller validation
    const loginReq = {
      body: {
        email: randEmail,
        password: 'Password123'
      }
    };
    const loginRes = mockResponse();
    await login(loginReq, loginRes);
    assert(loginRes.statusCode === 200, 'Login endpoint should return status 200');
    assert(loginRes.body.token !== undefined, 'Login should return a valid authentication token');
    assert(loginRes.body.user.role === 'SYSTEM_OWNER', 'Logged in user role metadata must match');

    // Test login fail
    const badLoginReq = {
      body: {
        email: randEmail,
        password: 'wrongpassword'
      }
    };
    const badLoginRes = mockResponse();
    await login(badLoginReq, badLoginRes);
    assert(badLoginRes.statusCode === 401, 'Login with wrong password should fail with status 401');

    // 5. RequireAuth Middleware validation
    const authReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    let nextCalled = false;
    const authRes = mockResponse();
    await requireAuth(authReq, authRes, () => { nextCalled = true; });
    assert(nextCalled === true, 'Valid Bearer token should trigger next() middleware step');
    assert(authReq.user.role === 'ASSESSOR', 'User payload should be attached to request context');

    // Test Auth Middleware block
    const badAuthReq = { headers: { authorization: 'Bearer invalid.token' } };
    let badNextCalled = false;
    const badAuthRes = mockResponse();
    await requireAuth(badAuthReq, badAuthRes, () => { badNextCalled = true; });
    assert(badNextCalled === false, 'Invalid Bearer token must block route access');
    assert(badAuthRes.statusCode === 401, 'Invalid Bearer token should return status 401');

    // 6. RequireRole Middleware validation
    const roleReq = {
      user: { role: 'SYSTEM_OWNER' }
    };
    let roleNext = false;
    const roleRes = mockResponse();
    const middleware = requireRole(['ASSESSOR', 'SYSTEM_OWNER']);
    middleware(roleReq, roleRes, () => { roleNext = true; });
    assert(roleNext === true, 'Authorized role list must trigger next()');

    let blockNext = false;
    const blockRes = mockResponse();
    const strictMiddleware = requireRole(['ASSESSOR']);
    strictMiddleware(roleReq, blockRes, () => { blockNext = true; });
    assert(blockNext === false, 'Unauthorized role list must block execution');
    assert(blockRes.statusCode === 403, 'Unauthorized role should return status 403 Forbidden');

    // === EXTRA COVERAGE BOOSTER FOR AUTH CONTROLLER & MIDDLEWARE ===

    // Test verifyPassword Error Catch Block
    const verifyPassCatchResult = await verifyPassword('pass', null);
    assert(verifyPassCatchResult === false, 'verifyPassword should return false on exception');

    // Test verifyToken Catch Block
    const verifyTokenCatch = verifyToken(null);
    assert(verifyTokenCatch === null, 'verifyToken should return null on null token');

    // Test requireAuth - Missing Auth Header
    const authReqHeaderMissing = { headers: {} };
    const resHeaderMissing = mockResponse();
    await requireAuth(authReqHeaderMissing, resHeaderMissing, () => {});
    assert(resHeaderMissing.statusCode === 401, 'requireAuth should return 401 when Authorization header is missing');

    // Test requireAuth - Malformed Auth Header (not starting with Bearer)
    const authReqMalformed = { headers: { authorization: 'Basic dGVzdDp0ZXN0' } };
    const resMalformed = mockResponse();
    await requireAuth(authReqMalformed, resMalformed, () => {});
    assert(resMalformed.statusCode === 401, 'requireAuth should return 401 when Authorization header is malformed');

    // Test requireAuth - Invalid Decoded Token
    const authReqInvalidToken = { headers: { authorization: 'Bearer malformed.jwt.signature' } };
    const resInvalidToken = mockResponse();
    await requireAuth(authReqInvalidToken, resInvalidToken, () => {});
    assert(resInvalidToken.statusCode === 401, 'requireAuth should return 401 when token validation fails');

    // Test requireAuth - Throwing Exception
    const resAuthException = mockResponse();
    await requireAuth(null, resAuthException, () => {});
    assert(resAuthException.statusCode === 401, 'requireAuth should return 401 on middleware exception');

    // Test requireRole - Missing req.user
    const roleReqMissingUser = {};
    const resRoleMissingUser = mockResponse();
    const middlewareMissingUser = requireRole(['ASSESSOR']);
    middlewareMissingUser(roleReqMissingUser, resRoleMissingUser, () => {});
    assert(resRoleMissingUser.statusCode === 401, 'requireRole should return 401 if user payload is missing');

    // Test register controller - Missing Parameters
    const regReqMissing = { body: {} };
    const regResMissing = mockResponse();
    await register(regReqMissing, regResMissing);
    assert(regResMissing.statusCode === 400, 'register should return 400 on missing parameters');

    // Test register controller - Invalid Role
    // Test register controller - Invalid Role (using valid length password)
    const regReqBadRole = { body: { email: 'badrole@opene8.gov.au', password: 'Password123', name: 'Tester', role: 'SUPERMAN' } };
    const regResBadRole = mockResponse();
    await register(regReqBadRole, regResBadRole);
    assert(regResBadRole.statusCode === 400, 'register should return 400 on invalid role');

    // Test register controller - Short Password
    const regReqShortPass = { body: { email: 'shortpass@opene8.gov.au', password: '123', name: 'Tester', role: 'SYSTEM_OWNER' } };
    const regResShortPass = mockResponse();
    await register(regReqShortPass, regResShortPass);
    assert(regResShortPass.statusCode === 400 && regResShortPass.body.error.includes('at least 8 characters'), 'register should return 400 and password warning on short password');

    // Test register controller - Catch Block
    const regResException = mockResponse();
    await register(null, regResException);
    assert(regResException.statusCode === 500 && regResException.body.error.includes('Internal server error'), 'register catch block should return 500 with generic message');

    // Test login controller - Missing Parameters
    const loginReqMissing = { body: {} };
    const loginResMissing = mockResponse();
    await login(loginReqMissing, loginResMissing);
    assert(loginResMissing.statusCode === 400, 'login should return 400 on missing parameters');

    // Test login controller - Non-existing User
    const loginReqNotExists = { body: { email: 'doesnotexist@opene8.gov.au', password: 'Password123' } };
    const loginResNotExists = mockResponse();
    await login(loginReqNotExists, loginResNotExists);
    assert(loginResNotExists.statusCode === 401, 'login should return 401 for non-existing email');

    // Test login controller - Catch Block
    const loginResException = mockResponse();
    await login(null, loginResException);
    assert(loginResException.statusCode === 500 && loginResException.body.error.includes('Internal server error'), 'login catch block should return 500 with generic message');

    // Test logout and token blacklisting
    const logoutReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const logoutRes = mockResponse();
    await logout(logoutReq, logoutRes);
    assert(logoutRes.statusCode === 200, 'logout should return 200 OK');

    const authReqBlacklisted = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const authResBlacklisted = mockResponse();
    let blacklistedNextCalled = false;
    await requireAuth(authReqBlacklisted, authResBlacklisted, () => { blacklistedNextCalled = true; });
    assert(blacklistedNextCalled === false, 'RequireAuth should block blacklisted tokens');
    assert(authResBlacklisted.statusCode === 401, 'Blacklisted token request returns 401 unauthorized');

    // Cleanup test registration
    await prisma.user.delete({ where: { email: randEmail } });
    console.log('All Authentication & RBAC Tests passed successfully!');
  } catch (err) {
    console.error('Auth Tests failed:', err);
    throw err;
  }
}
