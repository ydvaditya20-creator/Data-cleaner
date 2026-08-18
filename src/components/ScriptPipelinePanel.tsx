import React, { useRef, useState } from 'react';
import {
  FileCode,
  Download,
  Upload,
  Play,
  CheckCircle2,
  Trash2,
  MoveUp,
  MoveDown,
  Power,
  Sparkles,
  Save,
  Bookmark,
  ChevronRight,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CleaningAction, CleaningRecipeScript } from '../types';
import { downloadScriptJson } from '../utils/exportUtils';
import { validateScriptJson } from '../utils/cleaningEngine';

interface ScriptPipelinePanelProps {
  currentScript: CleaningRecipeScript;
  onUpdateScript: (script: CleaningRecipeScript) => void;
  onLoadScript: (script: CleaningRecipeScript) => void;
  onRunScript: () => void;
  lang: 'en' | 'hi';
  onOpenScriptEditor: () => void;
  activeStepIndex?: number;
  onSelectStepIndex?: (index: number | undefined) => void;
  savedPresets: CleaningRecipeScript[];
  onSavePreset: (name: string, description: string) => void;
  onDeletePreset: (id: string) => void;
  executionDurationMs?: number;
}

export const ScriptPipelinePanel: React.FC<ScriptPipelinePanelProps> = ({
  currentScript,
  onUpdateScript,
  onLoadScript,
  onRunScript,
  lang,
  onOpenScriptEditor,
  activeStepIndex,
  onSelectStepIndex,
  savedPresets,
  onSavePreset,
  onDeletePreset,
  executionDurationMs,
}) => {
  const [saveName, setSaveName] = useState('');
  const [showSaveBox, setShowSaveBox] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const actions = currentScript.actions;
  const activeCount = actions.filter((a) => a.enabled).length;

  const handleDownloadScript = () => {
    downloadScriptJson(currentScript);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Ignored
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const res = validateScriptJson(text);
          if (res.valid && res.script) {
            onLoadScript(res.script);
            setUploadError(null);
            try {
              confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.7 },
              });
            } catch {
              // Confetti
            }
          } else {
            setUploadError(res.error || 'Invalid script format');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleToggleStep = (index: number) => {
    const updated = [...actions];
    updated[index] = {
      ...updated[index],
      enabled: !updated[index].enabled,
    };
    onUpdateScript({
      ...currentScript,
      actions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteStep = (index: number) => {
    const updated = actions.filter((_, idx) => idx !== index);
    onUpdateScript({
      ...currentScript,
      actions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === actions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...actions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onUpdateScript({
      ...currentScript,
      actions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveToPresets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    onSavePreset(saveName.trim(), currentScript.description || 'Custom Saved Recipe');
    setSaveName('');
    setShowSaveBox(false);
  };

  return (
    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs flex flex-col h-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                {lang === 'hi' ? '4. ऑटोमेशन स्क्रिप्ट पाइपलाइन' : '4. Automation Script Pipeline'}
              </h3>
              <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-blue-700">
                {activeCount} / {actions.length} {lang === 'hi' ? 'सक्रिय' : 'Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {lang === 'hi'
                ? 'रेसिपी डाउनलोड करें और नए टेक्स्ट पर 1-क्लिक ऑटो-क्लीन चलाएं'
                : 'Export recipe script & load on new text for instant clean'}
            </p>
          </div>
        </div>

        {executionDurationMs !== undefined && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            <Clock className="h-3 w-3 text-emerald-600" />
            <span>{executionDurationMs}ms</span>
          </div>
        )}
      </div>

      {/* Script Name & Description display */}
      <div className="mt-2 flex items-center justify-between rounded bg-slate-50 p-2 border border-slate-200">
        <div className="overflow-hidden">
          <h4 className="text-xs font-bold text-slate-800 truncate font-mono">{currentScript.name}</h4>
          <p className="text-[10px] text-slate-500 truncate font-sans">{currentScript.description || 'Recorded cleaning steps'}</p>
        </div>
        <button
          onClick={onOpenScriptEditor}
          className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {lang === 'hi' ? 'JSON' : 'JSON View'}
        </button>
      </div>

      {/* Top Action Buttons: DOWNLOAD SCRIPT & LOAD SCRIPT & RUN */}
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        {/* 1. Download Script (JSON) */}
        <button
          onClick={handleDownloadScript}
          className="flex items-center justify-center gap-1 rounded bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-blue-500 transition-all active:scale-98"
          title={lang === 'hi' ? 'क्लीनिंग स्क्रिप्ट फाइल (.json) डाउनलोड करें' : 'Download reusable cleaning script file (.json)'}
        >
          <Download className="h-3.5 w-3.5" />
          <span>{lang === 'hi' ? 'स्क्रिप्ट डाउनलोड' : 'Download Script'}</span>
        </button>

        {/* 2. Load Script File */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-all shadow-2xs active:scale-98"
          title={lang === 'hi' ? 'डाउनलोड की गई .json स्क्रिप्ट फाइल लोड करें' : 'Upload and load a saved .json script file'}
        >
          <Upload className="h-3.5 w-3.5 text-slate-500" />
          <span>{lang === 'hi' ? 'स्क्रिप्ट लोड' : 'Load File'}</span>
        </button>

        {/* 3. Run Automation Button */}
        <button
          onClick={onRunScript}
          className="flex items-center justify-center gap-1 rounded bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition-all active:scale-98"
          title={lang === 'hi' ? 'सभी स्टेप्स तुरंत चलाकर डेटा को ऑटो-क्लीन करें' : 'Execute all recipe steps on current text'}
        >
          <Play className="h-3 w-3 fill-white text-white" />
          <span>{lang === 'hi' ? '⚡ ऑटो-रन' : '⚡ Run Auto-Clean'}</span>
        </button>
      </div>

      {uploadError && (
        <div className="mt-2 rounded bg-red-50 p-1.5 text-xs text-red-700 border border-red-200 font-mono">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Preset Library Quick Selector */}
      {savedPresets.length > 0 && (
        <div className="mt-2 flex items-center gap-1 overflow-x-auto py-1 text-xs">
          <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            {lang === 'hi' ? 'सेव्ड:' : 'Saved:'}
          </span>
          {savedPresets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs shrink-0 hover:bg-slate-100 transition-colors"
            >
              <button
                onClick={() => onLoadScript(preset)}
                className="font-mono text-[11px] font-medium text-slate-800 hover:text-blue-600"
              >
                {preset.name}
              </button>
              <button
                onClick={() => onDeletePreset(preset.id)}
                className="text-slate-400 hover:text-red-600 text-xs px-0.5"
                title="Delete preset"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Steps List */}
      <div className="mt-2 flex-1 overflow-y-auto max-h-[380px] space-y-1.5 pr-1">
        {actions.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400 font-mono">
            {lang === 'hi'
              ? 'अभी तक कोई स्टेप नहीं जोड़ा गया है। ऊपर दिए टूल्स से सफाई शुरू करें।'
              : 'No pipeline steps recorded. Use cleaning tools to build steps.'}
          </div>
        ) : (
          actions.map((action, idx) => {
            const isInitial = action.type === 'INITIAL_SPLIT';
            const isCurrentDebugStep = activeStepIndex === idx;

            return (
              <div
                key={action.id || idx}
                className={`group flex items-center justify-between rounded border p-2 text-xs transition-all ${
                  !action.enabled
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : isCurrentDebugStep
                    ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-mono font-bold ${
                      action.enabled
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 truncate">{action.title}</span>
                      <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-mono text-slate-500">
                        {action.type}
                      </span>
                    </div>
                    {action.description && (
                      <p className="text-[10px] text-slate-500 truncate font-mono">{action.description}</p>
                    )}
                  </div>
                </div>

                {/* Step Action Controls: Toggle, Move, Delete */}
                <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                  {/* Step Inspector / Preview */}
                  {onSelectStepIndex && (
                    <button
                      onClick={() => onSelectStepIndex(isCurrentDebugStep ? undefined : idx)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold transition-colors ${
                        isCurrentDebugStep
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                      title={lang === 'hi' ? 'इस स्टेप तक का परिणाम देखें' : 'Preview result at this step'}
                    >
                      {isCurrentDebugStep ? 'Viewing' : 'Inspect'}
                    </button>
                  )}

                  {/* Enable / Disable toggle */}
                  <button
                    onClick={() => handleToggleStep(idx)}
                    className={`rounded p-1 transition-colors ${
                      action.enabled
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title={action.enabled ? 'Disable step' : 'Enable step'}
                  >
                    <Power className="h-3 w-3" />
                  </button>

                  {/* Move Up */}
                  {!isInitial && idx > 1 && (
                    <button
                      onClick={() => handleMoveStep(idx, 'up')}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Move step up"
                    >
                      <MoveUp className="h-3 w-3" />
                    </button>
                  )}

                  {/* Move Down */}
                  {!isInitial && idx > 0 && idx < actions.length - 1 && (
                    <button
                      onClick={() => handleMoveStep(idx, 'down')}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Move step down"
                    >
                      <MoveDown className="h-3 w-3" />
                    </button>
                  )}

                  {/* Delete Step */}
                  {!isInitial && (
                    <button
                      onClick={() => handleDeleteStep(idx)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete step"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save as Preset Drawer */}
      <div className="mt-2 border-t border-slate-200 pt-2">
        {showSaveBox ? (
          <form onSubmit={handleSaveToPresets} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={lang === 'hi' ? 'रेसिपी का नाम...' : 'Recipe Name (e.g. Courier Formatter)'}
                className="flex-1 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {lang === 'hi' ? 'सेव' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveBox(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSaveBox(true)}
              className="flex items-center gap-1 font-mono text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Bookmark className="h-3 w-3" />
              <span>{lang === 'hi' ? 'ब्राउज़र में रेसिपी सेव करें' : 'Save Preset'}</span>
            </button>

            <span className="font-mono text-[10px] text-slate-400">
              {lang === 'hi' ? 'रीयूजेबल स्क्रिप्ट' : 'Reusable Script'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
