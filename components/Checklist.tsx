'use client';

import { useState } from 'react';
import { ChecklistItem } from '@/lib/types';
import { Check, Plus, Trash2, Square } from 'lucide-react';

interface ChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  compact?: boolean;
}

export default function Checklist({ items, onChange, compact = false }: ChecklistProps) {
  const [newItemText, setNewItemText] = useState('');

  const toggleItem = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onChange(updated);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
    };
    onChange([...items, newItem]);
    setNewItemText('');
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs whitespace-nowrap">
          {completedCount}/{items.length}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center gap-2 group"
        >
          <button
            onClick={() => toggleItem(item.id)}
            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              item.completed
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {item.completed ? <Check className="w-3 h-3" /> : <Square className="w-3 h-3 text-transparent" />}
          </button>
          <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
            {item.text}
          </span>
          <button
            onClick={() => deleteItem(item.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item..."
          className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={addItem}
          disabled={!newItemText.trim()}
          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
