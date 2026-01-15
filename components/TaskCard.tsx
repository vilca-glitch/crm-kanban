'use client';

import { Task } from '@/lib/types';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, User } from 'lucide-react';
import Checklist from './Checklist';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
          }`}
        >
          {/* Title with priority indicator */}
          <div className="flex items-start gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityColors[task.priority]}`} />
            <h3 className="font-medium text-gray-900 text-sm leading-tight">{task.title}</h3>
          </div>

          {/* Client */}
          {task.client && (
            <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
              <User className="w-3 h-3" />
              <span>{task.client}</span>
            </div>
          )}

          {/* Checklist progress */}
          {task.checklist.length > 0 && (
            <div className="mb-2">
              <Checklist items={task.checklist} onChange={() => {}} compact />
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
