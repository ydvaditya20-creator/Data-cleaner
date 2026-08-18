import React, { useState } from 'react';
import {
  X,
  ClipboardPaste,
  Sliders,
  Download,
  Upload,
  Play,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
  Columns3,
  Split,
  Combine,
  Type,
  Eraser,
  Hash,
  Filter,
  Layers,
  BookOpen,
  Github,
  Globe,
  Copy,
  Check,
  Code2,
  Sparkles,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

type GuideTab = 'workflow' | 'formulas' | 'columns' | 'cells' | 'text' | 'advanced' | 'github';

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('workflow');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tabs: { id: GuideTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'workflow',
      label: lang === 'hi' ? '1. वर्कफ़्लो (5-स्टेप्स)' : '1. Workflow (5 Steps)',
      icon: <Play className="h-3.5 w-3.5" />,
    },
    {
      id: 'formulas',
      label: lang === 'hi' ? '2. फॉर्मूला & मैथ' : '2. Formulas & Math',
      icon: <Calculator className="h-3.5 w-3.5" />,
    },
    {
      id: 'columns',
      label: lang === 'hi' ? '3. कॉलम टूल्स (Merge/Split)' : '3. Column Tools',
      icon: <Columns3 className="h-3.5 w-3.5" />,
    },
    {
      id: 'cells',
      label: lang === 'hi' ? '4. सेल & रो (Insert/Delete)' : '4. Cells & Rows',
      icon: <Sliders className="h-3.5 w-3.5" />,
    },
    {
      id: 'text',
      label: lang === 'hi' ? '5. टेक्स्ट फ़ॉर्मेटिंग' : '5. Text Cleaning',
      icon: <Type className="h-3.5 w-3.5" />,
    },
    {
      id: 'advanced',
      label: lang === 'hi' ? '6. डिक्शनरी & ब्लैंक' : '6. Smart Tools',
      icon: <Layers className="h-3.5 w-3.5" />,
    },
    {
      id: 'github',
      label: lang === 'hi' ? '7. GitHub लाइव डिप्लॉय' : '7. GitHub Deployment',
      icon: <Github className="h-3.5 w-3.5 text-slate-800" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-mono text-sm font-bold text-white shadow-xs">
              δ
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                {lang === 'hi' ? 'डेटा क्लीनर — सम्पूर्ण टूल गाइड & उदाहरण' : 'DataCleaner — Complete Guide & Tool Examples'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {lang === 'hi'
                  ? 'हर टूल का सटीक उपयोग, उदाहरण और GitHub पर लाइव होस्टिंग की गाइड'
                  : 'Practical real-world examples for every transformation tool & GitHub deployment'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-100/70 px-3 py-1.5 gap-1.5 scrollbar-thin text-xs font-medium">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-all text-xs font-semibold ${
                activeTab === t.id
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-slate-700 space-y-4">
          {/* TAB 1: 5-STEP WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-blue-900">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-600" />
                  {lang === 'hi' ? '5-स्टेप ऑटोमेशन वर्कफ़्लो (Complete Lifecycle)' : '5-Step Automation Workflow'}
                </h4>
                <p className="mt-1 text-xs text-blue-800">
                  {lang === 'hi'
                    ? 'एक बार मैन्युअल क्लीन करके रेसिपी सेव कर लें, अगली बार सिर्फ 1-क्लिक में हज़ारों रिकॉर्ड्स अपने आप क्लीन हो जाएंगे।'
                    : 'Clean once manually, save your recipe script (.json), and run 1-click batch transformation on future raw files.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-1">
                {/* Step 1 */}
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ClipboardPaste className="h-3.5 w-3.5 text-blue-600" />
                      <span>{lang === 'hi' ? 'कच्चा टेक्स्ट पेस्ट करें (Paste Raw Text)' : 'Paste Raw Text'}</span>
                    </h5>
                    <p className="mt-1 text-slate-600">
                      {lang === 'hi'
                        ? 'ऊपर दिए गए टेक्स्ट बॉक्स में स्पेस या टैब से अलग किया हुआ कच्चा डेटा (जैसे कूरियर शीट, बैंक स्टेटमेंट, चालान डेटा) पेस्ट करें। टूल इसे तुरंत टेबल में बदल देगा।'
                        : 'Paste unformatted space/tab-delimited text into the input box. The parser immediately formats it into grid columns & rows.'}
                    </p>
                    <div className="mt-2 rounded bg-slate-900 p-2 font-mono text-[11px] text-emerald-400">
                      INV-101 Rahul Sharma 12/04/2025 Mumbai 1500 Paid
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-blue-600" />
                      <span>{lang === 'hi' ? 'टूल्स से डेटा साफ़ और व्यवस्थित करें (Clean & Structure)' : 'Clean & Structure'}</span>
                    </h5>
                    <p className="mt-1 text-slate-600">
                      {lang === 'hi'
                        ? 'ऊपर टूलबार का उपयोग करें: "मर्ज कॉलम" से बंटे हुए नाम जोड़ें, "कॉलम हटाएं" से फ़ालतू स्पेस हटाएं, "फ़िल्टर रो" से डिवाइडर हटाएं और "हेडर बनाएं" से शीर्ष शीर्षक सेट करें।'
                        : 'Apply transformation tools: Merge Columns (e.g. Rahul + Sharma), Delete blank split columns, Filter divider lines, Apply Math Formulas, and Set Headers.'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-600 font-bold text-white text-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{lang === 'hi' ? 'स्क्रिप्ट डाउनलोड करें (.json)' : 'Download Recipe Script (.json)'}</span>
                    </h5>
                    <p className="mt-1 text-emerald-800">
                      {lang === 'hi'
                        ? 'जब टेबल पूरी तरह तैयार हो जाए, "स्क्रिप्ट डाउनलोड (.json)" बटन दबाएं। आपके सभी क्लीनिंग स्टेप्स की रेसिपी फ़ाइल सेव हो जाएगी।'
                        : 'When your table is perfectly cleaned, click "Export Script (JSON)" to download the reusable transformation pipeline recipe.'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600 font-bold text-white text-xs">
                    4
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-violet-950 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-violet-600" />
                      <span>{lang === 'hi' ? 'अगली बार: 1-क्लिक ऑटो-क्लीन (Replay Recipe)' : '1-Click Automated Batch Cleaning'}</span>
                    </h5>
                    <p className="mt-1 text-violet-800">
                      {lang === 'hi'
                        ? 'अगली बार जब नया डेटा मिले: नया टेक्स्ट पेस्ट करें, "स्क्रिप्ट लोड करें" बटन से अपनी सेव की गई .json चुनें और "⚡ ऑटो-क्लीन रन करें" दबाएं। डेटा 1 सेकंड में क्लीन हो जाएगा!'
                        : 'In future sessions, paste fresh raw data, click "Load Script", and click "⚡ Run Auto-Clean". All steps apply in under 1 second!'}
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 font-bold text-white text-xs">
                    5
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-slate-700" />
                      <span>{lang === 'hi' ? 'Excel, CSV या क्लिपबोर्ड में एक्सपोर्ट करें' : 'Export Clean Data'}</span>
                    </h5>
                    <p className="mt-1 text-slate-600">
                      {lang === 'hi'
                        ? 'साफ़ टेबल को सीधे Excel (.xlsx), CSV, TSV, JSON में सेव करें या 1-क्लिक कॉपी करके सीधे Google Sheets में पेस्ट करें।'
                        : 'Export to Excel (.xlsx), CSV, TSV, JSON, Python Pandas script, or 1-click copy directly into Google Sheets.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORMULAS & MATH */}
          {activeTab === 'formulas' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-blue-950">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  {lang === 'hi' ? 'फॉर्मूला बार और गणितीय गणना (Math & Formulas)' : 'Formula Engine & Math Reference'}
                </h4>
                <p className="mt-1 text-xs text-blue-850">
                  {lang === 'hi'
                    ? 'टेबल के ऊपर दिए गए फॉर्मूला बार (fx) में कोई भी गणितीय समीकरण या सेल संदर्भ लिखकर Enter दबाएं।'
                    : 'Type expressions or cell references in the top formula bar (fx) and press Enter to evaluate.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Math Arithmetic */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                    {lang === 'hi' ? 'अंकगणित समीकरण (Arithmetic)' : 'Arithmetic Operations'}
                  </span>
                  <div className="mt-2 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">=2*5+1/4-1</span>
                      <span className="text-emerald-650 font-bold">➔ 9.25</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">=(100 + 50) * 0.18</span>
                      <span className="text-emerald-650 font-bold">➔ 27.0 (GST)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">=500 * (1 - 0.10)</span>
                      <span className="text-emerald-650 font-bold">➔ 450 (Discount)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">=2^3 + 10</span>
                      <span className="text-emerald-650 font-bold">➔ 18</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Cell Coordinates */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                    {lang === 'hi' ? 'सेल संदर्भ (Cell References)' : 'Cell References'}
                  </span>
                  <div className="mt-2 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">=A1 + B1</span>
                      <span className="text-slate-500 text-[11px]">{lang === 'hi' ? 'A1 और B1 का जोड़' : 'Sum of A1 and B1'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">=C1 * 1.18</span>
                      <span className="text-slate-500 text-[11px]">{lang === 'hi' ? '18% GST जोड़ें' : 'Add 18% GST on C1'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">=D1 * E1</span>
                      <span className="text-slate-500 text-[11px]">{lang === 'hi' ? 'दर × मात्रा (Qty * Rate)' : 'Multiply Qty & Rate'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">=(B1 - C1) / B1 * 100</span>
                      <span className="text-slate-500 text-[11px]">{lang === 'hi' ? 'मार्जिन % निकालें' : 'Calculate Margin %'}</span>
                    </div>
                  </div>
                </div>

                {/* Aggregate Functions */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:col-span-2">
                  <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-800">
                    {lang === 'hi' ? 'स्प्रेडशीट फंक्शन्स (Functions)' : 'Built-in Spreadsheet Functions'}
                  </span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3 font-mono text-xs">
                    <div className="rounded bg-slate-50 p-2 border border-slate-200">
                      <p className="font-bold text-blue-700">=SUM(A1:A10)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'hi' ? 'रेंज A1 से A10 का कुल योग' : 'Total sum of range A1..A10'}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-2 border border-slate-200">
                      <p className="font-bold text-blue-700">=AVERAGE(B1:B20)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'hi' ? 'रेंज का औसत (Mean/Avg)' : 'Calculates average'}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-2 border border-slate-200">
                      <p className="font-bold text-blue-700">=ROUND(C1, 2)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'hi' ? '2 दशमलव तक राउंड' : 'Round to 2 decimals'}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-2 border border-slate-200">
                      <p className="font-bold text-blue-700">=MIN(D1:D15)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'hi' ? 'सबसे छोटी वैल्यू' : 'Minimum value'}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-2 border border-slate-200">
                      <p className="font-bold text-blue-700">=MAX(D1:D15)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'hi' ? 'सबसे बड़ी वैल्यू' : 'Maximum value'}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-2 border border-slate-200">
                      <p className="font-bold text-blue-700">=IF(A1&gt;100, 1, 0)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'hi' ? 'कंडीशनल लॉजिक' : 'Conditional evaluation'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLUMN TOOLS */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Columns3 className="h-4 w-4 text-blue-600" />
                  {lang === 'hi' ? 'कॉलम टूल्स और उदाहरण (Column Transformations)' : 'Column Tools & Examples'}
                </h4>
              </div>

              {/* Merge Columns Example */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Combine className="h-3.5 w-3.5 text-blue-600" />
                    1. {lang === 'hi' ? 'मर्ज कॉलम (Merge Columns)' : 'Merge Columns'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Delimiter: Space / Custom</span>
                </div>
                <p className="text-slate-600 text-xs">
                  {lang === 'hi'
                    ? 'जब स्पेस से स्प्लिट होने के कारण पहला और अंतिम नाम अलग-अलग कॉलम में चले जाएं, तो उन्हें एक कॉलम में जोड़ें।'
                    : 'Combines two or more columns into one with a specified separator (e.g. First Name + Last Name).'}
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] rounded bg-slate-50 p-2 border border-slate-200">
                  <div>
                    <span className="text-red-600 font-bold">❌ {lang === 'hi' ? 'पहले (Before)' : 'Before'}:</span>
                    <p className="text-slate-700">Col 1: Rahul | Col 2: Sharma</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-bold">✅ {lang === 'hi' ? 'बाद में (After)' : 'After'}:</span>
                    <p className="text-slate-900 font-bold">Col 1: Rahul Sharma</p>
                  </div>
                </div>
              </div>

              {/* Split Column Example */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Split className="h-3.5 w-3.5 text-blue-600" />
                    2. {lang === 'hi' ? 'कॉलम स्प्लिट करें (Split Column)' : 'Split Column'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">By Comma / Hyphen / Space</span>
                </div>
                <p className="text-slate-600 text-xs">
                  {lang === 'hi'
                    ? 'एक कॉलम में लिखे संयुक्त डेटा (जैसे शहर-पिनकोड या तारीख) को 2 या अधिक कॉलम में बांटें।'
                    : 'Splits a single column value into multiple columns based on a delimiter like comma, hyphen, or space.'}
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] rounded bg-slate-50 p-2 border border-slate-200">
                  <div>
                    <span className="text-red-600 font-bold">❌ Before:</span>
                    <p className="text-slate-700">Col: "Mumbai-400001"</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-bold">✅ After:</span>
                    <p className="text-slate-900 font-bold">Col A: "Mumbai" | Col B: "400001"</p>
                  </div>
                </div>
              </div>

              {/* Insert / Delete Column */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <span className="font-bold text-slate-900">+ {lang === 'hi' ? 'कॉलम जोड़ें (Insert Column)' : 'Insert Column'}</span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'किसी भी कॉलम के बाएं या दाएं नया खाली कॉलम (कस्टम हेडर नाम के साथ) जोड़ें।'
                      : 'Add a new blank column to the Left or Right of any column with a custom header.'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <span className="font-bold text-red-700">🗑️ {lang === 'hi' ? 'कॉलम हटाएं (Delete Column)' : 'Delete Column'}</span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'फ़ालतू या खाली कॉलम को पूरी तरह हटाएं। बाकी कॉलम अपने आप व्यवस्थित हो जाएंगे।'
                      : 'Remove unused split columns permanently while maintaining table consistency.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CELLS & ROWS */}
          {activeTab === 'cells' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  {lang === 'hi' ? 'सेल इंसर्ट, डिलीट & रो ऑपरेशन्स' : 'Cell & Row Operations'}
                </h4>
              </div>

              {/* Insert Cell Shift Right */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                    1. {lang === 'hi' ? '+ दाएं इंसर्ट (Insert Cell Right)' : '+ Right (Insert Cell Right)'}
                  </span>
                  <span className="text-[11px] text-blue-750 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded">
                    Button: + दाएं
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  {lang === 'hi'
                    ? 'चयनित सेल के आगे एक खाली सेल जोड़ता है और उस रो के आगे के सभी सेल्स को दाईं तरफ (Right) खिसका देता है।'
                    : 'Inserts an empty cell at the active position, cleanly shifting subsequent row cells to the right.'}
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] rounded bg-slate-50 p-2 border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-bold">Original:</span>
                    <p className="text-slate-700">[101] [Rahul] [Mumbai]</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-bold">After Shift Right:</span>
                    <p className="text-slate-900 font-bold">[101] [Rahul] <span className="text-blue-600 bg-blue-100 px-1 rounded">[Blank]</span> [Mumbai]</p>
                  </div>
                </div>
              </div>

              {/* Insert Cell Shift Left */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
                    2. {lang === 'hi' ? '+ बाएं इंसर्ट (Insert Cell Left)' : '+ Left (Insert Cell Left)'}
                  </span>
                  <span className="text-[11px] text-blue-750 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded">
                    Button: + बाएं
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  {lang === 'hi'
                    ? 'चयनित सेल के ठीक पहले खाली सेल जोड़ता है जिससे वर्तमान वैल्यू दाएं शिफ्ट हो जाती है।'
                    : 'Inserts a blank cell immediately to the left of active cell coordinate.'}
                </p>
              </div>

              {/* Delete Cell */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-700 flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    3. {lang === 'hi' ? 'सेल हटाएं (Delete Cell)' : 'Delete Cell'}
                  </span>
                  <span className="text-[11px] text-red-700 font-mono font-bold bg-red-50 px-2 py-0.5 rounded">
                    Button: हटाएं
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  {lang === 'hi'
                    ? 'चयनित सेल को हटाकर उस रो के आगे के सभी सेल्स को बाईं तरफ (Shift Left) ले आता है।'
                    : 'Removes the selected cell, shifting following cells in that row to the left.'}
                </p>
              </div>

              {/* Insert & Delete Row */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <span className="font-bold text-slate-900">{lang === 'hi' ? 'रो इंसर्ट करें (Insert Row Above/Below)' : 'Insert Row'}</span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'किसी भी रो के ऊपर या नीचे खाली रो जोड़ें।'
                      : 'Add empty rows above or below any active row index.'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <span className="font-bold text-red-700">{lang === 'hi' ? 'रो हटाएं (Delete Row)' : 'Delete Row'}</span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'गलत या खाली रो को पूरी तरह टेबल से हटाएं।'
                      : 'Remove specific rows directly from table context menu or toolbar.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TEXT CLEANING */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Type className="h-4 w-4 text-blue-600" />
                  {lang === 'hi' ? 'टेक्स्ट फ़ॉर्मेटिंग & क्लीनिंग टूल्स' : 'Text Cleaning & Formatting Tools'}
                </h4>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Change Case */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-blue-600" />
                    1. {lang === 'hi' ? 'केस बदलें (Change Case)' : 'Change Case'}
                  </span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'पूरे कॉलम को UPPERCASE, lowercase, Title Case या Sentence Case में बदलें।'
                      : 'Convert text to UPPERCASE, lowercase, Title Case (Capital Each Word), or Sentence case.'}
                  </p>
                  <div className="rounded bg-slate-50 p-2 font-mono text-[11px] border border-slate-200">
                    <span className="text-slate-500">"rahul sharma"</span> ➔ <span className="font-bold text-emerald-600">"Rahul Sharma"</span>
                  </div>
                </div>

                {/* Trim Spaces */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Eraser className="h-3.5 w-3.5 text-blue-600" />
                    2. {lang === 'hi' ? 'स्पेस ट्रिम करें (Trim Spaces)' : 'Trim Spaces'}
                  </span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'शुरुआत, अंत या बीच के फ़ालतू डबल/ट्रिपल स्पेस को एक स्पेस में बदलें।'
                      : 'Strips leading/trailing spaces and collapses consecutive whitespace.'}
                  </p>
                  <div className="rounded bg-slate-50 p-2 font-mono text-[11px] border border-slate-200">
                    <span className="text-slate-500">"  Mumbai   "</span> ➔ <span className="font-bold text-emerald-600">"Mumbai"</span>
                  </div>
                </div>

                {/* Find & Replace */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-blue-600" />
                    3. {lang === 'hi' ? 'खोजें और बदलें (Find & Replace)' : 'Find & Replace'}
                  </span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'किसी विशेष शब्द, सिम्बल या Regex पैटर्न को नए मान से बदलें।'
                      : 'Replace specific text, symbols, or regex matches across columns or whole table.'}
                  </p>
                  <div className="rounded bg-slate-50 p-2 font-mono text-[11px] border border-slate-200">
                    <span className="text-slate-500">"N/A"</span> ➔ <span className="font-bold text-emerald-600">"0.00"</span>
                  </div>
                </div>

                {/* Prefix & Suffix */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-blue-600" />
                    4. {lang === 'hi' ? 'उपसर्ग & प्रत्यय (Prefix/Suffix)' : 'Prefix & Suffix'}
                  </span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'कॉलम के आगे करंसी सिंबल (₹, $) या पीछे यूनिट (kg, pcs) लगाएं।'
                      : 'Prepend currency (₹, $) or append units (kg, pcs, .00) to every row.'}
                  </p>
                  <div className="rounded bg-slate-50 p-2 font-mono text-[11px] border border-slate-200">
                    <span className="text-slate-500">"1500"</span> ➔ <span className="font-bold text-emerald-600">"₹1,500.00"</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SMART & ADVANCED TOOLS */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  {lang === 'hi' ? 'एडवांस्ड ऑटोमेशन & डिक्शनरी टूल्स' : 'Smart & Advanced Data Tools'}
                </h4>
              </div>

              <div className="space-y-3">
                {/* Dictionary Word Joiner */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    1. {lang === 'hi' ? 'डिक्शनरी वर्ड जॉइनर (Dictionary Blank Manager)' : 'Dictionary Blank Manager'}
                  </span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'जब संयुक्त नाम (जैसे "State Bank of India" या "Shri Ram") स्पेस के कारण अलग-अलग कॉलम में बिखर जाएं और उनके आगे की रो खाली दिखे, तो यह टूल डिक्शनरी के आधार पर उन्हें 1-क्लिक में जोड़ देता है।'
                      : 'Repairs fractured multi-word company names, product titles, or phrases and shifts trailing cells left seamlessly.'}
                  </p>
                </div>

                {/* Fill Missing Values */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    2. {lang === 'hi' ? 'खाली मान भरें (Fill Missing Values)' : 'Fill Missing Values'}
                  </span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'खाली सेल्स को ऊपर वाली वैल्यू (Forward Fill), नीचे वाली वैल्यू (Backward Fill), या 0 / N/A / औसत से भरें।'
                      : 'Fills blank cells with forward fill, backward fill, constant (e.g. 0, N/A), or column average.'}
                  </p>
                </div>

                {/* Remove Duplicates */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-blue-600" />
                    3. {lang === 'hi' ? 'डुप्लीकेट हटाएं (Deduplication)' : 'Remove Duplicates'}
                  </span>
                  <p className="text-slate-600 text-xs">
                    {lang === 'hi'
                      ? 'पूरी रो या किसी मुख्य कॉलम (जैसे Invoice No, Email ID) के आधार पर डुप्लीकेट रिकॉर्ड्स हटाएं।'
                      : 'Eliminate duplicate rows across the entire dataset or based on a unique key column.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GITHUB DEPLOYMENT */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-white">
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-white" />
                  <h4 className="font-bold text-sm sm:text-base">
                    {lang === 'hi' ? 'GitHub पर अपलोड और लाइव URL बनाने की सम्पूर्ण गाइड' : 'How to Upload to GitHub & Deploy Live URL'}
                  </h4>
                </div>
                <p className="mt-1.5 text-xs text-slate-300">
                  {lang === 'hi'
                    ? 'इस ऐप को GitHub पर अपलोड करके 100% मुफ़्त में GitHub Pages, Vercel, या Netlify पर लाइव चलाएं।'
                    : 'Step-by-step guide to push this project to GitHub and get a free, fast live website URL.'}
                </p>
              </div>

              {/* Method 1: Vercel (Easiest & Fastest) */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-blue-600" />
                    {lang === 'hi' ? 'तरीका 1: Vercel / Netlify (सबसे आसान — 1 मिनट में लाइव)' : 'Method 1: Deploy on Vercel / Netlify (1-Click Live)'}
                  </span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                    Recommended
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>GitHub Repo बनाएं:</strong> <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-blue-600 underline">github.com/new</a> पर जाएं और नया रिपॉजिटरी बनाएं।
                  </li>
                  <li>
                    <strong>कोड पुश करें:</strong> अपने टर्मिनल में नीचे दिए गए कमांड्स चलाएं:
                    <div className="relative mt-1 rounded bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200">
                      <code>
                        git init<br/>
                        git add .<br/>
                        git commit -m "Initial commit - DataPrep Studio"<br/>
                        git branch -M main<br/>
                        git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git<br/>
                        git push -u origin main
                      </code>
                      <button
                        onClick={() => handleCopy('git init\ngit add .\ngit commit -m "Initial commit - DataPrep Studio"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git\ngit push -u origin main', 'git_cmds')}
                        className="absolute top-2 right-2 flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                      >
                        {copiedCode === 'git_cmds' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCode === 'git_cmds' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    <strong>Vercel पर जाएं:</strong> <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-blue-600 underline">vercel.com/new</a> खोलें ➔ अपने GitHub अकाउंट से लॉग इन करें ➔ अपनी रिपॉजिटरी चुनें और <strong>"Deploy"</strong> दबाएं।
                  </li>
                  <li>
                    <strong>आपका लाइव URL:</strong> 30 सेकंड में आपको <code className="bg-slate-100 px-1 py-0.5 text-blue-700 font-bold">https://your-app.vercel.app</code> लाइव लिंक मिल जाएगा!
                  </li>
                </ol>
              </div>

              {/* Method 2: GitHub Pages */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Github className="h-4 w-4 text-slate-800" />
                  {lang === 'hi' ? 'तरीका 2: GitHub Pages पर मुफ़्त होस्टिंग' : 'Method 2: GitHub Pages (Direct Hosting)'}
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700">
                  <li>
                    प्रोजेक्ट में <code>npm run build</code> चलाएं।
                  </li>
                  <li>
                    GitHub Repo की <strong>Settings ➔ Pages</strong> में जाएं।
                  </li>
                  <li>
                    Source में <strong>"GitHub Actions"</strong> या <strong>"Deploy from a branch"</strong> चुनें।
                  </li>
                  <li>
                    आपका लाइव यूआरएल: <code className="bg-slate-100 px-1 py-0.5 text-blue-700 font-bold">https://username.github.io/repo-name/</code>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 sm:px-6">
          <div className="text-[11px] text-slate-500 font-mono">
            {lang === 'hi' ? 'सभी 20+ टूल्स पूरी तरह ऑफ़लाइन और क्लाइंट-साइड चलते हैं' : 'All 20+ transformation tools run client-side in real time'}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{lang === 'hi' ? 'समझ गया! काम शुरू करें' : 'Got it! Start Cleaning'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
