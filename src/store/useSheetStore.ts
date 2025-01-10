import { create } from 'zustand';
import { Cell, SheetState } from '../types/sheet';
import { evaluateFormula } from '../utils/formulas';

interface SheetStore extends SheetState {
  updateCell: (id: string, updates: Partial<Cell>) => void;
  setSelectedCell: (id: string | null) => void;
  setSelectedRange: (range: string[]) => void;
  updateColumnWidth: (col: string, width: number) => void;
  updateRowHeight: (row: string, height: number) => void;
  addRow: (afterRow: number) => void;
  deleteRow: (row: number) => void;
  addColumn: (afterCol: string) => void;
  deleteColumn: (col: string) => void;
  validateCell: (value: string) => boolean;
}

const useSheetStore = create<SheetStore>((set, get) => ({
  cells: {},
  selectedCell: null,
  selectedRange: [],
  columnWidths: {},
  rowHeights: {},

  updateCell: (id, updates) => {
    set((state) => {
      const cell = state.cells[id] || {
        id,
        value: '',
        formula: '',
        format: { bold: false, italic: false, fontSize: 12, color: '#000000' }
      };
      
      const updatedCell = { ...cell, ...updates };
      
      if (updatedCell.formula) {
        updatedCell.computed = evaluateFormula(updatedCell.formula, state.cells);
      }

      return {
        cells: {
          ...state.cells,
          [id]: updatedCell
        }
      };
    });
  },

  setSelectedCell: (id) => set({ selectedCell: id }),
  setSelectedRange: (range) => set({ selectedRange: range }),
  
  updateColumnWidth: (col, width) => 
    set((state) => ({ columnWidths: { ...state.columnWidths, [col]: width } })),
  
  updateRowHeight: (row, height) =>
    set((state) => ({ rowHeights: { ...state.rowHeights, [row]: height } })),

  addRow: (afterRow) => {
    set((state) => {
      const newCells = { ...state.cells };
      const rowsToMove = Object.keys(newCells)
        .filter(id => {
          const row = parseInt(id.match(/\d+/)?.[0] || '0');
          return row > afterRow;
        })
        .sort((a, b) => parseInt(b.match(/\d+/)?.[0] || '0') - parseInt(a.match(/\d+/)?.[0] || '0'));

      rowsToMove.forEach(id => {
        const col = id.match(/[A-Z]+/)?.[0] || '';
        const row = parseInt(id.match(/\d+/)?.[0] || '0');
        const newId = `${col}${row + 1}`;
        newCells[newId] = { ...newCells[id], id: newId };
        delete newCells[id];
      });

      return { cells: newCells };
    });
  },

  deleteRow: (row) => {
    set((state) => {
      const newCells = { ...state.cells };
      const rowsToMove = Object.keys(newCells)
        .filter(id => parseInt(id.match(/\d+/)?.[0] || '0') >= row)
        .sort((a, b) => parseInt(a.match(/\d+/)?.[0] || '0') - parseInt(b.match(/\d+/)?.[0] || '0'));

      rowsToMove.forEach(id => {
        const col = id.match(/[A-Z]+/)?.[0] || '';
        const currentRow = parseInt(id.match(/\d+/)?.[0] || '0');
        if (currentRow === row) {
          delete newCells[id];
        } else {
          const newId = `${col}${currentRow - 1}`;
          newCells[newId] = { ...newCells[id], id: newId };
          delete newCells[id];
        }
      });

      return { cells: newCells };
    });
  },

  addColumn: (afterCol) => {
    set((state) => {
      const newCells = { ...state.cells };
      const colNum = colToNum(afterCol);
      const colsToMove = Object.keys(newCells)
        .filter(id => {
          const col = id.match(/[A-Z]+/)?.[0] || '';
          return colToNum(col) > colNum;
        })
        .sort((a, b) => {
          const colA = colToNum(a.match(/[A-Z]+/)?.[0] || '');
          const colB = colToNum(b.match(/[A-Z]+/)?.[0] || '');
          return colB - colA;
        });

      colsToMove.forEach(id => {
        const col = id.match(/[A-Z]+/)?.[0] || '';
        const row = id.match(/\d+/)?.[0] || '';
        const newCol = numToCol(colToNum(col) + 1);
        const newId = `${newCol}${row}`;
        newCells[newId] = { ...newCells[id], id: newId };
        delete newCells[id];
      });

      return { cells: newCells };
    });
  },

  deleteColumn: (col) => {
    set((state) => {
      const newCells = { ...state.cells };
      const colNum = colToNum(col);
      const colsToMove = Object.keys(newCells)
        .filter(id => {
          const currentCol = id.match(/[A-Z]+/)?.[0] || '';
          return colToNum(currentCol) >= colNum;
        })
        .sort((a, b) => {
          const colA = colToNum(a.match(/[A-Z]+/)?.[0] || '');
          const colB = colToNum(b.match(/[A-Z]+/)?.[0] || '');
          return colA - colB;
        });

      colsToMove.forEach(id => {
        const currentCol = id.match(/[A-Z]+/)?.[0] || '';
        const row = id.match(/\d+/)?.[0] || '';
        if (currentCol === col) {
          delete newCells[id];
        } else {
          const newCol = numToCol(colToNum(currentCol) - 1);
          const newId = `${newCol}${row}`;
          newCells[newId] = { ...newCells[id], id: newId };
          delete newCells[id];
        }
      });

      return { cells: newCells };
    });
  },

  validateCell: (value: string) => {
    if (value.startsWith('=')) return true; // Formula
    if (value === '') return true; // Empty cell
    if (!isNaN(Number(value))) return true; // Number
    if (!isNaN(Date.parse(value))) return true; // Date
    return true; // Text is always valid
  }
}));

const colToNum = (col: string): number => {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + col.charCodeAt(i) - 64;
  }
  return num;
};

const numToCol = (num: number): string => {
  let col = '';
  while (num > 0) {
    const mod = (num - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
};

export default useSheetStore;