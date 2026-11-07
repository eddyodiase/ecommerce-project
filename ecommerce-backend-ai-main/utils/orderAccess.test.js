import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrderAccessToken,
  hashOrderAccessToken,
  matchesOrderAccessToken
} from './orderAccess.js';

test('creates unique high-entropy order access tokens and one-way hashes', () => {
  const firstToken = createOrderAccessToken();
  const secondToken = createOrderAccessToken();

  assert.notEqual(firstToken, secondToken);
  assert.equal(firstToken.length, 43);
  assert.equal(hashOrderAccessToken(firstToken).length, 64);
  assert.notEqual(hashOrderAccessToken(firstToken), firstToken);
  assert.equal(hashOrderAccessToken(firstToken), hashOrderAccessToken(firstToken));
  assert.equal(matchesOrderAccessToken(hashOrderAccessToken(firstToken), firstToken), true);
  assert.equal(matchesOrderAccessToken(hashOrderAccessToken(firstToken), secondToken), false);
});
