import { Cell } from '../types/sheet';

type FormulaFunction = (args: (number | string)[], cells: { [key: string]: Cell }) => number | string;

const formulaFunctions: { [key: string]: FormulaFunction } = {
  SUM: (args) => args.reduce((sum, val) => sum + (Number(val) || 0), 0),
  AVERAGE: (args) => {
    const numbers = args.filter(arg => !isNaN(Number(arg)));
    return numbers.length ? formulaFunctions.SUM(numbers) / numbers.length : 0;
  },
  MAX: (args) => Math.max(...args.map(arg => Number(arg) || -Infinity)),
  MIN: (args) => Math.min(...args.map(arg => Number(arg) || Infinity)),
  COUNT: (args) => args.filter(arg => !isNaN(Number(arg))).length,
  TRIM: (args) => String(args[0]).trim(),
  UPPER: (args) => String(args[0]).toUpperCase(),
  LOWER: (args) => String(args[0]).toLowerCase(),
  REMOVE_DUPLICATES: (args, cells) => {
    const range = expandRange(args[0]);
    const values = range.map(ref => cells[ref]?.value || '');
    const unique = [...new Set(values)];
    return unique.join(',');
  }
};

function expandRange(range: string): string[] {
  const [start, end] = range.split(':');
  if (!end) return [start];

  const startCol = start.match(/[A-Z]+/)?.[0] || '';
  const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
  const endCol = end.match(/[A-Z]+/)?.[0] || '';
  const endRow = parseInt(end.match(/\d+/)?.[0] || '0');

  const startColNum = colToNum(startCol);
  const endColNum = colToNum(endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startColNum, endColNum);
  const maxCol = Math.max(startColNum, endColNum);

  const refs: string[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      refs.push(`${numToCol(col)}${row}`);
    }
  }
  return refs;
}

function colToNum(col: string): number {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + col.charCodeAt(i) - 64;
  }
  return num;
}

function numToCol(num: number): string {
  let col = '';
  while (num > 0) {
    const mod = (num - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

export const evaluateFormula = (formula: string, cells: { [key: string]: Cell }): number | string => {
  if (!formula.startsWith('=')) return formula;

  const functionMatch = formula.match(/^=([A-Z_]+)\((.*)\)$/);
  if (!functionMatch) {
    // Handle cell references without functions
    if (formula.match(/^=[A-Z]+\d+$/)) {
      const ref = formula.substring(1);
      return cells[ref]?.computed || cells[ref]?.value || '';
    }
    return '#ERROR!';
  }

  const [, functionName, argsString] = functionMatch;
  const func = formulaFunctions[functionName];
  if (!func) return '#NAME?';

  let args: string[];
  if (argsString.includes(':')) {
    // Handle range references
    args = [argsString];
  } else {
    args = argsString.split(',').map(arg => arg.trim());
  }

  const resolvedArgs = args.map(arg => {
    if (arg.includes(':')) {
      return expandRange(arg).map(ref => 
        cells[ref]?.computed || cells[ref]?.value || ''
      );
    }
    if (cells[arg]) {
      return cells[arg].computed || cells[arg].value;
    }
    return arg;
  }).flat();

  try {
    return func(resolvedArgs, cells);
  } catch {
    return '#ERROR!';
  }
};