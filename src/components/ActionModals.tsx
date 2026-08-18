import React, { useState } from 'react';
import {
  X,
  Merge,
  Split,
  Trash2,
  Filter,
  Search,
  Type,
  Eraser,
  Heading,
  Plus,
  ArrowDownToLine,
  Check,
  Calculator,
  ArrowRight,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  CleaningAction,
  FilterCondition,
  CellRange,
} from '../types';
import { parseRangeString, colIndexToLetter } from '../utils/formulaEngine';

interface ActionModalsProps {
  activeModal: string | null;
  onClose: () => void;
  onAddAction: (action: CleaningAction) => void;
  headers: string[];
  lang: 'en' | 'hi';
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  activeModal,
  onClose,
  onAddAction,
  headers,
  lang,
}) => {
  // Merge state
  const [selectedMergeCols, setSelectedMergeCols] = useState<number[]>([]);
  const [mergeSeparator, setMergeSeparator] = useState(' ');
  const [mergeTargetName, setMergeTargetName] = useState('');
  const [mergeReplaceOriginals, setMergeReplaceOriginals] = useState(true);

  // Split state
  const [splitColIdx, setSplitColIdx] = useState(0);
  const [splitDelimType, setSplitDelimType] = useState<'space' | 'spaces' | 'comma' | 'dash' | 'custom' | 'regex'>('spaces');
  const [splitCustomDelim, setSplitCustomDelim] = useState('');
  const [splitCustomRegex, setSplitCustomRegex] = useState('');
  const [splitMaxSplits, setSplitMaxSplits] = useState(0);

  // Delete state
  const [selectedDeleteCols, setSelectedDeleteCols] = useState<number[]>([]);

  // Filter rows state
  const [filterColIdx, setFilterColIdx] = useState<number | 'all'>('all');
  const [filterCondition, setFilterCondition] = useState<FilterCondition>('not_contains');
  const [filterValue, setFilterValue] = useState('');
  const [filterCaseSensitive, setFilterCaseSensitive] = useState(false);

  // Find & Replace state
  const [frColIdx, setFrColIdx] = useState<number | 'all'>('all');
  const [frFindText, setFrFindText] = useState('');
  const [frReplaceText, setFrReplaceText] = useState('');
  const [frUseRegex, setFrUseRegex] = useState(false);
  const [frCaseSensitive, setFrCaseSensitive] = useState(false);
  const [frScope, setFrScope] = useState<'col' | 'range'>('col');
  const [frRangeStr, setFrRangeStr] = useState('');

  // Case state
  const [caseColIdx, setCaseColIdx] = useState<number | 'all'>('all');
  const [caseType, setCaseType] = useState<'UPPER' | 'LOWER' | 'TITLE' | 'SENTENCE'>('TITLE');
  const [caseScope, setCaseScope] = useState<'col' | 'range'>('col');
  const [caseRangeStr, setCaseRangeStr] = useState('');

  // Trim state
  const [trimColIdx, setTrimColIdx] = useState<number | 'all'>('all');
  const [trimType, setTrimType] = useState<'both' | 'start' | 'end' | 'collapse_internal'>('both');
  const [trimScope, setTrimScope] = useState<'col' | 'range'>('col');
  const [trimRangeStr, setTrimRangeStr] = useState('');

  // Prefix / Suffix state
  const [psColIdx, setPsColIdx] = useState(0);
  const [psPrefix, setPsPrefix] = useState('₹');
  const [psSuffix, setPsSuffix] = useState('');
  const [psScope, setPsScope] = useState<'col' | 'range'>('col');
  const [psRangeStr, setPsRangeStr] = useState('');

  // Custom Headers state
  const [customHeaderList, setCustomHeaderList] = useState<string[]>(headers);

  // Fill State
  const [fillMode, setFillMode] = useState<'empty' | 'down'>('empty');
  const [fillColIdx, setFillColIdx] = useState<number | 'all'>('all');
  const [fillValue, setFillValue] = useState('N/A');
  const [fillScope, setFillScope] = useState<'col' | 'range'>('col');
  const [fillRangeStr, setFillRangeStr] = useState('');

  // Sequence / Auto Number Column State
  const [seqColName, setSeqColName] = useState('Sr_No');
  const [seqStart, setSeqStart] = useState(1);
  const [seqStep, setSeqStep] = useState(1);
  const [seqPosition, setSeqPosition] = useState<'start' | 'end'>('start');

  // Formula & Calculation state
  const [formulaStr, setFormulaStr] = useState('=2*5+1/4-1');
  const [formulaTargetMode, setFormulaTargetMode] = useState<'column' | 'range' | 'all'>('column');
  const [formulaColIdx, setFormulaColIdx] = useState(0);
  const [formulaRangeStr, setFormulaRangeStr] = useState('A1:B10');

  // Insert Cell state
  const [cellRow, setCellRow] = useState(1);
  const [cellCol, setCellCol] = useState(0);
  const [cellShift, setCellShift] = useState<'right' | 'left'>('right');
  const [cellVal, setCellVal] = useState('');

  // Insert Row / Column state
  const [insertTargetType, setInsertTargetType] = useState<'row' | 'column'>('row');
  const [targetRowIdx, setTargetRowIdx] = useState(1);
  const [rowPosition, setRowPosition] = useState<'above' | 'below'>('below');
  const [targetColIdx, setTargetColIdx] = useState(0);
  const [colPosition, setColPosition] = useState<'left' | 'right'>('right');
  const [newColHeader, setNewColHeader] = useState('New_Column');

  if (!activeModal) return null;

  // Handlers
  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFormula = formulaStr.trim();
    if (!cleanFormula) return;

    let customRange: CellRange | undefined;
    if (formulaTargetMode === 'range' && formulaRangeStr) {
      customRange = parseRangeString(formulaRangeStr);
    }

    onAddAction({
      id: `act_formula_${Date.now()}`,
      type: 'APPLY_FORMULA',
      title: `Formula: ${cleanFormula}`,
      description: `Target: ${formulaTargetMode === 'column' ? headers[formulaColIdx] || 'Col' : formulaTargetMode === 'range' ? formulaRangeStr : 'All'}`,
      enabled: true,
      formula: cleanFormula,
      targetMode: formulaTargetMode,
      targetColumnIndex: formulaTargetMode === 'column' ? formulaColIdx : undefined,
      customRange,
    });
    onClose();
  };

  const handleInsertCellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = Math.max(0, cellRow - 1);
    const c = cellCol;
    onAddAction({
      id: `act_ins_cell_${Date.now()}`,
      type: 'INSERT_CELL',
      title: `Insert Cell at Row ${cellRow}, Col ${colIndexToLetter(c)} (Shift ${cellShift})`,
      description: `Shift row cells to ${cellShift}`,
      enabled: true,
      rowIndex: r,
      columnIndex: c,
      shiftDirection: cellShift,
      fillValue: cellVal,
    });
    onClose();
  };

  const handleInsertRowColSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (insertTargetType === 'row') {
      const r = Math.max(0, targetRowIdx - 1);
      onAddAction({
        id: `act_ins_row_${Date.now()}`,
        type: 'INSERT_ROW',
        title: `Insert Row ${rowPosition} Row ${targetRowIdx}`,
        description: `Add blank row ${rowPosition} row #${targetRowIdx}`,
        enabled: true,
        rowIndex: r,
        position: rowPosition,
      });
    } else {
      onAddAction({
        id: `act_ins_col_${Date.now()}`,
        type: 'INSERT_COLUMN',
        title: `Insert Column "${newColHeader}" ${colPosition} of Col ${colIndexToLetter(targetColIdx)}`,
        description: `Add new column ${colPosition} of column ${headers[targetColIdx]}`,
        enabled: true,
        columnIndex: targetColIdx,
        position: colPosition,
        headerName: newColHeader.trim() || 'New_Column',
      });
    }
    onClose();
  };

  const handleSequenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = seqColName.trim() || 'Sr_No';
    onAddAction({
      id: `act_seq_${Date.now()}`,
      type: 'ADD_SEQUENCE_COLUMN',
      title: `Add Sequence Column "${name}" (${seqStart}, ${seqStart + seqStep}...)`,
      description: `Add sequence column at ${seqPosition} with start ${seqStart} and step ${seqStep}`,
      enabled: true,
      columnName: name,
      startNumber: seqStart,
      step: seqStep,
      insertPosition: seqPosition,
    });
    onClose();
  };
  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMergeCols.length < 2) return;
    const name = mergeTargetName.trim() || `Merged_${selectedMergeCols.map((i) => headers[i] || `Col${i + 1}`).join('_')}`;
    onAddAction({
      id: `act_merge_${Date.now()}`,
      type: 'MERGE_COLUMNS',
      title: `Merge Columns [${selectedMergeCols.map((i) => headers[i]).join(', ')}]`,
      description: `Combine columns into "${name}" with "${mergeSeparator}"`,
      enabled: true,
      columnIndices: selectedMergeCols,
      separator: mergeSeparator,
      targetColumnName: name,
      replaceOriginals: mergeReplaceOriginals,
    });
    onClose();
  };

  const handleSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAction({
      id: `act_split_${Date.now()}`,
      type: 'SPLIT_COLUMN',
      title: `Split Column "${headers[splitColIdx]}"`,
      description: `Split by ${splitDelimType}`,
      enabled: true,
      columnIndex: splitColIdx,
      delimiterType: splitDelimType,
      customDelimiter: splitCustomDelim,
      customRegex: splitCustomRegex,
      maxSplits: splitMaxSplits > 0 ? splitMaxSplits : undefined,
    });
    onClose();
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDeleteCols.length === 0) return;
    onAddAction({
      id: `act_delete_${Date.now()}`,
      type: 'DELETE_COLUMNS',
      title: `Delete Columns [${selectedDeleteCols.map((i) => headers[i]).join(', ')}]`,
      enabled: true,
      columnIndices: selectedDeleteCols,
    });
    onClose();
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colName = filterColIdx === 'all' ? 'All Columns' : headers[filterColIdx];
    onAddAction({
      id: `act_filter_${Date.now()}`,
      type: 'FILTER_ROWS',
      title: `Filter Rows (${filterCondition} "${filterValue}")`,
      description: `Target: ${colName}`,
      enabled: true,
      targetColumnIndex: filterColIdx === 'all' ? undefined : filterColIdx,
      condition: filterCondition,
      value: filterValue,
      caseSensitive: filterCaseSensitive,
    });
    onClose();
  };

  const handleFindReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colName = frScope === 'range' ? `Range ${frRangeStr}` : frColIdx === 'all' ? 'All Columns' : headers[frColIdx];
    const parsedRange = frScope === 'range' && frRangeStr ? parseRangeString(frRangeStr) : undefined;
    onAddAction({
      id: `act_fr_${Date.now()}`,
      type: 'FIND_REPLACE',
      title: `Replace "${frFindText}" with "${frReplaceText}"`,
      description: `Target: ${colName}`,
      enabled: true,
      targetColumnIndex: frScope === 'col' && frColIdx !== 'all' ? frColIdx : undefined,
      findText: frFindText,
      replaceText: frReplaceText,
      useRegex: frUseRegex,
      caseSensitive: frCaseSensitive,
      range: parsedRange,
    });
    onClose();
  };

  const handleCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colName = caseScope === 'range' ? `Range ${caseRangeStr}` : caseColIdx === 'all' ? 'All Columns' : headers[caseColIdx];
    const parsedRange = caseScope === 'range' && caseRangeStr ? parseRangeString(caseRangeStr) : undefined;
    onAddAction({
      id: `act_case_${Date.now()}`,
      type: 'TEXT_CASE',
      title: `Convert Case to ${caseType}`,
      description: `Target: ${colName}`,
      enabled: true,
      targetColumnIndex: caseScope === 'col' && caseColIdx !== 'all' ? caseColIdx : undefined,
      caseType,
      range: parsedRange,
    });
    onClose();
  };

  const handleTrimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colName = trimScope === 'range' ? `Range ${trimRangeStr}` : trimColIdx === 'all' ? 'All Columns' : headers[trimColIdx];
    const parsedRange = trimScope === 'range' && trimRangeStr ? parseRangeString(trimRangeStr) : undefined;
    onAddAction({
      id: `act_trim_${Date.now()}`,
      type: 'TRIM_SPACES',
      title: `Trim Spaces (${trimType})`,
      description: `Target: ${colName}`,
      enabled: true,
      targetColumnIndex: trimScope === 'col' && trimColIdx !== 'all' ? trimColIdx : undefined,
      trimType,
      range: parsedRange,
    });
    onClose();
  };

  const handlePrefixSuffixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colName = psScope === 'range' ? `Range ${psRangeStr}` : headers[psColIdx];
    const parsedRange = psScope === 'range' && psRangeStr ? parseRangeString(psRangeStr) : undefined;
    onAddAction({
      id: `act_ps_${Date.now()}`,
      type: 'PREFIX_SUFFIX',
      title: `Add Prefix/Suffix to "${colName}"`,
      description: `Prefix: "${psPrefix}", Suffix: "${psSuffix}"`,
      enabled: true,
      targetColumnIndex: psScope === 'col' ? psColIdx : undefined,
      prefix: psPrefix,
      suffix: psSuffix,
      range: parsedRange,
    });
    onClose();
  };

  const handleCustomHeadersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAction({
      id: `act_headers_${Date.now()}`,
      type: 'CUSTOM_HEADERS',
      title: 'Rename Column Headers',
      description: `Set ${customHeaderList.length} header names`,
      enabled: true,
      headers: customHeaderList,
    });
    onClose();
  };

  const handleFillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fillMode === 'empty') {
      const colName = fillScope === 'range' ? `Range ${fillRangeStr}` : fillColIdx === 'all' ? 'All Columns' : headers[fillColIdx];
      const parsedRange = fillScope === 'range' && fillRangeStr ? parseRangeString(fillRangeStr) : undefined;
      onAddAction({
        id: `act_fill_empty_${Date.now()}`,
        type: 'FILL_EMPTY',
        title: `Fill Empty Cells with "${fillValue}"`,
        description: `Target: ${colName}`,
        enabled: true,
        targetColumnIndex: fillScope === 'col' && fillColIdx !== 'all' ? fillColIdx : undefined,
        fillValue,
        range: parsedRange,
      });
    } else {
      const idx = fillColIdx === 'all' ? 0 : fillColIdx;
      onAddAction({
        id: `act_fill_down_${Date.now()}`,
        type: 'FILL_DOWN',
        title: `Fill Down Values in "${headers[idx]}"`,
        description: 'Carry forward non-empty values downwards',
        enabled: true,
        targetColumnIndex: idx,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 1. MERGE COLUMNS MODAL */}
        {activeModal === 'merge' && (
          <form onSubmit={handleMergeSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Merge className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'कॉलम मर्ज करें (Merge Columns)' : 'Merge Columns'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi'
                    ? 'दो या दो से अधिक कॉलम को जोड़कर एक नया कॉलम बनाएं'
                    : 'Combine multiple columns into a single column'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'जोड़ने के लिए कॉलम चुनें (कम से कम 2)' : 'Select Columns to Merge (Select 2+)'}
              </label>
              <div className="max-h-36 overflow-y-auto rounded border border-slate-200 p-1.5 space-y-1 bg-slate-50">
                {headers.map((h, idx) => {
                  const isChecked = selectedMergeCols.includes(idx);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center justify-between rounded px-2 py-1 font-mono text-xs font-medium cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>
                        Col {idx + 1}: <strong className="font-semibold">{h}</strong>
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMergeCols([...selectedMergeCols, idx]);
                          } else {
                            setSelectedMergeCols(selectedMergeCols.filter((i) => i !== idx));
                          }
                        }}
                        className="hidden"
                      />
                      {isChecked && <Check className="h-3 w-3" />}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'सेपरेटर (Separator)' : 'Separator'}
                </label>
                <input
                  type="text"
                  value={mergeSeparator}
                  onChange={(e) => setMergeSeparator(e.target.value)}
                  placeholder="Space or - or ,"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'नए कॉलम का नाम' : 'Target Column Name'}
                </label>
                <input
                  type="text"
                  value={mergeTargetName}
                  onChange={(e) => setMergeTargetName(e.target.value)}
                  placeholder="e.g. Full Name"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-mono text-[11px]">
              <input
                type="checkbox"
                checked={mergeReplaceOriginals}
                onChange={(e) => setMergeReplaceOriginals(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{lang === 'hi' ? 'पुराने अलग-अलग कॉलम हटा दें (Replace original)' : 'Replace original merged columns'}</span>
            </label>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={selectedMergeCols.length < 2}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lang === 'hi' ? 'कॉलम मर्ज करें' : 'Apply Merge'}
              </button>
            </div>
          </form>
        )}

        {/* 2. SPLIT COLUMN MODAL */}
        {activeModal === 'split' && (
          <form onSubmit={handleSplitSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Split className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'कॉलम विभाजित करें (Split Column)' : 'Split Column'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'एक कॉलम को विभाजित कर कई कॉलम बनाएं' : 'Split a single column by delimiter into multiple columns'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'विभाजित करने के लिए कॉलम चुनें' : 'Column to Split'}
              </label>
              <select
                value={splitColIdx}
                onChange={(e) => setSplitColIdx(Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    Col {idx + 1}: {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'विभाजन का प्रकार (Split Delimiter)' : 'Split By'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'spaces', label: 'Multi Spaces (\\s+)' },
                  { key: 'space', label: 'Single Space' },
                  { key: 'comma', label: 'Comma (,)' },
                  { key: 'dash', label: 'Dash (-)' },
                  { key: 'custom', label: 'Custom Delim' },
                  { key: 'regex', label: 'Regex Pattern' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSplitDelimType(item.key as any)}
                    className={`rounded px-2 py-1 font-mono text-[11px] font-medium border transition-colors ${
                      splitDelimType === item.key
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {splitDelimType === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'कस्टम कैरेक्टर' : 'Custom Delimiter'}
                </label>
                <input
                  type="text"
                  value={splitCustomDelim}
                  onChange={(e) => setSplitCustomDelim(e.target.value)}
                  placeholder="e.g. / or | or #"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {splitDelimType === 'regex' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'रेगेक्स पैटर्न' : 'Regex Expression'}
                </label>
                <input
                  type="text"
                  value={splitCustomRegex}
                  onChange={(e) => setSplitCustomRegex(e.target.value)}
                  placeholder="e.g. [,-/]"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-500"
              >
                {lang === 'hi' ? 'स्प्लिट लागू करें' : 'Apply Split'}
              </button>
            </div>
          </form>
        )}

        {/* 3. DELETE COLUMNS MODAL */}
        {activeModal === 'delete' && (
          <form onSubmit={handleDeleteSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-red-50 text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'कॉलम हटाएं (Delete Columns)' : 'Delete Columns'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'अनावश्यक या खाली कॉलम हटाएं' : 'Select columns to remove from table'}
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded border border-slate-200 p-1.5 space-y-1 bg-slate-50">
              {headers.map((h, idx) => {
                const isChecked = selectedDeleteCols.includes(idx);
                return (
                  <label
                    key={idx}
                    className={`flex items-center justify-between rounded px-2 py-1 font-mono text-xs font-medium cursor-pointer transition-colors ${
                      isChecked ? 'bg-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>
                      Col {idx + 1}: <strong className="font-semibold">{h}</strong>
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDeleteCols([...selectedDeleteCols, idx]);
                        } else {
                          setSelectedDeleteCols(selectedDeleteCols.filter((i) => i !== idx));
                        }
                      }}
                      className="hidden"
                    />
                    {isChecked && <Check className="h-3 w-3" />}
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={selectedDeleteCols.length === 0}
                className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-red-700 disabled:opacity-50"
              >
                {lang === 'hi' ? 'चयनित हटाएं' : 'Delete Selected'}
              </button>
            </div>
          </form>
        )}

        {/* 4. FILTER ROWS MODAL */}
        {activeModal === 'filter' && (
          <form onSubmit={handleFilterSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-50 text-amber-600">
                <Filter className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'पंक्तियाँ फ़िल्टर करें (Filter Rows)' : 'Filter Rows'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi'
                    ? 'फ़ालतू हेडर, फुटर, या विशिष्ट टेक्स्ट वाली पंक्तियाँ हटाएं'
                    : 'Remove header/footer divider lines or rows matching criteria'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'टारगेट कॉलम' : 'Target Column'}
                </label>
                <select
                  value={filterColIdx}
                  onChange={(e) => setFilterColIdx(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">{lang === 'hi' ? 'पूरी पंक्ति (All Columns)' : 'Entire Row (All Cols)'}</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={idx}>
                      Col {idx + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'कंडीशन (Condition)' : 'Condition'}
                </label>
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value as FilterCondition)}
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="not_contains">{lang === 'hi' ? 'शामिल नहीं है (Remove if Contains)' : 'Remove if contains'}</option>
                  <option value="contains">{lang === 'hi' ? 'केवल वही रखें (Keep if Contains)' : 'Keep if contains'}</option>
                  <option value="starts_with">{lang === 'hi' ? 'शुरू होता है (Starts with)' : 'Starts with'}</option>
                  <option value="ends_with">{lang === 'hi' ? 'समाप्त होता है (Ends with)' : 'Ends with'}</option>
                  <option value="is_empty">{lang === 'hi' ? 'खाली पंक्तियाँ (Is Empty)' : 'Is empty'}</option>
                  <option value="is_not_empty">{lang === 'hi' ? 'जो खाली नहीं है (Is Not Empty)' : 'Is not empty'}</option>
                  <option value="matches_regex">{lang === 'hi' ? 'रेगेक्स मैच (Matches Regex)' : 'Matches Regex'}</option>
                  <option value="skip_first_n">{lang === 'hi' ? 'शुरुआती N पंक्तियाँ हटाएं' : 'Skip first N rows'}</option>
                  <option value="skip_last_n">{lang === 'hi' ? 'आखिरी N पंक्तियाँ हटाएं' : 'Skip last N rows'}</option>
                </select>
              </div>
            </div>

            {!['is_empty', 'is_not_empty'].includes(filterCondition) && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {filterCondition.startsWith('skip_')
                    ? lang === 'hi' ? 'संख्या (N)' : 'Number of rows (N)'
                    : lang === 'hi' ? 'टेक्स्ट / पैटर्न' : 'Text / Pattern value'}
                </label>
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={
                    filterCondition.startsWith('skip_')
                      ? 'e.g. 2'
                      : 'e.g. --- or PAGE or TOTAL'
                  }
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-amber-500"
              >
                {lang === 'hi' ? 'फ़िल्टर लागू करें' : 'Apply Filter'}
              </button>
            </div>
          </form>
        )}

        {/* 5. FIND AND REPLACE MODAL */}
        {activeModal === 'findReplace' && (
          <form onSubmit={handleFindReplaceSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Search className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'खोजें और बदलें (Find & Replace)' : 'Find & Replace'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'टेक्स्ट, सिम्बल या अंकों को बदलें' : 'Search and replace text across cells'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'टारगेट कॉलम' : 'Target Column'}
              </label>
              <select
                value={frColIdx}
                onChange={(e) => setFrColIdx(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">{lang === 'hi' ? 'सभी कॉलम (All Columns)' : 'All Columns'}</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    Col {idx + 1}: {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'क्या खोजना है (Find)' : 'Find Text'}
                </label>
                <input
                  type="text"
                  value={frFindText}
                  onChange={(e) => setFrFindText(e.target.value)}
                  placeholder="e.g. Rs. or USD or _"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'किससे बदलना है (Replace)' : 'Replace With'}
                </label>
                <input
                  type="text"
                  value={frReplaceText}
                  onChange={(e) => setFrReplaceText(e.target.value)}
                  placeholder="e.g. ₹ or leave empty"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-700 font-mono text-[11px]">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={frUseRegex}
                  onChange={(e) => setFrUseRegex(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Regex</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={frCaseSensitive}
                  onChange={(e) => setFrCaseSensitive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{lang === 'hi' ? 'केस सेंसिटिव' : 'Match Case'}</span>
              </label>
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-500"
              >
                {lang === 'hi' ? 'लागू करें' : 'Apply Replace'}
              </button>
            </div>
          </form>
        )}

        {/* 6. CASE CONVERSION MODAL */}
        {activeModal === 'case' && (
          <form onSubmit={handleCaseSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Type className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'टेक्स्ट केस बदलें (Change Case)' : 'Change Text Case'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'अक्षरों को अपरकेस, लोअरकेस या टाइटल केस में बदलें' : 'Standardize text capitalization'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'टारगेट कॉलम' : 'Target Column'}
              </label>
              <select
                value={caseColIdx}
                onChange={(e) => setCaseColIdx(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">{lang === 'hi' ? 'सभी कॉलम (All Columns)' : 'All Columns'}</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    Col {idx + 1}: {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'TITLE', label: 'Title Case (Rahul Sharma)' },
                { key: 'UPPER', label: 'UPPERCASE (MUMBAI)' },
                { key: 'LOWER', label: 'lowercase (delhi)' },
                { key: 'SENTENCE', label: 'Sentence case (Active status)' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCaseType(item.key as any)}
                  className={`rounded p-1.5 text-xs font-mono font-medium border text-left transition-colors ${
                    caseType === item.key
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-500"
              >
                {lang === 'hi' ? 'केस लागू करें' : 'Apply Case'}
              </button>
            </div>
          </form>
        )}

        {/* 7. TRIM SPACES MODAL */}
        {activeModal === 'trim' && (
          <form onSubmit={handleTrimSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Eraser className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'स्पेस ट्रिम करें (Trim Spaces)' : 'Trim Spaces'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'आगे-पीछे या बीच के अतिरिक्त खाली स्पेस हटाएं' : 'Clean leading, trailing and duplicate spaces'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'टारगेट कॉलम' : 'Target Column'}
              </label>
              <select
                value={trimColIdx}
                onChange={(e) => setTrimColIdx(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">{lang === 'hi' ? 'सभी कॉलम (All Columns)' : 'All Columns'}</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    Col {idx + 1}: {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'both', label: 'Trim Both Ends (Start & End)' },
                { key: 'collapse_internal', label: 'Collapse Internal Spaces' },
                { key: 'start', label: 'Trim Start Only' },
                { key: 'end', label: 'Trim End Only' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTrimType(item.key as any)}
                  className={`rounded p-1.5 font-mono text-xs font-medium border text-left transition-colors ${
                    trimType === item.key
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-500"
              >
                {lang === 'hi' ? 'ट्रिम लागू करें' : 'Apply Trim'}
              </button>
            </div>
          </form>
        )}

        {/* 8. PREFIX / SUFFIX MODAL */}
        {activeModal === 'prefixSuffix' && (
          <form onSubmit={handlePrefixSuffixSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'प्रिफ़िक्स / सफ़िक्स जोड़ें (Prefix & Suffix)' : 'Add Prefix / Suffix'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'करेंसी सिम्बल, यूनिट्स या कोड जोड़ें' : 'Attach currency signs or unit tags'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'टारगेट कॉलम' : 'Target Column'}
              </label>
              <select
                value={psColIdx}
                onChange={(e) => setPsColIdx(Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    Col {idx + 1}: {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'प्रिफ़िक्स (आगे जोड़ें)' : 'Prefix (Before)'}
                </label>
                <input
                  type="text"
                  value={psPrefix}
                  onChange={(e) => setPsPrefix(e.target.value)}
                  placeholder="e.g. ₹ or USD "
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'सफ़िक्स (पीछे जोड़ें)' : 'Suffix (After)'}
                </label>
                <input
                  type="text"
                  value={psSuffix}
                  onChange={(e) => setPsSuffix(e.target.value)}
                  placeholder="e.g. /mo or kg"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-500"
              >
                {lang === 'hi' ? 'लागू करें' : 'Apply'}
              </button>
            </div>
          </form>
        )}

        {/* 9. CUSTOM HEADERS MODAL */}
        {activeModal === 'customHeaders' && (
          <form onSubmit={handleCustomHeadersSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Heading className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'कॉलम हेडर एडिट करें (Rename Headers)' : 'Rename Column Headers'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'सभी कॉलम के नाम अपनी पसंद अनुसार बदलें' : 'Edit column titles for export & display'}
                </p>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {headers.map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-14 text-xs font-mono text-slate-500">Col {idx + 1}:</span>
                  <input
                    type="text"
                    value={customHeaderList[idx] ?? ''}
                    onChange={(e) => {
                      const updated = [...customHeaderList];
                      updated[idx] = e.target.value;
                      setCustomHeaderList(updated);
                    }}
                    placeholder={`Header ${idx + 1}`}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-slate-800"
              >
                {lang === 'hi' ? 'हेडर सेव करें' : 'Save Headers'}
              </button>
            </div>
          </form>
        )}

        {/* 10. FILL EMPTY / FILL DOWN MODAL */}
        {activeModal === 'fill' && (
          <form onSubmit={handleFillSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                <ArrowDownToLine className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'खाली सेल्स भरें (Fill Values)' : 'Fill Empty Cells & Fill Down'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'डिफ़ॉल्ट वैल्यू भरें या ऊपर की वैल्यू नीचे कॉपी करें' : 'Fill blanks or carry forward values downwards'}
                </p>
              </div>
            </div>

            <div className="flex rounded border border-slate-200 p-0.5 bg-slate-50 font-mono text-xs">
              <button
                type="button"
                onClick={() => setFillMode('empty')}
                className={`flex-1 rounded py-1 text-xs font-semibold transition-colors ${
                  fillMode === 'empty' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'hi' ? 'डिफ़ॉल्ट वैल्यू (Fill Empty)' : 'Fill Empty (Default)'}
              </button>
              <button
                type="button"
                onClick={() => setFillMode('down')}
                className={`flex-1 rounded py-1 text-xs font-semibold transition-colors ${
                  fillMode === 'down' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'hi' ? 'फ़िल डाउन (Fill Down)' : 'Fill Down'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'टारगेट कॉलम' : 'Target Column'}
              </label>
              <select
                value={fillColIdx}
                onChange={(e) => setFillColIdx(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {fillMode === 'empty' && (
                  <option value="all">{lang === 'hi' ? 'सभी कॉलम (All Columns)' : 'All Columns'}</option>
                )}
                {headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    Col {idx + 1}: {h}
                  </option>
                ))}
              </select>
            </div>

            {fillMode === 'empty' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'खाली जगह पर भरने वाली वैल्यू' : 'Replacement for empty cells'}
                </label>
                <input
                  type="text"
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  placeholder="e.g. N/A or 0 or Unknown"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-slate-800"
              >
                {lang === 'hi' ? 'लागू करें' : 'Apply'}
              </button>
            </div>
          </form>
        )}

        {/* SEQUENCE COLUMN MODAL */}
        {activeModal === 'sequence' && (
          <form onSubmit={handleSequenceSubmit} className="space-y-3 font-sans">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-100 text-blue-700">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'क्रम संख्या कॉलम जोड़ें (Add Sequence / Sr. No. Column)' : 'Add Auto-Incrementing Sequence Column'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'पंक्तियों के लिए 1, 2, 3, 4... क्रम संख्या बनाएं' : 'Add 1, 2, 3, 4 sequence indexing column to grid'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'कॉलम हेडर नाम (Column Header Name)' : 'Sequence Column Header'}
              </label>
              <input
                type="text"
                value={seqColName}
                onChange={(e) => setSeqColName(e.target.value)}
                placeholder="e.g. Sr_No or Index or Row_ID"
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'शुरुआती संख्या (Start Number)' : 'Start Value'}
                </label>
                <input
                  type="number"
                  value={seqStart}
                  onChange={(e) => setSeqStart(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'स्टेप / अंतराल (Step Increment)' : 'Step / Increment'}
                </label>
                <input
                  type="number"
                  value={seqStep}
                  onChange={(e) => setSeqStep(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'कॉलम की स्थिति (Position)' : 'Column Position'}
              </label>
              <div className="flex gap-3 text-xs font-mono">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="seqPos"
                    value="start"
                    checked={seqPosition === 'start'}
                    onChange={() => setSeqPosition('start')}
                  />
                  <span>{lang === 'hi' ? 'सबसे पहले (At Beginning / First Col)' : 'Beginning (First Col)'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="seqPos"
                    value="end"
                    checked={seqPosition === 'end'}
                    onChange={() => setSeqPosition('end')}
                  />
                  <span>{lang === 'hi' ? 'सबसे अंत में (At End / Last Col)' : 'End (Last Col)'}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-slate-800"
              >
                {lang === 'hi' ? 'कॉलम जोड़ें' : 'Add Column'}
              </button>
            </div>
          </form>
        )}

        {/* FORMULA & MATH MODAL */}
        {activeModal === 'formula' && (
          <form onSubmit={handleFormulaSubmit} className="space-y-3 font-sans">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-100 text-indigo-700">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'फॉर्मूला एवं गणना इंजन (Formula & Math Engine)' : 'Apply Formula & Math Engine'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? '+, -, *, /, सेल संदर्भ (A1, B1) या SUM(), AVG() लागू करें' : 'Support for 2*5+1/4-1, cell references A1*B1, and SUM/AVG'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                  {lang === 'hi' ? 'फॉर्मूला या गणितीय व्यंजक (Formula / Expression)' : 'Formula Expression'}
                </label>
                <span className="text-[10px] font-mono text-indigo-600">
                  {lang === 'hi' ? 'उदा. =2*5+1/4-1 या =A1*1.18' : 'e.g. =2*5+1/4-1 or =A1+B1'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs font-mono font-bold text-slate-400">fx</span>
                <input
                  type="text"
                  value={formulaStr}
                  onChange={(e) => setFormulaStr(e.target.value)}
                  placeholder="=2*5+1/4-1 or =A1*B1"
                  className="w-full rounded border border-indigo-300 pl-8 pr-2.5 py-1.5 font-mono text-xs text-slate-900 bg-indigo-50/30 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Math Templates */}
            <div className="rounded border border-slate-200 bg-slate-50 p-2 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {lang === 'hi' ? 'त्वरित फॉर्मूला टेम्पलेट्स (क्लिक करके चुनें):' : 'Quick Formula Templates:'}
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: '2*5+1/4-1', val: '=2*5+1/4-1' },
                  { label: 'A1 + B1', val: '=A1 + B1' },
                  { label: 'A1 * 1.18 (GST)', val: '=A1 * 1.18' },
                  { label: 'A1 - B1 (Diff)', val: '=A1 - B1' },
                  { label: 'SUM(A1:A10)', val: '=SUM(A1:A10)' },
                  { label: 'ROUND(A1/B1, 2)', val: '=ROUND(A1 / B1, 2)' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormulaStr(item.val)}
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'फॉर्मूला कहाँ लागू करें (Target Scope)' : 'Target Scope'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className={`flex flex-col p-2 rounded border cursor-pointer text-xs font-mono transition-all ${formulaTargetMode === 'column' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="fmtarget"
                      value="column"
                      checked={formulaTargetMode === 'column'}
                      onChange={() => setFormulaTargetMode('column')}
                    />
                    <span>{lang === 'hi' ? 'पूरा कॉलम' : 'Column'}</span>
                  </div>
                </label>

                <label className={`flex flex-col p-2 rounded border cursor-pointer text-xs font-mono transition-all ${formulaTargetMode === 'range' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="fmtarget"
                      value="range"
                      checked={formulaTargetMode === 'range'}
                      onChange={() => setFormulaTargetMode('range')}
                    />
                    <span>{lang === 'hi' ? 'सेल सीमा (Range)' : 'Range'}</span>
                  </div>
                </label>

                <label className={`flex flex-col p-2 rounded border cursor-pointer text-xs font-mono transition-all ${formulaTargetMode === 'all' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="fmtarget"
                      value="all"
                      checked={formulaTargetMode === 'all'}
                      onChange={() => setFormulaTargetMode('all')}
                    />
                    <span>{lang === 'hi' ? 'पूरी टेबल' : 'All'}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Target Column Selection */}
            {formulaTargetMode === 'column' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'टारगेट कॉलम चुनें' : 'Select Target Column'}
                </label>
                <select
                  value={formulaColIdx}
                  onChange={(e) => setFormulaColIdx(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  {headers.map((h, idx) => (
                    <option key={idx} value={idx}>
                      Col {colIndexToLetter(idx)} ({idx + 1}): {h}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Range Selection Input */}
            {formulaTargetMode === 'range' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'सेल रेंज दर्ज करें (जैसे A1:C10)' : 'Enter Cell Range (e.g. A1:C10)'}
                </label>
                <input
                  type="text"
                  value={formulaRangeStr}
                  onChange={(e) => setFormulaRangeStr(e.target.value)}
                  placeholder="e.g. A1:B10 or C2:D20"
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-emerald-600 font-mono mt-1">
                  ✓ {lang === 'hi' ? 'इस रेंज के बाहर का बाकी डेटा पूरी तरह सुरक्षित और अनएडिटेड रहेगा।' : 'Data outside this range remains completely safe and untouched.'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-indigo-700"
              >
                {lang === 'hi' ? 'फॉर्मूला लागू करें' : 'Apply Formula'}
              </button>
            </div>
          </form>
        )}

        {/* INSERT CELL MODAL */}
        {activeModal === 'insert_cell' && (
          <form onSubmit={handleInsertCellSubmit} className="space-y-3 font-sans">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-100 text-blue-700">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'सेल इन्सर्ट करें (Insert Cell & Shift)' : 'Insert Cell & Shift Direction'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'सेल जोड़ें और बाकी डेटा को दाएं (Right) या बाएं (Left) खिसकाएं' : 'Insert a cell and shift row data left or right'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'पंक्ति संख्या (Row Number)' : 'Row Number (1-based)'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={cellRow}
                  onChange={(e) => setCellRow(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                  {lang === 'hi' ? 'कॉलम (Column)' : 'Column'}
                </label>
                <select
                  value={cellCol}
                  onChange={(e) => setCellCol(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  {headers.map((h, idx) => (
                    <option key={idx} value={idx}>
                      {colIndexToLetter(idx)}: {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'शिफ्ट की दिशा (Shift Direction)' : 'Shift Direction'}
              </label>
              <div className="flex gap-4 text-xs font-mono">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="cellshift"
                    value="right"
                    checked={cellShift === 'right'}
                    onChange={() => setCellShift('right')}
                  />
                  <span>{lang === 'hi' ? 'दाएं शिफ्ट करें (Shift Right ➔)' : 'Shift Right ➔'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="cellshift"
                    value="left"
                    checked={cellShift === 'left'}
                    onChange={() => setCellShift('left')}
                  />
                  <span>{lang === 'hi' ? 'बाएं शिफ्ट करें (Shift Left ⬅)' : 'Shift Left ⬅'}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'नई सेल में वैल्यू (वैकल्पिक)' : 'Value for Inserted Cell (Optional)'}
              </label>
              <input
                type="text"
                value={cellVal}
                onChange={(e) => setCellVal(e.target.value)}
                placeholder="Leave blank for empty cell"
                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-700"
              >
                {lang === 'hi' ? 'सेल जोड़ें' : 'Insert Cell'}
              </button>
            </div>
          </form>
        )}

        {/* INSERT ROW / COLUMN MODAL */}
        {activeModal === 'insert_row_col' && (
          <form onSubmit={handleInsertRowColSubmit} className="space-y-3 font-sans">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-100 text-blue-700">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  {lang === 'hi' ? 'पंक्ति या कॉलम जोड़ें (Insert Row / Column)' : 'Insert Row or Column'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {lang === 'hi' ? 'शीट में ऊपर/नीचे पंक्ति या बाएं/दाएं कॉलम जोड़ें' : 'Insert new rows or columns at target position'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                {lang === 'hi' ? 'क्या जोड़ना चाहते हैं?' : 'What do you want to insert?'}
              </label>
              <div className="flex gap-4 text-xs font-mono">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="insType"
                    value="row"
                    checked={insertTargetType === 'row'}
                    onChange={() => setInsertTargetType('row')}
                  />
                  <span className="font-bold">{lang === 'hi' ? 'नई पंक्ति (Row)' : 'New Row'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="insType"
                    value="column"
                    checked={insertTargetType === 'column'}
                    onChange={() => setInsertTargetType('column')}
                  />
                  <span className="font-bold">{lang === 'hi' ? 'नया कॉलम (Column)' : 'New Column'}</span>
                </label>
              </div>
            </div>

            {insertTargetType === 'row' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                      {lang === 'hi' ? 'पंक्ति संख्या (Target Row)' : 'Target Row Number'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={targetRowIdx}
                      onChange={(e) => setTargetRowIdx(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                      {lang === 'hi' ? 'स्थिति (Position)' : 'Position'}
                    </label>
                    <select
                      value={rowPosition}
                      onChange={(e) => setRowPosition(e.target.value as any)}
                      className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="above">{lang === 'hi' ? 'ऊपर (Above)' : 'Above'}</option>
                      <option value="below">{lang === 'hi' ? 'नीचे (Below)' : 'Below'}</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                    {lang === 'hi' ? 'नए कॉलम का हेडर नाम' : 'New Column Header Name'}
                  </label>
                  <input
                    type="text"
                    value={newColHeader}
                    onChange={(e) => setNewColHeader(e.target.value)}
                    placeholder="e.g. Remarks or Status or Fee_Amount"
                    className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                      {lang === 'hi' ? 'किस कॉलम के पास' : 'Near Column'}
                    </label>
                    <select
                      value={targetColIdx}
                      onChange={(e) => setTargetColIdx(Number(e.target.value))}
                      className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    >
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>
                          {colIndexToLetter(idx)}: {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-tight">
                      {lang === 'hi' ? 'स्थिति (Position)' : 'Position'}
                    </label>
                    <select
                      value={colPosition}
                      onChange={(e) => setColPosition(e.target.value as any)}
                      className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="left">{lang === 'hi' ? 'बाएं (Left)' : 'Left'}</option>
                      <option value="right">{lang === 'hi' ? 'दाएं (Right)' : 'Right'}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-blue-700"
              >
                {lang === 'hi' ? 'जोड़ें' : 'Insert'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
