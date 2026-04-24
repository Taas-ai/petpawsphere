import { describe, expect, it, beforeEach, vi } from 'vitest';

describe('initSentry', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.SENTRY_DSN;
  });

  it('is a no-op when SENTRY_DSN is not set', async () => {
    const initSpy = vi.fn();
    vi.doMock('@sentry/node', () => ({ init: initSpy, setupExpressErrorHandler: vi.fn() }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('calls Sentry.init when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1';
    const initSpy = vi.fn();
    vi.doMock('@sentry/node', () => ({ init: initSpy, setupExpressErrorHandler: vi.fn() }));
    const { initSentry } = await import('../../src/lib/sentry');
    initSentry();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy.mock.calls[0][0]).toMatchObject({ dsn: 'https://example@sentry.io/1' });
  });
});
