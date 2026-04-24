import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Languages, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { posthog } from '@/lib/posthog';

const CONTEXTS = ['profile', 'chat', 'medical', 'legal'] as const;

export function Translate() {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState<'ar' | 'en'>('ar');
  const [context, setContext] = useState('');
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      const data: Record<string, unknown> = {
        text,
        targetLanguage: targetLang === 'ar' ? 'arabic' : 'english',
      };
      if (context) data['context'] = context;
      return api.tools.translate(data);
    },
    onSuccess: () => {
      posthog.capture('translate_used', { target_language: targetLang, context: context || 'none' });
    },
  });

  const result = mutation.data;

  const copyToClipboard = () => {
    if (result?.translatedText) {
      navigator.clipboard.writeText(result.translatedText as string).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Translate</h1>
      <p className="text-gray-500 mb-8">
        Translate between Arabic and English with pet-specific context
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Language Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className={`text-sm font-medium ${targetLang === 'en' ? 'text-gray-400' : 'text-gray-900'}`}>
            English
          </span>
          <button
            onClick={() => setTargetLang(targetLang === 'ar' ? 'en' : 'ar')}
            className="w-10 h-10 bg-amber-100 hover:bg-amber-200 rounded-full flex items-center justify-center transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4 text-amber-700" />
          </button>
          <span className={`text-sm font-medium ${targetLang === 'ar' ? 'text-gray-400' : 'text-gray-900'}`}>
            Arabic
          </span>
        </div>

        <p className="text-center text-xs text-gray-400 mb-4">
          Translating to {targetLang === 'ar' ? 'Arabic' : 'English'}
        </p>

        {/* Source Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Source Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Enter text to translate..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
          />
        </div>

        {/* Context */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Context <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
          >
            <option value="">No specific context</option>
            {CONTEXTS.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm mb-3">
            {mutation.error instanceof Error ? mutation.error.message : 'Translation failed'}
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!text.trim() || mutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          <Languages className="h-4 w-4" />
          {mutation.isPending ? 'Translating...' : 'Translate'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Translation</h2>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          <div
            className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 mb-3"
            dir={targetLang === 'ar' ? 'rtl' : 'ltr'}
          >
            {String(result.translatedText)}
          </div>

          {result.detectedSourceLanguage ? (
            <p className="text-xs text-gray-400 mb-2">
              Detected source: {String(result.detectedSourceLanguage)}
            </p>
          ) : null}

          {result.culturalNotes ? (
            <div className="bg-amber-50 rounded-lg p-3 mt-3">
              <p className="text-xs font-medium text-amber-700 mb-1">Cultural Notes</p>
              <p className="text-xs text-amber-600">{String(result.culturalNotes)}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
