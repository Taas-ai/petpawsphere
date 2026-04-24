import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env['VITE_POSTHOG_KEY'] as string | undefined;
const POSTHOG_HOST = (import.meta.env['VITE_POSTHOG_HOST'] as string | undefined) ?? 'https://us.i.posthog.com';

export function initPostHog() {
  if (!POSTHOG_KEY) return; // no-op in dev without key
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
}

export { posthog };
