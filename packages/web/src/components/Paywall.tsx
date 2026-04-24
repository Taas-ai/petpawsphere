import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { createCheckoutSession, isMonetizationEnabled } from '@/lib/billing';

interface Props {
  priceId: string;
  petId: string;
  label?: string;
  description?: string;
}

/**
 * Dark-launched paywall button. While VITE_MONETIZATION_ENABLED is false it
 * renders nothing. Once enabled it shows a "Boost 24h" CTA that opens a Stripe
 * Checkout session via the createCheckoutSession callable function.
 */
export function Paywall({ priceId, petId, label = 'Boost for 24h', description }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isMonetizationEnabled()) return null;

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await createCheckoutSession(priceId, petId);
      if (res?.url) window.location.href = res.url;
      else setError('Checkout unavailable');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-900">{label}</p>
          {description && <p className="text-sm text-amber-800 mt-1">{description}</p>}
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Starting checkout...' : label}
          </button>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
