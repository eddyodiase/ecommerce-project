import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export const createOrderAccessToken = () => randomBytes(32).toString('base64url');

export const hashOrderAccessToken = (token) => createHash('sha256')
  .update(String(token || ''))
  .digest('hex');

export const matchesOrderAccessToken = (hash, token) => {
  const expected = Buffer.from(String(hash || ''));
  const actual = Buffer.from(hashOrderAccessToken(token));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
