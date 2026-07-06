import { URLSearchParams } from 'url';

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

export function decodeIdToken(idToken) {
  if (!idToken) {
    throw new Error('ID Token is empty.');
  }
  const segments = idToken.split('.');
  if (segments.length !== 3) {
    throw new Error('Invalid ID Token format.');
  }
  try {
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
    const email = payload.email || payload.upn || payload.preferred_username;
    if (!email) {
      throw new Error('No email found in token claims.');
    }
    return {
      email,
      name: payload.name || 'Entra User',
      tenantId: payload.tid
    };
  } catch (err) {
    throw new Error(`Failed to decode Entra ID Token: ${err.message}`);
  }
}
