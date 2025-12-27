import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoriesService } from './stories.service';
import { StoryEntity } from './entities/story.entity';

describe('StoriesService - Export Tests', () => {
  let service: StoriesService;
  let repository: Repository<StoryEntity>;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
import { NotFoundException } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoryEntity } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { randomUUID } from 'crypto';

describe('StoriesService', () => {
  let service: StoriesService;
  let repository: Repository<StoryEntity>;

  const mock_repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
import { SelectQueryBuilder } from 'typeorm';
import { StoriesService } from './stories.service';
import { StoryEntity } from './entities/story.entity';
import { QueryStoriesDto } from './dto/query-stories.dto';
import { randomUUID } from 'crypto';

describe('StoriesService - Filtering', () => {
  let service: StoriesService;
  let queryBuilder: SelectQueryBuilder<StoryEntity>;

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        {
          provide: getRepositoryToken(StoryEntity),
          useValue: mock_repository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    repository = module.get<Repository<StoryEntity>>(
      getRepositoryToken(StoryEntity),
    );
    queryBuilder = mockQueryBuilder as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportStories', () => {
    const mockStories: StoryEntity[] = [
      {
        id: '1',
        title: 'Test Story 1',
        description: 'Description 1',
        acceptance_criteria: 'Criteria 1',
        priority: 'High',
        story_points: 5,
        assignee: 'John Doe',
        status: 'In Progress',
        sprint: 'Sprint 1',
        epic: 'Epic 1',
        tags: ['tag1', 'tag2'],
        value: 8,
        effort: 5,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      },
    ];

    it('should export all stories as JSON in generic format', async () => {
      mockRepository.find.mockResolvedValue(mockStories);

      const result = await service.exportStories(
        undefined,
        'json',
        'generic',
      );

      expect(result.filename).toMatch(/stories_export_.*\.json/);
      expect(result.mimeType).toBe('application/json');
      const parsed = JSON.parse(result.data);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toHaveProperty('id', '1');
      expect(parsed[0]).toHaveProperty('title', 'Test Story 1');
    });

    it('should export selected stories as CSV', async () => {
      mockRepository.find.mockResolvedValue(mockStories);

      const result = await service.exportStories(['1'], 'csv', 'generic');

      expect(result.filename).toMatch(/stories_export_.*\.csv/);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toContain('id');
      expect(result.data).toContain('Test Story 1');
    });

    it('should map stories correctly for Jira format', async () => {
      mockRepository.find.mockResolvedValue(mockStories);

      const result = await service.exportStories(undefined, 'json', 'jira');

      const parsed = JSON.parse(result.data);
      expect(parsed[0]).toHaveProperty('summary', 'Test Story 1');
      expect(parsed[0]).toHaveProperty('description', 'Description 1');
      expect(parsed[0]).toHaveProperty('issuetype');
      expect(parsed[0].issuetype).toHaveProperty('name', 'Story');
      expect(parsed[0]).toHaveProperty('priority');
    });

    it('should map stories correctly for Taiga format', async () => {
      mockRepository.find.mockResolvedValue(mockStories);

      const result = await service.exportStories(undefined, 'json', 'taiga');

      const parsed = JSON.parse(result.data);
      expect(parsed[0]).toHaveProperty('subject', 'Test Story 1');
      expect(parsed[0]).toHaveProperty('priority');
      expect(typeof parsed[0].priority).toBe('number');
      expect(parsed[0]).toHaveProperty('status');
      expect(typeof parsed[0].status).toBe('number');
    });

    it('should handle empty story list', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.exportStories(undefined, 'json', 'generic');

      const parsed = JSON.parse(result.data);
      expect(parsed).toEqual([]);
    });

    it('should handle CSV generation with empty stories', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.exportStories(undefined, 'csv', 'generic');

      expect(result.data).toBe('');
    });
  });

  describe('Field Mapping', () => {
    it('should map priority correctly to Jira', async () => {
      const story: StoryEntity = {
        id: '1',
        title: 'Test',
        description: 'Test',
        acceptance_criteria: 'Test',
        priority: 'Critical',
        status: 'To Do',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockRepository.find.mockResolvedValue([story]);

      const result = await service.exportStories(undefined, 'json', 'jira');
      const parsed = JSON.parse(result.data);

      expect(parsed[0].priority.name).toBe('Highest');
    });

    it('should map status correctly to Taiga', async () => {
      const story: StoryEntity = {
        id: '1',
        title: 'Test',
        description: 'Test',
        acceptance_criteria: 'Test',
        priority: 'Medium',
        status: 'Done',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockRepository.find.mockResolvedValue([story]);

      const result = await service.exportStories(undefined, 'json', 'taiga');
      const parsed = JSON.parse(result.data);

      expect(parsed[0].status).toBe(4);
    });
  });
});

  describe('create', () => {
    it('should create a new story', async () => {
      const create_dto: CreateStoryDto = {
        title: 'Test Story',
        description: 'Test Description',
        acceptanceCriteria: 'Test Criteria',
        priority: 'High',
        storyPoints: 5,
      };

      const saved_story: StoryEntity = {
        id: randomUUID(),
        title: create_dto.title,
        description: create_dto.description,
        acceptance_criteria: create_dto.acceptanceCriteria,
        priority: create_dto.priority || 'Medium',
        story_points: create_dto.storyPoints ?? null,
        assignee: null,
        status: 'To Do',
        sprint: null,
        epic: null,
        tags: [],
        value: null,
        effort: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mock_repository.create.mockReturnValue(saved_story);
      mock_repository.save.mockResolvedValue(saved_story);

      const result = await service.create(create_dto);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: saved_story.id,
        title: saved_story.title,
        description: saved_story.description,
        acceptanceCriteria: saved_story.acceptance_criteria,
        priority: saved_story.priority,
        storyPoints: saved_story.story_points,
      });
    });

    it('should use default values when optional fields are not provided', async () => {
      const create_dto: CreateStoryDto = {
        title: 'Minimal Story',
        description: 'Description',
        acceptanceCriteria: 'Criteria',
      };

      const saved_story: StoryEntity = {
        id: randomUUID(),
        title: create_dto.title,
        description: create_dto.description,
        acceptance_criteria: create_dto.acceptanceCriteria,
        priority: 'Medium',
        story_points: null,
        assignee: null,
        status: 'To Do',
        sprint: null,
        epic: null,
        tags: [],
        value: null,
        effort: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mock_repository.create.mockReturnValue(saved_story);
      mock_repository.save.mockResolvedValue(saved_story);

      const result = await service.create(create_dto);

      expect(result.priority).toBe('Medium');
      expect(result.status).toBe('To Do');
      expect(result.tags).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all stories', async () => {
      const stories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          description: 'Description 1',
          acceptance_criteria: 'Criteria 1',
          priority: 'High',
          story_points: 5,
          assignee: null,
          status: 'To Do',
          sprint: null,
          epic: null,
          tags: [],
          value: null,
          effort: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: randomUUID(),
          title: 'Story 2',
          description: 'Description 2',
          acceptance_criteria: 'Criteria 2',
          priority: 'Medium',
          story_points: 3,
          assignee: null,
          status: 'In Progress',
          sprint: null,
          epic: null,
          tags: [],
          value: null,
          effort: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mock_repository.find.mockResolvedValue(stories);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: {
          updated_at: 'DESC',
          created_at: 'DESC',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
    });
  });

  describe('findOne', () => {
    it('should return a story by id', async () => {
      const story_id = randomUUID();
      const story: StoryEntity = {
        id: story_id,
        title: 'Test Story',
        description: 'Test Description',
        acceptance_criteria: 'Test Criteria',
        priority: 'High',
        story_points: 5,
        assignee: null,
        status: 'To Do',
        sprint: null,
        epic: null,
        tags: [],
        value: null,
        effort: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mock_repository.findOne.mockResolvedValue(story);

      const result = await service.findOne(story_id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: story_id },
      });
      expect(result).toMatchObject({
        id: story.id,
        title: story.title,
      });
    });

    it('should throw NotFoundException when story not found', async () => {
      const story_id = randomUUID();
      mock_repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(story_id)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: story_id },
      });
    });
  });

  describe('update', () => {
    it('should update an existing story', async () => {
      const story_id = randomUUID();
      const existing_story: StoryEntity = {
        id: story_id,
        title: 'Original Title',
        description: 'Original Description',
        acceptance_criteria: 'Original Criteria',
        priority: 'Medium',
        story_points: 3,
        assignee: null,
        status: 'To Do',
        sprint: null,
        epic: null,
        tags: [],
        value: null,
        effort: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const update_dto: UpdateStoryDto = {
        title: 'Updated Title',
        status: 'In Progress',
      };

      const updated_story: StoryEntity = {
        ...existing_story,
        title: update_dto.title,
        status: update_dto.status,
      };

      mock_repository.findOne.mockResolvedValue(existing_story);
      mock_repository.save.mockResolvedValue(updated_story);

      const result = await service.update(story_id, update_dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: story_id },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.title).toBe(update_dto.title);
      expect(result.status).toBe(update_dto.status);
    });

    it('should throw NotFoundException when story not found', async () => {
      const story_id = randomUUID();
      const update_dto: UpdateStoryDto = {
        title: 'Updated Title',
      };

      mock_repository.findOne.mockResolvedValue(null);

      await expect(service.update(story_id, update_dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should preserve existing values when fields are not provided', async () => {
      const story_id = randomUUID();
      const existing_story: StoryEntity = {
        id: story_id,
        title: 'Original Title',
        description: 'Original Description',
        acceptance_criteria: 'Original Criteria',
        priority: 'High',
        story_points: 5,
        assignee: null,
        status: 'To Do',
        sprint: null,
        epic: null,
        tags: [],
        value: null,
        effort: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const update_dto: UpdateStoryDto = {
        status: 'Done',
      };

      mock_repository.findOne.mockResolvedValue(existing_story);
      mock_repository.save.mockResolvedValue({
        ...existing_story,
        status: update_dto.status,
      });

      const result = await service.update(story_id, update_dto);

      expect(result.title).toBe(existing_story.title);
      expect(result.status).toBe(update_dto.status);
    });
  });

  describe('remove', () => {
    it('should delete a story', async () => {
      const story_id = randomUUID();
      mock_repository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(story_id);

      expect(repository.delete).toHaveBeenCalledWith(story_id);
    });

    it('should throw NotFoundException when story not found', async () => {
      const story_id = randomUUID();
      mock_repository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(story_id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should return stories matching search query', async () => {
      const query = 'test';
      const stories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Test Story',
          description: 'Description',
          acceptance_criteria: 'Criteria',
          priority: 'High',
          story_points: 5,
          assignee: null,
          status: 'To Do',
          sprint: null,
          epic: null,
          tags: [],
          value: null,
          effort: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mock_query_builder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(stories),
      };

      mock_repository.createQueryBuilder.mockReturnValue(mock_query_builder);

      const result = await service.search(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('story');
      expect(mock_query_builder.where).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Test');
    });

    it('should return all stories when query is empty', async () => {
      const query = '';
      const stories: StoryEntity[] = [];

      mock_repository.find.mockResolvedValue(stories);

      const result = await service.search(query);

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(stories);
    });

    it('should return all stories when query is whitespace only', async () => {
      const query = '   ';
      const stories: StoryEntity[] = [];

      mock_repository.find.mockResolvedValue(stories);

      const result = await service.search(query);

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(stories);
  describe('findAll - filtering by exact priority', () => {
    it('should filter stories by exact priority', async () => {
      const query: QueryStoriesDto = { priority: 'High' };
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          description: 'Description',
          acceptance_criteria: 'Criteria',
          priority: 'High',
          story_points: 5,
          status: 'To Do',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      const result = await service.findAll(query);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('story');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.priority = :priority',
        { priority: 'High' },
      );
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('High');
    });
  });

  describe('findAll - filtering by exact points', () => {
    it('should filter stories by exact points', async () => {
      const query: QueryStoriesDto = { points: 8 };
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          description: 'Description',
          acceptance_criteria: 'Criteria',
          priority: 'Medium',
          story_points: 8,
          status: 'To Do',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      const result = await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.story_points = :points',
        { points: 8 },
      );
      expect(result).toHaveLength(1);
      expect(result[0].storyPoints).toBe(8);
    });
  });

  describe('findAll - filtering by points range', () => {
    it('should filter stories by points range (min and max)', async () => {
      const query: QueryStoriesDto = { pointsMin: 3, pointsMax: 8 };
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          description: 'Description',
          acceptance_criteria: 'Criteria',
          priority: 'Medium',
          story_points: 5,
          status: 'To Do',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      const result = await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.story_points >= :pointsMin AND story.story_points <= :pointsMax',
        { pointsMin: 3, pointsMax: 8 },
      );
      expect(result).toHaveLength(1);
    });

    it('should filter stories by points min only', async () => {
      const query: QueryStoriesDto = { pointsMin: 5 };
      const mockStories: StoryEntity[] = [];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.story_points >= :pointsMin',
        { pointsMin: 5 },
      );
    });

    it('should filter stories by points max only', async () => {
      const query: QueryStoriesDto = { pointsMax: 10 };
      const mockStories: StoryEntity[] = [];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.story_points <= :pointsMax',
        { pointsMax: 10 },
      );
    });
  });

  describe('findAll - filtering by priority range', () => {
    it('should filter stories by priority range (min and max)', async () => {
      const query: QueryStoriesDto = {
        priorityMin: 'Medium',
        priorityMax: 'High',
      };
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          description: 'Description',
          acceptance_criteria: 'Criteria',
          priority: 'Medium',
          story_points: 5,
          status: 'To Do',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
        {
          id: randomUUID(),
          title: 'Story 2',
          description: 'Description',
          acceptance_criteria: 'Criteria',
          priority: 'High',
          story_points: 8,
          status: 'To Do',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      const result = await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.priority IN (:...priorities)',
        { priorities: ['Medium', 'High'] },
      );
      expect(result).toHaveLength(2);
    });

    it('should filter stories by priority min only', async () => {
      const query: QueryStoriesDto = { priorityMin: 'High' };
      const mockStories: StoryEntity[] = [];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.priority IN (:...priorities)',
        { priorities: ['High', 'Critical'] },
      );
    });

    it('should filter stories by priority max only', async () => {
      const query: QueryStoriesDto = { priorityMax: 'Medium' };
      const mockStories: StoryEntity[] = [];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.priority IN (:...priorities)',
        { priorities: ['Low', 'Medium'] },
      );
    });
  });

  describe('findAll - combined filters', () => {
    it('should filter stories by both priority and points', async () => {
      const query: QueryStoriesDto = { priority: 'High', points: 8 };
      const mockStories: StoryEntity[] = [];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.priority = :priority',
        { priority: 'High' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.story_points = :points',
        { points: 8 },
      );
    });

    it('should filter stories by priority and points range', async () => {
      const query: QueryStoriesDto = {
        priority: 'Medium',
        pointsMin: 3,
        pointsMax: 8,
      };
      const mockStories: StoryEntity[] = [];

      mockQueryBuilder.getMany.mockResolvedValue(mockStories);

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.priority = :priority',
        { priority: 'Medium' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'story.story_points >= :pointsMin AND story.story_points <= :pointsMax',
        { pointsMin: 3, pointsMax: 8 },
      );
    });
  });

  describe('findAll - no filters', () => {
    it('should return all stories when no query provided', async () => {
      const mockStories: StoryEntity[] = [
        {
          id: randomUUID(),
          title: 'Story 1',
          description: 'Description',
          acceptance_criteria: 'Criteria',
          priority: 'Medium',
          story_points: 5,
          status: 'To Do',
          created_at: new Date(),
          updated_at: new Date(),
        } as StoryEntity,
      ];

      mockRepository.find.mockResolvedValue(mockStories);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: {
          updated_at: 'DESC',
          created_at: 'DESC',
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should return all stories when empty query provided', async () => {
      const query: QueryStoriesDto = {};
      const mockStories: StoryEntity[] = [];

      mockRepository.find.mockResolvedValue(mockStories);

      await service.findAll(query);

      expect(mockRepository.find).toHaveBeenCalled();
    });
  });
});


