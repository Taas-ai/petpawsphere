import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { posthog } from '@/lib/posthog';

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

export function PetCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PetFormData>({
    defaultValues: { species: 'dog', gender: 'male', isNeutered: false },
  });

  const values = watch();

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
      return api.pets.create(payload);
    },
    onSuccess: (data) => {
      posthog.capture('pet_created', { species: (data as Record<string, unknown>).species, breed: (data as Record<string, unknown>).breed });
      navigate('/pets');
    },
  });

  const onSubmit = (data: PetFormData) => {
    mutation.mutate(data);
  };

  const canProceed = () => {
    if (step === 1) return values.name && values.breed && values.species && values.location;
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Add a New Pet</h1>
      <p className="text-gray-500 mb-8">Register your pet in three simple steps</p>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                step > s
                  ? 'bg-green-500 text-white'
                  : step === s
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-1 rounded ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  placeholder="Pet name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
                  <select
                    {...register('species', { required: true })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    {...register('gender', { required: true })}
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
                  placeholder="e.g. Golden Retriever"
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
            </div>
          )}

          {/* Step 2: Health & Lineage */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Health &amp; Lineage</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Health Records (comma-separated)
                </label>
                <input
                  {...register('healthRecords')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  placeholder="Vaccinated, Dewormed, Hip Score A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNA Test Results</label>
                <textarea
                  {...register('dnaTestResults')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
                  placeholder="DNA test details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pedigree</label>
                <textarea
                  {...register('pedigree')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
                  placeholder="Pedigree info..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperament</label>
                <input
                  {...register('temperament')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  placeholder="Calm, friendly, energetic..."
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
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review &amp; Submit</h2>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <ReviewField label="Name" value={values.name} />
                <ReviewField label="Species" value={values.species} />
                <ReviewField label="Breed" value={values.breed} />
                <ReviewField label="Gender" value={values.gender} />
                <ReviewField label="Age" value={values.age ? `${values.age} years` : 'N/A'} />
                <ReviewField label="Weight" value={values.weight ? `${values.weight} kg` : 'N/A'} />
                <ReviewField label="Location" value={values.location || 'N/A'} />
                <ReviewField label="Temperament" value={values.temperament || 'N/A'} />
                <ReviewField label="Neutered" value={values.isNeutered ? 'Yes' : 'No'} />
              </div>

              {values.healthRecords && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Health Records</p>
                  <p className="text-sm text-gray-500">{values.healthRecords}</p>
                </div>
              )}

              {mutation.isError && (
                <p className="text-red-500 text-sm">
                  {mutation.error instanceof Error ? mutation.error.message : 'Failed to create pet'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => (step === 1 ? navigate('/pets') : setStep(step - 1))}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {mutation.isPending ? 'Submitting...' : 'Create Pet'}
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || 'N/A'}</p>
    </div>
  );
}
