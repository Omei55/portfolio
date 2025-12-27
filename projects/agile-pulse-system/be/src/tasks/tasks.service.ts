import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './entities/task.entity';
import { SprintEntity } from '../sprints/entities/sprint.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { AssignTaskToSprintDto } from './dto/assign-task-to-sprint.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { PaginatedTasksResponseDto } from './dto/paginated-tasks-response.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasksRepository: Repository<TaskEntity>,
    @InjectRepository(SprintEntity)
    private readonly sprintsRepository: Repository<SprintEntity>,
  ) {}

  private toResponseDto(task: TaskEntity): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee_id,
      storyId: task.story_id,
      projectId: task.project_id,
      sprintId: task.sprint_id,
      dueDate: task.due_date,
      estimatedHours: task.estimated_hours ? Number(task.estimated_hours) : undefined,
      actualHours: task.actual_hours ? Number(task.actual_hours) : undefined,
      tags: task.tags ?? [],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status || 'To Do',
      priority: createTaskDto.priority || 'Medium',
      assignee_id: createTaskDto.assigneeId ?? null,
      story_id: createTaskDto.storyId ?? null,
      project_id: createTaskDto.projectId ?? null,
      sprint_id: createTaskDto.sprintId ?? null,
      due_date: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      estimated_hours: createTaskDto.estimatedHours ?? null,
      tags: Array.isArray(createTaskDto.tags) ? createTaskDto.tags : [],
    });

    const savedTask = await this.tasksRepository.save(task);
    return this.toResponseDto(savedTask);
  }

  async findAll(): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksRepository.find({
      order: {
        updated_at: 'DESC',
        created_at: 'DESC',
      },
    });
    return tasks.map((task) => this.toResponseDto(task));
  }

  async findWithFilters(
    filters: FilterTasksDto,
  ): Promise<PaginatedTasksResponseDto> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit =
      filters.limit && filters.limit > 0 && filters.limit <= 100
        ? filters.limit
        : 20;

    const qb = this.tasksRepository.createQueryBuilder('task');

    if (filters.assigneeId) {
      qb.andWhere('task.assignee_id = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }

    if (filters.storyId) {
      qb.andWhere('task.story_id = :storyId', { storyId: filters.storyId });
    }

    if (filters.projectId) {
      qb.andWhere('task.project_id = :projectId', {
        projectId: filters.projectId,
      });
    }

    if (filters.sprintId) {
      qb.andWhere('task.sprint_id = :sprintId', { sprintId: filters.sprintId });
    }

    if (filters.status) {
      qb.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere('task.priority = :priority', { priority: filters.priority });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search },
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      // simple-json column; use text search to find any matching tag
      filters.tags.forEach((tag, index) => {
        const param = `tag${index}`;
        qb.andWhere(`task.tags::text ILIKE :${param}`, {
          [param]: `%${tag}%`,
        });
      });
    }

    if (filters.dueDateFrom) {
      qb.andWhere('task.due_date >= :dueDateFrom', {
        dueDateFrom: filters.dueDateFrom,
      });
    }

    if (filters.dueDateTo) {
      qb.andWhere('task.due_date <= :dueDateTo', {
        dueDateTo: filters.dueDateTo,
      });
    }

    const sortOrder = filters.sortOrder ?? 'DESC';
    switch (filters.sortBy) {
      case 'createdAt':
        qb.orderBy('task.created_at', sortOrder);
        break;
      case 'dueDate':
        qb.orderBy('task.due_date', sortOrder);
        break;
      case 'priority':
        qb.orderBy('task.priority', sortOrder);
        break;
      case 'status':
        qb.orderBy('task.status', sortOrder);
        break;
      case 'updatedAt':
      default:
        qb.orderBy('task.updated_at', sortOrder).addOrderBy(
          'task.created_at',
          'DESC',
        );
        break;
    }

    qb.skip((page - 1) * limit).take(limit);

    const [tasks, total] = await qb.getManyAndCount();

    return {
      items: tasks.map((task) => this.toResponseDto(task)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return this.toResponseDto(task);
  }

  async findByAssignee(assigneeId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksRepository.find({
      where: { assignee_id: assigneeId },
      order: {
        updated_at: 'DESC',
        created_at: 'DESC',
      },
    });
    return tasks.map((task) => this.toResponseDto(task));
  }

  async findByStory(storyId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksRepository.find({
      where: { story_id: storyId },
      order: {
        updated_at: 'DESC',
        created_at: 'DESC',
      },
    });
    return tasks.map((task) => this.toResponseDto(task));
  }

  async findByProject(projectId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksRepository.find({
      where: { project_id: projectId },
      order: {
        updated_at: 'DESC',
        created_at: 'DESC',
      },
    });
    return tasks.map((task) => this.toResponseDto(task));
  }

  async findBySprint(sprintId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksRepository.find({
      where: { sprint_id: sprintId },
      order: {
        updated_at: 'DESC',
        created_at: 'DESC',
      },
    });
    return tasks.map((task) => this.toResponseDto(task));
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateTaskStatusDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    task.status = updateStatusDto.status;
    const savedTask = await this.tasksRepository.save(task);
    return this.toResponseDto(savedTask);
  }

  async assignTask(
    id: string,
    assignTaskDto: AssignTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    task.assignee_id = assignTaskDto.assigneeId;
    const savedTask = await this.tasksRepository.save(task);
    return this.toResponseDto(savedTask);
  }

  async unassignTask(id: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    task.assignee_id = null;
    const savedTask = await this.tasksRepository.save(task);
    return this.toResponseDto(savedTask);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const updatedTask = Object.assign(task, {
      title: updateTaskDto.title ?? task.title,
      description: updateTaskDto.description ?? task.description,
      status: updateTaskDto.status ?? task.status,
      priority: updateTaskDto.priority ?? task.priority,
      assignee_id: updateTaskDto.assigneeId !== undefined
        ? updateTaskDto.assigneeId
        : task.assignee_id,
      story_id: updateTaskDto.storyId !== undefined
        ? updateTaskDto.storyId
        : task.story_id,
      project_id: updateTaskDto.projectId !== undefined
        ? updateTaskDto.projectId
        : task.project_id,
      sprint_id: updateTaskDto.sprintId !== undefined
        ? updateTaskDto.sprintId
        : task.sprint_id,
      due_date: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : task.due_date,
      estimated_hours: updateTaskDto.estimatedHours !== undefined
        ? updateTaskDto.estimatedHours
        : task.estimated_hours,
      tags: Array.isArray(updateTaskDto.tags)
        ? updateTaskDto.tags
        : (task.tags ?? []),
    });

    const savedTask = await this.tasksRepository.save(updatedTask);
    return this.toResponseDto(savedTask);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.tasksRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return { message: 'Task deleted successfully' };
  }

  async updateActualHours(
    id: string,
    actualHours: number,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (actualHours < 0) {
      throw new BadRequestException('Actual hours cannot be negative');
    }

    task.actual_hours = actualHours;
    const savedTask = await this.tasksRepository.save(task);
    return this.toResponseDto(savedTask);
  }

  async assignTaskToSprint(
    id: string,
    assignTaskToSprintDto: AssignTaskToSprintDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const sprint = await this.sprintsRepository.findOne({
      where: { id: assignTaskToSprintDto.sprintId },
    });

    if (!sprint) {
      throw new NotFoundException(
        `Sprint with ID ${assignTaskToSprintDto.sprintId} not found`,
      );
    }

    task.sprint_id = assignTaskToSprintDto.sprintId;
    const savedTask = await this.tasksRepository.save(task);
    return this.toResponseDto(savedTask);
  }

  async unassignTaskFromSprint(id: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    task.sprint_id = null;
    const savedTask = await this.tasksRepository.save(task);
    return this.toResponseDto(savedTask);
  }
}

