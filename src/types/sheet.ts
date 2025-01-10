export interface Cell {
  id: string;
  value: string;
  formula: string;
  format: CellFormat;
  computed?: number | string;
}

export interface CellFormat {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  color: string;
}

export interface SheetState {
  cells: { [key: string]: Cell };
  selectedCell: string | null;
  selectedRange: string[];
  columnWidths: { [key: string]: number };
  rowHeights: { [key: string]: number };
}

export type CellPosition = {
  row: number;
  col: number;
};