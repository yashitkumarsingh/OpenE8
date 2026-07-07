import crypto from 'crypto';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword, generateToken, revokeToken } from '../authMiddleware.js';
import { exchangeCodeForTokens, validateIdToken } from '../entraService.js';

export async function register(req, res) {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required registration parameters' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const rolesList = ['ASSESSOR', 'SYSTEM_OWNER', 'AUDITOR'];
    if (!rolesList.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role assigned.' });
    }

    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role.toUpperCase()
      }
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during registration workflow' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during login workflow' });
  }
}

export async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      revokeToken(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during logout workflow' });
  }
}

export async function getMe(req, res) {
  res.json({ user: req.user });
}

export async function loginWithEntra(req, res) {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokenResponse = await exchangeCodeForTokens(code, redirectUri);
    const decoded = await validateIdToken(tokenResponse.id_token);

    // Auto-provision user if they do not exist
    let user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) {
      const randomPass = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPass);
      user = await prisma.user.create({
        data: {
          email: decoded.email,
          passwordHash,
          name: decoded.name,
          role: 'AUDITOR' // Default role for auto-provisioned SSO users
        }
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during Entra ID authentication workflow' });
  }
}
