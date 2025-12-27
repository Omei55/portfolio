export class RetroBoardResponseDto {
  id: string;
  title: string;
  description?: string;
  sprintId?: string;
  projectId?: string;
  createdBy?: string;
  retroDate?: Date;
  status: string;
  items?: RetroItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class RetroCategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RetroItemResponseDto {
  id: string;
  boardId: string;
  categoryId: string;
  content: string;
  createdBy?: string;
  votes: number;
  displayOrder: number;
  category?: RetroCategoryResponseDto;
  actionItem?: ActionItemResponseDto;
  createdAt: Date;
  updatedAt: Date;
}

export class ActionItemResponseDto {
  id: string;
  retroItemId: string;
  description: string;
  storyId?: string;
  assignedTo?: string;
  status: string;
  dueDate?: Date;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

