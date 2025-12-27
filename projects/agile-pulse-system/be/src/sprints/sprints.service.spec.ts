import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SprintsService } from './sprints.service';
import { SprintEntity } from './entities/sprint.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('SprintsService', () => {
  let service: SprintsService;
  let sprintsRepository: Repository<SprintEntity>;
  let storiesRepository: Repository<StoryEntity>;

  const mockSprintsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
  };

  const mockStoriesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintsService,
        {
          provide: getRepositoryToken(SprintEntity),
          useValue: mockSprintsRepository,
        },
        {
          provide: getRepositoryToken(StoryEntity),
          useValue: mockStoriesRepository,
        },
      ],
    }).compile();

    service = module.get<SprintsService>(SprintsService);
    sprintsRepository = module.get<Repository<SprintEntity>>(
      getRepositoryToken(SprintEntity),
    );
    storiesRepository = module.get<Repository<StoryEntity>>(
      getRepositoryToken(StoryEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createSprintDto: CreateSprintDto = {
      name: 'Sprint 1',
      description: 'Test Sprint',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
    };

    const mockSprint: SprintEntity = {
      id: randomUUID(),
      name: 'Sprint 1',
      description: 'Test Sprint',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-14'),
      created_at: new Date(),
      updated_at: new Date(),
    } as SprintEntity;

    it('should create a sprint successfully', async () => {
      mockSprintsRepository.findOne.mockResolvedValue(null);
      mockSprintsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockSprintsRepository.create.mockReturnValue(mockSprint);
      mockSprintsRepository.save.mockResolvedValue(mockSprint);

      const result = await service.create(createSprintDto);

      expect(result).toEqual(mockSprint);
      expect(mockSprintsRepository.create).toHaveBeenCalled();
      expect(mockSprintsRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if sprint with same name exists', async () => {
      mockSprintsRepository.findOne.mockResolvedValue(mockSprint);

      await expect(service.create(createSprintDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const invalidDto: CreateSprintDto = {
        name: 'Sprint 1',
        startDate: '2024-01-14',
        endDate: '2024-01-01',
      };

      mockSprintsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if sprint dates overlap', async () => {
      const existingSprint: SprintEntity = {
        id: randomUUID(),
        name: 'Existing Sprint',
        start_date: new Date('2024-01-05'),
        end_date: new Date('2024-01-20'),
      } as SprintEntity;

      mockSprintsRepository.findOne.mockResolvedValue(null);
      mockSprintsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingSprint),
      });

      await expect(service.create(createSprintDto)).rejects.toThrow(
        ConflictException,
      );
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
        {
          id: randomUUID(),
          name: 'Sprint 2',
          created_at: new Date(),
          updated_at: new Date(),
        } as SprintEntity,
      ];

      mockSprintsRepository.find.mockResolvedValue(mockSprints);

      const result = await service.findAll();

      expect(result).toEqual(mockSprints);
      expect(mockSprintsRepository.find).toHaveBeenCalledWith({
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array if no sprints exist', async () => {
      mockSprintsRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
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
      mockSprintsRepository.findOne.mockResolvedValue(mockSprint);

      const result = await service.findOne(sprintId);

      expect(result).toEqual(mockSprint);
      expect(mockSprintsRepository.findOne).toHaveBeenCalledWith({
        where: { id: sprintId },
      });
    });

    it('should throw NotFoundException if sprint does not exist', async () => {
      mockSprintsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(sprintId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const sprintId = randomUUID();
    const existingSprint: SprintEntity = {
      id: sprintId,
      name: 'Sprint 1',
      description: 'Original Description',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-14'),
      created_at: new Date(),
      updated_at: new Date(),
    } as SprintEntity;

    it('should update a sprint successfully', async () => {
      const updateDto: UpdateSprintDto = {
        name: 'Updated Sprint',
        description: 'Updated Description',
      };

      mockSprintsRepository.findOne
        .mockResolvedValueOnce(existingSprint)
        .mockResolvedValueOnce(null);
      mockSprintsRepository.save.mockResolvedValue({
        ...existingSprint,
        ...updateDto,
      });

      const result = await service.update(sprintId, updateDto);

      expect(result.name).toBe('Updated Sprint');
      expect(mockSprintsRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if sprint does not exist', async () => {
      const updateDto: UpdateSprintDto = { name: 'Updated Sprint' };

      mockSprintsRepository.findOne.mockResolvedValue(null);

      await expect(service.update(sprintId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateDto: UpdateSprintDto = { name: 'Existing Sprint' };
      const existingSprintWithName: SprintEntity = {
        id: randomUUID(),
        name: 'Existing Sprint',
      } as SprintEntity;

      mockSprintsRepository.findOne
        .mockResolvedValueOnce(existingSprint)
        .mockResolvedValueOnce(existingSprintWithName);

      await expect(service.update(sprintId, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const updateDto: UpdateSprintDto = {
        startDate: '2024-01-14',
        endDate: '2024-01-01',
      };

      mockSprintsRepository.findOne.mockResolvedValue(existingSprint);

      await expect(service.update(sprintId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    const sprintId = randomUUID();
    const mockSprint: SprintEntity = {
      id: sprintId,
      name: 'Sprint 1',
    } as SprintEntity;

    it('should remove a sprint successfully', async () => {
      mockSprintsRepository.findOne.mockResolvedValue(mockSprint);
      mockSprintsRepository.remove.mockResolvedValue(mockSprint);

      await service.remove(sprintId);

      expect(mockSprintsRepository.remove).toHaveBeenCalledWith(mockSprint);
    });

    it('should throw NotFoundException if sprint does not exist', async () => {
      mockSprintsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(sprintId)).rejects.toThrow(
        NotFoundException,
      );
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
        {
          id: randomUUID(),
          title: 'Story 2',
          sprint: '',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockStoriesRepository.find.mockResolvedValue(mockStories);

      const result = await service.getUnassignedStories();

      expect(result).toEqual(mockStories);
      expect(mockStoriesRepository.find).toHaveBeenCalledWith({
        where: [{ sprint: null }, { sprint: '' }],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('getSprintStories', () => {
    const sprintName = 'Sprint 1';
    const mockSprint: SprintEntity = {
      id: randomUUID(),
      name: sprintName,
    } as SprintEntity;

    it('should return stories for a sprint', async () => {
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          sprint: sprintName,
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockSprintsRepository.findOne.mockResolvedValue(mockSprint);
      mockStoriesRepository.find.mockResolvedValue(mockStories);

      const result = await service.getSprintStories(sprintName);

      expect(result).toEqual(mockStories);
    });

    it('should throw NotFoundException if sprint does not exist', async () => {
      mockSprintsRepository.findOne.mockResolvedValue(null);

      await expect(service.getSprintStories(sprintName)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSprintStats', () => {
    const sprintName = 'Sprint 1';
    const mockSprint: SprintEntity = {
      id: randomUUID(),
      name: sprintName,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-14'),
      description: 'Test Sprint',
      goal: 'Test Goal',
    } as SprintEntity;

    it('should return sprint statistics', async () => {
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          sprint: sprintName,
          story_points: 5,
          status: 'To Do',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
        {
          id: randomUUID(),
          title: 'Story 2',
          sprint: sprintName,
          story_points: 8,
          status: 'In Progress',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockSprintsRepository.findOne.mockResolvedValue(mockSprint);
      mockStoriesRepository.find.mockResolvedValue(mockStories);

      const result = await service.getSprintStats(sprintName);

      expect(result.sprint.name).toBe(sprintName);
      expect(result.story_count).toBe(2);
      expect(result.total_points).toBe(13);
      expect(result.status_counts['To Do']).toBe(1);
      expect(result.status_counts['In Progress']).toBe(1);
    });

    it('should throw NotFoundException if sprint does not exist', async () => {
      mockSprintsRepository.findOne.mockResolvedValue(null);

      await expect(service.getSprintStats(sprintName)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignStoryToSprint', () => {
    const storyId = randomUUID();
    const sprintName = 'Sprint 1';
    const mockStory: StoryEntity = {
      id: storyId,
      title: 'Story 1',
      sprint: null,
    } as StoryEntity;
    const mockSprint: SprintEntity = {
      id: randomUUID(),
      name: sprintName,
    } as SprintEntity;

    it('should assign story to sprint successfully', async () => {
      mockStoriesRepository.findOne.mockResolvedValue(mockStory);
      mockSprintsRepository.findOne.mockResolvedValue(mockSprint);
      mockStoriesRepository.save.mockResolvedValue({
        ...mockStory,
        sprint: sprintName,
      });

      const result = await service.assignStoryToSprint(storyId, sprintName);

      expect(result.sprint).toBe(sprintName);
      expect(mockStoriesRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if story does not exist', async () => {
      mockStoriesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignStoryToSprint(storyId, sprintName),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if sprint does not exist', async () => {
      mockStoriesRepository.findOne.mockResolvedValue(mockStory);
      mockSprintsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignStoryToSprint(storyId, sprintName),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unassignStoryFromSprint', () => {
    const storyId = randomUUID();
    const mockStory: StoryEntity = {
      id: storyId,
      title: 'Story 1',
      sprint: 'Sprint 1',
    } as StoryEntity;

    it('should unassign story from sprint successfully', async () => {
      mockStoriesRepository.findOne.mockResolvedValue(mockStory);
      mockStoriesRepository.save.mockResolvedValue({
        ...mockStory,
        sprint: null,
      });

      const result = await service.unassignStoryFromSprint(storyId);

      expect(result.sprint).toBeNull();
      expect(mockStoriesRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if story does not exist', async () => {
      mockStoriesRepository.findOne.mockResolvedValue(null);

      await expect(service.unassignStoryFromSprint(storyId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});



