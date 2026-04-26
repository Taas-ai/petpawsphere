import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];

interface PetFormData {
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  weight: number;
  location: string;
  healthRecords: string;
  dnaTestResults: string;
  pedigree: string;
  temperament: string;
  isNeutered: boolean;
}

export function PetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => api.pets.get(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PetFormData>();

  useEffect(() => {
    if (pet) {
      const rawRecords = pet.healthRecords;
      const records: string[] = Array.isArray(rawRecords)
        ? (rawRecords as string[])
        : typeof rawRecords === 'string' && rawRecords.startsWith('[')
          ? (JSON.parse(rawRecords) as string[])
          : [];
      reset({
        name: (pet.name as string) ?? '',
        species: (pet.species as string) ?? 'dog',
        breed: (pet.breed as string) ?? '',
        age: (pet.age as number) ?? 0,
        gender: (pet.gender as string) ?? 'male',
        weight: (pet.weight as number) ?? 0,
        location: (pet.location as string) ?? '',
        healthRecords: records.join(', '),
        dnaTestResults: (pet.dnaTestResults as string) ?? '',
        pedigree: (pet.pedigree as string) ?? '',
        temperament: (pet.temperament as string) ?? '',
        isNeutered: (pet.isNeutered as boolean) ?? false,
      });
    }
  }, [pet, reset]);

  const mutation = useMutation({
    mutationFn: (data: PetFormData) => {
      const payload: Record<string, unknown> = {
        ...data,
        age: Number(data.age),
        weight: Number(data.weight),
        healthRecords: data.healthRecords
          ? data.healthRecords.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      return api.pets.update(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', id] });
      navigate(`/pets/${id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center py-20">Loading...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center py-20">Pet not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === (pet.ownerId as string);
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center py-20">You can only edit your own pets.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Edit Pet</h1>
      <p className="text-gray-500 mb-8">Update {pet.name as string}&apos;s information</p>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
              <select
                {...register('species')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
            <input
              {...register('breed', { required: 'Breed is required' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                {...register('age', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('weight', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              {...register('location')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
            >
              <option value="">Select Emirate</option>
              {EMIRATES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperament</label>
            <input
              {...register('temperament')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Health Records (comma-separated)
            </label>
            <input
              {...register('healthRecords')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNA Test Results</label>
            <textarea
              {...register('dnaTestResults')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedigree</label>
            <textarea
              {...register('pedigree')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('isNeutered')}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Neutered / Spayed</span>
          </label>

          {mutation.isError && (
            <p className="text-red-500 text-sm">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to update pet'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 px-5 py-2.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
