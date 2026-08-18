import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Table as TableIcon,
  Download,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  Code,
  Maximize2,
  Minimize2,
  Trash2,
  Edit2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calculator,
  CornerDownLeft,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { TableState, CellRange } from '../types';
import {
  exportToExcel,
  exportToCsv,
  exportToTsv,
  exportToJson,
  copyTableToClipboard,
} from '../utils/exportUtils';
import {
  colIndexToLetter,
  letterToColIndex,
  formatCellCoordinate,
  parseCellCoordinate,
  parseRangeString,
  evaluateFormula,
  isFormulaOrMath,
} from '../utils/formulaEngine';

interface TableViewerProps {
  tableState: TableState;
  lang: 'en' | 'hi';
  onQuickDeleteColumn?: (colIdx: number) => void;
  onQuickRenameColumn?: (colIdx: number, newName: string) => void;
  onInsertCell?: (rowIdx: number, colIdx: number, shiftDirection: 'right' | 'left', fillValue?: string) => void;
  onDeleteCell?: (rowIdx: number, colIdx: number, shiftDirection: 'left' | 'up') => void;
  onInsertRow?: (rowIdx: number, position: 'above' | 'below') => void;
  onDeleteRow?: (rowIdx: number) => void;
  onInsertColumn?: (colIdx: number, position: 'left' | 'right', headerName?: string) => void;
  onEditCell?: (rowIdx: number, colIdx: number, value: string) => void;
  onApplyFormula?: (
    formula: string,
    targetMode: 'cell' | 'column' | 'range' | 'all',
    customRange?: CellRange,
    colIdx?: number,
    cellCoord?: string
  ) => void;
  onApplyRangeTransform?: (
    type: 'UPPER' | 'LOWER' | 'TITLE' | 'TRIM' | 'FILL' | 'CLEAR',
    range: CellRange,
    fillValue?: string
  ) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  rowIdx: number;
  colIdx: number;
  type: 'cell' | 'row' | 'header';
}

export const TableViewer: React.FC<TableViewerProps> = ({
  tableState,
  lang,
  onQuickDeleteColumn,
  onQuickRenameColumn,
  onInsertCell,
  onDeleteCell,
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onEditCell,
  onApplyFormula,
  onApplyRangeTransform,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Selected Cell & Range state
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [rangeSelection, setRangeSelection] = useState<CellRange | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<{ row: number; col: number } | null>(null);
  
  // Coordinate Input Box State
  const [coordInput, setCoordInput] = useState('A1');
  const [isEditingCoord, setIsEditingCoord] = useState(false);

  // Inline Cell Editing
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellEditVal, setCellEditVal] = useState('');

  // Formula Bar
  const [formulaInput, setFormulaInput] = useState('');
  
  // Header Editing
  const [editingHeaderIdx, setEditingHeaderIdx] = useState<number | null>(null);
  const [editingHeaderVal, setEditingHeaderVal] = useState('');

  // Context Menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Range Actions Bar
  const [showRangeBar, setShowRangeBar] = useState(false);

  const { headers, rows } = tableState;

  // Active cell coordinate string
  const activeCoord = selectedCell ? formatCellCoordinate(selectedCell.row, selectedCell.col) : 'A1';

  // Range string representation
  const activeRangeStr = rangeSelection
    ? `${formatCellCoordinate(rangeSelection.startRow, rangeSelection.startCol)}:${formatCellCoordinate(rangeSelection.endRow, rangeSelection.endCol)}`
    : activeCoord;

  // Sync formula bar input and coordinate box when selected cell/range changes
  useEffect(() => {
    if (selectedCell && rows[selectedCell.row]) {
      const val = rows[selectedCell.row][selectedCell.col] ?? '';
      setFormulaInput(val);
    }
    if (!isEditingCoord) {
      setCoordInput(activeRangeStr);
    }
  }, [selectedCell, rangeSelection, rows, isEditingCoord, activeRangeStr]);

  // Global mouseup and outside click handlers
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelectingRange(false);
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
  }, [rows, searchTerm]);

  // Sorted rows with original index mapping
  const indexedRows = useMemo(() => {
    return filteredRows.map((r, i) => ({ originalIndex: i, cells: r }));
  }, [filteredRows]);

  const sortedIndexedRows = useMemo(() => {
    if (sortCol === null || sortCol >= headers.length) return indexedRows;
    return [...indexedRows].sort((a, b) => {
      const valA = a.cells[sortCol] ?? '';
      const valB = b.cells[sortCol] ?? '';

      const numA = Number(valA.replace(/[^0-9.-]+/g, ''));
      const numB = Number(valB.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [indexedRows, sortCol, sortDirection, headers.length]);

  // Paginated rows
  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(sortedIndexedRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return sortedIndexedRows;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedIndexedRows.slice(start, start + rowsPerPage);
  }, [sortedIndexedRows, currentPage, rowsPerPage]);

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortCol(null);
      }
    } else {
      setSortCol(colIdx);
      setSortDirection('asc');
    }
  };

  const handleCopyClipboard = async () => {
    const success = await copyTableToClipboard(tableState);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startEditHeader = (idx: number) => {
    setEditingHeaderIdx(idx);
    setEditingHeaderVal(headers[idx]);
  };

  const saveHeaderEdit = () => {
    if (editingHeaderIdx !== null && onQuickRenameColumn && editingHeaderVal.trim()) {
      onQuickRenameColumn(editingHeaderIdx, editingHeaderVal.trim());
    }
    setEditingHeaderIdx(null);
  };

  // Mouse selection handlers
  const handleCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary left click
    if (editingCell) {
      saveCellEdit();
    }

    if (e.shiftKey && selectedCell) {
      // Shift + Click range selection
      const newRange: CellRange = {
        startRow: Math.min(selectedCell.row, r),
        endRow: Math.max(selectedCell.row, r),
        startCol: Math.min(selectedCell.col, c),
        endCol: Math.max(selectedCell.col, c),
      };
      setRangeSelection(newRange);
      setShowRangeBar(true);
    } else {
      // Single cell select & initiate potential drag
      setSelectedCell({ row: r, col: c });
      setRangeStart({ row: r, col: c });
      setIsSelectingRange(true);
      setRangeSelection(null);
      setShowRangeBar(false);
    }
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isSelectingRange && rangeStart) {
      if (r !== rangeStart.row || c !== rangeStart.col) {
        const newRange: CellRange = {
          startRow: Math.min(rangeStart.row, r),
          endRow: Math.max(rangeStart.row, r),
          startCol: Math.min(rangeStart.col, c),
          endCol: Math.max(rangeStart.col, c),
        };
        setRangeSelection(newRange);
        setShowRangeBar(true);
      } else {
        setRangeSelection(null);
        setShowRangeBar(false);
      }
    }
  };

  const handleSelectColumn = (colIdx: number) => {
    if (rows.length === 0) return;
    setSelectedCell({ row: 0, col: colIdx });
    setRangeSelection({
      startRow: 0,
      endRow: rows.length - 1,
      startCol: colIdx,
      endCol: colIdx,
    });
    setShowRangeBar(true);
  };

  const handleSelectRow = (rowIdx: number) => {
    if (headers.length === 0) return;
    setSelectedCell({ row: rowIdx, col: 0 });
    setRangeSelection({
      startRow: rowIdx,
      endRow: rowIdx,
      startCol: 0,
      endCol: headers.length - 1,
    });
    setShowRangeBar(true);
  };

  const handleSelectAll = () => {
    if (rows.length === 0 || headers.length === 0) return;
    setSelectedCell({ row: 0, col: 0 });
    setRangeSelection({
      startRow: 0,
      endRow: rows.length - 1,
      startCol: 0,
      endCol: headers.length - 1,
    });
    setShowRangeBar(true);
  };

  const handleCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingCoord(false);
    const trimmed = coordInput.trim().toUpperCase();
    if (!trimmed) return;

    if (trimmed.includes(':')) {
      const parsedRange = parseRangeString(trimmed);
      if (parsedRange) {
        setRangeSelection(parsedRange);
        setSelectedCell({ row: parsedRange.startRow, col: parsedRange.startCol });
        setShowRangeBar(true);
      }
    } else {
      const parsed = parseCellCoordinate(trimmed);
      if (parsed) {
        const targetRow = Math.min(Math.max(0, parsed.row), Math.max(0, rows.length - 1));
        const targetCol = Math.min(Math.max(0, parsed.col), Math.max(0, headers.length - 1));
        setSelectedCell({ row: targetRow, col: targetCol });
        setRangeSelection(null);
        setShowRangeBar(false);
      }
    }
  };

  const handleCellDoubleClick = (r: number, c: number) => {
    setEditingCell({ row: r, col: c });
    const current = rows[r]?.[c] ?? '';
    setCellEditVal(current);
  };

  const saveCellEdit = () => {
    if (editingCell && onEditCell) {
      onEditCell(editingCell.row, editingCell.col, cellEditVal);
    }
    setEditingCell(null);
  };

  const handleFormulaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formulaInput) return;

    if (rangeSelection && onApplyFormula) {
      onApplyFormula(formulaInput, 'range', rangeSelection);
    } else if (selectedCell && onEditCell) {
      let finalVal = formulaInput;
      if (formulaInput.startsWith('=') || isFormulaOrMath(formulaInput)) {
        finalVal = evaluateFormula(formulaInput, tableState, selectedCell.row, selectedCell.col);
      }
      onEditCell(selectedCell.row, selectedCell.col, finalVal);
    }
  };

  // Quick Formula Token insertion
  const insertFormulaToken = (token: string) => {
    setFormulaInput((prev) => {
      const base = prev.startsWith('=') ? prev : prev ? `=${prev}` : '=';
      return `${base}${token}`;
    });
  };

  // Context Menu opener
  const handleContextMenu = (e: React.MouseEvent, rowIdx: number, colIdx: number, type: 'cell' | 'row' | 'header') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCell({ row: rowIdx, col: colIdx });
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 300),
      rowIdx,
      colIdx,
      type,
    });
  };

  // Check if a cell is highlighted by range or active selection
  const isCellSelected = (r: number, c: number) => {
    if (selectedCell.row === r && selectedCell.col === c) return true;
    if (rangeSelection) {
      return (
        r >= rangeSelection.startRow &&
        r <= rangeSelection.endRow &&
        c >= rangeSelection.startCol &&
        c <= rangeSelection.endCol
      );
    }
    return false;
  };

  // Quick Shift Left / Right for Active Cell
  const handleQuickShift = (direction: 'right' | 'left') => {
    if (onInsertCell && selectedCell) {
      onInsertCell(selectedCell.row, selectedCell.col, direction);
    }
  };

  // Quick Delete for Active Cell
  const handleQuickDeleteCell = () => {
    if (onDeleteCell && selectedCell) {
      onDeleteCell(selectedCell.row, selectedCell.col, 'left');
    }
  };

  return (
    <div
      className={`rounded border border-slate-200 bg-white shadow-xs transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden flex flex-col' : ''
      }`}
    >
      {/* 1. Header Toolbar (Title, Search, Export, Fullscreen) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-2 sm:px-3 bg-slate-50/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <TableIcon className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              {lang === 'hi' ? '3. स्प्रेडशीट डेटा ग्रिड (Live Sheet & Formula Bar)' : '3. Structured Sheet & Formula Grid'}
            </h3>
          </div>
          <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-blue-700">
            {rows.length}R × {headers.length}C
          </span>
          {rangeSelection && (
            <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-800">
              {activeRangeStr} ({(rangeSelection.endRow - rangeSelection.startRow + 1) * (rangeSelection.endCol - rangeSelection.startCol + 1)} cells)
            </span>
          )}
        </div>

        {/* Search, Copy, Export, Fullscreen */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={lang === 'hi' ? 'ग्रिड में खोजें...' : 'Filter records...'}
              className="w-28 sm:w-36 rounded border border-slate-300 pl-6 pr-2 py-0.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none bg-white transition-all"
            />
          </div>

          {/* Copy Table Button */}
          <button
            onClick={handleCopyClipboard}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-700 font-mono">{lang === 'hi' ? 'कॉपी!' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-500" />
                <span>{lang === 'hi' ? 'कॉपी' : 'Copy'}</span>
              </>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 px-2 py-0.5 text-xs font-medium text-white shadow-2xs transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>{lang === 'hi' ? 'एक्सपोर्ट' : 'Export'}</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 rounded border border-slate-300 bg-white p-1 shadow-lg z-30 font-mono text-xs">
                <button
                  onClick={() => {
                    exportToExcel(tableState);
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    exportToCsv(tableState);
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span>CSV (.csv)</span>
                </button>
                <button
                  onClick={() => {
                    exportToTsv(tableState);
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  <span>TSV (Tabular)</span>
                </button>
                <button
                  onClick={() => {
                    exportToJson(tableState);
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100"
                >
                  <Code className="h-3.5 w-3.5 text-amber-600" />
                  <span>JSON (.json)</span>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded border border-slate-300 bg-white p-1 text-slate-500 hover:bg-slate-100 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Spreadsheet Formula Bar & Active Cell Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-100/90 px-2 py-1.5 font-mono text-xs">
        {/* Cell / Range Coordinate Box (Editable Jump Box) */}
        <form onSubmit={handleCoordSubmit} className="flex items-center">
          <input
            type="text"
            value={coordInput}
            onFocus={() => setIsEditingCoord(true)}
            onBlur={() => {
              setIsEditingCoord(false);
              setCoordInput(activeRangeStr);
            }}
            onChange={(e) => setCoordInput(e.target.value)}
            className="w-16 sm:w-20 rounded border border-slate-300 bg-white px-1.5 py-0.5 font-bold text-blue-900 text-center shadow-2xs focus:border-blue-600 focus:outline-none uppercase text-xs"
            title={lang === 'hi' ? 'सेल या रेंज पता (जैसे A1 या A1:B10) - लिखकर Enter दबाएं' : 'Jump to Cell / Range (e.g. A1 or A1:B10) - Press Enter'}
          />
        </form>

        {/* Function symbol */}
        <span className="font-bold text-slate-400 select-none italic text-sm">fx</span>

        {/* Formula / Value Input Field */}
        <form onSubmit={handleFormulaSubmit} className="flex-1 flex items-center gap-1 min-w-[200px]">
          <input
            type="text"
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'सेल वैल्यू या फॉर्मूला लिखें (उदा. =2*5+1/4-1 या =A1*10 या टेक्स्ट)'
                : 'Enter value or formula (e.g. =2*5+1/4-1 or =A1*10)'
            }
            className="flex-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors"
            title={lang === 'hi' ? 'फॉर्मूला / वैल्यू लागू करें' : 'Apply Formula or Value'}
          >
            <CornerDownLeft className="h-3 w-3 inline" />
          </button>
        </form>

        {/* Direct Insert / Delete for Active Cell */}
        {selectedCell && (
          <div className="flex items-center gap-1 border-l border-slate-300 pl-1.5">
            {onInsertCell && (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickShift('left')}
                  className="inline-flex items-center gap-0.5 rounded border border-blue-400 bg-white px-1.5 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs hover:bg-blue-50 active:scale-95 transition-all"
                  title={lang === 'hi' ? 'चयनित सेल के बाएं खाली सेल जोड़ें (Insert Left)' : 'Insert Empty Cell to the Left of Selected Cell'}
                >
                  <ArrowLeft className="h-3 w-3 text-blue-600" />
                  <span>{lang === 'hi' ? '+ बाएं' : '+ Left'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShift('right')}
                  className="inline-flex items-center gap-0.5 rounded border border-blue-400 bg-white px-1.5 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs hover:bg-blue-50 active:scale-95 transition-all"
                  title={lang === 'hi' ? 'चयनित सेल के दाएं खाली सेल जोड़ें (Insert Right)' : 'Insert Empty Cell to the Right of Selected Cell'}
                >
                  <span>{lang === 'hi' ? '+ दाएं' : '+ Right'}</span>
                  <ArrowRight className="h-3 w-3 text-blue-600" />
                </button>
              </>
            )}
            {onDeleteCell && (
              <button
                type="button"
                onClick={handleQuickDeleteCell}
                className="inline-flex items-center gap-0.5 rounded border border-red-300 bg-white px-1.5 py-0.5 text-[11px] font-bold text-red-700 shadow-2xs hover:bg-red-50 active:scale-95 transition-all"
                title={lang === 'hi' ? 'चयनित सेल हटाएं (Delete Cell)' : 'Delete Active Cell (Shift Left)'}
              >
                <Trash2 className="h-3 w-3 text-red-600" />
                <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Math Operator Buttons (+, -, *, /, =, SUM, AVG) */}
        <div className="flex items-center gap-0.5 border-l border-slate-300 pl-1.5">
          <button
            type="button"
            onClick={() => insertFormulaToken('+')}
            className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
            title="Add (+)"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => insertFormulaToken('-')}
            className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
            title="Subtract (-)"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => insertFormulaToken('*')}
            className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
            title="Multiply (*)"
          >
            *
          </button>
          <button
            type="button"
            onClick={() => insertFormulaToken('/')}
            className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
            title="Divide (/)"
          >
            /
          </button>
          <button
            type="button"
            onClick={() => insertFormulaToken('=')}
            className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
            title="Equal (=)"
          >
            =
          </button>
          <button
            type="button"
            onClick={() => insertFormulaToken('SUM(')}
            className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
            title="SUM formula"
          >
            SUM
          </button>
          <button
            type="button"
            onClick={() => insertFormulaToken('AVG(')}
            className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
            title="AVERAGE formula"
          >
            AVG
          </button>
        </div>
      </div>

      {/* 3. Range Quick Transform Toolbar (shown when multiple cells are selected) */}
      {rangeSelection && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[11px] text-emerald-900">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            <span>
              {lang === 'hi'
                ? `चयनित सीमा [${activeRangeStr}] पर ऑपरेशन (बाकी डेटा सुरक्षित रहेगा):`
                : `Range [${activeRangeStr}] Quick Operations (rest of sheet unedited):`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onApplyRangeTransform && (
              <>
                <button
                  type="button"
                  onClick={() => onApplyRangeTransform('UPPER', rangeSelection)}
                  className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-emerald-100"
                >
                  UPPER
                </button>
                <button
                  type="button"
                  onClick={() => onApplyRangeTransform('LOWER', rangeSelection)}
                  className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-emerald-100"
                >
                  lower
                </button>
                <button
                  type="button"
                  onClick={() => onApplyRangeTransform('TRIM', rangeSelection)}
                  className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-emerald-100"
                >
                  Trim
                </button>
                <button
                  type="button"
                  onClick={() => onApplyRangeTransform('CLEAR', rangeSelection)}
                  className="rounded border border-rose-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-50"
                >
                  Clear
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setRangeSelection(null);
                setShowRangeBar(false);
              }}
              className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-800"
            >
              ✕ {lang === 'hi' ? 'हटाएं' : 'Deselect'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Spreadsheet Grid with Full Coordinate Headers */}
      <div
        className={`overflow-x-auto select-none ${
          isFullscreen ? 'flex-1 overflow-y-auto' : 'max-h-[440px] overflow-y-auto'
        }`}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-slate-400 font-mono">
              #
            </div>
            <p className="mt-2 text-xs font-bold text-slate-700 uppercase tracking-tight">
              {lang === 'hi' ? 'कोई डेटा नहीं मिला' : 'No Table Records'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
              {lang === 'hi'
                ? 'ऊपर टेक्स्ट पेस्ट करें या कोई सैंपल डेटा लोड करें'
                : 'Paste text above to initialize structured rows'}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left font-mono text-xs select-none">
            <thead>
              {/* Spreadsheet Column Letter Row (A, B, C, D...) */}
              <tr className="sticky top-0 z-20 border-b border-slate-300 bg-slate-200/90 text-slate-600 uppercase text-[9px] font-bold tracking-wider select-none">
                <th
                  onClick={handleSelectAll}
                  className="w-12 border border-slate-300 bg-slate-200 px-1.5 py-1 text-center text-slate-500 font-bold select-none cursor-pointer hover:bg-slate-300 transition-colors"
                  title={lang === 'hi' ? 'पूरी शीट चुनें (Select All)' : 'Select All Sheet'}
                >
                  #
                </th>
                {headers.map((_, colIdx) => {
                  const letter = colIndexToLetter(colIdx);
                  const isColActive = selectedCell.col === colIdx;
                  return (
                    <th
                      key={`letter_${colIdx}`}
                      onClick={() => handleSelectColumn(colIdx)}
                      className={`border border-slate-300 px-2 py-0.5 text-center font-bold transition-colors select-none cursor-pointer hover:bg-blue-100 ${
                        isColActive ? 'bg-blue-200 text-blue-950 font-black' : 'bg-slate-200 text-slate-600'
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, 0, colIdx, 'header')}
                      title={lang === 'hi' ? `कॉलम ${letter} चुनें` : `Select Column ${letter}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-full text-center">{letter}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Data Header Name Row */}
              <tr className="sticky top-[22px] z-10 border-b border-slate-300 bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-semibold select-none shadow-xs">
                <th
                  onClick={handleSelectAll}
                  className="w-12 border border-slate-300 bg-slate-100 px-1.5 py-1.5 text-center text-slate-500 select-none cursor-pointer hover:bg-slate-200"
                  title={lang === 'hi' ? 'पूरी शीट चुनें' : 'Select All'}
                >
                  Row
                </th>
                {headers.map((header, colIdx) => (
                  <th
                    key={colIdx}
                    className="border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-800 select-none bg-slate-100"
                    onContextMenu={(e) => handleContextMenu(e, 0, colIdx, 'header')}
                  >
                    <div className="flex items-center justify-between group">
                      {editingHeaderIdx === colIdx ? (
                        <input
                          type="text"
                          value={editingHeaderVal}
                          autoFocus
                          onChange={(e) => setEditingHeaderVal(e.target.value)}
                          onBlur={saveHeaderEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveHeaderEdit();
                            if (e.key === 'Escape') setEditingHeaderIdx(null);
                          }}
                          className="w-full rounded border border-blue-500 bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      ) : (
                        <div
                          className="flex items-center gap-1 cursor-pointer truncate"
                          onClick={() => handleSort(colIdx)}
                          title={lang === 'hi' ? 'सॉर्ट करने के लिए क्लिक करें' : 'Click to sort column'}
                        >
                          <span className="font-bold text-slate-800 truncate">{header}</span>
                          {sortCol === colIdx ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-blue-600 shrink-0" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-blue-600 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          )}
                        </div>
                      )}

                      {/* Header quick tools */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditHeader(colIdx)}
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                          title="Rename Header"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                        {onInsertColumn && (
                          <button
                            type="button"
                            onClick={() => onInsertColumn(colIdx, 'right')}
                            className="rounded p-0.5 text-slate-400 hover:bg-blue-100 hover:text-blue-700"
                            title={lang === 'hi' ? 'दाएं कॉलम जोड़ें' : 'Insert Column Right'}
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {onQuickDeleteColumn && headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onQuickDeleteColumn(colIdx)}
                            className="rounded p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-600"
                            title={lang === 'hi' ? 'कॉलम हटाएं' : 'Delete Column'}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((item) => {
                const actualRowIdx = item.originalIndex;
                const actualRowNumber = actualRowIdx + 1;
                const isRowActive = selectedCell.row === actualRowIdx;

                return (
                  <tr
                    key={`row_${actualRowIdx}`}
                    className={`transition-colors ${
                      isRowActive ? 'bg-blue-50/60' : 'hover:bg-slate-50/70 even:bg-slate-50/30'
                    }`}
                  >
                    {/* Row Header Cell with coordinate */}
                    <td
                      className={`border border-slate-300 px-1.5 py-1 text-center font-mono text-[11px] select-none cursor-pointer font-bold transition-colors ${
                        isRowActive ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-600 hover:bg-blue-100'
                      }`}
                      onClick={() => handleSelectRow(actualRowIdx)}
                      onContextMenu={(e) => handleContextMenu(e, actualRowIdx, 0, 'row')}
                      title={`Row ${actualRowNumber} (Click to select entire row)`}
                    >
                      {actualRowNumber}
                    </td>

                    {/* Data Cells with full drag-selection support */}
                    {item.cells.map((cellVal, colIdx) => {
                      const isCellActive = selectedCell.row === actualRowIdx && selectedCell.col === colIdx;
                      const inRange = isCellSelected(actualRowIdx, colIdx);
                      const isEditing = editingCell?.row === actualRowIdx && editingCell?.col === colIdx;

                      return (
                        <td
                          key={`c_${actualRowIdx}_${colIdx}`}
                          className={`border border-slate-200 px-2 py-1 font-mono text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px] cursor-cell transition-all select-none ${
                            isCellActive
                              ? 'ring-2 ring-blue-600 ring-inset bg-blue-100/80 font-bold text-blue-950 z-10 relative'
                              : inRange
                              ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400 ring-inset'
                              : 'text-slate-800'
                          }`}
                          onMouseDown={(e) => handleCellMouseDown(actualRowIdx, colIdx, e)}
                          onMouseEnter={() => handleCellMouseEnter(actualRowIdx, colIdx)}
                          onDoubleClick={() => handleCellDoubleClick(actualRowIdx, colIdx)}
                          onContextMenu={(e) => handleContextMenu(e, actualRowIdx, colIdx, 'cell')}
                          title={`${formatCellCoordinate(actualRowIdx, colIdx)}: ${cellVal}`}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={cellEditVal}
                              autoFocus
                              onChange={(e) => setCellEditVal(e.target.value)}
                              onBlur={saveCellEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveCellEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full rounded border border-blue-600 bg-white px-1 py-0 font-mono text-xs text-slate-900 focus:outline-none"
                            />
                          ) : cellVal === '' ? (
                            <span className="text-slate-300 italic text-[11px]">null</span>
                          ) : (
                            cellVal
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Pagination & Footer summary */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 p-2 text-xs text-slate-600 bg-slate-50 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span>{lang === 'hi' ? 'प्रति पृष्ठ:' : 'Show:'}</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>{lang === 'hi' ? 'सभी (All)' : 'All'}</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              {sortedIndexedRows.length} {lang === 'hi' ? 'कुल पंक्तियाँ' : 'total items'}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded border border-slate-300 bg-white px-2 py-0.5 font-medium disabled:opacity-40 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'पिछला' : 'Prev'}
              </button>
              <span className="px-1.5">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-slate-300 bg-white px-2 py-0.5 font-medium disabled:opacity-40 hover:bg-slate-100"
              >
                {lang === 'hi' ? 'अगला' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Spreadsheet Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-56 rounded border border-slate-300 bg-white p-1.5 shadow-xl font-mono text-xs space-y-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 font-bold text-slate-800 border-b border-slate-100 flex items-center justify-between text-[11px]">
            <span>
              {contextMenu.type === 'cell'
                ? `Cell: ${formatCellCoordinate(contextMenu.rowIdx, contextMenu.colIdx)}`
                : contextMenu.type === 'row'
                ? `Row: ${contextMenu.rowIdx + 1}`
                : `Col: ${colIndexToLetter(contextMenu.colIdx)}`}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Actions</span>
          </div>

          {/* Cell Shift & Insert Actions */}
          {contextMenu.type === 'cell' && (
            <>
              {onInsertCell && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertCell(contextMenu.rowIdx, contextMenu.colIdx, 'right');
                      setContextMenu(null);
                    }}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <ArrowRight className="h-3 w-3 text-blue-600" />
                    <span>{lang === 'hi' ? 'सेल जोड़ें (दाएं शिफ्ट)' : 'Insert Cell (Shift Right)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onInsertCell(contextMenu.rowIdx, contextMenu.colIdx, 'left');
                      setContextMenu(null);
                    }}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <ArrowLeft className="h-3 w-3 text-blue-600" />
                    <span>{lang === 'hi' ? 'सेल जोड़ें (बाएं शिफ्ट)' : 'Insert Cell (Shift Left)'}</span>
                  </button>
                </>
              )}

              {onDeleteCell && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCell(contextMenu.rowIdx, contextMenu.colIdx, 'left');
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                  <span>{lang === 'hi' ? 'सेल हटाएं (बाएं शिफ्ट)' : 'Delete Cell (Shift Left)'}</span>
                </button>
              )}

              <div className="border-t border-slate-100 my-1"></div>
            </>
          )}

          {/* Row Actions */}
          {onInsertRow && (
            <>
              <button
                type="button"
                onClick={() => {
                  onInsertRow(contextMenu.rowIdx, 'above');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-slate-700 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3 text-blue-600" />
                <span>{lang === 'hi' ? 'पंक्ति ऊपर जोड़ें' : 'Insert Row Above'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onInsertRow(contextMenu.rowIdx, 'below');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-slate-700 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3 text-blue-600" />
                <span>{lang === 'hi' ? 'पंक्ति नीचे जोड़ें' : 'Insert Row Below'}</span>
              </button>
            </>
          )}

          {onDeleteRow && (
            <button
              type="button"
              onClick={() => {
                onDeleteRow(contextMenu.rowIdx);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
              <span>{lang === 'hi' ? 'यह पंक्ति हटाएं' : 'Delete Row'}</span>
            </button>
          )}

          <div className="border-t border-slate-100 my-1"></div>

          {/* Column Actions */}
          {onInsertColumn && (
            <>
              <button
                type="button"
                onClick={() => {
                  onInsertColumn(contextMenu.colIdx, 'left');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-slate-700 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3 text-blue-600" />
                <span>{lang === 'hi' ? 'बाएं कॉलम जोड़ें' : 'Insert Column Left'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onInsertColumn(contextMenu.colIdx, 'right');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-slate-700 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3 text-blue-600" />
                <span>{lang === 'hi' ? 'दाएं कॉलम जोड़ें' : 'Insert Column Right'}</span>
              </button>
            </>
          )}

          {onQuickDeleteColumn && headers.length > 1 && (
            <button
              type="button"
              onClick={() => {
                onQuickDeleteColumn(contextMenu.colIdx);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
              <span>{lang === 'hi' ? 'यह कॉलम हटाएं' : 'Delete Column'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
