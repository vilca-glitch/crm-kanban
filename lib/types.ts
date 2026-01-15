export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  client: string;
  checklist: ChecklistItem[];
  stageId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  order: number;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface Database {
  stages: Stage[];
  tasks: Task[];
}
