// @ts-nocheck — dynamic AI diagnostic API responses are inherently untyped
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

function urgencyBadge(level: string) {
  const l = level.toLowerCase();
  if (l === 'low') return 'bg-green-100 text-green-700 border-green-200';
  if (l === 'moderate') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (l === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (l === 'critical' || l === 'emergency') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function urgencyIcon(level: string) {
  const l = level.toLowerCase();
  if (l === 'low') return <CheckCircle className="h-4 w-4" />;
  if (l === 'moderate') return <Clock className="h-4 w-4" />;
  if (l === 'high') return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

export default function Diagnostic() {
  const [selectedPetId, setSelectedPetId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const { data: myPets } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => api.pets.list({ owner: 'me' }),
  });

  const selectedPet = myPets?.find((p) => (p.id as string) === selectedPetId);

  const mutation = useMutation({
    mutationFn: () => api.tools.analyzePetPhoto(selectedPetId, imageUrl, symptoms || undefined),
  });

  const { data: history } = useQuery({
    queryKey: ['diagnostic-history', selectedPetId],
    queryFn: () => api.tools.getDiagnosticHistory(selectedPetId),
    enabled: !!selectedPetId,
  });

  const result = mutation.data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AI Diagnostics</h1>
      <p className="text-gray-500 mb-8">
        Upload a photo and describe symptoms for AI-powered health assessment
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Pet Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Pet</label>
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
          >
            <option value="">Choose a pet...</option>
            {myPets?.map((pet) => (
              <option key={pet.id as string} value={pet.id as string}>
                {pet.name as string} ({pet.breed as string})
              </option>
            ))}
          </select>
        </div>

        {/* Pre-filled info */}
        {selectedPet && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-gray-500">Species</p>
              <p className="font-medium text-gray-800 capitalize">{selectedPet.species as string}</p>
            </div>
            <div>
              <p className="text-gray-500">Breed</p>
              <p className="font-medium text-gray-800">{selectedPet.breed as string}</p>
            </div>
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium text-gray-800">
                {selectedPet.age != null ? `${selectedPet.age} yrs` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Weight</p>
              <p className="font-medium text-gray-800">
                {selectedPet.weight != null ? `${selectedPet.weight} kg` : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Image URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/pet-photo.jpg"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>
        {imageUrl && (
          <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Symptoms */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe Symptoms <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={3}
            placeholder="e.g., limping on front left leg, reduced appetite for 2 days..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
          />
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm mb-3">
            {mutation.error instanceof Error ? mutation.error.message : 'Diagnostic failed'}
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!selectedPetId || !imageUrl || mutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          <Activity className="h-4 w-4" />
          {mutation.isPending ? 'Analyzing...' : 'Run Diagnostic'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 mb-8">
          {/* Urgency Badge */}
          {!!result.urgency && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Assessment</h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border ${urgencyBadge(result.urgency as string)}`}
                >
                  {urgencyIcon(result.urgency as string)}
                  {String(result.urgency)}
                </span>
              </div>
              {!!result.assessment && (
                <p className="text-sm text-gray-700">{String(result.assessment)}</p>
              )}
            </div>
          )}

          {/* Possible Conditions */}
          {Array.isArray(result.possibleConditions) && (result.possibleConditions as string[]).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Possible Conditions</h2>
              <ul className="space-y-2">
                {(result.possibleConditions as string[]).map((condition, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1 text-blue-500 shrink-0">&#8226;</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {Array.isArray(result.recommendedActions) && (result.recommendedActions as string[]).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h2>
              <ul className="space-y-2">
                {(result.recommendedActions as string[]).map((action, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <p className="text-xs text-amber-800">
              <strong>Disclaimer:</strong> This AI-powered diagnostic is for informational purposes only and does not replace professional veterinary care. Always consult a licensed veterinarian for medical decisions regarding your pet.
            </p>
          </div>
        </div>
      )}

      {/* Diagnostic History */}
      {selectedPetId && Array.isArray(history) && history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic History</h2>
          <div className="space-y-3">
            {(history as Record<string, unknown>[]).map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {entry.assessment ? String(entry.assessment).slice(0, 80) + '...' : 'Diagnostic'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.createdAt ? new Date(entry.createdAt as string).toLocaleDateString() : ''}
                  </p>
                </div>
                {!!entry.urgency && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${urgencyBadge(entry.urgency as string)}`}
                  >
                    {String(entry.urgency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
