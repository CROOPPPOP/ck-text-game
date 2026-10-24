'use client';

const API_KEY_STORAGE_KEY = 'ck_api_key';
const STARTUP_CONFIG_KEY = 'ck_startup_config';

function removeLegacyStartupConfigKey(): string {
  try {
    const rawConfig = window.localStorage.getItem(STARTUP_CONFIG_KEY);
    if (!rawConfig) return '';
    const config = JSON.parse(rawConfig) as Record<string, unknown>;
    const legacyConfigKey = typeof config.apiKey === 'string' ? config.apiKey : '';
    if ('apiKey' in config) {
      delete config.apiKey;
      window.localStorage.setItem(STARTUP_CONFIG_KEY, JSON.stringify(config));
    }
    return legacyConfigKey;
  } catch {
    return '';
  }
}

/** Keep a BYOK Gemini key only for the current browser tab session. */
export function getGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    let apiKey = window.sessionStorage.getItem(API_KEY_STORAGE_KEY) || '';
    const legacyKey = window.localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    if (legacyKey) window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    const legacyConfigKey = removeLegacyStartupConfigKey();
    if (!apiKey) apiKey = legacyKey || legacyConfigKey;

    if (apiKey && !window.sessionStorage.getItem(API_KEY_STORAGE_KEY)) {
      window.sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    }
    return apiKey;
  } catch {
    return '';
  }
}

export function setGeminiApiKey(apiKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    removeLegacyStartupConfigKey();
    return true;
  } catch {
    return false;
  }
}

export function clearGeminiApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    removeLegacyStartupConfigKey();
  } catch {
    // Storage can be disabled by browser policy; clearing remains best effort.
  }
}

