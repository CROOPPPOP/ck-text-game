import assert from 'node:assert/strict';
import test from 'node:test';
import { clearGeminiApiKey, getGeminiApiKey, setGeminiApiKey } from '../src/lib/apiKeyStorage';

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
    snapshot: () => Object.fromEntries(values)
  };
}

function withWindow<T>(run: (local: ReturnType<typeof storage>, session: ReturnType<typeof storage>) => T): T {
  const local = storage();
  const session = storage();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: local, sessionStorage: session }
  });
  try {
    return run(local, session);
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
  }
}

test('stores keys in session storage and removes the persistent legacy key', () => {
  withWindow((local, session) => {
    assert.equal(setGeminiApiKey('AIza-session-only'), true);
    assert.equal(session.getItem('ck_api_key'), 'AIza-session-only');
    assert.equal(local.getItem('ck_api_key'), null);
  });
});

test('migrates and removes the key from older persistent storage', () => {
  withWindow((local, session) => {
    local.setItem('ck_api_key', 'AIza-legacy');
    assert.equal(getGeminiApiKey(), 'AIza-legacy');
    assert.equal(session.getItem('ck_api_key'), 'AIza-legacy');
    assert.equal(local.getItem('ck_api_key'), null);
  });
});

test('removes legacy keys copied into persisted startup settings', () => {
  withWindow((local, session) => {
    local.setItem('ck_startup_config', JSON.stringify({ character: 'A', apiKey: 'AIza-startup' }));
    assert.equal(getGeminiApiKey(), 'AIza-startup');
    assert.equal(session.getItem('ck_api_key'), 'AIza-startup');
    assert.deepEqual(JSON.parse(local.getItem('ck_startup_config') || '{}'), { character: 'A' });
    clearGeminiApiKey();
    assert.equal(session.getItem('ck_api_key'), null);
  });
});
