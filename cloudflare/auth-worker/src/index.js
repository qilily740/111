import nodemailer from 'nodemailer';
import { createAuth } from './auth.js';
import { discordMember } from './discord.js';
import { allowedOAuthReturnUrl, oauthReturnUrl } from './oauth-return.js';

const EMAIL_TTL_MS = 10 * 60 * 1000;
const TICKET_TTL_MS = 15 * 60 * 1000;
const MAX_EMAIL_ATTEMPTS = 5;
const EMAIL_PATTERN = /^[^\s@]{1,64}@qq\.com$/i;

function originAllowed(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : '';
}

function corsHeaders(request, env) {
  const origin = originAllowed(request, env);
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Expose-Headers': 'set-auth-token',
    'Cache-Control': 'no-store',
    Vary: 'Origin'
  });
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function json(request, env, body, status = 200) {
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [name, value] of corsHeaders(request, env)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64url(value) {
  const raw = String(value || '');
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(raw.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function randomToken(bytes = 32) {
  return base64url(randomBytes(bytes));
}

function randomSixDigitCode() {
  const ceiling = Math.floor(0x100000000 / 1_000_000) * 1_000_000;
  const sample = new Uint32Array(1);
  do { crypto.getRandomValues(sample); } while (sample[0] >= ceiling);
  return String(sample[0] % 1_000_000).padStart(6, '0');
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hmac(value, env) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.BETTER_AUTH_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function discordEncryptionKey(env) {
  if (!env.DISCORD_TOKEN_ENCRYPTION_KEY) throw new Error('discord_encryption_key_missing');
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.DISCORD_TOKEN_ENCRYPTION_KEY));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptDiscordSecret(value, env) {
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await discordEncryptionKey(env), new TextEncoder().encode(String(value)));
  return `${base64url(iv)}.${base64url(new Uint8Array(encrypted))}`;
}

async function decryptDiscordSecret(value, env) {
  const [encodedIv, encodedCiphertext] = String(value || '').split('.', 2);
  if (!encodedIv || !encodedCiphertext) throw new Error('discord_credential_invalid');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64url(encodedIv) },
    await discordEncryptionKey(env),
    fromBase64url(encodedCiphertext)
  );
  return new TextDecoder().decode(plaintext);
}

function constantTimeEqual(left, right) {
  const a = new TextEncoder().encode(String(left));
  const b = new TextEncoder().encode(String(right));
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) diff |= (a[index] || 0) ^ (b[index] || 0);
  return diff === 0;
}

async function rateLimit(env, name, value, limit, windowMs) {
  const key = await hmac(`${name}:${value}`, env);
  const now = Date.now();
  const row = await env.DB.prepare(`
    INSERT INTO rate_limits (limit_key, window_started_at, hit_count)
    VALUES (?, ?, 1)
    ON CONFLICT(limit_key) DO UPDATE SET
      hit_count = CASE WHEN window_started_at + ? <= ? THEN 1 ELSE hit_count + 1 END,
      window_started_at = CASE WHEN window_started_at + ? <= ? THEN ? ELSE window_started_at END
    RETURNING hit_count
  `).bind(key, now, windowMs, now, windowMs, now, now).first();
  return Number(row?.hit_count || 0) <= limit;
}

function clientAddress(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function frontendRedirect(env, fragment, returnUrl = '') {
  const target = new URL(oauthReturnUrl(env, returnUrl));
  target.hash = new URLSearchParams(fragment).toString();
  return Response.redirect(target.toString(), 302);
}

async function refreshDiscordCredentials(env, credentials) {
  if (Number(credentials.expiresAt) > Date.now() + 60_000) return credentials;
  const apiBase = String(env.DISCORD_API_BASE_URL || 'https://discord.com/api/v10').replace(/\/$/, '');
  const response = await fetch(`${apiBase}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken
    })
  });
  if (!response.ok) throw new Error('discord_refresh_failed');
  const token = await response.json();
  if (!token?.access_token || !token?.refresh_token) throw new Error('discord_refresh_invalid');
  return {
    accessToken: String(token.access_token),
    refreshToken: String(token.refresh_token),
    expiresAt: Date.now() + Math.max(60, Number(token.expires_in) || 0) * 1000
  };
}

async function checkDiscordCredentials(env, credentials) {
  try {
    const current = await refreshDiscordCredentials(env, credentials);
    return { ...(await discordMember(env, current.accessToken)), credentials: current };
  } catch (error) {
    console.warn(JSON.stringify({ event: 'discord_credential_check_failed', reason: String(error?.message || 'unknown').slice(0, 80) }));
    return { status: 'check_failed', httpStatus: 503, credentials };
  }
}

async function currentDiscordAccess(env, discordUserId, force = false) {
  const now = Date.now();
  const ttl = Math.max(60, Math.min(900, Number(env.DISCORD_ACCESS_TTL_SECONDS) || 600)) * 1000;
  if (!force) {
    const cached = await env.DB.prepare('SELECT status, checked_at FROM discord_access_cache WHERE discord_user_id = ? AND expires_at > ?')
      .bind(discordUserId, now).first();
    if (cached) return { status: cached.status, checkedAt: Number(cached.checked_at), httpStatus: cached.status === 'check_failed' ? 503 : 200 };
  }
  let result;
  try {
    const stored = await env.DB.prepare('SELECT access_token_enc, refresh_token_enc, access_expires_at FROM discord_credentials WHERE discord_user_id = ?')
      .bind(discordUserId).first();
    if (!stored) throw new Error('discord_credentials_missing');
    const credentials = {
      accessToken: await decryptDiscordSecret(stored.access_token_enc, env),
      refreshToken: await decryptDiscordSecret(stored.refresh_token_enc, env),
      expiresAt: Number(stored.access_expires_at)
    };
    result = await checkDiscordCredentials(env, credentials);
    if (result.status !== 'check_failed' && result.credentials.expiresAt !== credentials.expiresAt) {
      await env.DB.prepare('UPDATE discord_credentials SET access_token_enc = ?, refresh_token_enc = ?, access_expires_at = ?, updated_at = ? WHERE discord_user_id = ?')
        .bind(await encryptDiscordSecret(result.credentials.accessToken, env), await encryptDiscordSecret(result.credentials.refreshToken, env), result.credentials.expiresAt, now, discordUserId).run();
    }
  } catch {
    result = { status: 'check_failed', httpStatus: 503 };
  }
  const cacheTtl = result.status === 'check_failed' ? 30_000 : ttl;
  await env.DB.prepare(`
    INSERT INTO discord_access_cache (discord_user_id, status, checked_at, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(discord_user_id) DO UPDATE SET status = excluded.status, checked_at = excluded.checked_at, expires_at = excluded.expires_at
  `).bind(discordUserId, result.status, now, now + cacheTtl).run();
  await env.DB.prepare('UPDATE user SET discordAccessStatus = ?, discordAccessCheckedAt = ? WHERE discordUserId = ?')
    .bind(result.status, now, discordUserId).run();
  return { ...result, checkedAt: now };
}

async function checkAndUpdateRegistrationTicket(env, ticket) {
  const credentials = {
    accessToken: await decryptDiscordSecret(ticket.access_token_enc, env),
    refreshToken: await decryptDiscordSecret(ticket.refresh_token_enc, env),
    expiresAt: Number(ticket.access_expires_at)
  };
  const result = await checkDiscordCredentials(env, credentials);
  if (result.status === 'check_failed') return result;
  await env.DB.prepare('UPDATE registration_tickets SET access_token_enc = ?, refresh_token_enc = ?, access_expires_at = ? WHERE ticket_hash = ? AND consumed_at IS NULL')
    .bind(await encryptDiscordSecret(result.credentials.accessToken, env), await encryptDiscordSecret(result.credentials.refreshToken, env), result.credentials.expiresAt, ticket.ticket_hash).run();
  return result;
}

async function getSession(auth, request) {
  return auth.api.getSession({ headers: request.headers });
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username || '',
    email: user.email || '',
    discordAccessStatus: user.discordAccessStatus || 'unknown',
    discordAccessCheckedAt: user.discordAccessCheckedAt || null
  };
}

async function authorizeRequest(request, env) {
  const auth = createAuth(env);
  const session = await getSession(auth, request);
  if (!session?.user) return json(request, env, { error: 'UNAUTHORIZED' }, 401);
  if (!session.user.discordUserId) return json(request, env, { error: 'ACCOUNT_NOT_LINKED' }, 403);
  const access = await currentDiscordAccess(env, session.user.discordUserId);
  if (access.status === 'check_failed') return json(request, env, { error: 'DISCORD_CHECK_FAILED' }, 503);
  if (access.status !== 'active') {
    const code = access.status === 'not_in_guild' ? 'DISCORD_NOT_IN_GUILD' : 'DISCORD_REQUIRED_ROLE_MISSING';
    return json(request, env, { error: 'DISCORD_ACCESS_REVOKED', code }, 403);
  }
  return json(request, env, { ok: true, user: publicUser({ ...session.user, discordAccessStatus: 'active', discordAccessCheckedAt: access.checkedAt }) });
}

async function beginDiscordOAuth(request, env) {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_REDIRECT_URI) return json(request, env, { error: 'DISCORD_NOT_CONFIGURED' }, 503);
  const requestedReturnUrl = new URL(request.url).searchParams.get('return_to');
  const frontendUrl = requestedReturnUrl
    ? allowedOAuthReturnUrl(env, requestedReturnUrl)
    : oauthReturnUrl(env);
  if (!frontendUrl) return json(request, env, { error: 'FRONTEND_REDIRECT_NOT_ALLOWED' }, 400);
  if (!await rateLimit(env, 'discord-start-ip', clientAddress(request), 10, 60_000)) return json(request, env, { error: 'RATE_LIMITED' }, 429);
  const state = randomToken(32);
  const flowId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare('INSERT INTO registration_flows (id, state_hash, flow_nonce_hash, frontend_url, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(flowId, await sha256(state), await sha256(randomToken(24)), frontendUrl, now + 10 * 60_000, now).run();
  const authorize = new URL(env.DISCORD_OAUTH_AUTHORIZE_URL || 'https://discord.com/oauth2/authorize');
  authorize.search = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds.members.read',
    state
  }).toString();
  return Response.redirect(authorize.toString(), 302);
}

async function exchangeDiscordCode(code, env) {
  const apiBase = String(env.DISCORD_API_BASE_URL || 'https://discord.com/api/v10').replace(/\/$/, '');
  const response = await fetch(`${apiBase}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.DISCORD_REDIRECT_URI
    })
  });
  if (!response.ok) throw new Error('discord_oauth_failed');
  const token = await response.json();
  if (!token?.access_token || !token?.refresh_token || !String(token.scope || '').split(/\s+/).includes('guilds.members.read')) {
    throw new Error('discord_scope_or_token_missing');
  }
  const identityResponse = await fetch(`${apiBase}/users/@me`, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' }
  });
  if (!identityResponse.ok) throw new Error('discord_identity_failed');
  const identity = await identityResponse.json();
  if (!/^\d{17,20}$/.test(String(identity?.id || ''))) throw new Error('discord_identity_invalid');
  return {
    discordUserId: String(identity.id),
    credentials: {
      accessToken: String(token.access_token),
      refreshToken: String(token.refresh_token),
      expiresAt: Date.now() + Math.max(60, Number(token.expires_in) || 0) * 1000
    }
  };
}

async function finishDiscordOAuth(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  if (!state) return frontendRedirect(env, { auth: 'error', reason: 'oauth_failed' });
  const now = Date.now();
  const flow = await env.DB.prepare('SELECT id, frontend_url, expires_at, consumed_at FROM registration_flows WHERE state_hash = ?')
    .bind(await sha256(state)).first();
  const frontendUrl = oauthReturnUrl(env, flow?.frontend_url);
  if (!flow || flow.consumed_at || Number(flow.expires_at) <= now) {
    return frontendRedirect(env, { auth: 'error', reason: 'registration_expired' }, frontendUrl);
  }
  const consumed = await env.DB.prepare('UPDATE registration_flows SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL AND expires_at > ?')
    .bind(now, flow.id, now).run();
  if (Number(consumed.meta?.changes || 0) !== 1) return frontendRedirect(env, { auth: 'error', reason: 'registration_expired' }, frontendUrl);
  if (!code) return frontendRedirect(env, { auth: 'error', reason: 'oauth_failed' }, frontendUrl);

  try {
    const { discordUserId, credentials } = await exchangeDiscordCode(code, env);
    const existing = await env.DB.prepare('SELECT id FROM user WHERE discordUserId = ? LIMIT 1').bind(discordUserId).first();
    if (existing) return frontendRedirect(env, { auth: 'error', reason: 'discord_already_registered' }, frontendUrl);
    const access = await checkDiscordCredentials(env, credentials);
    if (access.status === 'check_failed') {
      console.warn(JSON.stringify({ event: 'discord_eligibility_check_failed', status: access.httpStatus || 503 }));
      return frontendRedirect(env, { auth: 'error', reason: 'discord_check_failed' }, frontendUrl);
    }
    if (access.status === 'not_in_guild') return frontendRedirect(env, { auth: 'error', reason: 'not_in_guild' }, frontendUrl);
    if (access.status !== 'active') return frontendRedirect(env, { auth: 'error', reason: 'required_role_missing' }, frontendUrl);
    const ticket = randomToken(32);
    await env.DB.prepare(`INSERT INTO registration_tickets (ticket_hash, flow_id, discord_user_id, access_token_enc, refresh_token_enc, access_expires_at, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(await sha256(ticket), flow.id, discordUserId,
        await encryptDiscordSecret(access.credentials.accessToken, env),
        await encryptDiscordSecret(access.credentials.refreshToken, env),
        access.credentials.expiresAt, Date.now() + TICKET_TTL_MS, Date.now()).run();
    return frontendRedirect(env, { auth: 'register', ticket }, frontendUrl);
  } catch (error) {
    console.error(JSON.stringify({ event: 'discord_oauth_callback_failed', errorType: error?.name || 'Error', reason: String(error?.message || 'unknown').slice(0, 80) }));
    return frontendRedirect(env, { auth: 'error', reason: 'discord_check_failed' }, frontendUrl);
  }
}

async function findEligibilityTicket(env, token) {
  if (!token) return null;
  return env.DB.prepare(`
    SELECT ticket_hash, flow_id, discord_user_id, access_token_enc, refresh_token_enc, access_expires_at, expires_at
    FROM registration_tickets
    WHERE ticket_hash = ? AND consumed_at IS NULL AND expires_at > ?
  `).bind(await sha256(token), Date.now()).first();
}

function mailTransport(env) {
  if (!env.QQ_SMTP_USER || !env.QQ_SMTP_AUTH_CODE) throw new Error('mail_not_configured');
  return nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: { user: env.QQ_SMTP_USER, pass: env.QQ_SMTP_AUTH_CODE },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000
  });
}

async function sendEmailCode(request, env) {
  const body = await readJson(request);
  const ticket = await findEligibilityTicket(env, String(body?.registrationTicket || ''));
  const email = String(body?.email || '').trim().toLowerCase();
  if (!ticket) return json(request, env, { error: 'REGISTRATION_TICKET_INVALID' }, 403);
  if (!EMAIL_PATTERN.test(email)) return json(request, env, { error: 'QQ_EMAIL_REQUIRED' }, 400);
  if (!env.QQ_SMTP_USER || !env.QQ_SMTP_AUTH_CODE) {
    return json(request, env, { error: 'EMAIL_SENDER_NOT_CONFIGURED' }, 503);
  }
  const access = await checkAndUpdateRegistrationTicket(env, ticket);
  if (access.status === 'check_failed') return json(request, env, { error: 'DISCORD_CHECK_FAILED' }, 503);
  if (access.status !== 'active') return json(request, env, { error: 'DISCORD_ACCESS_REVOKED' }, 403);
  if (!await rateLimit(env, 'email-send-ip', clientAddress(request), 5, 60 * 60_000)) return json(request, env, { error: 'RATE_LIMITED' }, 429);
  const emailKey = await hmac(`email:${email}`, env);
  if (!await rateLimit(env, 'email-send-address', emailKey, 5, 24 * 60 * 60_000)) return json(request, env, { error: 'RATE_LIMITED' }, 429);
  const recent = await env.DB.prepare('SELECT last_sent_at FROM email_challenges WHERE flow_id = ? AND email = ? ORDER BY created_at DESC LIMIT 1')
    .bind(ticket.flow_id, email).first();
  if (recent && Date.now() - Number(recent.last_sent_at) < 60_000) return json(request, env, { error: 'RATE_LIMITED' }, 429);

  const code = randomSixDigitCode();
  const now = Date.now();
  const challengeId = crypto.randomUUID();
  const digest = await hmac(`${ticket.flow_id}:${email}:${code}`, env);
  const transport = mailTransport(env);
  try {
    await transport.sendMail({
      from: env.QQ_SMTP_FROM || env.QQ_SMTP_USER,
      to: email,
      subject: '理想机注册验证码',
      text: `你的理想机注册验证码是 ${code}，10 分钟内有效。请勿转发给他人。`
    });
  } finally {
    transport.close();
  }
  await env.DB.batch([
    env.DB.prepare('UPDATE email_challenges SET consumed_at = ? WHERE flow_id = ? AND email = ? AND consumed_at IS NULL')
      .bind(now, ticket.flow_id, email),
    env.DB.prepare(`
      INSERT INTO email_challenges (id, flow_id, email, code_hash, attempts, expires_at, last_sent_at, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    `).bind(challengeId, ticket.flow_id, email, digest, now + EMAIL_TTL_MS, now, now)
  ]);
  return json(request, env, { ok: true, expiresIn: 600 });
}

async function verifyEmailCode(request, env) {
  const body = await readJson(request);
  const ticket = await findEligibilityTicket(env, String(body?.registrationTicket || ''));
  const email = String(body?.email || '').trim().toLowerCase();
  const code = String(body?.code || '').trim();
  if (!ticket) return json(request, env, { error: 'REGISTRATION_TICKET_INVALID' }, 403);
  if (!EMAIL_PATTERN.test(email) || !/^\d{6}$/.test(code)) return json(request, env, { error: 'EMAIL_CODE_INVALID' }, 400);
  if (!await rateLimit(env, 'email-verify-ip', clientAddress(request), 20, 60 * 60_000)) return json(request, env, { error: 'RATE_LIMITED' }, 429);
  const challenge = await env.DB.prepare(`
    SELECT id, code_hash, attempts, expires_at FROM email_challenges
    WHERE flow_id = ? AND email = ? AND consumed_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `).bind(ticket.flow_id, email).first();
  if (!challenge || Number(challenge.expires_at) <= Date.now() || Number(challenge.attempts) >= MAX_EMAIL_ATTEMPTS) {
    return json(request, env, { error: 'EMAIL_CODE_EXPIRED' }, 400);
  }
  if (!constantTimeEqual(challenge.code_hash, await hmac(`${ticket.flow_id}:${email}:${code}`, env))) {
    await env.DB.prepare('UPDATE email_challenges SET attempts = attempts + 1 WHERE id = ? AND consumed_at IS NULL')
      .bind(challenge.id).run();
    return json(request, env, { error: 'EMAIL_CODE_INVALID' }, 400);
  }
  const now = Date.now();
  const verificationTicket = randomToken(32);
  const consumed = await env.DB.prepare('UPDATE email_challenges SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL AND expires_at > ? AND attempts < ?')
    .bind(now, challenge.id, now, MAX_EMAIL_ATTEMPTS).run();
  if (Number(consumed.meta?.changes || 0) !== 1) return json(request, env, { error: 'EMAIL_CODE_EXPIRED' }, 400);
  await env.DB.prepare('INSERT INTO email_verification_tickets (ticket_hash, flow_id, email, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256(verificationTicket), ticket.flow_id, email, now + TICKET_TTL_MS, now).run();
  return json(request, env, { ok: true, emailVerificationTicket: verificationTicket, expiresIn: 900 });
}

async function registerAccount(request, env) {
  if (!await rateLimit(env, 'register-ip', clientAddress(request), 5, 60 * 60_000)) return json(request, env, { error: 'RATE_LIMITED' }, 429);
  const body = await readJson(request);
  const registrationToken = String(body?.registrationTicket || '');
  const emailToken = String(body?.emailVerificationTicket || '');
  const usernameValue = String(body?.username || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const passwordConfirmation = String(body?.passwordConfirmation || '');
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(usernameValue)) return json(request, env, { error: 'USERNAME_INVALID' }, 400);
  if (!EMAIL_PATTERN.test(email)) return json(request, env, { error: 'QQ_EMAIL_REQUIRED' }, 400);
  if (password.length < 12 || password.length > 128 || password !== passwordConfirmation) return json(request, env, { error: 'PASSWORD_INVALID' }, 400);
  const eligibility = await findEligibilityTicket(env, registrationToken);
  if (!eligibility) return json(request, env, { error: 'REGISTRATION_TICKET_INVALID' }, 403);
  const emailHash = await sha256(emailToken);
  const emailTicket = await env.DB.prepare(`
    SELECT ticket_hash, flow_id, email FROM email_verification_tickets
    WHERE ticket_hash = ? AND consumed_at IS NULL AND expires_at > ?
  `).bind(emailHash, Date.now()).first();
  if (!emailTicket || emailTicket.flow_id !== eligibility.flow_id || emailTicket.email !== email) {
    return json(request, env, { error: 'EMAIL_VERIFICATION_TICKET_INVALID' }, 403);
  }
  const access = await checkAndUpdateRegistrationTicket(env, eligibility);
  if (access.status === 'check_failed') return json(request, env, { error: 'DISCORD_CHECK_FAILED' }, 503);
  if (access.status !== 'active') return json(request, env, { error: 'DISCORD_ACCESS_REVOKED' }, 403);
  const bound = await env.DB.prepare('SELECT id FROM user WHERE discordUserId = ? LIMIT 1').bind(eligibility.discord_user_id).first();
  if (bound) return json(request, env, { error: 'DISCORD_ALREADY_REGISTERED' }, 409);

  const auth = createAuth(env, { allowRegistration: true });
  const origin = originAllowed(request, env) || String(env.ALLOWED_ORIGINS).split(',')[0].trim();
  const createRequest = new Request(`${env.AUTH_BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'User-Agent': request.headers.get('User-Agent') || '' },
    body: JSON.stringify({ email, name: usernameValue, username: usernameValue, password })
  });
  let created;
  try {
    created = await auth.handler(createRequest);
  } catch (error) {
    console.error(JSON.stringify({ event: 'registration_create_failed', errorType: error?.name || 'Error' }));
    return json(request, env, { error: 'REGISTRATION_FAILED' }, 400);
  }
  if (!created.ok) {
    let issue = {};
    try { issue = await created.json(); } catch {}
    const message = String(issue?.message || issue?.error || '');
    return json(request, env, { error: /already|exist|unique/i.test(message) ? 'USERNAME_OR_EMAIL_TAKEN' : 'REGISTRATION_FAILED' }, 400);
  }
  let payload = {};
  try { payload = await created.clone().json(); } catch {}
  const userId = String(payload?.user?.id || payload?.data?.user?.id || '');
  if (!userId) return json(request, env, { error: 'REGISTRATION_FAILED' }, 500);

  const now = Date.now();
  try {
    const results = await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO registration_claims (id, eligibility_ticket_hash, email_ticket_hash, discord_user_id, user_id, claimed_at)
        SELECT ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM registration_tickets WHERE ticket_hash = ? AND flow_id = ? AND discord_user_id = ? AND consumed_at IS NULL AND expires_at > ?)
          AND EXISTS (SELECT 1 FROM email_verification_tickets WHERE ticket_hash = ? AND flow_id = ? AND email = ? AND consumed_at IS NULL AND expires_at > ?)
      `).bind(crypto.randomUUID(), await sha256(registrationToken), emailHash, eligibility.discord_user_id, userId, now,
        await sha256(registrationToken), eligibility.flow_id, eligibility.discord_user_id, now,
        emailHash, eligibility.flow_id, email, now),
      env.DB.prepare(`UPDATE user SET emailVerified = 1, discordUserId = ?, discordAccessStatus = 'active', discordAccessCheckedAt = ?
        WHERE id = ? AND discordUserId IS NULL AND EXISTS (SELECT 1 FROM registration_claims WHERE user_id = ?)`)
        .bind(eligibility.discord_user_id, now, userId, userId),
      env.DB.prepare(`INSERT INTO discord_credentials (discord_user_id, user_id, access_token_enc, refresh_token_enc, access_expires_at, created_at, updated_at)
        SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM registration_claims WHERE user_id = ?)`)
        .bind(eligibility.discord_user_id, userId,
          await encryptDiscordSecret(access.credentials.accessToken, env),
          await encryptDiscordSecret(access.credentials.refreshToken, env),
          access.credentials.expiresAt, now, now, userId),
      env.DB.prepare(`UPDATE registration_tickets SET consumed_at = ? WHERE ticket_hash = ? AND consumed_at IS NULL AND EXISTS (SELECT 1 FROM registration_claims WHERE user_id = ?)`)
        .bind(now, await sha256(registrationToken), userId),
      env.DB.prepare(`UPDATE email_verification_tickets SET consumed_at = ? WHERE ticket_hash = ? AND consumed_at IS NULL AND EXISTS (SELECT 1 FROM registration_claims WHERE user_id = ?)`)
        .bind(now, emailHash, userId)
    ]);
    if ([0, 1, 2].some(index => Number(results[index]?.meta?.changes || 0) !== 1)) throw new Error('registration_claim_failed');
  } catch (error) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM discord_credentials WHERE user_id = ?').bind(userId),
      env.DB.prepare('DELETE FROM session WHERE userId = ?').bind(userId),
      env.DB.prepare('DELETE FROM account WHERE userId = ?').bind(userId),
      env.DB.prepare('DELETE FROM user WHERE id = ?').bind(userId)
    ]);
    console.error(JSON.stringify({ event: 'registration_claim_failed', errorType: error?.name || 'Error' }));
    return json(request, env, { error: 'REGISTRATION_TICKET_INVALID' }, 403);
  }
  return withCors(created, request, env);
}

async function login(request, env) {
  if (!await rateLimit(env, 'login-ip', clientAddress(request), 20, 15 * 60_000)) return json(request, env, { error: 'RATE_LIMITED' }, 429);
  let body = await readJson(request);
  if (!body || typeof body !== 'object') return json(request, env, { error: 'INVALID_REQUEST' }, 400);
  const usernameValue = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!usernameValue || !password) return json(request, env, { error: 'INVALID_CREDENTIALS' }, 401);
  if (!await rateLimit(env, 'login-name', usernameValue.toLowerCase(), 10, 15 * 60_000)) return json(request, env, { error: 'RATE_LIMITED' }, 429);
  const auth = createAuth(env);
  const origin = originAllowed(request, env) || String(env.ALLOWED_ORIGINS).split(',')[0].trim();
  const loginRequest = new Request(`${env.AUTH_BASE_URL}/api/auth/sign-in/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'User-Agent': request.headers.get('User-Agent') || '' },
    body: JSON.stringify({ username: usernameValue, password })
  });
  const response = await auth.handler(loginRequest);
  if (!response.ok) return json(request, env, { error: 'INVALID_CREDENTIALS' }, 401);
  const token = response.headers.get('set-auth-token');
  if (!token) return json(request, env, { error: 'AUTH_SERVICE_UNAVAILABLE' }, 503);
  const sessionRequest = new Request(request.url, { headers: { Authorization: `Bearer ${token}` } });
  const session = await getSession(auth, sessionRequest);
  if (!session?.user?.discordUserId) {
    await env.DB.prepare('DELETE FROM session WHERE token = ?').bind(token).run();
    return json(request, env, { error: 'INVALID_CREDENTIALS' }, 401);
  }
  const access = await currentDiscordAccess(env, session.user.discordUserId);
  if (access.status === 'check_failed') {
    await env.DB.prepare('DELETE FROM session WHERE token = ?').bind(token).run();
    return json(request, env, { error: 'DISCORD_CHECK_FAILED' }, 503);
  }
  if (access.status !== 'active') {
    const code = access.status === 'not_in_guild' ? 'DISCORD_NOT_IN_GUILD' : 'DISCORD_REQUIRED_ROLE_MISSING';
    await env.DB.prepare('DELETE FROM session WHERE token = ?').bind(token).run();
    return json(request, env, { error: 'DISCORD_ACCESS_REVOKED', code }, 403);
  }
  return withCors(response, request, env);
}

async function sessionStatus(request, env) {
  const auth = createAuth(env);
  const session = await getSession(auth, request);
  if (!session?.user) return json(request, env, { error: 'UNAUTHORIZED' }, 401);
  if (!session.user.discordUserId) return json(request, env, { error: 'ACCOUNT_NOT_LINKED' }, 403);
  const access = await currentDiscordAccess(env, session.user.discordUserId);
  if (access.status === 'check_failed') return json(request, env, { error: 'DISCORD_CHECK_FAILED' }, 503);
  if (access.status !== 'active') {
    return json(request, env, { error: 'DISCORD_ACCESS_REVOKED', code: access.status === 'not_in_guild' ? 'DISCORD_NOT_IN_GUILD' : 'DISCORD_REQUIRED_ROLE_MISSING' }, 403);
  }
  return json(request, env, { ok: true, user: publicUser({ ...session.user, discordAccessStatus: 'active', discordAccessCheckedAt: access.checkedAt }) });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/health' && request.method === 'GET') return json(request, env, { ok: true, service: 'ideal-machine-auth' });
      if (url.pathname === '/auth/discord/start' && request.method === 'GET') return await beginDiscordOAuth(request, env);
      if (url.pathname === '/auth/discord/callback' && request.method === 'GET') return await finishDiscordOAuth(request, env);
      if (url.pathname === '/auth/email/send' && request.method === 'POST') return await sendEmailCode(request, env);
      if (url.pathname === '/auth/email/verify' && request.method === 'POST') return await verifyEmailCode(request, env);
      if (url.pathname === '/auth/register' && request.method === 'POST') return await registerAccount(request, env);
      if (url.pathname === '/auth/login' && request.method === 'POST') return await login(request, env);
      if ((url.pathname === '/auth/session' && request.method === 'GET') || (url.pathname === '/auth/authorize' && request.method === 'POST')) {
        return await authorizeRequest(request, env);
      }
      if (url.pathname === '/api/auth/sign-in/username') return await login(request, env);
      if (url.pathname === '/api/auth/sign-up/email') return json(request, env, { error: 'REGISTRATION_FLOW_REQUIRED' }, 403);
      if (url.pathname.startsWith('/api/auth/')) {
        const auth = createAuth(env);
        return withCors(await auth.handler(request), request, env);
      }
      return json(request, env, { error: 'NOT_FOUND' }, 404);
    } catch (error) {
      console.error(JSON.stringify({ event: 'auth_request_failed', errorType: error?.name || 'Error' }));
      return json(request, env, { error: 'AUTH_SERVICE_UNAVAILABLE' }, 503);
    }
  },

  async scheduled(_controller, env) {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM registration_flows WHERE expires_at < ?').bind(now - 24 * 60 * 60_000),
      env.DB.prepare('DELETE FROM registration_tickets WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM email_challenges WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM email_verification_tickets WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM discord_access_cache WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM rate_limits WHERE window_started_at < ?').bind(now - 24 * 60 * 60_000)
    ]);
  }
};
