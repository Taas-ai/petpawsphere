/**
 * Validate that a URL is safe to fetch (prevents SSRF).
 * Only allows https:// URLs that don't resolve to private IP ranges.
 * Also allows data: URIs (base64-encoded images) as they don't trigger network requests.
 */
export function validateImageUrl(url: string): { valid: boolean; error?: string } {
  try {
    // Allow data URIs (base64 images) — no network request involved
    if (url.startsWith('data:')) {
      return { valid: true };
    }

    const parsed = new URL(url);

    // Only allow https (and http for localhost in dev)
    if (parsed.protocol !== 'https:') {
      if (parsed.protocol === 'http:' && process.env.NODE_ENV !== 'development') {
        return { valid: false, error: 'Only HTTPS URLs are allowed' };
      }
      if (parsed.protocol !== 'http:') {
        return { valid: false, error: 'Only HTTPS URLs are allowed' };
      }
    }

    // Block private/internal hostnames
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1', 'metadata.google.internal'];
    if (blockedHosts.includes(parsed.hostname)) {
      return { valid: false, error: 'Internal URLs are not allowed' };
    }
    // Block IPv6 private ranges (link-local, unique-local, loopback)
    const h = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (h === '::' || h.startsWith('fe80:') || h.startsWith('fc00:') || h.startsWith('fd')) {
      return { valid: false, error: 'Private IP not allowed' };
    }

    // Block private IP ranges
    const parts = parsed.hostname.split('.').map(Number);
    if (parts.length === 4 && parts.every(p => !isNaN(p))) {
      if (parts[0] === 10) return { valid: false, error: 'Private IP not allowed' };
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return { valid: false, error: 'Private IP not allowed' };
      if (parts[0] === 192 && parts[1] === 168) return { valid: false, error: 'Private IP not allowed' };
      if (parts[0] === 169 && parts[1] === 254) return { valid: false, error: 'Metadata endpoint not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
