import React, { useState } from 'react';
import { 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type,
  Search, Replace, Plus, Trash2
} from 'lucide-react';
import useSheetStore from '../store/useSheetStore';

export const Toolbar: React.FC = () => {
  const { 
    selectedCell, 
    selectedRange, 
    cells, 
    updateCell,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn
  } = useSheetStore();
  
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  
  const handleFormatting = (type: 'bold' | 'italic') => {
    if (!selectedCell) return;
    const cell = cells[selectedCell];
    if (!cell) return;
    
    updateCell(selectedCell, {
      format: {
        ...cell.format,
        [type]: !cell.format[type]
      }
    });
  };

  const handleFontSize = (size: number) => {
    if (!selectedCell) return;
    const cell = cells[selectedCell];
    if (!cell) return;

    updateCell(selectedCell, {
      format: {
        ...cell.format,
        fontSize: size
      }
    });
  };

  const handleColor = (color: string) => {
    if (!selectedCell) return;
    const cell = cells[selectedCell];
    if (!cell) return;

    updateCell(selectedCell, {
      format: {
        ...cell.format,
        color
      }
    });
  };

  const handleFindReplace = () => {
    selectedRange.forEach(cellId => {
      const cell = cells[cellId];
      if (cell?.value.includes(findText)) {
        updateCell(cellId, {
          value: cell.value.replace(new RegExp(findText, 'g'), replaceText),
          formula: cell.formula.replace(new RegExp(findText, 'g'), replaceText)
        });
      }
    });
  };

  const handleAddRow = () => {
    if (selectedCell) {
      const row = parseInt(selectedCell.match(/\d+/)?.[0] || '0');
      addRow(row);
    }
  };

  const handleDeleteRow = () => {
    if (selectedCell) {
      const row = parseInt(selectedCell.match(/\d+/)?.[0] || '0');
      deleteRow(row);
    }
  };

  const handleAddColumn = () => {
    if (selectedCell) {
      const col = selectedCell.match(/[A-Z]+/)?.[0] || '';
      addColumn(col);
    }
  };

  const handleDeleteColumn = () => {
    if (selectedCell) {
      const col = selectedCell.match(/[A-Z]+/)?.[0] || '';
      deleteColumn(col);
    }
  };

  return (
    <div className="flex flex-col bg-white border-b">
      <div className="flex items-center gap-2 p-2">
        <input
          type="text"
          className="px-2 py-1 border rounded flex-1"
          value={selectedCell ? (cells[selectedCell]?.formula || cells[selectedCell]?.value || '') : ''}
          onChange={(e) => {
            if (selectedCell) {
              updateCell(selectedCell, {
                value: e.target.value,
                formula: e.target.value.startsWith('=') ? e.target.value : ''
              });
            }
          }}
        />
        
        <button
          onClick={() => handleFormatting('bold')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Bold size={18} />
        </button>
        
        <button
          onClick={() => handleFormatting('italic')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Italic size={18} />
        </button>

        <div className="flex items-center gap-1">
          <AlignLeft size={18} className="cursor-pointer hover:text-blue-500" />
          <AlignCenter size={18} className="cursor-pointer hover:text-blue-500" />
          <AlignRight size={18} className="cursor-pointer hover:text-blue-500" />
        </div>

        <div className="flex items-center gap-1">
          <Type size={18} />
          <select 
            className="border rounded px-1"
            onChange={(e) => handleFontSize(Number(e.target.value))}
            value={selectedCell ? (cells[selectedCell]?.format?.fontSize || 12) : 12}
          >
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
          </select>
        </div>

        <input
          type="color"
          className="w-6 h-6 cursor-pointer"
          onChange={(e) => handleColor(e.target.value)}
          value={selectedCell ? (cells[selectedCell]?.format?.color || '#000000') : '#000000'}
        />

        <div className="flex items-center gap-1 border-l pl-2">
          <button
            onClick={handleAddRow}
            className="p-1 hover:bg-gray-100 rounded"
            title="Add Row"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={handleDeleteRow}
            className="p-1 hover:bg-gray-100 rounded"
            title="Delete Row"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 border-l pl-2">
          <button
            onClick={handleAddColumn}
            className="p-1 hover:bg-gray-100 rounded rotate-90"
            title="Add Column"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={handleDeleteColumn}
            className="p-1 hover:bg-gray-100 rounded"
            title="Delete Column"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <button
          onClick={() => setShowFindReplace(!showFindReplace)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Search size={18} />
        </button>
      </div>

      {showFindReplace && (
        <div className="flex items-center gap-2 p-2 bg-gray-50">
          <input
            type="text"
            placeholder="Find"
            className="px-2 py-1 border rounded"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
          />
          <input
            type="text"
            placeholder="Replace"
            className="px-2 py-1 border rounded"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
          />
          <button
            onClick={handleFindReplace}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Replace size={18} />
          </button>
        </div>
      )}
    </div>
  );
};