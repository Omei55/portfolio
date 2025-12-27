import { TaskResponseDto } from './task-response.dto';

export class PaginatedTasksResponseDto {
  items: TaskResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


