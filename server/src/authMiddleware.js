import crypto from 'crypto';
import { prisma } from './db.js';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'opene8-governance-secret-key-1337')) {
  throw new Error('JWT_SECRET must be configured in production with a custom secure key.');
}
const SECRET = process.env.JWT_SECRET || 'opene8-governance-secret-key-1337';

// 1. Password Hashing via native PBKDF2
// NIST SP 800-63B compliant: 310,000 iterations, 32-byte salt, SHA-512
// Reference: https://pages.nist.gov/800-63-3/sp800-63b.html
const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_SALT_BYTES = 32;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';

export async function hashPassword(password) {
  const salt = crypto.randomBytes(PBKDF2_SALT_BYTES).toString('hex');
  const hash = await new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST, (err, key) =>
      err ? reject(err) : resolve(key.toString('hex'))
    )
  );
  return `${salt}:${hash}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    const verifyHash = await new Promise((resolve, reject) =>
      crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST, (err, key) =>
        err ? reject(err) : resolve(key.toString('hex'))
      )
    );
    
    // Constant-time comparison to prevent side-channel timing exploits
    // Reference: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
    const hashBuf = Buffer.from(hash, 'hex');
    const verifyBuf = Buffer.from(verifyHash, 'hex');
    if (hashBuf.length !== verifyBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, verifyBuf);
  } catch (err) {
    return false;
  }
}

// 2. Custom Signed Token generation (Stateless Native JWT)
export function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ 
    ...payload, 
    exp: Date.now() + 1000 * 60 * 60 * 24 // 24 Hours expiry
  })).toString('base64url');
  
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

const tokenBlacklist = new Set();

export function revokeToken(token) {
  tokenBlacklist.add(token);
}

export function verifyToken(token) {
  try {
    if (tokenBlacklist.has(token)) return null;

    const [header, body, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    
    // Constant-time signature comparison to mitigate timing attacks
    // Reference: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedSigBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expectedSigBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedSigBuf)) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null; // Token expired

    return payload;
  } catch (err) {
    return null;
  }
}

// 3. Express Authorization Middleware
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    // Bind authenticated user properties to the request context
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// 4. Role checking middleware
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access restricted. Requires roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}
