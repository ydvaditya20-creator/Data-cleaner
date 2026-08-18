import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CleaningAction,
  CleaningRecipeScript,
  DictionaryRule,
  InitialSplitConfig,
  SampleDataset,
  TableState,
} from './types';
import { SAMPLE_DATASETS } from './utils/sampleData';
import { executePipeline } from './utils/cleaningEngine';
import { downloadScriptJson } from './utils/exportUtils';
import { colIndexToLetter, formatCellCoordinate } from './utils/formulaEngine';
import { Header } from './components/Header';
import { RawInputSection } from './components/RawInputSection';
import { CleaningToolbar } from './components/CleaningToolbar';
import { DictionaryBlankManager } from './components/DictionaryBlankManager';
import { ActionModals } from './components/ActionModals';
import { TableViewer } from './components/TableViewer';
import { ScriptPipelinePanel } from './components/ScriptPipelinePanel';
import { ScriptModal } from './components/ScriptModal';
import { GuideModal } from './components/GuideModal';
import confetti from 'canvas-confetti';
import { CheckCircle2, Sparkles, Layers, ArrowRight } from 'lucide-react';

const LOCAL_STORAGE_PRESETS_KEY = 'text_to_tabular_saved_presets_v1';

const DEFAULT_INITIAL_SPLIT_CONFIG: InitialSplitConfig = {
  delimiter: 'spaces',
  treatConsecutiveSpacesAsOne: true,
  trimEachCell: true,
  removeEmptyInitialRows: true,
  firstRowIsHeader: false,
};

const INITIAL_DEFAULT_SCRIPT: CleaningRecipeScript = {
  version: '1.0',
  id: 'script_default',
  name: 'Default Text Cleaning Recipe',
  description: 'Initial space delimiter split and cleaning pipeline',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  actions: [
    {
      id: 'act_init_base',
      type: 'INITIAL_SPLIT',
      title: 'Initial Space Delimiter Split',
      description: 'Split text lines by multiple consecutive whitespace characters',
      enabled: true,
      config: DEFAULT_INITIAL_SPLIT_CONFIG,
    },
  ],
};

export default function App() {
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [rawText, setRawText] = useState<string>(SAMPLE_DATASETS[0].rawText);
  const [splitConfig, setSplitConfig] = useState<InitialSplitConfig>(DEFAULT_INITIAL_SPLIT_CONFIG);
  const [currentScript, setCurrentScript] = useState<CleaningRecipeScript>(
    SAMPLE_DATASETS[0].suggestedScript || INITIAL_DEFAULT_SCRIPT
  );
  const [dictionaryRules, setDictionaryRules] = useState<DictionaryRule[]>([
    {
      id: 'rule_default_1',
      original: 'State Bank India',
      replaceWith: 'State [BLANK] Bank [BLANK] [BLANK] India',
      enabled: true,
    },
  ]);
  const [showDictionaryManager, setShowDictionaryManager] = useState<boolean>(true);
  const [debugStepIndex, setDebugStepIndex] = useState<number | undefined>(undefined);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [savedPresets, setSavedPresets] = useState<CleaningRecipeScript[]>([]);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string } | null>(null);

  // Load presets from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY);
      if (stored) {
        setSavedPresets(JSON.parse(stored));
      } else {
        // Pre-fill with sample scripts
        const defaults = SAMPLE_DATASETS.filter((s) => s.suggestedScript).map(
          (s) => s.suggestedScript!
        );
        setSavedPresets(defaults);
      }
    } catch {
      // Ignored
    }
  }, []);

  // Synchronized script with dictionaryRules guaranteed included
  const fullScript = useMemo((): CleaningRecipeScript => {
    const validRules = dictionaryRules.filter((r) => r.original && r.original.trim().length > 0);
    const actionsCopy = [...currentScript.actions];
    const dictIdx = actionsCopy.findIndex((a) => a.type === 'DICTIONARY_REPLACE');

    if (validRules.length > 0) {
      const dictAction: CleaningAction = {
        id: dictIdx >= 0 ? actionsCopy[dictIdx].id : `act_dict_${Date.now()}`,
        type: 'DICTIONARY_REPLACE',
        title: 'Dictionary & Multi-Blank Cell Mapping',
        description: `${validRules.length} phrase & [BLANK] cell rules`,
        enabled: true,
        rules: dictionaryRules,
      };
      if (dictIdx >= 0) {
        actionsCopy[dictIdx] = dictAction;
      } else {
        const initIdx = actionsCopy.findIndex((a) => a.type === 'INITIAL_SPLIT');
        if (initIdx >= 0) {
          actionsCopy.splice(initIdx + 1, 0, dictAction);
        } else {
          actionsCopy.unshift(dictAction);
        }
      }
    } else if (dictIdx >= 0) {
      actionsCopy.splice(dictIdx, 1);
    }

    return {
      ...currentScript,
      dictionaryRules: validRules.length > 0 ? dictionaryRules : undefined,
      actions: actionsCopy,
      updatedAt: new Date().toISOString(),
    };
  }, [currentScript, dictionaryRules]);

  // Save presets helper
  const handleSavePreset = (name: string, description: string) => {
    const newPreset: CleaningRecipeScript = {
      ...fullScript,
      id: `preset_${Date.now()}`,
      name,
      description,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newPreset, ...savedPresets.filter((p) => p.name !== name)];
    setSavedPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(updated));
      showToast(
        lang === 'hi' ? 'रेसिपी सेव हो गई!' : 'Recipe Preset Saved!',
        lang === 'hi'
          ? `"${name}" ब्लैंक सेल नियमों के साथ आपके ब्राउज़र में सेव कर ली गई है।`
          : `Saved as "${name}" with blank cell logic in browser storage.`
      );
    } catch {
      // Storage full
    }
  };

  const handleDeletePreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const showToast = (title: string, desc?: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Keep initial split action in sync when user changes split config from top bar
  const handleSplitConfigChange = (newConfig: InitialSplitConfig) => {
    setSplitConfig(newConfig);
    const updatedActions = [...currentScript.actions];
    const initIdx = updatedActions.findIndex((a) => a.type === 'INITIAL_SPLIT');
    if (initIdx >= 0) {
      updatedActions[initIdx] = {
        ...updatedActions[initIdx],
        config: newConfig,
      } as any;
    } else {
      updatedActions.unshift({
        id: `act_init_${Date.now()}`,
        type: 'INITIAL_SPLIT',
        title: 'Initial Space Delimiter Split',
        enabled: true,
        config: newConfig,
      });
    }
    setCurrentScript({
      ...currentScript,
      actions: updatedActions,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add new transformation action to script pipeline
  const handleAddAction = (action: CleaningAction) => {
    setCurrentScript((prev) => ({
      ...prev,
      actions: [...prev.actions, action],
      updatedAt: new Date().toISOString(),
    }));
    setDebugStepIndex(undefined);
    showToast(
      lang === 'hi' ? 'स्टेप जोड़ा गया!' : 'Step Added to Recipe!',
      action.title
    );
  };

  // Load a complete sample dataset
  const handleLoadSample = (sample: SampleDataset) => {
    setRawText(sample.rawText);
    if (sample.suggestedScript) {
      setCurrentScript(sample.suggestedScript);
      const initAct = sample.suggestedScript.actions.find((a) => a.type === 'INITIAL_SPLIT');
      if (initAct) {
        setSplitConfig((initAct as any).config);
      }
      let extractedRules: DictionaryRule[] | undefined = sample.suggestedScript.dictionaryRules;
      if (!extractedRules || extractedRules.length === 0) {
        const dictAct = sample.suggestedScript.actions.find((a) => a.type === 'DICTIONARY_REPLACE');
        if (dictAct && (dictAct as any).rules) {
          extractedRules = (dictAct as any).rules;
        }
      }
      if (extractedRules && extractedRules.length > 0) {
        setDictionaryRules(extractedRules);
        setShowDictionaryManager(true);
      }
    }
    setDebugStepIndex(undefined);
    showToast(
      lang === 'hi' ? 'सैंपल डेटा लोड हो गया' : 'Sample Data Loaded',
      lang === 'hi' ? sample.titleHi : sample.title
    );
  };

  // Load recipe script from file or preset
  const handleLoadScript = (script: CleaningRecipeScript) => {
    setCurrentScript(script);
    const initAct = script.actions.find((a) => a.type === 'INITIAL_SPLIT');
    if (initAct) {
      setSplitConfig((initAct as any).config);
    }
    let extractedRules: DictionaryRule[] | undefined = script.dictionaryRules;
    if (!extractedRules || extractedRules.length === 0) {
      const dictAct = script.actions.find((a) => a.type === 'DICTIONARY_REPLACE');
      if (dictAct && (dictAct as any).rules) {
        extractedRules = (dictAct as any).rules;
      }
    }
    if (extractedRules && extractedRules.length > 0) {
      setDictionaryRules(extractedRules);
      setShowDictionaryManager(true);
    }
    setDebugStepIndex(undefined);
    showToast(
      lang === 'hi' ? '⚡ ऑटो-क्लीनिंग स्क्रिप्ट लोड हो गई!' : '⚡ Cleaning Script Loaded!',
      lang === 'hi'
        ? `"${script.name}" लोड हो गई (${extractedRules ? extractedRules.length : 0} ब्लैंक सेल नियमों के साथ)`
        : `Loaded "${script.name}" with ${extractedRules ? extractedRules.length : 0} blank cell rules.`
    );
  };

  // Sync dictionary rules directly to current recipe script actions
  const handleSyncDictionaryToPipeline = (rules: DictionaryRule[]) => {
    const updatedActions = [...currentScript.actions];
    const dictIdx = updatedActions.findIndex((a) => a.type === 'DICTIONARY_REPLACE');
    const newDictAction: CleaningAction = {
      id: `act_dict_${Date.now()}`,
      type: 'DICTIONARY_REPLACE',
      title: 'Dictionary & Multi-Blank Cell Mapping',
      description: `${rules.filter((r) => r.enabled !== false && r.original.trim()).length} phrase & [BLANK] rules`,
      enabled: true,
      rules,
    };

    if (dictIdx >= 0) {
      updatedActions[dictIdx] = newDictAction;
    } else {
      const initIdx = updatedActions.findIndex((a) => a.type === 'INITIAL_SPLIT');
      if (initIdx >= 0) {
        updatedActions.splice(initIdx + 1, 0, newDictAction);
      } else {
        updatedActions.unshift(newDictAction);
      }
    }

    setCurrentScript({
      ...currentScript,
      actions: updatedActions,
      updatedAt: new Date().toISOString(),
    });

    showToast(
      lang === 'hi' ? 'डिक्शनरी नियम पाइपलाइन में जुड़े!' : 'Dictionary Rules Synced to Script!',
      lang === 'hi'
        ? 'जब आप स्क्रिप्ट डाउनलोड करेंगे, तो यह नियम उसमें शामिल रहेंगे।'
        : 'Rules will be executed and exported with this recipe.'
    );
  };

  // Execute pipeline with synchronized fullScript actions
  const pipelineResult = useMemo(() => {
    return executePipeline(rawText, fullScript.actions, debugStepIndex);
  }, [rawText, fullScript.actions, debugStepIndex]);

  const { finalState, durationMs } = pipelineResult;

  // Run script / Auto Clean
  const handleRunScript = () => {
    setDebugStepIndex(undefined);
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti
    }
    showToast(
      lang === 'hi' ? '⚡ ऑटो-क्लीन सफलतापूर्वक पूरा हुआ!' : '⚡ Auto-Clean Executed Successfully!',
      lang === 'hi'
        ? `${currentScript.actions.length} स्टेप्स चले (${durationMs}ms में) - ${finalState.totalRows} पंक्तियाँ व्यवस्थित की गईं।`
        : `Ran ${currentScript.actions.length} steps in ${durationMs}ms on ${finalState.totalRows} rows.`
    );
  };

  // Quick Action Handlers
  const handleQuickRemoveEmptyRows = () => {
    handleAddAction({
      id: `act_filter_empty_${Date.now()}`,
      type: 'FILTER_ROWS',
      title: 'Remove Blank / Empty Rows',
      enabled: true,
      condition: 'is_not_empty',
    });
  };

  const handleQuickDeduplicate = () => {
    handleAddAction({
      id: `act_dedup_${Date.now()}`,
      type: 'REMOVE_DUPLICATES',
      title: 'Remove Duplicate Rows',
      enabled: true,
    });
  };

  const handlePromoteFirstRowToHeader = () => {
    handleAddAction({
      id: `act_promote_header_${Date.now()}`,
      type: 'SET_HEADERS_FROM_ROW',
      title: 'Promote First Row to Headers',
      enabled: true,
      rowIndex: 0,
      removeHeaderRow: true,
    });
  };

  const handleQuickDeleteColumn = (colIdx: number) => {
    handleAddAction({
      id: `act_del_col_${Date.now()}`,
      type: 'DELETE_COLUMNS',
      title: `Delete Column "${finalState.headers[colIdx]}"`,
      enabled: true,
      columnIndices: [colIdx],
    });
  };

  const handleQuickRenameColumn = (colIdx: number, newName: string) => {
    handleAddAction({
      id: `act_rename_${Date.now()}`,
      type: 'RENAME_COLUMN',
      title: `Rename Column ${colIdx + 1} to "${newName}"`,
      enabled: true,
      columnIndex: colIdx,
      newName,
    });
  };

  const handleResetAll = () => {
    setRawText('');
    setSplitConfig(DEFAULT_INITIAL_SPLIT_CONFIG);
    setCurrentScript(INITIAL_DEFAULT_SCRIPT);
    setDebugStepIndex(undefined);
    showToast(
      lang === 'hi' ? 'नया खाली सेशन शुरू किया गया' : 'New Session Started',
      lang === 'hi' ? 'डेटा रीसेट हो गया है।' : 'Workspace has been cleared.'
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-5 z-50 flex items-center gap-2.5 rounded bg-slate-900 text-white px-3.5 py-2.5 shadow-xl border border-slate-700 font-mono text-xs animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-white shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-bold text-white">{toastMessage.title}</p>
            {toastMessage.desc && <p className="text-[10px] text-slate-400 font-sans">{toastMessage.desc}</p>}
          </div>
        </div>
      )}

      {/* App Header */}
      <Header
        lang={lang}
        onToggleLang={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
        onResetAll={handleResetAll}
        scriptActionCount={fullScript.actions.length}
      />

      {/* Main Workspace Layout */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 sm:px-5 space-y-3">
        {/* Top Info Banner on First Load */}
        <div className="rounded border border-blue-200 bg-blue-50/70 p-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white shadow-xs font-mono text-xs font-bold">
                λ
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi'
                    ? '1. कच्चा टेक्स्ट पेस्ट करें ➔ 2. टूल्स से क्लीन करें ➔ 3. ऑटो-स्क्रिप्ट डाउनलोड करें'
                    : '1. Paste Raw Text Data ➔ 2. Structure into Tabular View ➔ 3. Export Reusable Script'}
                </h2>
                <p className="text-[11px] text-slate-600 font-mono">
                  {lang === 'hi'
                    ? 'डेटा क्लीनिंग रेसिपी सेव करें और अगली बार नए डेटा पर 1-क्लिक ऑटो-क्लीन रन करें।'
                    : 'Download script recipe once. Re-run on future batches with 1-click execution.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGuideModalOpen(true)}
                className="flex items-center gap-1 rounded border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 shadow-2xs hover:bg-blue-50 transition-colors"
              >
                <span>{lang === 'hi' ? 'वर्कफ़्लो गाइड' : 'Workflow Guide'}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 1. Raw Text Input Section */}
        <RawInputSection
          rawText={rawText}
          onRawTextChange={setRawText}
          splitConfig={splitConfig}
          onSplitConfigChange={handleSplitConfigChange}
          onApplyInitialSplit={() => {}}
          lang={lang}
          onLoadSample={handleLoadSample}
        />

        {/* 2. Cleaning Tools Palette */}
        <CleaningToolbar
          onOpenMergeModal={() => setActiveModal('merge')}
          onOpenSplitColumnModal={() => setActiveModal('split')}
          onOpenDeleteModal={() => setActiveModal('delete')}
          onOpenSequenceModal={() => setActiveModal('sequence')}
          onOpenFilterRowsModal={() => setActiveModal('filter')}
          onOpenFindReplaceModal={() => setActiveModal('findReplace')}
          onOpenCaseModal={() => setActiveModal('case')}
          onOpenTrimModal={() => setActiveModal('trim')}
          onOpenCustomHeadersModal={() => setActiveModal('customHeaders')}
          onOpenFillModal={() => setActiveModal('fill')}
          onOpenPrefixSuffixModal={() => setActiveModal('prefixSuffix')}
          onOpenFormulaModal={() => setActiveModal('formula')}
          onOpenInsertCellModal={() => setActiveModal('insert_cell')}
          onOpenInsertRowColModal={() => setActiveModal('insert_row_col')}
          onQuickRemoveEmptyRows={handleQuickRemoveEmptyRows}
          onQuickDeduplicate={handleQuickDeduplicate}
          onPromoteFirstRowToHeader={handlePromoteFirstRowToHeader}
          lang={lang}
          columnCount={finalState.headers.length}
          rowCount={finalState.rows.length}
          onToggleDictionary={() => setShowDictionaryManager(!showDictionaryManager)}
          dictionaryRuleCount={dictionaryRules.length}
          isDictionaryOpen={showDictionaryManager}
        />

        {/* 📖 Dictionary & Multi-Blank Cell Manager (Fixed Table Logic) */}
        {showDictionaryManager && (
          <DictionaryBlankManager
            rules={dictionaryRules}
            onUpdateRules={setDictionaryRules}
            lang={lang}
            rawText={rawText}
            onSyncToPipeline={handleSyncDictionaryToPipeline}
            onDownloadScript={() => downloadScriptJson(fullScript, `${fullScript.name.toLowerCase().replace(/\s+/g, '_')}.json`)}
            tableState={finalState}
          />
        )}

        {/* 3 & 4. Grid: Left Table View (7 cols) + Right Script Automation Pipeline (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* 3. Table Viewer (7 cols on lg screens) */}
          <div className="lg:col-span-7 space-y-3">
            <TableViewer
              tableState={finalState}
              lang={lang}
              onQuickDeleteColumn={handleQuickDeleteColumn}
              onQuickRenameColumn={handleQuickRenameColumn}
              onEditCell={(r, c, val) => {
                handleAddAction({
                  id: `act_edit_cell_${Date.now()}`,
                  type: 'EDIT_CELL',
                  title: `Edit Cell ${colIndexToLetter(c)}${r + 1} = "${val}"`,
                  description: `Live cell edit at [${r + 1}, ${c + 1}]`,
                  enabled: true,
                  rowIndex: r,
                  columnIndex: c,
                  value: val,
                });
              }}
              onInsertCell={(r, c, shift, val) => {
                handleAddAction({
                  id: `act_ins_cell_${Date.now()}`,
                  type: 'INSERT_CELL',
                  title: `Insert Cell at ${colIndexToLetter(c)}${r + 1} (Shift ${shift})`,
                  description: `Shift row items to ${shift}`,
                  enabled: true,
                  rowIndex: r,
                  columnIndex: c,
                  shiftDirection: shift,
                  fillValue: val,
                });
              }}
              onDeleteCell={(r, c, shift) => {
                handleAddAction({
                  id: `act_del_cell_${Date.now()}`,
                  type: 'DELETE_CELL',
                  title: `Delete Cell at ${colIndexToLetter(c)}${r + 1} (Shift ${shift})`,
                  description: `Delete cell and shift ${shift}`,
                  enabled: true,
                  rowIndex: r,
                  columnIndex: c,
                  shiftDirection: shift,
                });
              }}
              onInsertRow={(r, pos) => {
                handleAddAction({
                  id: `act_ins_row_${Date.now()}`,
                  type: 'INSERT_ROW',
                  title: `Insert Row ${pos} Row ${r + 1}`,
                  description: `Add blank row ${pos} row #${r + 1}`,
                  enabled: true,
                  rowIndex: r,
                  position: pos,
                });
              }}
              onDeleteRow={(r) => {
                handleAddAction({
                  id: `act_del_row_${Date.now()}`,
                  type: 'DELETE_ROW',
                  title: `Delete Row ${r + 1}`,
                  description: `Remove row #${r + 1}`,
                  enabled: true,
                  rowIndex: r,
                });
              }}
              onInsertColumn={(c, pos, name) => {
                const header = name || `New_Col_${Date.now().toString().slice(-4)}`;
                handleAddAction({
                  id: `act_ins_col_${Date.now()}`,
                  type: 'INSERT_COLUMN',
                  title: `Insert Column "${header}" ${pos} of Col ${colIndexToLetter(c)}`,
                  description: `Add new column ${pos} of column ${finalState.headers[c]}`,
                  enabled: true,
                  columnIndex: c,
                  position: pos,
                  headerName: header,
                });
              }}
              onApplyFormula={(formula, targetMode, customRange, colIdx, cellCoord) => {
                const rangeLabel = customRange
                  ? `${colIndexToLetter(customRange.startCol)}${customRange.startRow + 1}:${colIndexToLetter(customRange.endCol)}${customRange.endRow + 1}`
                  : targetMode === 'column' && colIdx !== undefined
                  ? `Col ${colIndexToLetter(colIdx)}`
                  : cellCoord
                  ? `${colIndexToLetter(cellCoord.col)}${cellCoord.row + 1}`
                  : 'All';

                handleAddAction({
                  id: `act_formula_${Date.now()}`,
                  type: 'APPLY_FORMULA',
                  title: `Formula: ${formula}`,
                  description: `Target: ${rangeLabel} (Other data remains unedited)`,
                  enabled: true,
                  formula,
                  targetMode,
                  customRange,
                  targetColumnIndex: colIdx,
                  cellCoordinate: cellCoord ? `${colIndexToLetter(cellCoord.col)}${cellCoord.row + 1}` : undefined,
                });
              }}
              onApplyRangeTransform={(type, range, fillValue) => {
                const rangeLabel = `${colIndexToLetter(range.startCol)}${range.startRow + 1}:${colIndexToLetter(range.endCol)}${range.endRow + 1}`;
                if (type === 'fill_empty') {
                  handleAddAction({
                    id: `act_fill_range_${Date.now()}`,
                    type: 'FILL_EMPTY',
                    title: `Fill Empty in Range ${rangeLabel} with "${fillValue || 'N/A'}"`,
                    description: `Target range: ${rangeLabel} (remaining data untouched)`,
                    enabled: true,
                    fillValue: fillValue || 'N/A',
                    range,
                  });
                } else if (type === 'trim') {
                  handleAddAction({
                    id: `act_trim_range_${Date.now()}`,
                    type: 'TRIM_SPACES',
                    title: `Trim Spaces in Range ${rangeLabel}`,
                    description: `Trim spaces in selected range ${rangeLabel}`,
                    enabled: true,
                    trimType: 'both',
                    range,
                  });
                } else if (type === 'uppercase' || type === 'lowercase' || type === 'titlecase') {
                  const caseTypeMap = {
                    uppercase: 'UPPER' as const,
                    lowercase: 'LOWER' as const,
                    titlecase: 'TITLE' as const,
                  };
                  handleAddAction({
                    id: `act_case_range_${Date.now()}`,
                    type: 'TEXT_CASE',
                    title: `Convert Range ${rangeLabel} to ${caseTypeMap[type]}`,
                    description: `Case transformation in range ${rangeLabel}`,
                    enabled: true,
                    caseType: caseTypeMap[type],
                    range,
                  });
                }
              }}
            />
          </div>

          {/* 4. Script Pipeline Panel (5 cols on lg screens) */}
          <div className="lg:col-span-5 space-y-3">
            <ScriptPipelinePanel
              currentScript={fullScript}
              onUpdateScript={setCurrentScript}
              onLoadScript={handleLoadScript}
              onRunScript={handleRunScript}
              lang={lang}
              onOpenScriptEditor={() => setIsScriptModalOpen(true)}
              activeStepIndex={debugStepIndex}
              onSelectStepIndex={setDebugStepIndex}
              savedPresets={savedPresets}
              onSavePreset={handleSavePreset}
              onDeletePreset={handleDeletePreset}
              executionDurationMs={durationMs}
            />
          </div>
        </div>
      </main>

      {/* High Density Status Footer */}
      <footer className="h-8 bg-slate-900 text-slate-400 flex items-center px-4 sm:px-6 text-[10px] font-mono justify-between shrink-0 border-t border-slate-800 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            System Engine: Space Parser v2.4
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">Execution Latency: {durationMs || 2}ms</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Active Pipeline: {fullScript.actions.length} Steps</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-emerald-400">Auto-Save: Ready</span>
        </div>
      </footer>

      {/* Modals */}
      <ActionModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onAddAction={handleAddAction}
        headers={finalState.headers}
        lang={lang}
      />

      <ScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        script={fullScript}
        onSaveScript={handleLoadScript}
        lang={lang}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
