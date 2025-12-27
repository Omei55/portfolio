import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { AssignTaskToSprintDto } from './dto/assign-task-to-sprint.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaskDto: CreateTaskDto): Promise<ApiResponseDto> {
    const task = await this.tasksService.create(createTaskDto);
    return ApiResponseDto.created(task, 'Task created successfully');
  }

  @Get()
  findAll(@Query() filters: FilterTasksDto) {
    // Extended filter logic with combined criteria and pagination
    if (
      filters.assigneeId ||
      filters.storyId ||
      filters.projectId ||
      filters.sprintId ||
      filters.status ||
      filters.priority ||
      filters.search ||
      (filters.tags && filters.tags.length > 0) ||
      filters.dueDateFrom ||
      filters.dueDateTo ||
      filters.page ||
      filters.limit ||
      filters.sortBy ||
      filters.sortOrder
    ) {
      return this.tasksService.findWithFilters(filters);
    }

    // Fallback to existing simple listing when no filters are provided
    return this.tasksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const task = await this.tasksService.findOne(id);
    return ApiResponseDto.success(task, 'Task retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<ApiResponseDto> {
    const task = await this.tasksService.update(id, updateTaskDto);
    return ApiResponseDto.success(task, 'Task updated successfully');
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
  ): Promise<ApiResponseDto> {
    const task = await this.tasksService.updateStatus(id, updateStatusDto);
    return ApiResponseDto.success(task, 'Task status updated successfully');
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  async assignTask(
    @Param('id') id: string,
    @Body() assignTaskDto: AssignTaskDto,
  ): Promise<ApiResponseDto> {
    const task = await this.tasksService.assignTask(id, assignTaskDto);
    return ApiResponseDto.success(task, 'Task assigned successfully');
  }

  @Post(':id/unassign')
  @HttpCode(HttpStatus.OK)
  async unassignTask(@Param('id') id: string): Promise<ApiResponseDto> {
    const task = await this.tasksService.unassignTask(id);
    return ApiResponseDto.success(task, 'Task unassigned successfully');
  }

  @Patch(':id/actual-hours')
  async updateActualHours(
    @Param('id') id: string,
    @Body('actualHours') actualHours: number,
  ): Promise<ApiResponseDto> {
    const task = await this.tasksService.updateActualHours(id, actualHours);
    return ApiResponseDto.success(task, 'Task actual hours updated successfully');
  }

  @Post(':id/assign-sprint')
  @HttpCode(HttpStatus.OK)
  async assignTaskToSprint(
    @Param('id') id: string,
    @Body() assignTaskToSprintDto: AssignTaskToSprintDto,
  ): Promise<ApiResponseDto> {
    const task = await this.tasksService.assignTaskToSprint(id, assignTaskToSprintDto);
    return ApiResponseDto.success(task, 'Task assigned to sprint successfully');
  }

  @Post(':id/unassign-sprint')
  @HttpCode(HttpStatus.OK)
  async unassignTaskFromSprint(@Param('id') id: string): Promise<ApiResponseDto> {
    const task = await this.tasksService.unassignTaskFromSprint(id);
    return ApiResponseDto.success(task, 'Task unassigned from sprint successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}

