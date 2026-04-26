import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { posthog } from '@/lib/posthog';

export function MatchCreate() {
  const navigate = useNavigate();
  const [petAId, setPetAId] = useState('');
  const [petBId, setPetBId] = useState('');

  const { data: myPets } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => api.pets.list({ owner: 'me' }),
  });

  const { data: allPets } = useQuery({
    queryKey: ['all-pets'],
    queryFn: () => api.pets.list(),
  });

  const otherPets = allPets?.filter((p) => {
    const id = p.id as string;
    return id !== petAId && !myPets?.some((mp) => (mp.id as string) === id);
  });

  const mutation = useMutation({
    mutationFn: () => api.matches.analyze(petAId, petBId),
    onSuccess: (data) => {
      const matchId = data.id as string;
      posthog.capture('match_requested', { match_id: matchId, compatibility_score: (data as Record<string, unknown>).compatibilityScore });
      navigate(`/matches/${matchId}`);
    },
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">New Match</h1>
      <p className="text-gray-500 mb-8">
        Select two pets to analyze their compatibility
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Your Pet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Pet</label>
          <select
            value={petAId}
            onChange={(e) => setPetAId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
          >
            <option value="">Select your pet...</option>
            {myPets?.map((pet) => (
              <option key={pet.id as string} value={pet.id as string}>
                {pet.name as string} ({pet.breed as string})
              </option>
            ))}
          </select>
        </div>

        {/* Match With */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Match With</label>
          <select
            value={petBId}
            onChange={(e) => setPetBId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
          >
            <option value="">Select a pet to match...</option>
            {otherPets?.map((pet) => (
              <option key={pet.id as string} value={pet.id as string}>
                {pet.name as string} ({pet.breed as string})
              </option>
            ))}
          </select>
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm">
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to analyze match'}
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!petAId || !petBId || mutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing Compatibility...
            </>
          ) : (
            <>
              <Heart className="h-4 w-4" />
              Analyze Compatibility
            </>
          )}
        </button>
      </div>
    </div>
  );
}
