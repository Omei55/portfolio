export class TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  storyId?: string;
  projectId?: string;
  sprintId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

