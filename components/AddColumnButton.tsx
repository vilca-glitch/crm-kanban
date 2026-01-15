'use client';

import { Plus } from 'lucide-react';

interface AddColumnButtonProps {
  onClick: () => void;
}

export default function AddColumnButton({ onClick }: AddColumnButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-72 h-fit min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
    >
      <Plus className="w-6 h-6" />
      <span className="text-sm font-medium">Add Column</span>
    </button>
  );
}
