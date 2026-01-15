'use client';

import { useState, useEffect } from 'react';
import { Task, Stage, ChecklistItem } from '@/lib/types';
import { X, Trash2 } from 'lucide-react';
import Checklist from './Checklist';

interface TaskModalProps {
  task: Task | null;
  stages: Stage[];
  clients: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

const priorityOptions: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-green-500' },
];

export default function TaskModal({
  task,
  stages,
  clients,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [stageId, setStageId] = useState('todo');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setClient(task.client);
      setPriority(task.priority);
      setDueDate(task.dueDate || '');
      setStageId(task.stageId);
      setChecklist(task.checklist);
    } else {
      // Reset for new task
      setTitle('');
      setClient('');
      setPriority('medium');
      setDueDate('');
      setStageId('todo');
      setChecklist([]);
    }
  }, [task, isOpen]);

  const handleSave = () => {
    const taskData: Partial<Task> & { id?: string } = {
      title: title.trim() || 'Untitled Task',
      client: client.trim(),
      priority,
      dueDate: dueDate || null,
      stageId,
      checklist,
    };

    if (task) {
      taskData.id = task.id;
    }

    onSave(taskData);
    onClose();
  };

  const handleDelete = () => {
    if (task && onDelete && confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const filteredClients = clients.filter(c =>
    c.toLowerCase().includes(client.toLowerCase()) && c !== client
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="text-lg font-semibold flex-1 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Client */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <input
              type="text"
              value={client}
              onChange={(e) => {
                setClient(e.target.value);
                setShowClientDropdown(true);
              }}
              onFocus={() => setShowClientDropdown(true)}
              onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
              placeholder="Enter client name..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            />
            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setClient(c);
                      setShowClientDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    priority === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${option.color}`} />
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
            <Checklist items={checklist} onChange={setChecklist} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          {task && onDelete ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
