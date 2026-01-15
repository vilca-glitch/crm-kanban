'use client';

import { useState } from 'react';
import { Stage, Task } from '@/lib/types';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreVertical, Trash2, Pencil, Check, X, Plus } from 'lucide-react';
import TaskCard from './TaskCard';

interface ColumnProps {
  stage: Stage;
  tasks: Task[];
  index: number;
  onTaskClick: (task: Task) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (stageId: string) => void;
}

export default function Column({
  stage,
  tasks,
  index,
  onTaskClick,
  onRename,
  onDelete,
  onAddTask,
}: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stage.name);
  const [showMenu, setShowMenu] = useState(false);

  const handleSaveName = () => {
    if (editName.trim()) {
      onRename(stage.id, editName.trim());
    } else {
      setEditName(stage.name);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (tasks.length > 0) {
      alert('Cannot delete a column with tasks. Move or delete tasks first.');
      return;
    }
    if (confirm(`Delete "${stage.name}" column?`)) {
      onDelete(stage.id);
    }
    setShowMenu(false);
  };

  return (
    <Draggable draggableId={`column-${stage.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-72 bg-gray-100 rounded-lg flex flex-col max-h-full"
        >
          {/* Column Header */}
          <div
            {...provided.dragHandleProps}
            className="p-3 flex items-center justify-between"
            style={{ borderTop: `3px solid ${stage.color}` }}
          >
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setEditName(stage.name);
                      setIsEditing(false);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm font-semibold rounded border border-blue-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditName(stage.name);
                    setIsEditing(false);
                  }}
                  className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-700">{stage.name}</h2>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="w-4 h-4" />
                          Rename
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Tasks */}
          <Droppable droppableId={stage.id} type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px] ${
                  snapshot.isDraggingOver ? 'bg-blue-50' : ''
                }`}
              >
                {tasks
                  .sort((a, b) => a.order - b.order)
                  .map((task, taskIndex) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={taskIndex}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add Task Button */}
          <div className="p-2">
            <button
              onClick={() => onAddTask(stage.id)}
              className="w-full flex items-center justify-center gap-1 py-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
