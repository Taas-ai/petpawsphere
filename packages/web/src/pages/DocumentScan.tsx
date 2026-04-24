// @ts-nocheck — dynamic OCR/document API responses are inherently untyped
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileSearch, FileText } from 'lucide-react';
import { api } from '@/lib/api';

const DOCUMENT_TYPES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'vaccination', label: 'Vaccination Record' },
];

export default function DocumentScan() {
  const [selectedPetId, setSelectedPetId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [documentType, setDocumentType] = useState('lab_report');

  const { data: myPets } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => api.pets.list({ owner: 'me' }),
  });

  const selectedPet = myPets?.find((p) => (p.id as string) === selectedPetId);

  const mutation = useMutation({
    mutationFn: () => api.tools.scanDocument(selectedPetId, imageUrl, documentType),
  });

  const { data: history } = useQuery({
    queryKey: ['document-history', selectedPetId],
    queryFn: () => api.tools.getDocumentHistory(selectedPetId),
    enabled: !!selectedPetId,
  });

  const result = mutation.data;
  type LabRow = { name?: string; test?: string; value?: string; reference?: string; range?: string; status?: string };
  type MedRow = { name?: string; dosage?: string; frequency?: string; duration?: string };
  const labRows: LabRow[] = Array.isArray(result?.labResults) ? (result.labResults as LabRow[]) : [];
  const medRows: MedRow[] = Array.isArray(result?.medications) ? (result.medications as MedRow[]) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Document Scanner</h1>
      <p className="text-gray-500 mb-8">
        Scan and extract data from vet documents, lab reports, and prescriptions
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

        {/* Document Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
          >
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Image URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/document-scan.jpg"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>
        {imageUrl && (
          <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
            <img
              src={imageUrl}
              alt="Document preview"
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {mutation.isError && (
          <p className="text-red-500 text-sm mb-3">
            {mutation.error instanceof Error ? mutation.error.message : 'Scan failed'}
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!selectedPetId || !imageUrl || mutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          <FileSearch className="h-4 w-4" />
          {mutation.isPending ? 'Scanning...' : 'Scan Document'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 mb-8">
          {/* Document Type Badge */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Extracted Data</h2>
              <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                {DOCUMENT_TYPES.find((dt) => dt.value === documentType)?.label || documentType}
              </span>
            </div>

            {/* Raw text */}
            {!!result.rawText && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Raw Text</h3>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                  {String(result.rawText)}
                </p>
              </div>
            )}

            {/* Structured fields */}
            {!!result.fields && typeof result.fields === 'object' && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Fields</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(result.fields as Record<string, unknown>).map(([key, value]) => (
                        <tr key={key} className="border-b border-gray-50">
                          <td className="py-2 pr-4 font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 text-gray-900">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Lab results table */}
            {labRows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Lab Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Test</th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Value</th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Reference</th>
                        <th className="text-left py-2 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labRows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 pr-4 font-medium text-gray-900">{row.name ?? row.test ?? ''}</td>
                          <td className="py-2 pr-4 text-gray-700">{row.value ?? ''}</td>
                          <td className="py-2 pr-4 text-gray-500">{row.reference ?? row.range ?? ''}</td>
                          <td className="py-2">
                            {row.status && (
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  row.status.toLowerCase() === 'normal'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {row.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Medications (prescription) */}
            {medRows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Medications</h3>
                <div className="space-y-2">
                  {medRows.map((med, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{med.name ?? ''}</p>
                      {med.dosage && <p className="text-xs text-gray-600">Dosage: {med.dosage}</p>}
                      {med.frequency && <p className="text-xs text-gray-600">Frequency: {med.frequency}</p>}
                      {med.duration && <p className="text-xs text-gray-600">Duration: {med.duration}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vaccinations */}
            {Array.isArray(result.vaccinations) && (result.vaccinations as Record<string, unknown>[]).length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Vaccinations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Vaccine</th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Date</th>
                        <th className="text-left py-2 font-medium text-gray-500">Next Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.vaccinations as Record<string, unknown>[]).map((vac, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 pr-4 font-medium text-gray-900">{String(vac.name || '')}</td>
                          <td className="py-2 pr-4 text-gray-700">{String(vac.date || '')}</td>
                          <td className="py-2 text-gray-700">{String(vac.nextDue || vac.nextDate || '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Summary</h3>
                <p className="text-sm text-gray-600">{String(result.summary)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document History */}
      {selectedPetId && Array.isArray(history) && history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Document History</h2>
          <div className="space-y-3">
            {(history as Record<string, unknown>[]).map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {entry.documentType
                        ? DOCUMENT_TYPES.find((dt) => dt.value === entry.documentType)?.label || String(entry.documentType)
                        : 'Document'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.createdAt ? new Date(entry.createdAt as string).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
