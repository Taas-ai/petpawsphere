import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, PawPrint, MapPin, Edit, Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Paywall } from '@/components/Paywall';

const BOOST_24H_PRICE_ID = (import.meta.env.VITE_STRIPE_PRICE_BOOST_24H as string | undefined) ?? '';

export function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => api.pets.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center py-20">Loading pet details...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center py-20">Pet not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === (pet.ownerId as string);
  const rawHR = pet.healthRecords;
  const healthRecords: string[] = Array.isArray(rawHR)
    ? (rawHR as string[])
    : typeof rawHR === 'string' && rawHR.startsWith('[')
      ? (JSON.parse(rawHR) as string[])
      : [];
  const species = (pet.species as string) ?? 'dog';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Photo */}
      <div className="h-64 sm:h-80 bg-gradient-to-br from-amber-100 to-orange-200 rounded-xl flex items-center justify-center mb-6">
        <PawPrint className="h-24 w-24 text-amber-400/60" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {String(pet.name)}
            </h1>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                species === 'cat'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {species === 'cat' ? 'Cat' : 'Dog'}
            </span>
          </div>
          <p className="text-gray-500 mt-1">{String(pet.breed)}</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Link
              to={`/pets/${id}/edit`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" /> Edit
            </Link>
          )}
          <Link
            to="/matches/new"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-lg transition-colors"
          >
            <Heart className="h-4 w-4" /> Find a Match
          </Link>
        </div>
      </div>

      {/* Boost paywall — dark-launched, renders only when VITE_MONETIZATION_ENABLED=true */}
      {isOwner && BOOST_24H_PRICE_ID && (
        <div className="mb-6">
          <Paywall
            priceId={BOOST_24H_PRICE_ID}
            petId={String(pet.id)}
            label="Boost for 24h"
            description="Put this profile at the top of search results for 24 hours."
          />
        </div>
      )}

      {/* Info Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
          <InfoItem label="Breed" value={String(pet.breed)} />
          <InfoItem label="Species" value={species} />
          <InfoItem label="Age" value={pet.age != null ? `${Number(pet.age)} years` : 'N/A'} />
          <InfoItem label="Gender" value={String(pet.gender ?? 'N/A')} />
          <InfoItem label="Weight" value={pet.weight != null ? `${Number(pet.weight)} kg` : 'N/A'} />
          <InfoItem
            label="Location"
            value={String(pet.location ?? '')}
            icon={<MapPin className="h-3.5 w-3.5" />}
          />
          <InfoItem label="Temperament" value={String(pet.temperament ?? 'N/A')} />
          <InfoItem label="Neutered" value={(pet.isNeutered as boolean) ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* Health Records */}
      {healthRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Health Records</h2>
          <div className="flex flex-wrap gap-2">
            {healthRecords.map((rec, i) => (
              <span
                key={i}
                className="text-xs font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full"
              >
                {rec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* DNA Test Results */}
      {pet.dnaTestResults ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">DNA Test Results</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(pet.dnaTestResults)}</p>
        </div>
      ) : null}

      {/* Pedigree */}
      {pet.pedigree ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pedigree</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(pet.pedigree)}</p>
        </div>
      ) : null}
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="font-medium text-gray-900 flex items-center gap-1 capitalize">
        {icon}
        {value || 'N/A'}
      </p>
    </div>
  );
}
