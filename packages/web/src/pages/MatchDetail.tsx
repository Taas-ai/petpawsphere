import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, PawPrint, MessageCircle, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { posthog } from '@/lib/posthog';
import { CompatibilityCard } from '@/components/CompatibilityCard';

export function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => api.matches.get(id!),
    enabled: !!id,
  });

  const respondMutation = useMutation({
    mutationFn: (status: string) => api.matches.respond(id!, status),
    onSuccess: (_data, status) => {
      posthog.capture(status === 'accepted' ? 'match_accepted' : 'match_rejected', { match_id: id });
      queryClient.invalidateQueries({ queryKey: ['match', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center py-20">Loading match...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center py-20">Match not found.</p>
      </div>
    );
  }

  const status = (match.status as string) ?? 'pending';
  const petA = match.petA as Record<string, unknown> | undefined;
  const petB = match.petB as Record<string, unknown> | undefined;
  const petAOwnerId = (petA?.ownerId as string) ?? (match.petAOwnerId as string);
  const petBOwnerId = (petB?.ownerId as string) ?? (match.petBOwnerId as string);
  const requesterId = (match.requesterId ?? match.requestedBy) as string | undefined;

  // User can respond if they own the non-requesting pet and match is pending
  const isResponder =
    status === 'pending' &&
    user &&
    requesterId &&
    user.id !== requesterId &&
    (user.id === petAOwnerId || user.id === petBOwnerId);

  const result = (match.result as Record<string, unknown>) ?? match;
  const contract = match.contract as Record<string, unknown> | undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Match Details</h1>

      {/* Pet Cards Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MiniPetCard pet={petA} fallbackId={match.petAId as string} label="Pet A" />
        <MiniPetCard pet={petB} fallbackId={match.petBId as string} label="Pet B" />
      </div>

      {/* Compatibility */}
      <div className="mb-6">
        <CompatibilityCard result={result} />
      </div>

      {/* Actions for pending */}
      {isResponder && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Respond to Match</h2>
          <p className="text-sm text-gray-500 mb-4">This match is waiting for your response.</p>
          <div className="flex gap-3">
            <button
              onClick={() => respondMutation.mutate('accepted')}
              disabled={respondMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => respondMutation.mutate('rejected')}
              disabled={respondMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Reject
            </button>
          </div>
          {respondMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              {respondMutation.error instanceof Error ? respondMutation.error.message : 'Failed to respond'}
            </p>
          )}
        </div>
      )}

      {/* Accepted: show chat + contract */}
      {status === 'accepted' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/messages/${id}`}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <MessageCircle className="h-4 w-4" /> Open Chat
            </Link>
            <Link
              to={`/contracts/new?matchId=${id}`}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <FileText className="h-4 w-4" /> Create Contract
            </Link>
          </div>
        </div>
      )}

      {/* Contract section */}
      {contract && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contract</h2>
          <p className="text-sm text-gray-600">
            Status:{' '}
            <span className="font-medium capitalize">{String(contract.status)}</span>
          </p>
          {contract.id ? (
            <Link
              to={`/contracts/${String(contract.id)}`}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium mt-2 inline-block"
            >
              View Contract
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MiniPetCard({
  pet,
  fallbackId,
  label,
}: {
  pet: Record<string, unknown> | undefined;
  fallbackId: string;
  label: string;
}) {
  const name = pet ? (pet.name as string) : fallbackId;
  const breed = pet ? (pet.breed as string) : '';
  const petId = pet ? (pet.id as string) : fallbackId;

  return (
    <Link
      to={`/pets/${petId}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
    >
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <PawPrint className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          {breed && <p className="text-sm text-gray-500">{breed}</p>}
        </div>
      </div>
    </Link>
  );
}
