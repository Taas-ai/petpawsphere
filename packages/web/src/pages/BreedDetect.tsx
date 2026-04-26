import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Image, FileText } from 'lucide-react';
import { api } from '@/lib/api';

export function BreedDetect() {
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const data: Record<string, unknown> =
        mode === 'image' ? { imageUrl } : { description };
      return api.tools.breedDetect(data);
    },
  });

  const result = mutation.data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Breed Detection</h1>
      <p className="text-gray-500 mb-8">
        Identify breeds from an image URL or text description
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Mode Toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === 'image'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Image className="h-4 w-4" /> Image URL
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4" /> Text Description
          </button>
        </div>

        {mode === 'image' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/pet-photo.jpg"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>
            {imageUrl && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imageUrl}
                  alt="Preview"
                  loading="lazy"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the pet (size, color, fur type, features)..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
            />
          </div>
        )}

        {mutation.isError && (
          <p className="text-red-500 text-sm mt-3">
            {mutation.error instanceof Error ? mutation.error.message : 'Detection failed'}
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (mode === 'image' ? !imageUrl : !description)}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          <Search className="h-4 w-4" />
          {mutation.isPending ? 'Detecting...' : 'Detect Breed'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detection Results</h2>

          <div className="mb-4">
            <p className="text-2xl font-bold text-gray-900">
              {String(result.primaryBreed)}
            </p>
            {result.confidence != null && (
              <p className="text-sm text-gray-500">
                Confidence: {Math.round(Number(result.confidence))}%
              </p>
            )}
            {result.secondaryBreed ? (
              <p className="text-sm text-gray-500 mt-1">
                Secondary: {String(result.secondaryBreed)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {result.species ? (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                {String(result.species)}
              </span>
            ) : null}
            {result.sizeCategory ? (
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {String(result.sizeCategory)}
              </span>
            ) : null}
            {result.colorPattern ? (
              <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {String(result.colorPattern)}
              </span>
            ) : null}
          </div>

          {/* UAE Info */}
          {result.uaeInfo ? (
            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">UAE Information</h3>
              {(() => {
                const uae = result.uaeInfo as Record<string, unknown>;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {uae.popularity ? (
                      <div>
                        <p className="text-amber-600 text-xs">Popularity</p>
                        <p className="font-medium text-amber-900">{String(uae.popularity)}</p>
                      </div>
                    ) : null}
                    {uae.heatTolerance ? (
                      <div>
                        <p className="text-amber-600 text-xs">Heat Tolerance</p>
                        <p className="font-medium text-amber-900">{String(uae.heatTolerance)}</p>
                      </div>
                    ) : null}
                    {uae.averagePriceAED != null ? (
                      <div>
                        <p className="text-amber-600 text-xs">Avg Price</p>
                        <p className="font-medium text-amber-900">{Number(uae.averagePriceAED)} AED</p>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          ) : null}

          {/* Characteristics */}
          {Array.isArray(result.characteristics) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Characteristics</h3>
              <div className="flex flex-wrap gap-2">
                {(result.characteristics as string[]).map((c, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-purple-50 text-purple-700 px-3 py-1 rounded-full"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
