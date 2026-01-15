export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  taskId?: string;
}

export interface Task {
  id: string;
  title: string;
  client: string;
  checklist: ChecklistItem[];
  stageId: string;
  priority: string;
  dueDate: string | Date | null;
  createdAt: string | Date;
  order: number;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
}
