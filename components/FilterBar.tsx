'use client';

import { Search, X } from 'lucide-react';

interface FilterBarProps {
  clients: string[];
  selectedClient: string;
  onClientChange: (client: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export default function FilterBar({
  clients,
  selectedClient,
  onClientChange,
  selectedPriority,
  onPriorityChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: FilterBarProps) {
  const hasFilters = selectedClient || selectedPriority || searchQuery;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-b">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
        />
      </div>

      {/* Client filter */}
      <select
        value={selectedClient}
        onChange={(e) => onClientChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm bg-white"
      >
        <option value="">All Clients</option>
        {clients.map((client) => (
          <option key={client} value={client}>
            {client}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={selectedPriority}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm bg-white"
      >
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  );
}
