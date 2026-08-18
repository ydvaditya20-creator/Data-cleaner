import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  Copy,
  Check,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { CleaningRecipeScript } from '../types';
import { downloadScriptJson } from '../utils/exportUtils';
import { validateScriptJson } from '../utils/cleaningEngine';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: CleaningRecipeScript;
  onSaveScript: (updated: CleaningRecipeScript) => void;
  lang: 'en' | 'hi';
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  isOpen,
  onClose,
  script,
  onSaveScript,
  lang,
}) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(script, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync state when script changes
  React.useEffect(() => {
    setJsonText(JSON.stringify(script, null, 2));
  }, [script]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleDownload = () => {
    const res = validateScriptJson(jsonText);
    if (res.valid && res.script) {
      downloadScriptJson(res.script);
    } else {
      downloadScriptJson(script);
    }
  };

  const handleApplyChanges = () => {
    const res = validateScriptJson(jsonText);
    if (!res.valid || !res.script) {
      setError(res.error || 'Invalid JSON syntax');
      return;
    }
    setError(null);
    onSaveScript(res.script);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-150 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                {lang === 'hi' ? 'क्लीनिंग स्क्रिप्ट JSON इंस्पेक्टर' : 'Cleaning Script JSON Recipe'}
              </h3>
              <p className="text-xs text-neutral-500">
                {lang === 'hi' ? 'स्क्रिप्ट कोड देखें, एडिट करें या सीधे डाउनलोड करें' : 'View, edit, or copy the reusable transformation JSON script'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* JSON Editor area */}
        <div className="mt-3 flex-1 overflow-hidden flex flex-col">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            rows={14}
            className="w-full flex-1 rounded-xl border border-neutral-300 bg-neutral-900 p-3.5 font-mono text-xs text-emerald-400 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
          />

          {error && (
            <div className="mt-2 flex items-center space-x-1.5 rounded-lg bg-red-50 p-2 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-150 pt-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>{lang === 'hi' ? 'फ़ाइल डाउनलोड (.json)' : 'Download .json'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>
            <button
              onClick={handleApplyChanges}
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              {lang === 'hi' ? 'JSON बदलाव लागू करें' : 'Apply JSON Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
