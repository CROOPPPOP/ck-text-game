import assert from 'node:assert/strict';
import test from 'node:test';
import { readJsonBody, isValidOptionalApiKey } from '../src/lib/api/request';

test('reads a bounded JSON request body', async () => {
  const request = new Request('https://example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'continue' })
  });
  const result = await readJsonBody<{ action: string }>(request, 128);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.body, { action: 'continue' });
});

test('rejects oversized bodies before parsing', async () => {
  const request = new Request('https://example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'x'.repeat(200) })
  });
  const result = await readJsonBody(request, 64);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 413);
});

test('rejects non-JSON and malformed JSON', async () => {
  const wrongType = await readJsonBody(new Request('https://example.test/api', { method: 'POST', body: '{}' }), 64);
  assert.equal(wrongType.ok, false);
  if (!wrongType.ok) assert.equal(wrongType.response.status, 415);

  const malformed = await readJsonBody(new Request('https://example.test/api', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{'
  }), 64);
  assert.equal(malformed.ok, false);
  if (!malformed.ok) assert.equal(malformed.response.status, 400);
});

test('accepts an optional bounded API key and rejects invalid values', () => {
  assert.equal(isValidOptionalApiKey(undefined), true);
  assert.equal(isValidOptionalApiKey('AIza-example'), true);
  assert.equal(isValidOptionalApiKey('x'.repeat(513)), false);
  assert.equal(isValidOptionalApiKey(42), false);
});
