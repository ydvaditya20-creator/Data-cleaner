import React from 'react';
import {
  Sparkles,
  FileCode,
  HelpCircle,
  RotateCcw,
  Languages,
  Terminal,
  Download,
} from 'lucide-react';

interface HeaderProps {
  lang: 'en' | 'hi';
  onToggleLang: () => void;
  onOpenGuide: () => void;
  onOpenScriptModal: () => void;
  onResetAll: () => void;
  scriptActionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onOpenGuide,
  onOpenScriptModal,
  onResetAll,
  scriptActionCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-700 bg-[#1e293b] px-4 py-2.5 sm:px-6 text-white shadow-sm shrink-0">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-mono text-sm font-bold text-white shadow-xs">
            δ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight uppercase text-white sm:text-lg">
                {lang === 'hi' ? 'डेटा क्लीनर' : 'DataCleaner'}
                <span className="ml-2 font-mono text-xs font-normal text-blue-400 opacity-80">v2.4.0</span>
              </h1>
              <span className="hidden sm:inline-flex items-center rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                {lang === 'hi' ? 'ऑटो-स्क्रिप्ट' : 'Auto-Script'}
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block font-mono">
              {lang === 'hi'
                ? 'स्पेस-डिलिमिटेड डेटा क्लीनिंग और 1-क्लिक ऑटोमेशन रेसिपी'
                : 'Space-delimited tabular parser & automated recipe engine'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 rounded border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-slate-300 font-mono text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{lang === 'hi' ? 'सिस्टम तैयार' : 'Ready for Input'}</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
          >
            <Languages className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">{lang === 'hi' ? 'HI' : 'EN'}</span>
          </button>

          {/* Quick Guide */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline font-sans">{lang === 'hi' ? 'गाइड' : 'Guide'}</span>
          </button>

          {/* Script Inspector */}
          <button
            onClick={onOpenScriptModal}
            className="flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 px-3 py-1 font-medium text-white shadow-xs transition-colors"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span className="font-sans text-xs">{lang === 'hi' ? 'स्क्रिप्ट (JSON)' : 'Export Script (JSON)'}</span>
            {scriptActionCount > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded bg-slate-900 px-1 font-mono text-[10px] font-bold text-white">
                {scriptActionCount}
              </span>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={onResetAll}
            className="flex items-center rounded border border-slate-700 bg-slate-800 p-1 text-slate-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800 transition-colors"
            title={lang === 'hi' ? 'नया सेशन शुरू करें (Reset)' : 'Reset / New Session'}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

