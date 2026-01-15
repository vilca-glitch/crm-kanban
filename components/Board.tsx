'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Stage, Task } from '@/lib/types';
import Column from './Column';
import TaskModal from './TaskModal';
import FilterBar from './FilterBar';
import AddColumnButton from './AddColumnButton';
import { Plus } from 'lucide-react';

export default function Board() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string>('todo');

  const fetchData = useCallback(async () => {
    try {
      const [stagesRes, tasksRes, clientsRes] = await Promise.all([
        fetch('/api/stages'),
        fetch('/api/tasks'),
        fetch('/api/clients'),
      ]);

      const [stagesData, tasksData, clientsData] = await Promise.all([
        stagesRes.json(),
        tasksRes.json(),
        clientsRes.json(),
      ]);

      setStages(stagesData);
      setTasks(tasksData);
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (selectedClient && task.client !== selectedClient) return false;
    if (selectedPriority && task.priority !== selectedPriority) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesChecklist = task.checklist.some((item) =>
        item.text.toLowerCase().includes(query)
      );
      if (!matchesTitle && !matchesChecklist) return false;
    }
    return true;
  });

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle column reordering
    if (type === 'column') {
      const newStages = Array.from(stages);
      const [removed] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, removed);

      // Update order values
      const reorderedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index,
      }));

      setStages(reorderedStages);

      // Persist to server
      try {
        await fetch('/api/stages/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageIds: reorderedStages.map((s) => s.id) }),
        });
      } catch (error) {
        console.error('Failed to reorder stages:', error);
        fetchData(); // Revert on error
      }
      return;
    }

    // Handle task moving
    const taskId = draggableId;
    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;

    // Get tasks for source and destination stages
    const sourceTasks = tasks
      .filter((t) => t.stageId === sourceStageId)
      .sort((a, b) => a.order - b.order);
    const destTasks =
      sourceStageId === destStageId
        ? sourceTasks
        : tasks.filter((t) => t.stageId === destStageId).sort((a, b) => a.order - b.order);

    // Find the task being moved
    const [movedTask] = sourceTasks.splice(source.index, 1);
    if (!movedTask) return;

    // Insert at new position
    if (sourceStageId === destStageId) {
      sourceTasks.splice(destination.index, 0, movedTask);
    } else {
      destTasks.splice(destination.index, 0, { ...movedTask, stageId: destStageId });
    }

    // Update orders
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          stageId: destStageId,
          order: destination.index,
        };
      }

      // Update orders for tasks in source stage
      if (task.stageId === sourceStageId && sourceStageId === destStageId) {
        const idx = sourceTasks.findIndex((t) => t.id === task.id);
        if (idx !== -1) {
          return { ...task, order: idx };
        }
      } else if (task.stageId === sourceStageId) {
        const idx = sourceTasks.findIndex((t) => t.id === task.id);
        if (idx !== -1) {
          return { ...task, order: idx };
        }
      } else if (task.stageId === destStageId) {
        const idx = destTasks.findIndex((t) => t.id === task.id);
        if (idx !== -1) {
          return { ...task, order: idx };
        }
      }

      return task;
    });

    setTasks(updatedTasks);

    // Persist to server
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: destStageId,
          order: destination.index,
        }),
      });
    } catch (error) {
      console.error('Failed to move task:', error);
      fetchData(); // Revert on error
    }
  };

  const handleTaskSave = async (taskData: Partial<Task> & { id?: string }) => {
    try {
      if (taskData.id) {
        // Update existing task
        const response = await fetch(`/api/tasks/${taskData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        const result = await response.json();
        if (result.success) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskData.id ? result.task : t))
          );
        }
      } else {
        // Create new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        const result = await response.json();
        if (result.success) {
          setTasks((prev) => [...prev, result.task]);
          // Update clients list if new client
          if (taskData.client && !clients.includes(taskData.client)) {
            setClients((prev) => [...prev, taskData.client!].sort());
          }
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleStageRename = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/stages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (result.success) {
        setStages((prev) =>
          prev.map((s) => (s.id === id ? result.stage : s))
        );
      }
    } catch (error) {
      console.error('Failed to rename stage:', error);
    }
  };

  const handleStageDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/stages/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setStages((prev) => prev.filter((s) => s.id !== id));
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Failed to delete stage:', error);
    }
  };

  const handleAddColumn = async () => {
    const name = prompt('Enter column name:');
    if (!name?.trim()) return;

    try {
      const response = await fetch('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const result = await response.json();
      if (result.success) {
        setStages((prev) => [...prev, result.stage]);
      }
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  };

  const handleAddTask = (stageId: string) => {
    setEditingTask(null);
    setDefaultStageId(stageId);
    setModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setDefaultStageId(task.stageId);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedClient('');
    setSelectedPriority('');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900">CRM Kanban</h1>
        <button
          onClick={() => handleAddTask(sortedStages[0]?.id || 'todo')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
      />

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6 bg-gray-50">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 h-full items-start"
              >
                {sortedStages.map((stage, index) => (
                  <Column
                    key={stage.id}
                    stage={stage}
                    tasks={filteredTasks.filter((t) => t.stageId === stage.id)}
                    index={index}
                    onTaskClick={handleTaskClick}
                    onRename={handleStageRename}
                    onDelete={handleStageDelete}
                    onAddTask={handleAddTask}
                  />
                ))}
                {provided.placeholder}
                <AddColumnButton onClick={handleAddColumn} />
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Task Modal */}
      <TaskModal
        key={editingTask?.id || 'new'}
        task={editingTask}
        stages={sortedStages}
        clients={clients}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={(taskData) => {
          // If creating a new task, set the default stage
          if (!taskData.id && !taskData.stageId) {
            taskData.stageId = defaultStageId;
          }
          handleTaskSave(taskData);
        }}
        onDelete={handleTaskDelete}
      />
    </div>
  );
}
