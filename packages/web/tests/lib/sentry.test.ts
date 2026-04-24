import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('initSentry (web)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SENTRY_DSN', '');
  });

  it('is a no-op when VITE_SENTRY_DSN is empty', async () => {
    const initSpy = vi.fn();
    vi.doMock('@sentry/react', () => ({ init: initSpy }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('calls Sentry.init with DSN when set', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/1');
    const initSpy = vi.fn();
    vi.doMock('@sentry/react', () => ({ init: initSpy }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy.mock.calls[0][0]).toMatchObject({ dsn: 'https://example@sentry.io/1' });
  });
});
