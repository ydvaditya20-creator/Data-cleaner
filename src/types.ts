/**
 * Data Cleaning & Automation Script Types
 */

export type ActionType =
  | 'INITIAL_SPLIT'
  | 'DICTIONARY_REPLACE'
  | 'SPLIT_COLUMN'
  | 'MERGE_COLUMNS'
  | 'DELETE_COLUMNS'
  | 'RENAME_COLUMN'
  | 'REORDER_COLUMNS'
  | 'FILTER_ROWS'
  | 'FIND_REPLACE'
  | 'TEXT_CASE'
  | 'TRIM_SPACES'
  | 'EXTRACT_PATTERN'
  | 'FILL_EMPTY'
  | 'FILL_DOWN'
  | 'REMOVE_DUPLICATES'
  | 'SET_HEADERS_FROM_ROW'
  | 'CUSTOM_HEADERS'
  | 'PREFIX_SUFFIX'
  | 'ADD_SEQUENCE_COLUMN'
  | 'INSERT_CELL'
  | 'DELETE_CELL'
  | 'INSERT_ROW'
  | 'DELETE_ROW'
  | 'INSERT_COLUMN'
  | 'EDIT_CELL'
  | 'APPLY_FORMULA';

export type TextPlacementMode = 'flow' | 'most_left' | 'most_right' | 'specific_col';
export type TextJoinMode = 'words' | 'single_cell_space' | 'single_cell_underscore' | 'single_cell_hyphen';

export interface CellRange {
  startRow: number; // 0-based
  endRow: number;   // 0-based inclusive
  startCol: number; // 0-based
  endCol: number;   // 0-based inclusive
}

export interface DictionaryRule {
  id: string;
  original: string;
  replaceWith: string;
  enabled?: boolean;
  placement?: TextPlacementMode;
  targetColumnIndex?: number; // 0-based target column
  joinMode?: TextJoinMode;
  range?: {
    startRow?: number; // 1-based row filter
    endRow?: number;
  };
}

export type SplitDelimiter = 'spaces' | 'single_space' | 'tab' | 'comma' | 'semicolon' | 'pipe' | 'regex' | 'custom';

export interface InitialSplitConfig {
  delimiter: SplitDelimiter;
  customDelimiter?: string;
  customRegex?: string;
  treatConsecutiveSpacesAsOne: boolean;
  trimEachCell: boolean;
  removeEmptyInitialRows: boolean;
  firstRowIsHeader: boolean;
}

export type FilterCondition =
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'matches_regex'
  | 'skip_first_n'
  | 'skip_last_n';

export interface BaseAction {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  enabled: boolean;
  range?: {
    startRow?: number; // 0-based
    endRow?: number;
    startCol?: number;
    endCol?: number;
  };
}

export interface InitialSplitAction extends BaseAction {
  type: 'INITIAL_SPLIT';
  config: InitialSplitConfig;
}

export interface SplitColumnAction extends BaseAction {
  type: 'SPLIT_COLUMN';
  columnIndex: number;
  delimiterType: 'space' | 'spaces' | 'comma' | 'dash' | 'custom' | 'regex';
  customDelimiter?: string;
  customRegex?: string;
  maxSplits?: number;
  newColumnNames?: string[];
}

export interface MergeColumnsAction extends BaseAction {
  type: 'MERGE_COLUMNS';
  columnIndices: number[];
  separator: string;
  targetColumnName: string;
  replaceOriginals: boolean;
}

export interface DeleteColumnsAction extends BaseAction {
  type: 'DELETE_COLUMNS';
  columnIndices: number[];
}

export interface RenameColumnAction extends BaseAction {
  type: 'RENAME_COLUMN';
  columnIndex: number;
  newName: string;
}

export interface ReorderColumnsAction extends BaseAction {
  type: 'REORDER_COLUMNS';
  newOrder: number[]; // array of current column indices in new sequence
}

export interface FilterRowsAction extends BaseAction {
  type: 'FILTER_ROWS';
  targetColumnIndex?: number; // undefined means all columns / whole row
  condition: FilterCondition;
  value?: string;
  caseSensitive?: boolean;
}

export interface FindReplaceAction extends BaseAction {
  type: 'FIND_REPLACE';
  targetColumnIndex?: number; // undefined means all columns
  findText: string;
  replaceText: string;
  useRegex?: boolean;
  caseSensitive?: boolean;
}

export interface TextCaseAction extends BaseAction {
  type: 'TEXT_CASE';
  targetColumnIndex?: number; // undefined means all
  caseType: 'UPPER' | 'LOWER' | 'TITLE' | 'SENTENCE';
}

export interface TrimSpacesAction extends BaseAction {
  type: 'TRIM_SPACES';
  targetColumnIndex?: number;
  trimType: 'both' | 'start' | 'end' | 'collapse_internal';
}

export interface ExtractPatternAction extends BaseAction {
  type: 'EXTRACT_PATTERN';
  columnIndex: number;
  patternType: 'digits' | 'email' | 'date' | 'phone' | 'amount' | 'regex';
  customRegex?: string;
  targetColumnName?: string;
  replaceOriginal: boolean;
}

export interface FillEmptyAction extends BaseAction {
  type: 'FILL_EMPTY';
  targetColumnIndex?: number;
  fillValue: string;
}

export interface FillDownAction extends BaseAction {
  type: 'FILL_DOWN';
  targetColumnIndex: number;
}

export interface RemoveDuplicatesAction extends BaseAction {
  type: 'REMOVE_DUPLICATES';
  keyColumnIndex?: number; // undefined = whole row match
}

export interface SetHeadersFromRowAction extends BaseAction {
  type: 'SET_HEADERS_FROM_ROW';
  rowIndex: number;
  removeHeaderRow: boolean;
}

export interface CustomHeadersAction extends BaseAction {
  type: 'CUSTOM_HEADERS';
  headers: string[];
}

export interface PrefixSuffixAction extends BaseAction {
  type: 'PREFIX_SUFFIX';
  targetColumnIndex?: number;
  prefix: string;
  suffix: string;
}

export interface DictionaryReplaceAction extends BaseAction {
  type: 'DICTIONARY_REPLACE';
  rules: DictionaryRule[];
  matchCase?: boolean;
}

export interface AddSequenceColumnAction extends BaseAction {
  type: 'ADD_SEQUENCE_COLUMN';
  columnName?: string;
  startNumber?: number;
  step?: number;
  insertPosition?: 'start' | 'end';
}

export interface InsertCellAction extends BaseAction {
  type: 'INSERT_CELL';
  rowIndex: number;
  columnIndex: number;
  shiftDirection: 'right' | 'left';
  fillValue?: string;
}

export interface DeleteCellAction extends BaseAction {
  type: 'DELETE_CELL';
  rowIndex: number;
  columnIndex: number;
  shiftDirection: 'left' | 'up';
}

export interface InsertRowAction extends BaseAction {
  type: 'INSERT_ROW';
  rowIndex: number;
  position: 'above' | 'below';
  initialValues?: string[];
}

export interface DeleteRowAction extends BaseAction {
  type: 'DELETE_ROW';
  rowIndex: number;
}

export interface InsertColumnAction extends BaseAction {
  type: 'INSERT_COLUMN';
  columnIndex: number;
  position: 'left' | 'right';
  headerName?: string;
  fillValue?: string;
}

export interface EditCellAction extends BaseAction {
  type: 'EDIT_CELL';
  rowIndex: number;
  columnIndex: number;
  value: string;
}

export interface ApplyFormulaAction extends BaseAction {
  type: 'APPLY_FORMULA';
  formula: string;
  targetMode?: 'range' | 'column' | 'cell' | 'all';
  targetColumnIndex?: number;
  cellCoordinate?: string; // e.g. "B3"
  customRange?: CellRange;
}

export type CleaningAction =
  | InitialSplitAction
  | DictionaryReplaceAction
  | SplitColumnAction
  | MergeColumnsAction
  | DeleteColumnsAction
  | RenameColumnAction
  | ReorderColumnsAction
  | FilterRowsAction
  | FindReplaceAction
  | TextCaseAction
  | TrimSpacesAction
  | ExtractPatternAction
  | FillEmptyAction
  | FillDownAction
  | RemoveDuplicatesAction
  | SetHeadersFromRowAction
  | CustomHeadersAction
  | PrefixSuffixAction
  | AddSequenceColumnAction
  | InsertCellAction
  | DeleteCellAction
  | InsertRowAction
  | DeleteRowAction
  | InsertColumnAction
  | EditCellAction
  | ApplyFormulaAction;

export interface CleaningRecipeScript {
  version: '1.0';
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  matchPatternSample?: string;
  dictionaryRules?: DictionaryRule[];
  actions: CleaningAction[];
}

export interface TableState {
  headers: string[];
  rows: string[][];
  warnings?: string[];
  totalRows: number;
  totalColumns: number;
}

export interface SampleDataset {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  description: string;
  descriptionHi: string;
  rawText: string;
  suggestedScript?: CleaningRecipeScript;
}
