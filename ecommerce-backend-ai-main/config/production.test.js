import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedOrigins, validateProductionConfig } from './production.js';

const validProductionConfig = {
  NODE_ENV: 'production',
  ADMIN_API_KEY: 'a'.repeat(40),
  FRONTEND_URL: 'https://shop.example.com/path',
  DB_TYPE: 'postgres',
  RDS_HOSTNAME: 'database.example.com',
  RDS_DB_NAME: 'shop',
  RDS_USERNAME: 'shop',
  RDS_PASSWORD: 'secret',
};

test('allows development defaults without production settings', () => {
  assert.doesNotThrow(() => validateProductionConfig({ NODE_ENV: 'development' }));
});

test('requires HTTPS, a strong admin key, and a configured production database', () => {
  assert.doesNotThrow(() => validateProductionConfig(validProductionConfig));
  assert.throws(
    () => validateProductionConfig({ ...validProductionConfig, ADMIN_API_KEY: 'short' }),
    /at least 32 characters/
  );
  assert.throws(
    () => validateProductionConfig({ ...validProductionConfig, FRONTEND_URL: 'http://shop.example.com' }),
    /must use HTTPS/
  );
  assert.throws(
    () => validateProductionConfig({ ...validProductionConfig, RDS_PASSWORD: '' }),
    /RDS_PASSWORD/
  );
  assert.throws(
    () => validateProductionConfig({ ...validProductionConfig, CORS_ORIGINS: 'http://admin.example.com' }),
    /CORS_ORIGINS entry must use HTTPS/
  );
});

test('limits CORS origins to the configured site and explicit additions', () => {
  assert.deepEqual(
    getAllowedOrigins({
      FRONTEND_URL: 'https://shop.example.com/path',
      CORS_ORIGINS: 'https://admin.example.com, https://shop.example.com/another-path',
    }),
    ['https://shop.example.com', 'https://admin.example.com']
  );
});
