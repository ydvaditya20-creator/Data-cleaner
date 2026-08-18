import * as XLSX from 'xlsx';
import { CleaningRecipeScript, TableState } from '../types';

/**
 * Downloads a text/json string as a client file.
 */
export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the Cleaning Recipe Script as a .json file.
 */
export function downloadScriptJson(script: CleaningRecipeScript, customFilename?: string) {
  const cleanName = (script.name || 'cleaning_recipe_script')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const filename = customFilename || `${cleanName || 'script_recipe'}.json`;
  const formattedJson = JSON.stringify(script, null, 2);
  downloadFile(formattedJson, filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json');
}

/**
 * Exports Table to Excel (.xlsx) using xlsx.
 */
export function exportToExcel(state: TableState, filename = 'cleaned_data.xlsx') {
  const worksheetData = [state.headers, ...state.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths based on content
  const colWidths = state.headers.map((h, colIdx) => {
    let maxLen = h.length;
    for (const row of state.rows.slice(0, 100)) {
      const cellVal = row[colIdx] || '';
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Data');
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Exports Table to standard CSV with quotes where needed.
 */
export function exportToCsv(state: TableState, filename = 'cleaned_data.csv') {
  const escapeCell = (cell: string) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    state.headers.map(escapeCell).join(','),
    ...state.rows.map((row) => row.map(escapeCell).join(',')),
  ];

  downloadFile(lines.join('\r\n'), filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports Table to Tab Separated Values (TSV).
 */
export function exportToTsv(state: TableState, filename = 'cleaned_data.tsv') {
  const lines = [
    state.headers.join('\t'),
    ...state.rows.map((row) => row.join('\t')),
  ];
  downloadFile(lines.join('\r\n'), filename.endsWith('.tsv') ? filename : `${filename}.tsv`, 'text/tab-separated-values;charset=utf-8;');
}

/**
 * Exports Table to JSON Array of Objects.
 */
export function exportToJson(state: TableState, filename = 'cleaned_data.json') {
  const objects = state.rows.map((row) => {
    const obj: Record<string, string> = {};
    state.headers.forEach((header, idx) => {
      obj[header || `col_${idx + 1}`] = row[idx] ?? '';
    });
    return obj;
  });

  downloadFile(JSON.stringify(objects, null, 2), filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json');
}

/**
 * Downloads Dictionary Rules as a .json file.
 */
export function downloadDictionaryJson(rules: { original: string; replaceWith: string }[], filename = 'my_dictionary.json') {
  const activeDict = rules
    .filter((r) => r.original && r.original.trim() !== '')
    .map((r) => ({
      original: r.original,
      replaceWith: r.replaceWith,
    }));
  const formattedJson = JSON.stringify(activeDict, null, 2);
  downloadFile(formattedJson, filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json');
}

/**
 * Copies table data as TSV (easy to paste into Excel/Google Sheets directly).
 */
export async function copyTableToClipboard(state: TableState): Promise<boolean> {
  try {
    const lines = [
      state.headers.join('\t'),
      ...state.rows.map((row) => row.join('\t')),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    return true;
  } catch (e) {
    console.error('Failed to copy to clipboard', e);
    return false;
  }
}

/**
 * Generates a clean Markdown table string.
 */
export function generateMarkdownTable(state: TableState): string {
  if (state.headers.length === 0) return '';
  const headerLine = `| ${state.headers.join(' | ')} |`;
  const dividerLine = `| ${state.headers.map(() => '---').join(' | ')} |`;
  const rowLines = state.rows.map((row) => `| ${row.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`);
  return [headerLine, dividerLine, ...rowLines].join('\n');
}
