import React, { useCallback, useRef, useState } from 'react';
import { useDrag, useDrop } from '@dnd-kit/core';
import useSheetStore from '../store/useSheetStore';
import { Cell } from '../types/sheet';

const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const ROWS = Array.from({ length: 100 }, (_, i) => i + 1);

const getCellRange = (start: string, end: string): string[] => {
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

  const range: string[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      range.push(`${numToCol(col)}${row}`);
    }
  }
  return range;
};

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

export const Grid: React.FC = () => {
  const {
    cells,
    selectedCell,
    selectedRange,
    updateCell,
    setSelectedCell,
    setSelectedRange,
    columnWidths,
    rowHeights,
    updateColumnWidth,
    updateRowHeight
  } = useSheetStore();

  const [dragStart, setDragStart] = useState<string | null>(null);
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const getCellId = useCallback((row: number, col: string) => `${col}${row}`, []);

  const handleMouseDown = (e: React.MouseEvent, cellId: string) => {
    if (e.button === 0) { // Left click
      setDragStart(cellId);
      setSelectedCell(cellId);
      setSelectedRange([cellId]);
    }
  };

  const handleCellMouseMove = (e: React.MouseEvent, cellId: string) => {
    if (dragStart) {
      const range = getCellRange(dragStart, cellId);
      setSelectedRange(range);
    }
  };

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (resizingCol) {
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, (columnWidths[resizingCol] || 100) + diff);
      updateColumnWidth(resizingCol, newWidth);
      setStartX(e.clientX);
    }
    if (resizingRow) {
      const diff = e.clientY - startY;
      const newHeight = Math.max(20, (rowHeights[resizingRow] || 24) + diff);
      updateRowHeight(resizingRow.toString(), newHeight);
      setStartY(e.clientY);
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
    setResizingCol(null);
    setResizingRow(null);
  };

  const handleColumnResize = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    setResizingCol(col);
    setStartX(e.clientX);
  };

  const handleRowResize = (e: React.MouseEvent, row: number) => {
    e.preventDefault();
    setResizingRow(row);
    setStartY(e.clientY);
  };

  const renderCell = (row: number, col: string) => {
    const cellId = getCellId(row, col);
    const cell = cells[cellId] as Cell;
    const isSelected = selectedCell === cellId;
    const isInRange = selectedRange.includes(cellId);

    const width = columnWidths[col] || 100;
    const height = rowHeights[row] || 24;

    return (
      <td
        key={cellId}
        className={`relative border border-gray-200 p-1 ${
          isSelected ? 'bg-blue-100' : isInRange ? 'bg-blue-50' : 'bg-white'
        }`}
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={(e) => handleMouseDown(e, cellId)}
        onMouseMove={(e) => handleCellMouseMove(e, cellId)}
        onMouseUp={handleMouseUp}
      >
        <div
          contentEditable
          suppressContentEditableWarning
          className={`outline-none ${cell?.format?.bold ? 'font-bold' : ''} ${
            cell?.format?.italic ? 'italic' : ''
          }`}
          style={{
            fontSize: `${cell?.format?.fontSize || 12}px`,
            color: cell?.format?.color || '#000000'
          }}
          onBlur={(e) => {
            updateCell(cellId, {
              value: e.currentTarget.textContent || '',
              formula: e.currentTarget.textContent?.startsWith('=')
                ? e.currentTarget.textContent
                : ''
            });
          }}
        >
          {cell?.computed || cell?.value || ''}
        </div>
        {isSelected && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-nwse-resize" />
        )}
      </td>
    );
  };

  return (
    <div 
      className="overflow-auto flex-1"
      onMouseMove={handleResizeMouseMove}
      onMouseUp={handleMouseUp}
    >
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-20 bg-gray-100 border">&nbsp;</th>
            {COLUMNS.map((col) => (
              <th 
                key={col} 
                className="sticky top-0 z-10 bg-gray-100 border px-2 relative"
                style={{ width: `${columnWidths[col] || 100}px` }}
              >
                {col}
                <div
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize"
                  onMouseDown={(e) => handleColumnResize(e, col)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row}>
              <th 
                className="sticky left-0 z-10 bg-gray-100 border px-2 relative"
                style={{ height: `${rowHeights[row] || 24}px` }}
              >
                {row}
                <div
                  className="absolute bottom-0 right-0 w-full h-1 cursor-row-resize"
                  onMouseDown={(e) => handleRowResize(e, row)}
                />
              </th>
              {COLUMNS.map((col) => renderCell(row, col))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};