import React, { useState, useRef } from 'react';
import { DictionaryRule } from '../types';
import { downloadDictionaryJson, copyTableToClipboard } from '../utils/exportUtils';
import { detectAdjacentCellPhrases } from '../utils/cleaningEngine';
import {
  BookOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  Copy,
  Sparkles,
  Check,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  FolderOpen,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DictionaryBlankManagerProps {
  rules: DictionaryRule[];
  onUpdateRules: (newRules: DictionaryRule[]) => void;
  lang: 'hi' | 'en';
  rawText: string;
  onSyncToPipeline?: (rules: DictionaryRule[]) => void;
  onDownloadScript?: () => void;
  isAutoApplied?: boolean;
  onToggleAutoApply?: (enabled: boolean) => void;
  tableState?: any;
}

const PRESET_DICTIONARIES = [
  {
    name: '💰 Late Fee & Fee Payment (Compound Sequence Ledger)',
    nameHi: '💰 लेट फीस एवं फीस पेमेंट (कंडीशनल एडजसेंट सेल्स)',
    rules: [
      { id: 'f1', original: 'Late Fee', replaceWith: 'Late_Fee [BLANK]', enabled: true },
      { id: 'f2', original: 'Fee payment', replaceWith: 'Fee_Payment [BLANK]', enabled: true },
      { id: 'f3', original: 'Tuition Fee', replaceWith: 'Tuition_Fee [BLANK]', enabled: true },
      { id: 'f4', original: 'Late Fine', replaceWith: 'Late_Fine', enabled: true },
      { id: 'f5', original: 'Exam Fee', replaceWith: 'Exam_Fee [BLANK]', enabled: true },
    ],
  },
  {
    name: '🏦 Banking & Entities (State Bank / HDFC)',
    nameHi: '🏦 बैंकिंग शब्द और बैंक नाम (Multi-Blank)',
    rules: [
      { id: 'p1', original: 'State Bank India', replaceWith: 'State [BLANK] Bank [BLANK] [BLANK] India', enabled: true },
      { id: 'p2', original: 'Punjab National Bank', replaceWith: 'Punjab_National_Bank', enabled: true },
      { id: 'p3', original: 'Bank of Baroda', replaceWith: 'Bank [BLANK] Baroda', enabled: true },
      { id: 'p4', original: 'Account Number', replaceWith: 'Acc_No [BLANK] Verified', enabled: true },
      { id: 'p5', original: 'IFSC Code', replaceWith: 'IFSC_Code [BLANK] Branch', enabled: true },
    ],
  },
  {
    name: '📍 Addresses & Alignment (Pincode / District)',
    nameHi: '📍 पता एवं पिनकोड अलाइनमेंट (Multi-Blank)',
    rules: [
      { id: 'a1', original: 'New Delhi', replaceWith: 'New_Delhi', enabled: true },
      { id: 'a2', original: 'Uttar Pradesh', replaceWith: 'Uttar_Pradesh', enabled: true },
      { id: 'a3', original: 'PIN CODE', replaceWith: 'PIN [BLANK] [BLANK] CODE', enabled: true },
    ],
  },
  {
    name: '🔗 Space-to-Underscore (Combine Words)',
    nameHi: '🔗 शब्दों को जोड़ना (Underscore Join)',
    rules: [
      { id: 'u1', original: 'Total Amount', replaceWith: 'Total_Amount', enabled: true },
      { id: 'u2', original: 'Invoice Date', replaceWith: 'Invoice_Date', enabled: true },
      { id: 'u3', original: 'Customer Name', replaceWith: 'Customer_Name', enabled: true },
    ],
  },
];

export function DictionaryBlankManager({
  rules,
  onUpdateRules,
  lang,
  rawText,
  onSyncToPipeline,
  onDownloadScript,
  isAutoApplied = true,
  onToggleAutoApply,
  tableState,
}: DictionaryBlankManagerProps) {
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showAutoDetect, setShowAutoDetect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect adjacent compound phrases from raw text and current table
  const detectedPhrases = React.useMemo(() => {
    return detectAdjacentCellPhrases(rawText, tableState?.rows);
  }, [rawText, tableState]);

  // Live sequence test state
  const [testPhrase, setTestPhrase] = useState('');
  const [testReplace, setTestReplace] = useState('');

  // Live test matching results
  const testMatchResult = React.useMemo(() => {
    if (!testPhrase.trim() || !tableState?.rows) return null;
    const tokens = testPhrase.trim().split(/\s+/);
    const matchedRowIndices: number[] = [];

    tableState.rows.forEach((row: string[], rIdx: number) => {
      let isMatch = false;
      if (tokens.length > 1) {
        for (let j = 0; j <= row.length - tokens.length; j++) {
          let match = true;
          for (let k = 0; k < tokens.length; k++) {
            if ((row[j + k] ?? '').trim().toLowerCase() !== tokens[k].trim().toLowerCase()) {
              match = false;
              break;
            }
          }
          if (match) {
            isMatch = true;
            break;
          }
        }
      } else if (tokens.length === 1) {
        isMatch = row.some((c) => (c ?? '').trim().toLowerCase() === tokens[0].trim().toLowerCase());
      }
      if (isMatch) {
        matchedRowIndices.push(rIdx);
      }
    });

    return {
      tokens,
      matchCount: matchedRowIndices.length,
      sampleRows: matchedRowIndices.slice(0, 4).map((idx) => ({
        rowIdx: idx + 1,
        cells: tableState.rows[idx],
      })),
    };
  }, [testPhrase, tableState]);

  // Calculate live matching count in rawText
  const matchCount = React.useMemo(() => {
    if (!rawText) return 0;
    let count = 0;
    for (const rule of rules) {
      if (!rule.original.trim() || rule.enabled === false) continue;
      const safe = rule.original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const matches = rawText.match(new RegExp(safe, 'gi'));
      if (matches) count += matches.length;
    }
    return count;
  }, [rawText, rules]);

  // Add a new rule
  const handleAddRule = (fromVal = '', toVal = '') => {
    const newRule: DictionaryRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      original: fromVal,
      replaceWith: toVal,
      enabled: true,
    };
    onUpdateRules([...rules, newRule]);
  };

  // Remove a rule
  const handleRemoveRule = (id: string) => {
    onUpdateRules(rules.filter((r) => r.id !== id));
  };

  // Update a single rule field
  const handleRuleChange = (id: string, field: 'original' | 'replaceWith' | 'enabled', value: any) => {
    onUpdateRules(
      rules.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        // If updating "original" and "replaceWith" is empty, auto suggest underscore
        if (field === 'original' && !r.replaceWith) {
          updated.replaceWith = value.replace(/\s+/g, '_');
        }
        return updated;
      })
    );
  };

  // Auto replace spaces with underscores helper
  const handleAutoUnderscore = (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const underScored = rule.original.trim().replace(/\s+/g, '_');
    handleRuleChange(id, 'replaceWith', underScored);
  };

  // Insert token like [BLANK] at cursor or append
  const handleInsertToken = (id: string, token: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const current = rule.replaceWith || rule.original.trim();
    const updated = current ? `${current} ${token}` : token;
    handleRuleChange(id, 'replaceWith', updated);
  };

  // Download dictionary JSON
  const handleDownload = () => {
    downloadDictionaryJson(rules, 'my_dictionary.json');
  };

  // Upload dictionary JSON
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          const formatted: DictionaryRule[] = data
            .filter((item: any) => item && (item.original || item.from))
            .map((item: any, idx: number) => ({
              id: `imported_${Date.now()}_${idx}`,
              original: String(item.original || item.from || ''),
              replaceWith: String(item.replaceWith || item.to || ''),
              enabled: item.enabled !== false,
            }));
          onUpdateRules(formatted);
          alert(lang === 'hi' ? '✅ डिक्शनरी सफलतापूर्वक अपलोड हो गई!' : '✅ Dictionary uploaded successfully!');
        } else {
          alert(lang === 'hi' ? 'गलत फ़ाइल फॉर्मेट! कृपया मान्य JSON डिक्शनरी अपलोड करें।' : 'Invalid file format: JSON array required.');
        }
      } catch (err) {
        alert(lang === 'hi' ? 'फ़ाइल पढ़ने में त्रुटि हुई या JSON इनवैलिड है।' : 'Error reading JSON dictionary file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Copy table TSV to clipboard
  const handleCopyTable = async () => {
    if (tableState) {
      const ok = await copyTableToClipboard(tableState);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Load Preset
  const handleLoadPreset = (presetRules: DictionaryRule[]) => {
    const newItems = presetRules.map((r, idx) => ({
      ...r,
      id: `preset_${Date.now()}_${idx}`,
    }));
    onUpdateRules([...rules, ...newItems]);
    setShowPresets(false);
  };

  return (
    <div id="dictionary-blank-manager" className="rounded border border-emerald-300 bg-[#f4f7f6] p-3 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-200">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-white shadow-2xs">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight font-mono">
                {lang === 'hi'
                  ? '📖 डिक्शनरी एवं कंडीशनल सेल मैनेजर (Strict Adjacent Cell Rules)'
                  : '📖 Dictionary & Strict Adjacent Cell Matcher'}
              </h3>
              {matchCount > 0 && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-800 border border-emerald-300">
                  {matchCount} {lang === 'hi' ? 'मैच मिले' : 'Matches Active'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 font-sans mt-0.5">
              {lang === 'hi'
                ? 'कंडीशनल मैचिंग: "Late Fee" तभी बदलेगा जब पहली सेल में "Late" और अगली सेल में "Fee" मिले। "Late 500" या अकेला "Late" अपरिवर्तित रहेगा।'
                : 'Strict lookahead matching: "Late Fee" only applies if "Late" is strictly followed by "Fee".'}
            </p>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Auto Detect Button */}
          {detectedPhrases.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAutoDetect(!showAutoDetect)}
              className="flex items-center gap-1 rounded border border-emerald-400 bg-emerald-100 px-2 py-1 text-[11px] font-mono font-bold text-emerald-900 shadow-2xs hover:bg-emerald-200 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-emerald-700" />
              <span>
                {lang === 'hi'
                  ? `🔍 ऑटो-डिटेक्ट शब्द (${detectedPhrases.length})`
                  : `🔍 Auto-Detect Phrases (${detectedPhrases.length})`}
              </span>
            </button>
          )}

          {/* Download JSON */}
          <button
            type="button"
            onClick={handleDownload}
            title={lang === 'hi' ? 'डिक्शनरी JSON डाउनलोड करें' : 'Download Dictionary JSON'}
            className="flex items-center gap-1 rounded border border-emerald-400 bg-white px-2 py-1 text-[11px] font-mono font-medium text-emerald-800 shadow-2xs hover:bg-emerald-50 transition-colors"
          >
            <Download className="h-3 w-3 text-emerald-600" />
            <span>{lang === 'hi' ? '📥 Dictionary' : '📥 Dictionary'}</span>
          </button>

          {/* Upload JSON */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={lang === 'hi' ? 'डिक्शनरी JSON अपलोड करें' : 'Upload Dictionary JSON'}
            className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-mono font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Upload className="h-3 w-3 text-slate-500" />
            <span>{lang === 'hi' ? '📤 Upload' : '📤 Upload'}</span>
          </button>

          {/* Preset Rules */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-[11px] font-mono font-medium text-blue-700 shadow-2xs hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span>{lang === 'hi' ? '⚡ प्रीसेट' : '⚡ Presets'}</span>
            </button>

            {showPresets && (
              <div className="absolute right-0 top-7 z-30 w-72 rounded border border-slate-300 bg-white p-2 shadow-lg font-sans text-xs">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200 font-bold text-slate-700">
                  <span>{lang === 'hi' ? 'नियम प्रीसेट चुनें' : 'Select Rule Preset'}</span>
                  <button onClick={() => setShowPresets(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="space-y-1">
                  {PRESET_DICTIONARIES.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleLoadPreset(p.rules as any)}
                      className="w-full text-left p-1.5 rounded hover:bg-emerald-50 text-[11px] text-slate-700 hover:text-emerald-900 flex flex-col transition-colors border border-transparent hover:border-emerald-200"
                    >
                      <span className="font-bold">{lang === 'hi' ? p.nameHi : p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.rules.length} {lang === 'hi' ? 'नियम शामिल हैं' : 'rules included'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Copy Table */}
          {tableState && (
            <button
              type="button"
              onClick={handleCopyTable}
              className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-mono font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              <span>{copied ? (lang === 'hi' ? 'कॉपी हो गया!' : 'Copied!') : (lang === 'hi' ? '📋 कॉपी ग्रिड' : '📋 Copy Grid')}</span>
            </button>
          )}

          {/* Download Complete Automation Script Button */}
          {onDownloadScript && (
            <button
              type="button"
              onClick={onDownloadScript}
              title={lang === 'hi' ? 'ब्लैंक सेल और सभी क्लीनिंग नियमों के साथ ऑटोमेशन स्क्रिप्ट (.json) डाउनलोड करें' : 'Download Complete Automation Script (.json)'}
              className="flex items-center gap-1 rounded border border-blue-400 bg-blue-600 px-2.5 py-1 text-[11px] font-mono font-medium text-white shadow-2xs hover:bg-blue-500 transition-colors"
            >
              <Download className="h-3 w-3 text-white" />
              <span>{lang === 'hi' ? '📥 ऑटो-क्लीन स्क्रिप्ट (.json)' : '📥 Auto-Script (.json)'}</span>
            </button>
          )}

          {/* Sync to Pipeline */}
          {onSyncToPipeline && (
            <button
              type="button"
              onClick={() => onSyncToPipeline(rules)}
              title={lang === 'hi' ? 'रेसिपी पाइपलाइन में स्टेप के रूप में जोड़ें' : 'Add to Recipe Script Pipeline'}
              className="flex items-center gap-1 rounded border border-purple-300 bg-purple-50 px-2 py-1 text-[11px] font-mono font-medium text-purple-700 shadow-2xs hover:bg-purple-100 transition-colors"
            >
              <Zap className="h-3 w-3 text-purple-600" />
              <span>{lang === 'hi' ? '⚡ पाइपलाइन में जोड़ें' : '⚡ Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-detected Phrases Quick Add Drawer */}
      {showAutoDetect && detectedPhrases.length > 0 && (
        <div className="mt-2 rounded border border-emerald-400 bg-emerald-50/90 p-2 text-xs">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-emerald-200">
            <span className="font-mono font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              {lang === 'hi'
                ? 'डिटेक्ट किए गए लगातार जुड़े हुए शब्द (क्लिक करके सीधे नियम जोड़ें):'
                : 'Detected Adjacent Word Pairs in Current Data (Click to add):'}
            </span>
            <button
              onClick={() => setShowAutoDetect(false)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-mono font-bold px-1"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {detectedPhrases.map((dp, idx) => {
              const alreadyExists = rules.some((r) => r.original.toLowerCase() === dp.phrase.toLowerCase());
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!alreadyExists) {
                      handleAddRule(dp.phrase, dp.suggestedReplace);
                    }
                  }}
                  disabled={alreadyExists}
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[11px] transition-colors border ${
                    alreadyExists
                      ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-default'
                      : 'border-emerald-500 bg-white text-emerald-900 hover:bg-emerald-600 hover:text-white shadow-2xs'
                  }`}
                >
                  <span className="font-bold">{dp.phrase}</span>
                  <span className="text-[10px] opacity-75">({dp.count}x)</span>
                  {alreadyExists ? <Check className="h-3 w-3 text-slate-400" /> : <Plus className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Strict Adjacent Cell Rule Explanation Banner */}
      <div className="mt-2 rounded border border-blue-300 bg-blue-50/90 p-2 text-[11px] text-blue-950 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">✓</span>
            <span>
              {lang === 'hi'
                ? 'ऑटोमैटिक एडजसेंट सेल वेरिफिकेशन (Next-Cell Lookahead Active):'
                : 'Automatic Adjacent Cell Verification (Next-Cell Lookahead Active):'}
            </span>
          </div>
        </div>
        <p className="pl-5 text-slate-700 leading-tight">
          {lang === 'hi'
            ? 'यदि आपने नियम "Late Fee" बनाया है, तो यह केवल तभी लागू होगा जब पहली सेल में "Late" और उसकी तुरंत अगली सेल में "Fee" मौजूद हो। यदि "Late" के बाद "Fee" नहीं है (जैसे "Late 500"), तो वह सेल सुरक्षित रहेगी। इसी प्रकार "Fee payment" केवल "Fee" के बाद "payment" मिलने पर ही ऑपरेट होगा।'
            : 'Multi-token rules like "Late Fee" strictly verify that "Late" is immediately followed by "Fee" in the adjacent cell. Single occurrences like "Late 500" or isolated "Fee" are safely left untouched.'}
        </p>
      </div>

      {/* Live Sequence Inspector & Rule Tester Tool */}
      <div className="mt-2 rounded border border-amber-300 bg-amber-50/70 p-2.5 text-xs font-mono">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-200">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500 text-[10px] text-white font-bold">🔍</span>
            <span>
              {lang === 'hi'
                ? 'लाइव सीक्वेंस टेस्टर एवं मैच इंस्पेक्टर (Live Sequence Inspector):'
                : 'Live Sequence Inspector & Rule Tester:'}
            </span>
          </div>
          <span className="text-[10px] text-amber-800">
            {lang === 'hi' ? 'टेस्ट करें कि शब्द लगातार सेल में मौजूद हैं या नहीं' : 'Test if words appear in adjacent cells'}
          </span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              value={testPhrase}
              onChange={(e) => {
                setTestPhrase(e.target.value);
                if (!testReplace) {
                  setTestReplace(e.target.value.replace(/\s+/g, '_') + ' [BLANK]');
                }
              }}
              placeholder={lang === 'hi' ? 'जांचें (उदा. Late Fee या Fee payment)' : 'Test words (e.g. Late Fee)'}
              className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex-[1.2] min-w-[200px]">
            <input
              type="text"
              value={testReplace}
              onChange={(e) => setTestReplace(e.target.value)}
              placeholder={lang === 'hi' ? 'बदलाव (उदा. Late_Fee [BLANK])' : 'Replacement (e.g. Late_Fee [BLANK])'}
              className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (testPhrase.trim()) {
                const rep = testReplace.trim() || testPhrase.trim().replace(/\s+/g, '_') + ' [BLANK]';
                handleAddRule(testPhrase.trim(), rep);
                setTestPhrase('');
                setTestReplace('');
              }
            }}
            disabled={!testPhrase.trim()}
            className="shrink-0 rounded bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {lang === 'hi' ? '➕ नियम में जोड़ें' : '➕ Add Rule'}
          </button>
        </div>

        {/* Live Test Results feedback */}
        {testPhrase.trim() && testMatchResult && (
          <div className="mt-2 rounded border border-amber-200 bg-white p-2 text-[11px]">
            <div className="flex items-center justify-between font-bold">
              <span className={testMatchResult.matchCount > 0 ? 'text-emerald-700' : 'text-slate-500'}>
                {testMatchResult.matchCount > 0
                  ? (lang === 'hi'
                      ? `✅ डेटा में "${testPhrase}" की ${testMatchResult.matchCount} पंक्तियाँ लगातार मिलीं!`
                      : `✅ Found ${testMatchResult.matchCount} matching adjacent occurrences!`)
                  : (lang === 'hi'
                      ? `❌ डेटा में "${testPhrase}" लगातार सेल में नहीं मिला।`
                      : `❌ No adjacent sequence found for "${testPhrase}".`)}
              </span>
            </div>

            {testMatchResult.sampleRows.length > 0 && (
              <div className="mt-1 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold">
                  {lang === 'hi' ? 'मैच हुई पंक्तियाँ (नमूना):' : 'Matching Rows (Sample):'}
                </span>
                <div className="max-h-24 overflow-y-auto space-y-0.5 font-mono text-[10px]">
                  {testMatchResult.sampleRows.map((sr, i) => (
                    <div key={i} className="flex items-center gap-1 text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="font-bold text-blue-600">Row {sr.rowIdx}:</span>
                      <span className="truncate">{sr.cells.join(' | ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules list container */}
      <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto pr-1">
        {rules.length === 0 ? (
          <div className="rounded border border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-center text-xs text-slate-500 font-mono">
            <p>{lang === 'hi' ? 'अभी कोई डिक्शनरी नियम नहीं है।' : 'No dictionary rules defined yet.'}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAddRule('Late Fee', 'Late_Fee [BLANK]')}
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-mono font-bold text-white hover:bg-emerald-700"
              >
                <Plus className="h-3 w-3" />
                <span>{lang === 'hi' ? '+ Late Fee नियम' : '+ Late Fee Rule'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRule('Fee payment', 'Fee_Payment [BLANK]')}
                className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-mono font-bold text-white hover:bg-blue-700"
              >
                <Plus className="h-3 w-3" />
                <span>{lang === 'hi' ? '+ Fee payment नियम' : '+ Fee payment Rule'}</span>
              </button>
            </div>
          </div>
        ) : (
          rules.map((rule, index) => {
            const origTokens = (rule.original || '').trim().split(/\s+/).filter(Boolean);
            const isMultiToken = origTokens.length > 1;

            return (
              <div
                key={rule.id || index}
                className={`flex flex-col gap-1.5 rounded border p-2 transition-colors ${
                  rule.enabled !== false ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-100 opacity-60'
                }`}
              >
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                  {/* Checkbox toggle */}
                  <input
                    type="checkbox"
                    checked={rule.enabled !== false}
                    onChange={(e) => handleRuleChange(rule.id, 'enabled', e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    title={lang === 'hi' ? 'नियम सक्रिय / निष्क्रिय करें' : 'Enable/Disable Rule'}
                  />

                  {/* From Input */}
                  <div className="flex-1 min-w-[140px] relative">
                    <input
                      type="text"
                      value={rule.original}
                      onChange={(e) => handleRuleChange(rule.id, 'original', e.target.value)}
                      placeholder={lang === 'hi' ? 'शब्द (उदा. Late Fee या Fee payment)' : 'Phrase (e.g. Late Fee)'}
                      className="w-full rounded border border-slate-300 bg-slate-50/50 px-2 py-1 font-mono text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Auto underscore helper shortcut */}
                  <button
                    type="button"
                    onClick={() => handleAutoUnderscore(rule.id)}
                    title={lang === 'hi' ? 'स्पेस को अंडरस्कोर (_) में बदलें' : 'Convert spaces to underscores'}
                    className="shrink-0 rounded border border-slate-300 bg-slate-100 px-1.5 py-1 text-[10px] font-mono text-slate-600 hover:bg-slate-200"
                  >
                    _ join
                  </button>

                  {/* Arrow */}
                  <span className="font-mono text-xs font-bold text-slate-400 px-0.5">➔</span>

                  {/* To Input */}
                  <div className="flex-[1.4] min-w-[200px] relative">
                    <input
                      type="text"
                      value={rule.replaceWith}
                      onChange={(e) => handleRuleChange(rule.id, 'replaceWith', e.target.value)}
                      placeholder={lang === 'hi' ? 'बदला हुआ रूप (उदा. Late_Fee [BLANK])' : 'Replacement or [BLANK] tokens'}
                      className="w-full rounded border border-emerald-400 bg-white px-2 py-1 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none font-semibold"
                    />
                  </div>

                  {/* Token Shortcut Chips */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleInsertToken(rule.id, '[BLANK]')}
                      title={lang === 'hi' ? '[BLANK] खाली सेल टोकन जोड़ें' : 'Add 1 Blank Cell'}
                      className="rounded border border-amber-300 bg-amber-50 px-1.5 py-1 text-[10px] font-mono font-bold text-amber-800 hover:bg-amber-100"
                    >
                      +[BLANK]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertToken(rule.id, '[BLANK] [BLANK]')}
                      title={lang === 'hi' ? '2 खाली सेल जोड़ें' : 'Add 2 Blank Cells'}
                      className="rounded border border-amber-300 bg-amber-50 px-1.5 py-1 text-[10px] font-mono font-bold text-amber-800 hover:bg-amber-100"
                    >
                      +2x[B]
                    </button>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      title={lang === 'hi' ? 'यह नियम हटाएं' : 'Remove Rule'}
                      className="rounded border border-rose-200 bg-rose-50 p-1 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Multi-token Lookahead Condition Badge */}
                {isMultiToken && (
                  <div className="flex items-center gap-1.5 pl-6 text-[10px] font-mono text-emerald-800 bg-emerald-50/60 rounded px-1.5 py-0.5 border border-emerald-200/60">
                    <span className="font-bold">⚡ Strict Sequence Match:</span>
                    <span>
                      {origTokens.map((tok, ti) => (
                        <span key={ti}>
                          <span className="rounded bg-white px-1 py-0.2 border border-emerald-300 text-emerald-900 font-bold">
                            &quot;{tok}&quot;
                          </span>
                          {ti < origTokens.length - 1 && <span className="mx-0.5 text-emerald-600">➔ (Next Cell)</span>}
                        </span>
                      ))}
                    </span>
                    <span className="text-slate-500 italic ml-auto hidden md:inline">
                      {lang === 'hi'
                        ? '(सिर्फ तभी जब सभी शब्द इसी क्रम में मिलें)'
                        : '(Only matches when cells appear in exact sequence)'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Bar: Add Rule & Helpers */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200 text-xs">
        <button
          type="button"
          onClick={() => handleAddRule('', '')}
          className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-mono font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{lang === 'hi' ? '➕ नया नियम जोड़ें (Add Rule)' : '➕ Add New Rule'}</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>
            {lang === 'hi'
              ? `कुल नियम: ${rules.length} | सक्रिय: ${rules.filter((r) => r.enabled !== false).length}`
              : `Total Rules: ${rules.length} | Active: ${rules.filter((r) => r.enabled !== false).length}`}
          </span>
          {rules.length > 0 && (
            <button
              type="button"
              onClick={() => onUpdateRules([])}
              className="text-rose-600 hover:underline text-[10px]"
            >
              {lang === 'hi' ? 'सब साफ़ करें' : 'Clear All'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
