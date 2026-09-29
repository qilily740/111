import { betterAuth } from 'better-auth';
import { bearer, username } from 'better-auth/plugins';

export function createAuth(env, { allowRegistration = false } = {}) {
  const origins = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (!env.DB || !env.BETTER_AUTH_SECRET || !env.AUTH_BASE_URL || origins.length === 0) {
    throw new Error('Auth Worker 未完成基础配置');
  }

  return betterAuth({
    appName: '理想机',
    baseURL: env.AUTH_BASE_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: origins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128
    },
    user: {
      additionalFields: {
        discordUserId: { type: 'string', required: false, unique: true, input: false },
        discordAccessStatus: { type: 'string', required: false, defaultValue: 'unknown', input: false },
        discordAccessCheckedAt: { type: 'number', required: false, input: false }
      }
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 6,
      cookieCache: { enabled: false }
    },
    disabledPaths: [
      ...(!allowRegistration ? ['/sign-up/email'] : []),
      '/sign-in/email',
      '/update-user',
      '/delete-user',
      '/change-password',
      '/forget-password',
      '/reset-password',
      '/send-verification-email',
      '/verify-email'
    ],
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 32,
        immutableUsername: true,
        displayUsername: false,
        usernameNormalization: value => value.toLowerCase(),
        usernameValidator: value => /^[a-zA-Z0-9._-]{3,32}$/.test(value)
      }),
      bearer()
    ]
  });
}
