import React, { useRef, useState } from 'react';
import {
  ClipboardPaste,
  FileText,
  Upload,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import { InitialSplitConfig, SampleDataset, SplitDelimiter } from '../types';
import { SAMPLE_DATASETS } from '../utils/sampleData';

interface RawInputSectionProps {
  rawText: string;
  onRawTextChange: (text: string) => void;
  splitConfig: InitialSplitConfig;
  onSplitConfigChange: (config: InitialSplitConfig) => void;
  onApplyInitialSplit: () => void;
  lang: 'en' | 'hi';
  onLoadSample: (sample: SampleDataset) => void;
}

export const RawInputSection: React.FC<RawInputSectionProps> = ({
  rawText,
  onRawTextChange,
  splitConfig,
  onSplitConfigChange,
  onApplyInitialSplit,
  lang,
  onLoadSample,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = rawText ? rawText.split('\n').filter((l) => l.trim().length > 0).length : 0;
  const wordCount = rawText ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = rawText.length;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onRawTextChange(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onRawTextChange(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onRawTextChange(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDelimiterChange = (delimiter: SplitDelimiter) => {
    onSplitConfigChange({
      ...splitConfig,
      delimiter,
      treatConsecutiveSpacesAsOne: delimiter === 'spaces',
    });
  };

  return (
    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
      {/* Top Bar: Title, Sample Selector, Upload & Paste */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">
            {lang === 'hi' ? '1. कच्चा टेक्स्ट डेटा पेस्ट करें' : '1. Paste Raw Text Data'}
          </label>
          <span className="text-[10px] font-mono text-slate-400 italic">
            {lang === 'hi' ? 'स्पेस-डिलिमिटेड ऑटो-डिटेक्ट एक्टिव' : 'Space-Delimited Auto-Detection Enabled'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <ClipboardPaste className="h-3 w-3 text-slate-500" />
            <span>{lang === 'hi' ? 'पेस्ट करें' : 'Paste Clipboard'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.csv,.tsv,.log,.dat"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Upload className="h-3 w-3 text-slate-500" />
            <span>{lang === 'hi' ? 'फ़ाइल अपलोड' : 'Upload File'}</span>
          </button>

          {rawText && (
            <button
              type="button"
              onClick={() => onRawTextChange('')}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              title={lang === 'hi' ? 'टेक्स्ट साफ़ करें' : 'Clear Text'}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Sample Demos bar */}
      <div className="mt-2 flex flex-wrap items-center gap-1 rounded bg-slate-100 p-1.5 border border-slate-200 text-xs">
        <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
          <Sparkles className="h-3 w-3 text-blue-600" />
          <span>{lang === 'hi' ? 'सैंपल डेटा लोड करें:' : 'Sample Library:'}</span>
        </span>
        {SAMPLE_DATASETS.map((sample) => (
          <button
            key={sample.id}
            onClick={() => onLoadSample(sample)}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-2xs"
          >
            {lang === 'hi' ? sample.titleHi.split(' ')[0] : sample.title}
          </button>
        ))}
      </div>

      {/* Text Area with Drag & Drop Zone */}
      <div
        className={`relative mt-2 rounded border transition-all ${
          isDragging
            ? 'border-dashed border-blue-500 bg-blue-50/50'
            : 'border-slate-300 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder={
            lang === 'hi'
              ? 'यहाँ अपना रॉ टेक्स्ट पेस्ट करें (उदा: 10.0.0.1 root success 2024-05-12 / कूरियर डेटा / बैंक स्टेटमेंट)...'
              : 'Paste your raw data here... e.g. 10.0.0.1 root success 2024-05-12'
          }
          rows={4}
          className="w-full resize-y rounded bg-slate-50 p-2.5 font-mono text-xs text-slate-800 focus:bg-white focus:outline-none leading-relaxed"
        />

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-blue-50/90 backdrop-blur-xs">
            <div className="text-center text-blue-700 font-mono text-xs">
              <Upload className="mx-auto h-6 w-6 animate-bounce" />
              <p className="mt-1 font-bold">
                {lang === 'hi' ? 'फ़ाइल यहाँ छोड़ें' : 'Drop text file to parse'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Bar & Split Configuration */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-slate-700">
            Lines: {lineCount}
          </span>
          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-slate-700">
            Tokens: {wordCount}
          </span>
          <span className="hidden sm:inline-flex text-slate-400">
            Chars: {charCount}
          </span>
        </div>

        {/* Delimiter Quick Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            {lang === 'hi' ? 'विभाजन:' : 'Split:'}
          </span>
          <button
            type="button"
            onClick={() => handleDelimiterChange('spaces')}
            className={`rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors ${
              splitConfig.delimiter === 'spaces'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            \s+ (Spaces)
          </button>
          <button
            type="button"
            onClick={() => handleDelimiterChange('single_space')}
            className={`rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors ${
              splitConfig.delimiter === 'single_space'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Single Space
          </button>
          <button
            type="button"
            onClick={() => handleDelimiterChange('tab')}
            className={`rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors ${
              splitConfig.delimiter === 'tab'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tab (\t)
          </button>
          <button
            type="button"
            onClick={() => handleDelimiterChange('comma')}
            className={`rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors ${
              splitConfig.delimiter === 'comma'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Comma (,)
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3 text-slate-500" />
            <span>{lang === 'hi' ? 'कस्टम' : 'Custom'}</span>
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Advanced Split Controls Drawer */}
      {showAdvanced && (
        <div className="mt-2 rounded border border-blue-200 bg-blue-50/50 p-2.5 text-xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Custom Delimiter */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-slate-600 mb-1">
                {lang === 'hi' ? 'कस्टम कैरेक्टर' : 'Custom Delimiter'}
              </label>
              <input
                type="text"
                value={splitConfig.customDelimiter || ''}
                onChange={(e) => {
                  onSplitConfigChange({
                    ...splitConfig,
                    delimiter: 'custom',
                    customDelimiter: e.target.value,
                  });
                }}
                placeholder="e.g. | or ;"
                className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Custom Regex Pattern */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-slate-600 mb-1">
                {lang === 'hi' ? 'कस्टम रेगेक्स' : 'Regex Pattern'}
              </label>
              <input
                type="text"
                value={splitConfig.customRegex || ''}
                onChange={(e) => {
                  onSplitConfigChange({
                    ...splitConfig,
                    delimiter: 'regex',
                    customRegex: e.target.value,
                  });
                }}
                placeholder="e.g. \s{2,} or [;,]"
                className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Checkbox Options */}
            <div className="flex flex-col justify-center space-y-1 font-mono text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitConfig.trimEachCell}
                  onChange={(e) =>
                    onSplitConfigChange({ ...splitConfig, trimEachCell: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700">{lang === 'hi' ? 'सेल्स ट्रिम करें' : 'Trim cell whitespace'}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitConfig.removeEmptyInitialRows}
                  onChange={(e) =>
                    onSplitConfigChange({ ...splitConfig, removeEmptyInitialRows: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700">{lang === 'hi' ? 'खाली पंक्तियाँ हटाएं' : 'Remove empty rows'}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitConfig.firstRowIsHeader}
                  onChange={(e) =>
                    onSplitConfigChange({ ...splitConfig, firstRowIsHeader: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700">{lang === 'hi' ? 'पंक्ति 1 हेडर है' : 'First row is header'}</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
