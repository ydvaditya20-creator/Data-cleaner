import React from 'react';
import {
  Merge,
  Split,
  Trash2,
  Filter,
  Search,
  Type,
  Sparkles,
  Heading,
  ArrowDownToLine,
  ListFilter,
  Plus,
  Eraser,
  Hash,
  Layers,
  BookOpen,
  Calculator,
  ArrowRight,
} from 'lucide-react';

interface CleaningToolbarProps {
  onOpenMergeModal: () => void;
  onOpenSplitColumnModal: () => void;
  onOpenDeleteModal: () => void;
  onOpenSequenceModal?: () => void;
  onOpenFilterRowsModal: () => void;
  onOpenFindReplaceModal: () => void;
  onOpenCaseModal: () => void;
  onOpenTrimModal: () => void;
  onOpenCustomHeadersModal: () => void;
  onOpenFillModal: () => void;
  onOpenPrefixSuffixModal: () => void;
  onOpenFormulaModal?: () => void;
  onOpenInsertCellModal?: () => void;
  onOpenInsertRowColModal?: () => void;
  onQuickRemoveEmptyRows: () => void;
  onQuickDeduplicate: () => void;
  onPromoteFirstRowToHeader: () => void;
  lang: 'en' | 'hi';
  columnCount: number;
  rowCount: number;
  onToggleDictionary?: () => void;
  dictionaryRuleCount?: number;
  isDictionaryOpen?: boolean;
}

export const CleaningToolbar: React.FC<CleaningToolbarProps> = ({
  onOpenMergeModal,
  onOpenSplitColumnModal,
  onOpenDeleteModal,
  onOpenSequenceModal,
  onOpenFilterRowsModal,
  onOpenFindReplaceModal,
  onOpenCaseModal,
  onOpenTrimModal,
  onOpenCustomHeadersModal,
  onOpenFillModal,
  onOpenPrefixSuffixModal,
  onOpenFormulaModal,
  onOpenInsertCellModal,
  onOpenInsertRowColModal,
  onQuickRemoveEmptyRows,
  onQuickDeduplicate,
  onPromoteFirstRowToHeader,
  lang,
  columnCount,
  rowCount,
  onToggleDictionary,
  dictionaryRuleCount = 0,
  isDictionaryOpen = true,
}) => {
  return (
    <div className="rounded border border-slate-200 bg-white p-2.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-tight">
            {lang === 'hi' ? '2. डेटा ट्रांसफॉर्मेशन टूल्स (Manual Cleaning Palette)' : '2. Data Cleaning & Transformation Tools'}
          </h3>
          <span className="text-[10px] font-mono text-slate-400 italic">
            {lang === 'hi' ? 'कॉलम, पंक्तियाँ, सेल्स और फॉर्मूला इंजन' : 'Tabular Operations, Cells & Formula Engine'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleDictionary && (
            <button
              onClick={onToggleDictionary}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-mono font-medium transition-colors shadow-2xs ${
                isDictionaryOpen
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-3 w-3 text-emerald-600" />
              <span>{lang === 'hi' ? 'डिक्शनरी एवं ब्लैंक सेल' : 'Dictionary & Blanks'}</span>
              {dictionaryRuleCount > 0 && (
                <span className="ml-0.5 rounded-full bg-emerald-600 px-1.5 text-[9px] font-bold text-white">
                  {dictionaryRuleCount}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
            <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-medium">
              {columnCount} {lang === 'hi' ? 'कॉलम' : 'Cols'}
            </span>
            <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-medium">
              {rowCount} {lang === 'hi' ? 'पंक्तियाँ' : 'Rows'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Categorized */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Math & Formula Featured Group */}
        {onOpenFormulaModal && (
          <div className="flex items-center gap-1 rounded border border-indigo-300 bg-indigo-50/70 p-1">
            <span className="px-1 font-mono text-[9px] font-bold uppercase tracking-wider text-indigo-700">
              {lang === 'hi' ? 'फॉर्मूला' : 'Math'}
            </span>
            <button
              onClick={onOpenFormulaModal}
              className="inline-flex items-center gap-1 rounded border border-indigo-400 bg-white px-2 py-1 text-xs font-mono font-medium text-indigo-800 shadow-2xs hover:bg-indigo-100 transition-all"
              title={lang === 'hi' ? 'फॉर्मूला एवं गणना लागू करें (+, -, *, / आदि)' : 'Apply Formula (+, -, *, /) to Column or Range'}
            >
              <Calculator className="h-3 w-3 text-indigo-600" />
              <span>{lang === 'hi' ? 'फॉर्मूला एवं गणना (fx)' : 'Formula Engine'}</span>
            </button>
          </div>
        )}

        {/* Cell Shifting & Row/Col Insert Group */}
        <div className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50/50 p-1">
          <span className="px-1 font-mono text-[9px] font-bold uppercase tracking-wider text-blue-700">
            {lang === 'hi' ? 'सेल / पंक्ति' : 'Cells'}
          </span>

          {onOpenInsertCellModal && (
            <button
              onClick={onOpenInsertCellModal}
              className="inline-flex items-center gap-1 rounded border border-blue-300 bg-white px-2 py-1 text-xs font-medium text-blue-800 shadow-2xs hover:bg-blue-100 transition-all"
              title={lang === 'hi' ? 'सेल जोड़ें और दाएं/बाएं शिफ्ट करें' : 'Insert Cell & Shift Left/Right'}
            >
              <ArrowRight className="h-3 w-3 text-blue-600" />
              <span>{lang === 'hi' ? 'सेल जोड़ें (Shift)' : 'Insert Cell'}</span>
            </button>
          )}

          {onOpenInsertRowColModal && (
            <button
              onClick={onOpenInsertRowColModal}
              className="inline-flex items-center gap-1 rounded border border-blue-300 bg-white px-2 py-1 text-xs font-medium text-blue-800 shadow-2xs hover:bg-blue-100 transition-all"
              title={lang === 'hi' ? 'पंक्ति या कॉलम जोड़ें' : 'Insert Row or Column'}
            >
              <Plus className="h-3 w-3 text-blue-600" />
              <span>{lang === 'hi' ? 'पंक्ति/कॉलम जोड़ें' : 'Add Row/Col'}</span>
            </button>
          )}
        </div>

        {/* Column Group */}
        <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-1">
          <span className="px-1 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {lang === 'hi' ? 'कॉलम' : 'Cols'}
          </span>

          <button
            onClick={onOpenMergeModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
            title={lang === 'hi' ? 'दो या अधिक कॉलम एक साथ जोड़ें' : 'Combine 2+ columns with custom separator'}
          >
            <Merge className="h-3 w-3 text-blue-600" />
            <span>{lang === 'hi' ? 'मर्ज' : 'Merge'}</span>
          </button>

          <button
            onClick={onOpenSplitColumnModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
            title={lang === 'hi' ? 'कॉलम को स्पेस, कॉमा या कैरेक्टर से विभाजित करें' : 'Split a single column into multiple columns'}
          >
            <Split className="h-3 w-3 text-blue-600" />
            <span>{lang === 'hi' ? 'स्प्लिट' : 'Split'}</span>
          </button>

          <button
            onClick={onOpenDeleteModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
            title={lang === 'hi' ? 'अनावश्यक कॉलम हटाएं' : 'Remove unwanted columns'}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
            <span>{lang === 'hi' ? 'डिलीट' : 'Delete'}</span>
          </button>

          {onOpenSequenceModal && (
            <button
              onClick={onOpenSequenceModal}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
              title={lang === 'hi' ? '1, 2, 3... क्रम संख्या कॉलम जोड़ें' : 'Add Auto-Incrementing Sequence / Serial No Column'}
            >
              <Hash className="h-3 w-3 text-blue-600" />
              <span>{lang === 'hi' ? 'क्रम संख्या' : 'Sr. No.'}</span>
            </button>
          )}
        </div>

        {/* Rows & Header Group */}
        <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-1">
          <span className="px-1 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {lang === 'hi' ? 'पंक्तियाँ' : 'Rows'}
          </span>

          <button
            onClick={onPromoteFirstRowToHeader}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
            title={lang === 'hi' ? 'पहली पंक्ति को कॉलम हेडर बनाएं' : 'Use first row values as table headers'}
          >
            <Heading className="h-3 w-3 text-blue-600" />
            <span>{lang === 'hi' ? 'हेडर बनाएं' : 'Promote Header'}</span>
          </button>

          <button
            onClick={onOpenFilterRowsModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
            title={lang === 'hi' ? 'टेक्स्ट या पैटर्न के आधार पर पंक्तियाँ हटाएं/रखें' : 'Filter rows by keyword or condition'}
          >
            <Filter className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'फ़िल्टर' : 'Filter'}</span>
          </button>

          <button
            onClick={onQuickRemoveEmptyRows}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'खाली पंक्तियाँ तुरंत हटाएं' : 'Remove all empty rows'}
          >
            <Eraser className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'खाली हटाएं' : 'Trim Blanks'}</span>
          </button>

          <button
            onClick={onQuickDeduplicate}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'डुप्लिकेट पंक्तियाँ हटाएं' : 'Remove exact duplicate rows'}
          >
            <ListFilter className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'डिडुप' : 'Deduplicate'}</span>
          </button>
        </div>

        {/* Text & Formatting Group */}
        <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-1">
          <span className="px-1 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {lang === 'hi' ? 'टेक्स्ट' : 'Text'}
          </span>

          <button
            onClick={onOpenFindReplaceModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'खोजें और बदलें (Find and Replace)' : 'Search and replace text in columns'}
          >
            <Search className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'खोजें & बदलें' : 'Find & Replace'}</span>
          </button>

          <button
            onClick={onOpenTrimModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'अतिरिक्त स्पेस हटाएं' : 'Trim leading, trailing & extra spaces'}
          >
            <Eraser className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'स्पेस ट्रिम' : 'Trim'}</span>
          </button>

          <button
            onClick={onOpenCaseModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'केस बदलें (UPPER, lower, Title Case)' : 'Change text case'}
          >
            <Type className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'केस' : 'Case'}</span>
          </button>

          <button
            onClick={onOpenPrefixSuffixModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'करेंसी या सिम्बल जोड़ें' : 'Add prefix or suffix to column (e.g. ₹ or $)'}
          >
            <Plus className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'प्रिफ़िक्स' : 'Prefix/Suffix'}</span>
          </button>

          <button
            onClick={onOpenCustomHeadersModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'कॉलम हेडर नाम कस्टमाइज़ करें' : 'Rename all column headers'}
          >
            <Heading className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'हेडर' : 'Headers'}</span>
          </button>

          <button
            onClick={onOpenFillModal}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
            title={lang === 'hi' ? 'खाली सेल्स भरें या फिल डाउन करें' : 'Fill blanks or carry down values'}
          >
            <ArrowDownToLine className="h-3 w-3 text-slate-600" />
            <span>{lang === 'hi' ? 'फ़िल' : 'Fill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
