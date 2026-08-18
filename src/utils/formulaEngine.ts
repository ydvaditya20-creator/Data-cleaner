import { TableState, CellRange } from '../types';

/**
 * Converts a 0-based column index to an Excel-style letter (0 -> 'A', 25 -> 'Z', 26 -> 'AA')
 */
export function colIndexToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Converts an Excel-style column letter to a 0-based column index ('A' -> 0, 'Z' -> 25, 'AA' -> 26)
 */
export function letterToColIndex(letter: string): number {
  const clean = letter.toUpperCase().trim();
  let result = 0;
  for (let i = 0; i < clean.length; i++) {
    result = result * 26 + (clean.charCodeAt(i) - 64);
  }
  return result - 1;
}

/**
 * Parses a cell coordinate string (e.g. 'A1', 'B5', 'AA10') into 0-based row and column
 */
export function parseCellCoordinate(coord: string): { row: number; col: number } | null {
  const match = coord.trim().match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  const colLetter = match[1];
  const rowNumber = parseInt(match[2], 10);
  if (isNaN(rowNumber) || rowNumber < 1) return null;
  return {
    col: letterToColIndex(colLetter),
    row: rowNumber - 1, // convert 1-based to 0-based
  };
}

/**
 * Formats row and col (0-based) into a coordinate like 'A1', 'C4'
 */
export function formatCellCoordinate(row: number, col: number): string {
  return `${colIndexToLetter(col)}${row + 1}`;
}

/**
 * Parses a range string like 'A1:B10' into a CellRange
 */
export function parseRangeString(rangeStr: string): CellRange | null {
  const parts = rangeStr.trim().split(':');
  if (parts.length !== 2) return null;
  const start = parseCellCoordinate(parts[0]);
  const end = parseCellCoordinate(parts[1]);
  if (!start || !end) return null;
  return {
    startRow: Math.min(start.row, end.row),
    endRow: Math.max(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endCol: Math.max(start.col, end.col),
  };
}

/**
 * Safely evaluates a pure arithmetic expression like "2*5+1/4-1" using BODMAS / math precedence
 */
export function evaluateMathExpression(expr: string): number {
  if (!expr || typeof expr !== 'string') return 0;
  
  // Clean expression: remove '=' prefix and replace comma with point for decimals if needed
  let cleaned = expr.replace(/^=/, '').trim();
  if (!cleaned) return 0;

  // Remove any dangerous characters - only allow numbers, math operators, parentheses, decimal point
  const sanitized = cleaned.replace(/[^0-9+\-*/().^%eE ]/g, '');
  if (!sanitized) return 0;

  try {
    // Replace exponentiation '^' with '**'
    const jsExpr = sanitized.replace(/\^/g, '**');

    // Safe parser using Function (since only arithmetic characters are allowed)
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(`"use strict"; return (${jsExpr})`);
    const val = fn();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      // Round to 6 decimal places to avoid IEEE 754 precision artifacts (e.g. 0.30000000000000004)
      return Math.round(val * 1000000) / 1000000;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Resolves cell reference values from tableState
 */
function getCellValue(tableState: TableState, row: number, col: number): number {
  if (row < 0 || row >= tableState.rows.length) return 0;
  const r = tableState.rows[row];
  if (!r || col < 0 || col >= r.length) return 0;
  const valStr = (r[col] ?? '').replace(/[^0-9.-]+/g, '');
  const num = parseFloat(valStr);
  return isNaN(num) ? 0 : num;
}

/**
 * Gets array of numbers for a range like 'A1:A5'
 */
function getRangeValues(tableState: TableState, rangeStr: string): number[] {
  const parsed = parseRangeString(rangeStr);
  if (!parsed) {
    const single = parseCellCoordinate(rangeStr);
    if (!single) return [];
    return [getCellValue(tableState, single.row, single.col)];
  }
  const vals: number[] = [];
  for (let r = parsed.startRow; r <= parsed.endRow; r++) {
    for (let c = parsed.startCol; c <= parsed.endCol; c++) {
      vals.push(getCellValue(tableState, r, c));
    }
  }
  return vals;
}

/**
 * Evaluates Excel/Spreadsheet formula supporting:
 * - Direct math: "2*5+1/4-1" or "=2*5+1/4-1" -> 9.25
 * - Cell references: "=A1*2 + B1"
 * - Functions: SUM(A1:A10), AVERAGE(A1:A10), AVG(A1:A10), MIN(A1:A10), MAX(A1:A10), COUNT(A1:A10), ROUND(val, dec)
 */
export function evaluateFormula(
  formula: string,
  tableState?: TableState,
  currentRow: number = 0,
  currentCol: number = 0
): string {
  if (!formula || typeof formula !== 'string') return '';
  const raw = formula.trim();
  if (!raw) return '';

  let expr = raw.startsWith('=') ? raw.slice(1).trim() : raw;

  // If no tableState or simple pure arithmetic expression (no letters/functions)
  if (!tableState || !/[A-Za-z]/.test(expr)) {
    const num = evaluateMathExpression(expr);
    return num.toString();
  }

  // Handle spreadsheet functions
  // 1. SUM(A1:B5)
  expr = expr.replace(/SUM\(([^)]+)\)/gi, (_, range) => {
    const vals = getRangeValues(tableState, range);
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum.toString();
  });

  // 2. AVERAGE(A1:B5) / AVG(A1:B5)
  expr = expr.replace(/(?:AVERAGE|AVG)\(([^)]+)\)/gi, (_, range) => {
    const vals = getRangeValues(tableState, range);
    if (vals.length === 0) return '0';
    const sum = vals.reduce((a, b) => a + b, 0);
    return (sum / vals.length).toString();
  });

  // 3. MIN(A1:B5)
  expr = expr.replace(/MIN\(([^)]+)\)/gi, (_, range) => {
    const vals = getRangeValues(tableState, range);
    if (vals.length === 0) return '0';
    return Math.min(...vals).toString();
  });

  // 4. MAX(A1:B5)
  expr = expr.replace(/MAX\(([^)]+)\)/gi, (_, range) => {
    const vals = getRangeValues(tableState, range);
    if (vals.length === 0) return '0';
    return Math.max(...vals).toString();
  });

  // 5. COUNT(A1:B5)
  expr = expr.replace(/COUNT\(([^)]+)\)/gi, (_, range) => {
    const vals = getRangeValues(tableState, range);
    return vals.length.toString();
  });

  // 6. ROUND(expr, decimals)
  expr = expr.replace(/ROUND\(([^,]+),\s*(\d+)\)/gi, (_, subExpr, decStr) => {
    const subVal = evaluateMathExpression(subExpr);
    const dec = parseInt(decStr, 10);
    const factor = Math.pow(10, dec);
    return (Math.round(subVal * factor) / factor).toString();
  });

  // 7. Substitute Cell coordinates like A1, B3, C10
  expr = expr.replace(/\b([A-Za-z]+)(\d+)\b/g, (match, colLetter, rowNumStr) => {
    const col = letterToColIndex(colLetter);
    const row = parseInt(rowNumStr, 10) - 1;
    const val = getCellValue(tableState, row, col);
    return val.toString();
  });

  // 8. Substitute Column-relative tokens like @Col or [ColName] or current cell references
  expr = expr.replace(/@([A-Za-z]+)\b/g, (_, colLetter) => {
    const col = letterToColIndex(colLetter);
    const val = getCellValue(tableState, currentRow, col);
    return val.toString();
  });

  // Finally calculate the resulting arithmetic expression
  const result = evaluateMathExpression(expr);
  return result.toString();
}

/**
 * Checks if a string is a formula expression starting with '=' or containing arithmetic like '2*5+1/4-1'
 */
export function isFormulaOrMath(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const t = str.trim();
  if (t.startsWith('=')) return true;
  // Check if it's an arithmetic equation like "2*5+1/4-1" or "(10+5)/2"
  return /^[0-9\s.+\-*/^%()]+$/.test(t) && /[+\-*/^%]/.test(t);
}
