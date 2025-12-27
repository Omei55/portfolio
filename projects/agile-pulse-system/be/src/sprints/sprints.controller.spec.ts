import { Test, TestingModule } from '@nestjs/testing';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { SprintEntity } from './entities/sprint.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { randomUUID } from 'crypto';

describe('SprintsController', () => {
  let controller: SprintsController;
  let service: SprintsService;

  const mockSprintsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getUnassignedStories: jest.fn(),
    getSprintStories: jest.fn(),
    getSprintStats: jest.fn(),
    assignStoryToSprint: jest.fn(),
    unassignStoryFromSprint: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SprintsController],
      providers: [
        {
          provide: SprintsService,
          useValue: mockSprintsService,
        },
      ],
    }).compile();

    controller = module.get<SprintsController>(SprintsController);
    service = module.get<SprintsService>(SprintsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createSprintDto: CreateSprintDto = {
      name: 'Sprint 1',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      description: 'Test Sprint',
    };

    const mockSprint: SprintEntity = {
      id: randomUUID(),
      name: 'Sprint 1',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-14'),
      description: 'Test Sprint',
      created_at: new Date(),
      updated_at: new Date(),
    } as SprintEntity;

    it('should create a sprint', async () => {
      mockSprintsService.create.mockResolvedValue(mockSprint);

      const result = await controller.create(createSprintDto);

      expect(result).toEqual(mockSprint);
      expect(service.create).toHaveBeenCalledWith(createSprintDto);
    });
  });

  describe('findAll', () => {
    it('should return all sprints', async () => {
      const mockSprints: SprintEntity[] = [
        {
          id: randomUUID(),
          name: 'Sprint 1',
          created_at: new Date(),
          updated_at: new Date(),
        } as SprintEntity,
      ];

      mockSprintsService.findAll.mockResolvedValue(mockSprints);

      const result = await controller.findAll();

      expect(result).toEqual(mockSprints);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const sprintId = randomUUID();
    const mockSprint: SprintEntity = {
      id: sprintId,
      name: 'Sprint 1',
      created_at: new Date(),
      updated_at: new Date(),
    } as SprintEntity;

    it('should return a sprint by id', async () => {
      mockSprintsService.findOne.mockResolvedValue(mockSprint);

      const result = await controller.findOne(sprintId);

      expect(result).toEqual(mockSprint);
      expect(service.findOne).toHaveBeenCalledWith(sprintId);
    });
  });

  describe('update', () => {
    const sprintId = randomUUID();
    const updateSprintDto: UpdateSprintDto = {
      name: 'Updated Sprint',
    };

    const mockSprint: SprintEntity = {
      id: sprintId,
      name: 'Updated Sprint',
      created_at: new Date(),
      updated_at: new Date(),
    } as SprintEntity;

    it('should update a sprint', async () => {
      mockSprintsService.update.mockResolvedValue(mockSprint);

      const result = await controller.update(sprintId, updateSprintDto);

      expect(result).toEqual(mockSprint);
      expect(service.update).toHaveBeenCalledWith(sprintId, updateSprintDto);
    });
  });

  describe('remove', () => {
    const sprintId = randomUUID();

    it('should remove a sprint', async () => {
      mockSprintsService.remove.mockResolvedValue(undefined);

      await controller.remove(sprintId);

      expect(service.remove).toHaveBeenCalledWith(sprintId);
    });
  });

  describe('getUnassignedStories', () => {
    it('should return unassigned stories', async () => {
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          sprint: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockSprintsService.getUnassignedStories.mockResolvedValue(mockStories);

      const result = await controller.getUnassignedStories();

      expect(result).toEqual(mockStories);
      expect(service.getUnassignedStories).toHaveBeenCalled();
    });
  });

  describe('getSprintStoriesByName', () => {
    const sprintName = 'Sprint 1';
    const mockStories: StoryEntity[] = [
      {
        id: randomUUID(),
        title: 'Story 1',
        sprint: sprintName,
        created_at: new Date(),
        updated_at: new Date(),
      } as StoryEntity,
    ];

    it('should return stories for a sprint by name', async () => {
      mockSprintsService.getSprintStories.mockResolvedValue(mockStories);

      const result = await controller.getSprintStoriesByName(sprintName);

      expect(result).toEqual(mockStories);
      expect(service.getSprintStories).toHaveBeenCalledWith(sprintName);
    });
  });

  describe('getSprintStatsByName', () => {
    const sprintName = 'Sprint 1';
    const mockStats = {
      sprint: {
        id: randomUUID(),
        name: sprintName,
      },
      story_count: 5,
      total_points: 20,
      status_counts: { 'To Do': 2, 'In Progress': 3 },
    };

    it('should return sprint statistics by name', async () => {
      mockSprintsService.getSprintStats.mockResolvedValue(mockStats);

      const result = await controller.getSprintStatsByName(sprintName);

      expect(result).toEqual(mockStats);
      expect(service.getSprintStats).toHaveBeenCalledWith(sprintName);
    });
  });

  describe('assignStoryToSprintByName', () => {
    const sprintName = 'Sprint 1';
    const storyId = randomUUID();
    const mockStory: StoryEntity = {
      id: storyId,
      title: 'Story 1',
      sprint: sprintName,
      created_at: new Date(),
      updated_at: new Date(),
    } as StoryEntity;

    it('should assign story to sprint', async () => {
      mockSprintsService.assignStoryToSprint.mockResolvedValue(mockStory);

      const result = await controller.assignStoryToSprintByName(
        sprintName,
        storyId,
      );

      expect(result).toEqual(mockStory);
      expect(service.assignStoryToSprint).toHaveBeenCalledWith(
        storyId,
        sprintName,
      );
    });
  });

  describe('unassignStoryFromSprint', () => {
    const storyId = randomUUID();
    const mockStory: StoryEntity = {
      id: storyId,
      title: 'Story 1',
      sprint: null,
      created_at: new Date(),
      updated_at: new Date(),
    } as StoryEntity;

    it('should unassign story from sprint', async () => {
      mockSprintsService.unassignStoryFromSprint.mockResolvedValue(mockStory);

      const result = await controller.unassignStoryFromSprint(storyId);

      expect(result).toEqual(mockStory);
      expect(service.unassignStoryFromSprint).toHaveBeenCalledWith(storyId);
    });
  });
});



