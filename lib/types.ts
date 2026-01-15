export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  taskId?: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  client: string;
  checklist: ChecklistItem[];
  stageId: string;
  priority: Priority;
  dueDate: string | Date | null;
  remindMeInHours?: number | null;
  reminderSent?: boolean;
  createdAt: string | Date;
  order: number;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
}
