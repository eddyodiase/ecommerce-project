export function validateProductionConfig(env = process.env) {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const missing = [
    'ADMIN_API_KEY',
    'FRONTEND_URL',
    'RDS_DB_NAME',
    'RDS_HOSTNAME',
    'RDS_PASSWORD',
    'RDS_USERNAME',
    'DB_TYPE',
  ].filter((name) => !String(env[name] || '').trim());

  if (missing.length) {
    throw new Error(`Missing production configuration: ${missing.join(', ')}`);
  }
  if (String(env.ADMIN_API_KEY).trim().length < 32) {
    throw new Error('ADMIN_API_KEY must contain at least 32 characters in production');
  }
  if (!['mysql', 'postgres'].includes(env.DB_TYPE)) {
    throw new Error('DB_TYPE must be mysql or postgres in production');
  }

  let frontendUrl;
  try {
    frontendUrl = new URL(env.FRONTEND_URL);
  } catch {
    throw new Error('FRONTEND_URL must be a valid absolute URL in production');
  }
  if (frontendUrl.protocol !== 'https:') {
    throw new Error('FRONTEND_URL must use HTTPS in production');
  }
  for (const origin of (env.CORS_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean)) {
    let allowedUrl;
    try {
      allowedUrl = new URL(origin);
    } catch {
      throw new Error('Every CORS_ORIGINS entry must be a valid HTTPS URL in production');
    }
    if (allowedUrl.protocol !== 'https:') {
      throw new Error('Every CORS_ORIGINS entry must use HTTPS in production');
    }
  }
}

export function getAllowedOrigins(env = process.env) {
  const configuredOrigins = [
    env.FRONTEND_URL || (env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'),
    ...(env.CORS_ORIGINS || '').split(','),
  ];

  return [...new Set(configuredOrigins
    .map((origin) => String(origin || '').trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin))];
}
