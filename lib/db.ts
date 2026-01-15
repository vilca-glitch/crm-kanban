import fs from 'fs';
import path from 'path';
import { Database } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export function readDB(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Return default data if file doesn't exist
    return {
      stages: [
        { id: 'todo', name: 'To Do', order: 0, color: '#6B7280' },
        { id: 'in-progress', name: 'In Progress', order: 1, color: '#3B82F6' },
        { id: 'complete', name: 'Complete', order: 2, color: '#10B981' },
      ],
      tasks: [],
    };
  }
}

export function writeDB(data: Database): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
