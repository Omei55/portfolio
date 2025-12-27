import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { AssignTaskToSprintDto } from './dto/assign-task-to-sprint.dto';
import { randomUUID } from 'crypto';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByAssignee: jest.fn(),
    findByStory: jest.fn(),
    findByProject: jest.fn(),
    findBySprint: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    assignTask: jest.fn(),
    unassignTask: jest.fn(),
    updateActualHours: jest.fn(),
    assignTaskToSprint: jest.fn(),
    unassignTaskFromSprint: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test Description',
      status: 'To Do',
      priority: 'Medium',
    };

    const mockResponse = {
      id: randomUUID(),
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status,
      priority: createTaskDto.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a task', async () => {
      mockTasksService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createTaskDto);

      expect(service.create).toHaveBeenCalledWith(createTaskDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    const mockTasks = [
      {
        id: randomUUID(),
        title: 'Task 1',
        status: 'To Do',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: 'Task 2',
        status: 'In Progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all tasks when no query params provided', async () => {
      mockTasksService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });

    it('should filter by assigneeId when provided', async () => {
      const assigneeId = randomUUID();
      mockTasksService.findByAssignee.mockResolvedValue(mockTasks);

      const result = await controller.findAll(assigneeId);

      expect(service.findByAssignee).toHaveBeenCalledWith(assigneeId);
      expect(result).toEqual(mockTasks);
    });

    it('should filter by storyId when provided', async () => {
      const storyId = randomUUID();
      mockTasksService.findByStory.mockResolvedValue(mockTasks);

      const result = await controller.findAll(undefined, storyId);

      expect(service.findByStory).toHaveBeenCalledWith(storyId);
      expect(result).toEqual(mockTasks);
    });

    it('should filter by projectId when provided', async () => {
      const projectId = randomUUID();
      mockTasksService.findByProject.mockResolvedValue(mockTasks);

      const result = await controller.findAll(undefined, undefined, projectId);

      expect(service.findByProject).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(mockTasks);
    });

    it('should filter by sprintId when provided', async () => {
      const sprintId = randomUUID();
      mockTasksService.findBySprint.mockResolvedValue(mockTasks);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        sprintId,
      );

      expect(service.findBySprint).toHaveBeenCalledWith(sprintId);
      expect(result).toEqual(mockTasks);
    });

    it('should prioritize assigneeId over other filters', async () => {
      const assigneeId = randomUUID();
      const storyId = randomUUID();
      mockTasksService.findByAssignee.mockResolvedValue(mockTasks);

      const result = await controller.findAll(assigneeId, storyId);

      expect(service.findByAssignee).toHaveBeenCalledWith(assigneeId);
      expect(service.findByStory).not.toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findOne', () => {
    const taskId = randomUUID();
    const mockTask = {
      id: taskId,
      title: 'Test Task',
      status: 'To Do',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return a task by id', async () => {
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(taskId);

      expect(service.findOne).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    const taskId = randomUUID();
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: 'Done',
    };

    const mockResponse = {
      id: taskId,
      ...updateTaskDto,
      updatedAt: new Date(),
    };

    it('should update a task', async () => {
      mockTasksService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(taskId, updateTaskDto);

      expect(service.update).toHaveBeenCalledWith(taskId, updateTaskDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateStatus', () => {
    const taskId = randomUUID();
    const updateStatusDto: UpdateTaskStatusDto = {
      status: 'In Progress',
    };

    const mockResponse = {
      id: taskId,
      status: updateStatusDto.status,
      updatedAt: new Date(),
    };

    it('should update task status', async () => {
      mockTasksService.updateStatus.mockResolvedValue(mockResponse);

      const result = await controller.updateStatus(taskId, updateStatusDto);

      expect(service.updateStatus).toHaveBeenCalledWith(taskId, updateStatusDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('assignTask', () => {
    const taskId = randomUUID();
    const assignTaskDto: AssignTaskDto = {
      assigneeId: randomUUID(),
    };

    const mockResponse = {
      id: taskId,
      assigneeId: assignTaskDto.assigneeId,
      updatedAt: new Date(),
    };

    it('should assign task to user', async () => {
      mockTasksService.assignTask.mockResolvedValue(mockResponse);

      const result = await controller.assignTask(taskId, assignTaskDto);

      expect(service.assignTask).toHaveBeenCalledWith(taskId, assignTaskDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('unassignTask', () => {
    const taskId = randomUUID();

    const mockResponse = {
      id: taskId,
      assigneeId: null,
      updatedAt: new Date(),
    };

    it('should unassign task from user', async () => {
      mockTasksService.unassignTask.mockResolvedValue(mockResponse);

      const result = await controller.unassignTask(taskId);

      expect(service.unassignTask).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateActualHours', () => {
    const taskId = randomUUID();
    const actualHours = 8.5;

    const mockResponse = {
      id: taskId,
      actualHours,
      updatedAt: new Date(),
    };

    it('should update actual hours', async () => {
      mockTasksService.updateActualHours.mockResolvedValue(mockResponse);

      const result = await controller.updateActualHours(taskId, actualHours);

      expect(service.updateActualHours).toHaveBeenCalledWith(taskId, actualHours);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('assignTaskToSprint', () => {
    const taskId = randomUUID();
    const assignTaskToSprintDto: AssignTaskToSprintDto = {
      sprintId: randomUUID(),
    };

    const mockResponse = {
      id: taskId,
      sprintId: assignTaskToSprintDto.sprintId,
      updatedAt: new Date(),
    };

    it('should assign task to sprint', async () => {
      mockTasksService.assignTaskToSprint.mockResolvedValue(mockResponse);

      const result = await controller.assignTaskToSprint(
        taskId,
        assignTaskToSprintDto,
      );

      expect(service.assignTaskToSprint).toHaveBeenCalledWith(
        taskId,
        assignTaskToSprintDto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('unassignTaskFromSprint', () => {
    const taskId = randomUUID();

    const mockResponse = {
      id: taskId,
      sprintId: null,
      updatedAt: new Date(),
    };

    it('should unassign task from sprint', async () => {
      mockTasksService.unassignTaskFromSprint.mockResolvedValue(mockResponse);

      const result = await controller.unassignTaskFromSprint(taskId);

      expect(service.unassignTaskFromSprint).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    const taskId = randomUUID();

    it('should delete a task', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);

      await controller.remove(taskId);

      expect(service.remove).toHaveBeenCalledWith(taskId);
    });
  });
});
