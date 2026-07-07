import crypto from 'crypto';
import { URLSearchParams } from 'url';

// Cache Microsoft public keys in memory to minimize latency & network roundtrips
let cachedKeys = null;
let cacheExpiry = 0;

async function fetchMicrosoftKeys(tenantId) {
  if (cachedKeys && Date.now() < cacheExpiry) {
    return cachedKeys;
  }
  const tid = tenantId || 'common';
  const response = await fetch(`https://login.microsoftonline.com/${tid}/discovery/v2.0/keys`);
  if (!response.ok) {
    throw new Error('Failed to retrieve Microsoft OIDC public keys.');
  }
  const data = await response.json();
  cachedKeys = data.keys;
  cacheExpiry = Date.now() + 1000 * 60 * 60 * 24; // Cache for 24 hours
  return cachedKeys;
}

export async function exchangeCodeForTokens(code, redirectUri) {
  const tenantId = process.env.ENTRA_TENANT_ID || 'common';
  const clientId = process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;
  const targetRedirectUri = redirectUri || process.env.ENTRA_REDIRECT_URI;

  if (!clientId) {
    throw new Error('ENTRA_CLIENT_ID configuration is missing.');
  }

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }
  params.append('code', code);
  params.append('redirect_uri', targetRedirectUri);
  params.append('grant_type', 'authorization_code');

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Entra ID token exchange failed: ${errorText}`);
  }

  return response.json();
}

export async function validateIdToken(idToken) {
  if (!idToken) {
    throw new Error('ID Token is empty.');
  }
  const segments = idToken.split('.');
  if (segments.length !== 3) {
    throw new Error('Invalid ID Token format.');
  }

  const [headerB64, payloadB64, signatureB64] = segments;
  let header, payload;
  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch (err) {
    throw new Error('Failed to parse token segments.');
  }

  // 1. Validate claims
  const clientId = process.env.ENTRA_CLIENT_ID;
  if (!clientId) {
    throw new Error('ENTRA_CLIENT_ID configuration is missing.');
  }
  if (payload.aud !== clientId) {
    throw new Error(`Audience mismatch. Expected: ${clientId}, Got: ${payload.aud}`);
  }

  const tid = payload.tid || 'common';
  const expectedIssuer = `https://login.microsoftonline.com/${tid}/v2.0`;
  if (payload.iss !== expectedIssuer && payload.iss !== `https://login.microsoftonline.com/common/v2.0` && !payload.iss.includes(tid)) {
    throw new Error(`Issuer mismatch. Got: ${payload.iss}`);
  }

  // Expiry & Clock skew (5 min leeway)
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp + 300) {
    throw new Error('Token is expired.');
  }
  if (payload.nbf && now < payload.nbf - 300) {
    throw new Error('Token is not active yet.');
  }

  // 2. Validate Signature using dynamic JWK public key conversion
  const keys = await fetchMicrosoftKeys(tid);
  const matchingKey = keys.find(k => k.kid === header.kid);
  if (!matchingKey) {
    throw new Error('No matching Microsoft Key ID found for validation.');
  }

  let publicKey;
  try {
    publicKey = crypto.createPublicKey({
      format: 'jwk',
      key: matchingKey
    });
  } catch (err) {
    throw new Error(`Failed to import public key JWK: ${err.message}`);
  }

  const dataToVerify = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(signatureB64, 'base64url');

  const verified = crypto.verify('sha256', Buffer.from(dataToVerify), publicKey, signature);
  if (!verified) {
    throw new Error('Invalid token signature verification.');
  }

  const email = payload.email || payload.upn || payload.preferred_username;
  if (!email) {
    throw new Error('No email found in token claims.');
  }

  return {
    email,
    name: payload.name || 'Entra User',
    tenantId: tid
  };
}
