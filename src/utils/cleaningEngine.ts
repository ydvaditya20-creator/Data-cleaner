import {
  CleaningAction,
  CleaningRecipeScript,
  DictionaryRule,
  InitialSplitConfig,
  TableState,
} from '../types';
import { evaluateFormula, parseCellCoordinate } from './formulaEngine';

/**
 * Checks if a cell at (rowIdx, colIdx) falls within an optional range constraint
 */
function isCellInRange(
  rowIdx: number,
  colIdx: number,
  range?: { startRow?: number; endRow?: number; startCol?: number; endCol?: number }
): boolean {
  if (!range) return true;
  if (range.startRow !== undefined && rowIdx < range.startRow) return false;
  if (range.endRow !== undefined && rowIdx > range.endRow) return false;
  if (range.startCol !== undefined && colIdx < range.startCol) return false;
  if (range.endCol !== undefined && colIdx > range.endCol) return false;
  return true;
}

/**
 * Escapes string for RegExp usage
 */
function escapeRegex(str: string): string {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Parses a replacement rule value into an array of cell values.
 * Examples:
 * - "Late Fee" -> ["Late Fee"] (1 cell containing "Late Fee")
 * - "Late_Fee" -> ["Late_Fee"] (1 cell containing "Late_Fee")
 * - "Late Fee [BLANK]" -> ["Late Fee", ""] (2 cells: "Late Fee" and an empty cell)
 * - "Late_Fee [BLANK]" -> ["Late_Fee", ""] (2 cells: "Late_Fee" and an empty cell)
 * - "Late [BLANK] Fee" -> ["Late", "", "Fee"] (3 cells)
 * - "State [BLANK] Bank [BLANK] [BLANK] India" -> ["State", "", "Bank", "", "", "India"] (6 cells)
 * - "Late | Fee" -> ["Late", "Fee"] (2 cells)
 * - "[BLANK] [BLANK]" -> ["", ""] (2 blank cells)
 * - "[BLANK]" -> [""] (1 blank cell)
 */
export function parseReplacementTokens(replaceWith: string): string[] {
  if (replaceWith === undefined || replaceWith === null) return [''];
  const raw = replaceWith.trim();
  if (raw === '') return [''];

  // 1. Explicit pipe delimiter (e.g. "Late | Fee" or "Late | [BLANK]")
  if (raw.includes('|')) {
    return raw.split('|').map((part) => {
      const p = part.trim();
      return /^(\[BLANK\]|\[\])$/i.test(p) ? '' : p;
    });
  }

  // 2. Contains [BLANK] or []
  if (/\[BLANK\]|\[\]/i.test(raw)) {
    const tokens: string[] = [];
    const blankRegex = /\[BLANK\]|\[\]/gi;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = blankRegex.exec(raw)) !== null) {
      const textBefore = raw.substring(lastIdx, match.index).trim();
      if (textBefore.length > 0) {
        tokens.push(textBefore);
      }
      tokens.push(''); // Add blank cell
      lastIdx = blankRegex.lastIndex;
    }

    const textAfter = raw.substring(lastIdx).trim();
    if (textAfter.length > 0) {
      tokens.push(textAfter);
    }

    return tokens.length > 0 ? tokens : [''];
  }

  // 3. Otherwise: the entire text is a single cell value!
  return [raw];
}

/**
 * Applies dictionary phrase mappings with [BLANK] cell tokens to raw text before or during splitting.
 * Strictly verifies adjacent word sequences so that e.g. "Late Fee" only matches when "Late" is followed by "Fee",
 * and "Fee payment" only matches when "Fee" is followed by "payment".
 */
export function applyDictionaryToRawText(
  rawText: string,
  rules: DictionaryRule[],
  matchCase: boolean = false
): string {
  if (!rawText || !rules || rules.length === 0) return rawText;

  let processedText = rawText;
  const activeRules = rules.filter((r) => r.enabled !== false && r.original && r.original.trim().length > 0);
  if (activeRules.length === 0) return rawText;

  // Sort rules descending by token/word count, then by character length.
  // This guarantees compound phrases like "Late Fee" or "Fee payment" or "State Bank of India"
  // are processed BEFORE sub-tokens like "Fee", "Bank", "Late".
  const sortedRules = [...activeRules].sort((a, b) => {
    const tokensA = a.original.trim().split(/\s+/).length;
    const tokensB = b.original.trim().split(/\s+/).length;
    if (tokensB !== tokensA) {
      return tokensB - tokensA;
    }
    return b.original.trim().length - a.original.trim().length;
  });

  for (const rule of sortedRules) {
    const original = rule.original.trim();
    const cellTokens = parseReplacementTokens(rule.replaceWith ?? '');

    // Encode tokens into a single space-less sequence:
    // Empty cell -> "___B___"
    // Cell with text -> replace internal spaces with "___SPACE___"
    // Join cells with "___PIPE___"
    const encodedCells = cellTokens.map((tok) => {
      if (tok === '') return '___B___';
      return tok.replace(/\s+/g, '___SPACE___');
    });
    const secretChain = encodedCells.join('___PIPE___');

    const flags = matchCase ? 'g' : 'gi';
    
    // Split original into constituent words
    const words = original.split(/\s+/).map((w) => escapeRegex(w));
    const pattern = words.join('\\s+');

    // Safe boundary matching that preserves leading boundary and supports Unicode/Devanagari
    const regex = new RegExp(`(^|\\s|[^\\w\\d\\u0900-\\u097F])(${pattern})(?=$|\\s|[^\\w\\d\\u0900-\\u097F])`, flags);
    
    processedText = processedText.replace(regex, (_match, p1) => `${p1}${secretChain}`);
  }

  return processedText;
}

/**
 * Normalizes rows so every row has the same number of columns as the headers (or max columns).
 */
export function normalizeTable(headers: string[], rows: string[][]): { headers: string[]; rows: string[][] } {
  let maxCols = headers.length;
  for (const row of rows) {
    if (row.length > maxCols) {
      maxCols = row.length;
    }
  }

  // Ensure headers match maxCols
  const newHeaders = [...headers];
  while (newHeaders.length < maxCols) {
    newHeaders.push(`Col ${newHeaders.length + 1}`);
  }

  // Pad short rows with empty strings
  const newRows = rows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) {
      padded.push('');
    }
    return padded;
  });

  return { headers: newHeaders, rows: newRows };
}

/**
 * Executes the initial split of raw text into a 2D table array.
 */
export function executeInitialSplit(rawText: string, config: InitialSplitConfig): TableState {
  if (!rawText || !rawText.trim()) {
    return { headers: ['Col 1'], rows: [], totalRows: 0, totalColumns: 1 };
  }

  // Normalize line endings
  const rawLines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const filteredLines = config.removeEmptyInitialRows
    ? rawLines.filter((line) => line.trim().length > 0)
    : rawLines;

  if (filteredLines.length === 0) {
    return { headers: ['Col 1'], rows: [], totalRows: 0, totalColumns: 1 };
  }

  const rawRows: string[][] = [];

  for (const line of filteredLines) {
    let cells: string[] = [];

    switch (config.delimiter) {
      case 'spaces':
        // Split by one or more consecutive whitespace characters
        cells = line.trim().split(/\s+/);
        break;
      case 'single_space':
        cells = line.split(' ');
        break;
      case 'tab':
        cells = line.split('\t');
        break;
      case 'comma':
        cells = parseDelimitedLine(line, ',');
        break;
      case 'semicolon':
        cells = parseDelimitedLine(line, ';');
        break;
      case 'pipe':
        cells = line.split('|');
        break;
      case 'regex':
        try {
          if (config.customRegex) {
            const regex = new RegExp(config.customRegex);
            cells = line.split(regex);
          } else {
            cells = line.trim().split(/\s+/);
          }
        } catch {
          cells = line.trim().split(/\s+/);
        }
        break;
      case 'custom':
        if (config.customDelimiter) {
          cells = line.split(config.customDelimiter);
        } else {
          cells = line.trim().split(/\s+/);
        }
        break;
      default:
        cells = line.trim().split(/\s+/);
    }

    if (config.trimEachCell) {
      cells = cells.map((c) => c.trim());
    }

    // Expand any sub-columns created by dictionary rules & blank cell tokens
    const expandedCells: string[] = [];
    for (const cell of cells) {
      if (cell.includes('___PIPE___')) {
        const subCols = cell.split('___PIPE___');
        for (const sub of subCols) {
          expandedCells.push(sub === '___B___' ? '' : sub);
        }
      } else if (cell === '___B___') {
        expandedCells.push('');
      } else {
        expandedCells.push(cell);
      }
    }

    rawRows.push(expandedCells);
  }

  if (rawRows.length === 0) {
    return { headers: ['Col 1'], rows: [], totalRows: 0, totalColumns: 1 };
  }

  let headers: string[] = [];
  let rows: string[][] = [];

  if (config.firstRowIsHeader && rawRows.length > 0) {
    headers = rawRows[0].map((h, i) => (h && h.trim() ? h.trim() : `Col ${i + 1}`));
    rows = rawRows.slice(1);
  } else {
    const maxCols = Math.max(...rawRows.map((r) => r.length), 1);
    headers = Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`);
    rows = rawRows;
  }

  const normalized = normalizeTable(headers, rows);
  return {
    headers: normalized.headers,
    rows: normalized.rows,
    totalRows: normalized.rows.length,
    totalColumns: normalized.headers.length,
  };
}

/**
 * Helper to parse comma/semicolon separated lines while respecting basic quotes
 */
function parseDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Applies a single transformation action to the table state.
 */
export function applySingleAction(state: TableState, action: CleaningAction): TableState {
  if (!action.enabled) return state;

  const headers = [...state.headers];
  const rows = state.rows.map((r) => [...r]);

  switch (action.type) {
    case 'INITIAL_SPLIT':
      // Handled at pipeline level from raw text
      return state;

    case 'DICTIONARY_REPLACE': {
      const activeRules = (action.rules || []).filter((r) => r.enabled !== false && r.original && r.original.trim().length > 0);
      if (activeRules.length === 0) return state;

      // Sort rules descending by word/token count so compound phrases like "Late Fee" or "Fee payment"
      // run BEFORE single isolated words like "Fee" or "Late"
      const sortedRules = [...activeRules].sort((a, b) => {
        const wordsA = a.original.trim().split(/\s+/).length;
        const wordsB = b.original.trim().split(/\s+/).length;
        if (wordsB !== wordsA) return wordsB - wordsA;
        return b.original.trim().length - a.original.trim().length;
      });

      const newRows = rows.map((row) => {
        let currentRow = [...row];

        for (const rule of sortedRules) {
          const originalTokens = rule.original.trim().split(/\s+/);
          const replaceTokens = parseReplacementTokens(rule.replaceWith ?? '');

          if (originalTokens.length > 1) {
            // MULTI-CELL CONSECUTIVE SEQUENCE MATCHING:
            // Checks if adjacent cells in currentRow match originalTokens in strict order!
            // e.g. currentRow[j] === "Late" AND currentRow[j+1] === "Fee"
            // ONLY if ALL consecutive cells match, the replacement operation is performed!
            // If currentRow[j] is "Late" but next cell is "300" (not "Fee"), it skips and leaves it untouched!
            let j = 0;
            while (j <= currentRow.length - originalTokens.length) {
              let isMatch = true;
              for (let k = 0; k < originalTokens.length; k++) {
                const cellVal = (currentRow[j + k] ?? '').trim();
                const tokenVal = originalTokens[k].trim();
                if (action.matchCase) {
                  if (cellVal !== tokenVal) {
                    isMatch = false;
                    break;
                  }
                } else {
                  if (cellVal.toLowerCase() !== tokenVal.toLowerCase()) {
                    isMatch = false;
                    break;
                  }
                }
              }

              if (isMatch) {
                // Adjacent cells matched the entire phrase sequence!
                // Replace the matched consecutive cells with the replacement tokens
                currentRow.splice(j, originalTokens.length, ...replaceTokens);
                j += Math.max(1, replaceTokens.length);
              } else {
                j++;
              }
            }
          } else if (originalTokens.length === 1) {
            // SINGLE TOKEN / CELL MATCHING
            const targetToken = originalTokens[0].trim();
            for (let cIdx = 0; cIdx < currentRow.length; cIdx++) {
              const cellVal = (currentRow[cIdx] ?? '').trim();
              const isExact = action.matchCase
                ? cellVal === targetToken
                : cellVal.toLowerCase() === targetToken.toLowerCase();

              if (isExact) {
                currentRow.splice(cIdx, 1, ...replaceTokens);
                cIdx += Math.max(0, replaceTokens.length - 1);
              } else if (cellVal.length > 0) {
                // Word-boundary match inside cell if cell contains multiple internal words
                const safeSearch = escapeRegex(targetToken);
                const flags = action.matchCase ? 'g' : 'gi';
                const regex = new RegExp(`(^|\\s|[^\\w\\d\\u0900-\\u097F])(${safeSearch})(?=$|\\s|[^\\w\\d\\u0900-\\u097F])`, flags);
                if (regex.test(cellVal)) {
                  const replacedVal = cellVal.replace(regex, (_match, p1) => `${p1}${replaceTokens.join(' ')}`);
                  currentRow[cIdx] = replacedVal;
                }
              }
            }
          }
        }

        return currentRow;
      });

      const normalized = normalizeTable(headers, newRows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'SPLIT_COLUMN': {
      const colIdx = action.columnIndex;
      if (colIdx < 0 || colIdx >= headers.length) return state;

      const baseHeader = headers[colIdx];
      let maxSplitsFound = 1;

      // Determine splits for all rows
      const splitRows = rows.map((row) => {
        const val = row[colIdx] ?? '';
        let parts: string[] = [];

        if (action.delimiterType === 'spaces' || action.delimiterType === 'space') {
          parts = action.delimiterType === 'spaces' ? val.trim().split(/\s+/) : val.split(' ');
        } else if (action.delimiterType === 'comma') {
          parts = val.split(',');
        } else if (action.delimiterType === 'dash') {
          parts = val.split('-');
        } else if (action.delimiterType === 'custom' && action.customDelimiter) {
          parts = val.split(action.customDelimiter);
        } else if (action.delimiterType === 'regex' && action.customRegex) {
          try {
            parts = val.split(new RegExp(action.customRegex));
          } catch {
            parts = [val];
          }
        } else {
          parts = [val];
        }

        if (action.maxSplits && action.maxSplits > 0 && parts.length > action.maxSplits) {
          const kept = parts.slice(0, action.maxSplits - 1);
          const rest = parts.slice(action.maxSplits - 1).join(
            action.delimiterType === 'comma' ? ',' : action.customDelimiter ?? ' '
          );
          parts = [...kept, rest];
        }

        if (parts.length > maxSplitsFound) {
          maxSplitsFound = parts.length;
        }

        return parts;
      });

      // Construct new headers
      const customNames = action.newColumnNames || [];
      const newHeaderParts: string[] = [];
      for (let i = 0; i < maxSplitsFound; i++) {
        if (customNames[i] && customNames[i].trim()) {
          newHeaderParts.push(customNames[i].trim());
        } else {
          newHeaderParts.push(`${baseHeader}_part${i + 1}`);
        }
      }

      // Splice headers
      headers.splice(colIdx, 1, ...newHeaderParts);

      // Splice rows
      const newRows = rows.map((row, rIdx) => {
        const parts = splitRows[rIdx];
        while (parts.length < maxSplitsFound) {
          parts.push('');
        }
        const newRow = [...row];
        newRow.splice(colIdx, 1, ...parts);
        return newRow;
      });

      const normalized = normalizeTable(headers, newRows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'MERGE_COLUMNS': {
      const validIndices = action.columnIndices
        .filter((idx) => idx >= 0 && idx < headers.length)
        .sort((a, b) => a - b);

      if (validIndices.length < 2) return state;

      const sep = action.separator ?? ' ';
      const targetHeader = action.targetColumnName?.trim() || `Merged_${validIndices.map((i) => headers[i]).join('_')}`;

      if (action.replaceOriginals) {
        const firstIdx = validIndices[0];
        const newRows = rows.map((row) => {
          const mergedVal = validIndices.map((i) => row[i] ?? '').filter((v) => v !== '').join(sep);
          const newRow = row.filter((_, idx) => !validIndices.includes(idx));
          newRow.splice(firstIdx, 0, mergedVal);
          return newRow;
        });

        const newHeaders = headers.filter((_, idx) => !validIndices.includes(idx));
        newHeaders.splice(firstIdx, 0, targetHeader);

        const normalized = normalizeTable(newHeaders, newRows);
        return {
          headers: normalized.headers,
          rows: normalized.rows,
          totalRows: normalized.rows.length,
          totalColumns: normalized.headers.length,
        };
      } else {
        // Append as new column at the end
        const newHeaders = [...headers, targetHeader];
        const newRows = rows.map((row) => {
          const mergedVal = validIndices.map((i) => row[i] ?? '').filter((v) => v !== '').join(sep);
          return [...row, mergedVal];
        });

        const normalized = normalizeTable(newHeaders, newRows);
        return {
          headers: normalized.headers,
          rows: normalized.rows,
          totalRows: normalized.rows.length,
          totalColumns: normalized.headers.length,
        };
      }
    }

    case 'DELETE_COLUMNS': {
      const deleteSet = new Set(action.columnIndices);
      const newHeaders = headers.filter((_, idx) => !deleteSet.has(idx));
      const newRows = rows.map((row) => row.filter((_, idx) => !deleteSet.has(idx)));

      if (newHeaders.length === 0) {
        return { headers: ['Col 1'], rows: newRows.map(() => ['']), totalRows: newRows.length, totalColumns: 1 };
      }

      const normalized = normalizeTable(newHeaders, newRows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'RENAME_COLUMN': {
      const colIdx = action.columnIndex;
      if (colIdx >= 0 && colIdx < headers.length && action.newName?.trim()) {
        headers[colIdx] = action.newName.trim();
      }
      return { ...state, headers };
    }

    case 'REORDER_COLUMNS': {
      if (!action.newOrder || action.newOrder.length !== headers.length) return state;
      const newHeaders = action.newOrder.map((i) => headers[i]);
      const newRows = rows.map((row) => action.newOrder.map((i) => row[i] ?? ''));
      return {
        headers: newHeaders,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: newHeaders.length,
      };
    }

    case 'FILTER_ROWS': {
      const colIdx = action.targetColumnIndex;
      const val = action.value ?? '';
      const caseSensitive = action.caseSensitive ?? false;

      let filteredRows = [...rows];

      if (action.condition === 'skip_first_n') {
        const n = parseInt(val, 10) || 0;
        filteredRows = filteredRows.slice(n);
      } else if (action.condition === 'skip_last_n') {
        const n = parseInt(val, 10) || 0;
        filteredRows = n > 0 ? filteredRows.slice(0, -n) : filteredRows;
      } else {
        filteredRows = filteredRows.filter((row) => {
          // If specific column, test that cell; else test if any/all match
          const cellValues = colIdx !== undefined && colIdx >= 0 && colIdx < row.length
            ? [row[colIdx]]
            : row;

          const rowString = cellValues.join(' ');
          const targetStr = caseSensitive ? rowString : rowString.toLowerCase();
          const query = caseSensitive ? val : val.toLowerCase();

          switch (action.condition) {
            case 'contains':
              return targetStr.includes(query);
            case 'not_contains':
              return !targetStr.includes(query);
            case 'starts_with':
              return targetStr.trim().startsWith(query);
            case 'ends_with':
              return targetStr.trim().endsWith(query);
            case 'is_empty':
              return cellValues.every((c) => !c || c.trim() === '');
            case 'is_not_empty':
              return cellValues.some((c) => Boolean(c && c.trim() !== ''));
            case 'matches_regex':
              try {
                const regex = new RegExp(val, caseSensitive ? '' : 'i');
                return regex.test(rowString);
              } catch {
                return true;
              }
            default:
              return true;
          }
        });
      }

      return {
        headers,
        rows: filteredRows,
        totalRows: filteredRows.length,
        totalColumns: headers.length,
      };
    }

    case 'FIND_REPLACE': {
      const colIdx = action.targetColumnIndex;
      const findText = action.findText ?? '';
      const replaceText = action.replaceText ?? '';
      const caseSensitive = action.caseSensitive ?? false;
      const useRegex = action.useRegex ?? false;

      let regex: RegExp | null = null;
      if (useRegex) {
        try {
          regex = new RegExp(findText, caseSensitive ? 'g' : 'gi');
        } catch {
          regex = null;
        }
      }

      const newRows = rows.map((row, rIdx) => {
        return row.map((cell, idx) => {
          if (!isCellInRange(rIdx, idx, action.range)) return cell;
          if (colIdx !== undefined && colIdx !== idx) return cell;

          if (regex) {
            return cell.replace(regex, replaceText);
          } else {
            if (!findText) return cell;
            if (caseSensitive) {
              return cell.replaceAll(findText, replaceText);
            } else {
              const esc = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              return cell.replace(new RegExp(esc, 'gi'), replaceText);
            }
          }
        });
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'TEXT_CASE': {
      const colIdx = action.targetColumnIndex;
      const newRows = rows.map((row, rIdx) => {
        return row.map((cell, idx) => {
          if (!isCellInRange(rIdx, idx, action.range)) return cell;
          if (colIdx !== undefined && colIdx !== idx) return cell;
          switch (action.caseType) {
            case 'UPPER':
              return cell.toUpperCase();
            case 'LOWER':
              return cell.toLowerCase();
            case 'TITLE':
              return cell.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
            case 'SENTENCE':
              return cell.charAt(0).toUpperCase() + cell.slice(1).toLowerCase();
            default:
              return cell;
          }
        });
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'TRIM_SPACES': {
      const colIdx = action.targetColumnIndex;
      const newRows = rows.map((row, rIdx) => {
        return row.map((cell, idx) => {
          if (!isCellInRange(rIdx, idx, action.range)) return cell;
          if (colIdx !== undefined && colIdx !== idx) return cell;
          switch (action.trimType) {
            case 'both':
              return cell.trim();
            case 'start':
              return cell.trimStart();
            case 'end':
              return cell.trimEnd();
            case 'collapse_internal':
              return cell.trim().replace(/\s+/g, ' ');
            default:
              return cell.trim();
          }
        });
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'EXTRACT_PATTERN': {
      const colIdx = action.columnIndex;
      if (colIdx < 0 || colIdx >= headers.length) return state;

      let regex: RegExp;
      switch (action.patternType) {
        case 'digits':
          regex = /(\d+[\d,.]*)/;
          break;
        case 'amount':
          regex = /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|\d+(?:\.\d+)?)/;
          break;
        case 'email':
          regex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
          break;
        case 'date':
          regex = /(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/;
          break;
        case 'phone':
          regex = /(\+?\d[\d -]{7,}\d)/;
          break;
        case 'regex':
          try {
            regex = new RegExp(action.customRegex || '.*');
          } catch {
            regex = /.*/;
          }
          break;
        default:
          regex = /.*/;
      }

      const targetColName = action.targetColumnName || `${headers[colIdx]}_extracted`;

      if (action.replaceOriginal) {
        const newRows = rows.map((row) => {
          const val = row[colIdx] ?? '';
          const match = val.match(regex);
          const extracted = match ? match[1] || match[0] : '';
          const newRow = [...row];
          newRow[colIdx] = extracted;
          return newRow;
        });

        if (action.targetColumnName) {
          headers[colIdx] = action.targetColumnName;
        }

        return {
          headers,
          rows: newRows,
          totalRows: newRows.length,
          totalColumns: headers.length,
        };
      } else {
        const newHeaders = [...headers, targetColName];
        const newRows = rows.map((row) => {
          const val = row[colIdx] ?? '';
          const match = val.match(regex);
          const extracted = match ? match[1] || match[0] : '';
          return [...row, extracted];
        });

        const normalized = normalizeTable(newHeaders, newRows);
        return {
          headers: normalized.headers,
          rows: normalized.rows,
          totalRows: normalized.rows.length,
          totalColumns: normalized.headers.length,
        };
      }
    }

    case 'FILL_EMPTY': {
      const colIdx = action.targetColumnIndex;
      const fillVal = action.fillValue ?? '';

      const newRows = rows.map((row) => {
        return row.map((cell, idx) => {
          if (colIdx !== undefined && colIdx !== idx) return cell;
          return !cell || cell.trim() === '' ? fillVal : cell;
        });
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'FILL_DOWN': {
      const colIdx = action.targetColumnIndex;
      if (colIdx < 0 || colIdx >= headers.length) return state;

      let lastSeenValue = '';
      const newRows = rows.map((row) => {
        const currentVal = row[colIdx];
        if (currentVal && currentVal.trim() !== '') {
          lastSeenValue = currentVal;
          return row;
        } else {
          const newRow = [...row];
          newRow[colIdx] = lastSeenValue;
          return newRow;
        }
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'REMOVE_DUPLICATES': {
      const colIdx = action.keyColumnIndex;
      const seen = new Set<string>();
      const deduplicatedRows = rows.filter((row) => {
        const key = colIdx !== undefined && colIdx >= 0 && colIdx < row.length
          ? row[colIdx]
          : row.join('|||');

        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      return {
        headers,
        rows: deduplicatedRows,
        totalRows: deduplicatedRows.length,
        totalColumns: headers.length,
      };
    }

    case 'SET_HEADERS_FROM_ROW': {
      const rIdx = action.rowIndex;
      if (rIdx < 0 || rIdx >= rows.length) return state;

      const headerRow = rows[rIdx];
      const newHeaders = headerRow.map((c, i) => (c && c.trim() ? c.trim() : `Col ${i + 1}`));

      let newRows = [...rows];
      if (action.removeHeaderRow) {
        newRows = newRows.filter((_, idx) => idx !== rIdx);
      }

      const normalized = normalizeTable(newHeaders, newRows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'CUSTOM_HEADERS': {
      if (!action.headers || action.headers.length === 0) return state;
      const newHeaders = [...action.headers];
      while (newHeaders.length < headers.length) {
        newHeaders.push(`Col ${newHeaders.length + 1}`);
      }
      const normalized = normalizeTable(newHeaders, rows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'PREFIX_SUFFIX': {
      const colIdx = action.targetColumnIndex;
      const prefix = action.prefix ?? '';
      const suffix = action.suffix ?? '';

      const newRows = rows.map((row) => {
        return row.map((cell, idx) => {
          if (colIdx !== undefined && colIdx !== idx) return cell;
          if (!cell || cell.trim() === '') return cell;
          return `${prefix}${cell}${suffix}`;
        });
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'ADD_SEQUENCE_COLUMN': {
      const colName = action.columnName?.trim() || 'Sr_No';
      const startNum = action.startNumber ?? 1;
      const step = action.step ?? 1;
      const atStart = action.insertPosition !== 'end';

      const newHeaders = atStart ? [colName, ...headers] : [...headers, colName];
      const newRows = rows.map((row, idx) => {
        const seqVal = String(startNum + idx * step);
        return atStart ? [seqVal, ...row] : [...row, seqVal];
      });

      const normalized = normalizeTable(newHeaders, newRows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'INSERT_CELL': {
      const rIdx = action.rowIndex;
      const cIdx = action.columnIndex;
      const fill = action.fillValue ?? '';
      const shiftDirection = action.shiftDirection ?? 'right';
      if (rIdx < 0 || rIdx >= rows.length) return state;

      const newRows = rows.map((r, i) => {
        if (i !== rIdx) return [...r];
        const newRow = [...r];
        
        // Exact insertCell logic matching user's DOM/table algorithm:
        // let targetIndex = activeCell.cellIndex;
        // if (direction === 'right') targetIndex++;
        // row.insertCell(targetIndex) -> inserts blank cell
        let targetIndex = Math.max(0, Math.min(newRow.length, cIdx));
        if (shiftDirection === 'right') {
          targetIndex = Math.min(newRow.length, targetIndex + 1);
        }

        // Insert new cell at calculated target index
        newRow.splice(targetIndex, 0, fill);
        return newRow;
      });

      const normalized = normalizeTable(headers, newRows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'DELETE_CELL': {
      const rIdx = action.rowIndex;
      const cIdx = action.columnIndex;
      if (rIdx < 0 || rIdx >= rows.length) return state;

      const newRows = rows.map((r, i) => {
        if (i !== rIdx) return [...r];
        const newRow = [...r];
        if (cIdx >= 0 && cIdx < newRow.length) {
          // Delete cell at cIdx (subsequent cells shift left)
          newRow.splice(cIdx, 1);
          while (newRow.length < headers.length) {
            newRow.push(''); // Pad empty at end to maintain grid rectangular width
          }
        }
        return newRow;
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'INSERT_ROW': {
      const rIdx = action.rowIndex;
      const atAbove = action.position === 'above';
      const newRowVals = action.initialValues && action.initialValues.length > 0
        ? [...action.initialValues]
        : headers.map(() => '');

      const newRows = [...rows];
      const targetIdx = atAbove ? Math.max(0, rIdx) : Math.min(rows.length, rIdx + 1);
      newRows.splice(targetIdx, 0, newRowVals);

      const normalized = normalizeTable(headers, newRows);
      return {
        headers: normalized.headers,
        rows: normalized.rows,
        totalRows: normalized.rows.length,
        totalColumns: normalized.headers.length,
      };
    }

    case 'DELETE_ROW': {
      const rIdx = action.rowIndex;
      if (rIdx < 0 || rIdx >= rows.length) return state;
      const newRows = rows.filter((_, i) => i !== rIdx);
      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'INSERT_COLUMN': {
      const cIdx = action.columnIndex;
      const atLeft = action.position === 'left';
      const targetColIdx = atLeft ? Math.max(0, cIdx) : Math.min(headers.length, cIdx + 1);
      const colName = action.headerName?.trim() || `Col ${headers.length + 1}`;
      const fill = action.fillValue ?? '';

      const newHeaders = [...headers];
      newHeaders.splice(targetColIdx, 0, colName);

      const newRows = rows.map((r) => {
        const nr = [...r];
        nr.splice(targetColIdx, 0, fill);
        return nr;
      });

      return {
        headers: newHeaders,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: newHeaders.length,
      };
    }

    case 'EDIT_CELL': {
      const rIdx = action.rowIndex;
      const cIdx = action.columnIndex;
      if (rIdx < 0 || rIdx >= rows.length) return state;

      let val = action.value;
      if (typeof val === 'string' && val.startsWith('=')) {
        val = evaluateFormula(val, state, rIdx, cIdx);
      }

      const newRows = rows.map((r, i) => {
        if (i !== rIdx) return r;
        const nr = [...r];
        while (nr.length <= cIdx) nr.push('');
        nr[cIdx] = val;
        return nr;
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    case 'APPLY_FORMULA': {
      const formula = action.formula;
      if (!formula) return state;

      const targetMode = action.targetMode ?? 'all';
      const colIdx = action.targetColumnIndex;
      const customRange = action.customRange ?? action.range;

      const newRows = rows.map((r, rIdx) => {
        return r.map((cell, cIdx) => {
          // Check range filter
          if (customRange) {
            if (customRange.startRow !== undefined && rIdx < customRange.startRow) return cell;
            if (customRange.endRow !== undefined && rIdx > customRange.endRow) return cell;
            if (customRange.startCol !== undefined && cIdx < customRange.startCol) return cell;
            if (customRange.endCol !== undefined && cIdx > customRange.endCol) return cell;
          }
          if (targetMode === 'column' && colIdx !== undefined && colIdx !== cIdx) {
            return cell;
          }
          if (targetMode === 'cell' && action.cellCoordinate) {
            const parsed = parseCellCoordinate(action.cellCoordinate);
            if (parsed && (parsed.row !== rIdx || parsed.col !== cIdx)) return cell;
          }

          // Evaluate formula for this cell
          return evaluateFormula(formula, state, rIdx, cIdx);
        });
      });

      return {
        headers,
        rows: newRows,
        totalRows: newRows.length,
        totalColumns: headers.length,
      };
    }

    default:
      return state;
  }
}

/**
 * Runs the entire transformation pipeline from raw text through all recipe actions.
 * Supports running up to a specific step index for time-travel debugging!
 */
export function executePipeline(
  rawText: string,
  actions: CleaningAction[],
  upToStepIndex?: number
): {
  finalState: TableState;
  stepStates: { action: CleaningAction; state: TableState; stepNumber: number }[];
  durationMs: number;
} {
  const startTime = performance.now();

  // Find initial split config
  const initialSplitAction = actions.find((a) => a.type === 'INITIAL_SPLIT');
  const initialConfig: InitialSplitConfig = initialSplitAction
    ? (initialSplitAction as any).config
    : {
        delimiter: 'spaces',
        treatConsecutiveSpacesAsOne: true,
        trimEachCell: true,
        removeEmptyInitialRows: true,
        firstRowIsHeader: false,
      };

  // Apply any active dictionary rules before initial split so multi-blank and phrase chains expand properly
  let processedRawText = rawText;
  const dictActions = actions.filter((a) => a.type === 'DICTIONARY_REPLACE' && a.enabled);
  for (const dictAct of dictActions) {
    if (dictAct.type === 'DICTIONARY_REPLACE' && dictAct.rules) {
      processedRawText = applyDictionaryToRawText(processedRawText, dictAct.rules, dictAct.matchCase);
    }
  }

  let currentState = executeInitialSplit(processedRawText, initialConfig);
  const stepStates: { action: CleaningAction; state: TableState; stepNumber: number }[] = [];

  // Filter remaining actions
  const otherActions = actions.filter((a) => a.type !== 'INITIAL_SPLIT');

  const maxSteps = upToStepIndex !== undefined ? Math.min(upToStepIndex + 1, otherActions.length) : otherActions.length;

  for (let i = 0; i < maxSteps; i++) {
    const action = otherActions[i];
    if (action.enabled) {
      currentState = applySingleAction(currentState, action);
    }
    stepStates.push({
      action,
      state: currentState,
      stepNumber: i + 1,
    });
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    finalState: currentState,
    stepStates,
    durationMs,
  };
}

/**
 * Validates a loaded recipe script against the schema.
 */
export function validateScriptJson(jsonString: string): { valid: boolean; script?: CleaningRecipeScript; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid JSON structure: Root must be an object' };
    }
    if (!Array.isArray(parsed.actions)) {
      return { valid: false, error: 'Script must contain an "actions" array' };
    }

    const script: CleaningRecipeScript = {
      version: parsed.version || '1.0',
      id: parsed.id || `recipe_${Date.now()}`,
      name: parsed.name || 'Imported Cleaning Script',
      description: parsed.description || 'Imported data cleaning recipe',
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dictionaryRules: Array.isArray(parsed.dictionaryRules) ? parsed.dictionaryRules : undefined,
      actions: parsed.actions,
    };

    return { valid: true, script };
  } catch (err: any) {
    return { valid: false, error: err.message || 'JSON parse failed' };
  }
}

/**
 * Automatically scans raw text or table rows to discover adjacent words/cells
 * (e.g., "Late Fee", "Fee payment", "State Bank", "Account Number") that frequently appear together.
 */
export function detectAdjacentCellPhrases(
  rawText: string,
  tableRows?: string[][]
): { phrase: string; count: number; suggestedReplace: string }[] {
  const phraseCounts = new Map<string, number>();

  // 1. Scan raw text lines
  if (rawText && rawText.trim()) {
    const lines = rawText.split(/\r?\n/);
    for (const line of lines) {
      const words = line.trim().split(/\s+/).filter((w) => w.length > 1 && /^[a-zA-Z\u0900-\u097F]+$/.test(w));
      // 2-word pairs
      for (let i = 0; i < words.length - 1; i++) {
        const pair = `${words[i]} ${words[i + 1]}`;
        phraseCounts.set(pair, (phraseCounts.get(pair) || 0) + 1);
      }
    }
  }

  // 2. Scan table rows across adjacent columns
  if (tableRows && tableRows.length > 0) {
    for (const row of tableRows) {
      for (let j = 0; j < row.length - 1; j++) {
        const c1 = (row[j] ?? '').trim();
        const c2 = (row[j + 1] ?? '').trim();
        if (c1.length > 1 && c2.length > 1 && /^[a-zA-Z\u0900-\u097F]+$/.test(c1) && /^[a-zA-Z\u0900-\u097F]+$/.test(c2)) {
          const pair = `${c1} ${c2}`;
          phraseCounts.set(pair, (phraseCounts.get(pair) || 0) + 1);
        }
      }
    }
  }

  // Filter pairs that appear at least once or multiple times
  const results: { phrase: string; count: number; suggestedReplace: string }[] = [];
  phraseCounts.forEach((count, phrase) => {
    if (count >= 1) {
      const tokens = phrase.split(' ');
      results.push({
        phrase,
        count,
        suggestedReplace: `${tokens.join('_')} [BLANK]`,
      });
    }
  });

  return results.sort((a, b) => b.count - a.count).slice(0, 12);
}
