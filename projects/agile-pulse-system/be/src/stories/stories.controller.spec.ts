import { Test, TestingModule } from '@nestjs/testing';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { ExportStoriesDto, ExportFormat, ExportTarget } from './dto/export-stories.dto';

describe('StoriesController - Export End-to-End Tests', () => {
  let controller: StoriesController;
  let service: StoriesService;
  let mockResponse: any;
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('StoriesController', () => {
  let controller: StoriesController;
  let service: StoriesService;

  const mock_stories_service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoriesController],
      providers: [
        {
          provide: StoriesService,
          useValue: {
            exportStories: jest.fn(),
          },
          useValue: mock_stories_service,
        },
      ],
    }).compile();

    controller = module.get<StoriesController>(StoriesController);
    service = module.get<StoriesService>(StoriesService);

    mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('POST /api/stories/export', () => {
    it('should export all stories as JSON in generic format', async () => {
      const exportDto: ExportStoriesDto = {
        format: ExportFormat.JSON,
        target: ExportTarget.GENERIC,
      };

      const mockExportResult = {
        data: JSON.stringify([{ id: '1', title: 'Test Story' }]),
        filename: 'stories_export_2025-01-01.json',
        mimeType: 'application/json',
      };

      jest.spyOn(service, 'exportStories').mockResolvedValue(mockExportResult);

      await controller.exportStories(exportDto, mockResponse);

      expect(service.exportStories).toHaveBeenCalledWith(
        undefined,
        ExportFormat.JSON,
        ExportTarget.GENERIC,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="stories_export_2025-01-01.json"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockExportResult.data);
    });

    it('should export selected stories as CSV for Jira', async () => {
      const exportDto: ExportStoriesDto = {
        storyIds: ['story-1', 'story-2'],
        format: ExportFormat.CSV,
        target: ExportTarget.JIRA,
      };

      const mockExportResult = {
        data: 'summary,description,priority\nTest Story,Description,High',
        filename: 'stories_export_2025-01-01.csv',
        mimeType: 'text/csv',
      };

      jest.spyOn(service, 'exportStories').mockResolvedValue(mockExportResult);

      await controller.exportStories(exportDto, mockResponse);

      expect(service.exportStories).toHaveBeenCalledWith(
        ['story-1', 'story-2'],
        ExportFormat.CSV,
        ExportTarget.JIRA,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockExportResult.data);
    });

    it('should export stories for Taiga in JSON format', async () => {
      const exportDto: ExportStoriesDto = {
        format: ExportFormat.JSON,
        target: ExportTarget.TAIGA,
      };

      const mockExportResult = {
        data: JSON.stringify([{ subject: 'Test Story', priority: 2 }]),
        filename: 'stories_export_2025-01-01.json',
        mimeType: 'application/json',
      };

      jest.spyOn(service, 'exportStories').mockResolvedValue(mockExportResult);

      await controller.exportStories(exportDto, mockResponse);

      expect(service.exportStories).toHaveBeenCalledWith(
        undefined,
        ExportFormat.JSON,
        ExportTarget.TAIGA,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockExportResult.data);
    });
  });
});

  });

  afterEach(() => {
    jest.clearAllMocks();
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

      const expected_story = {
        id: randomUUID(),
        title: create_dto.title,
        description: create_dto.description,
        acceptanceCriteria: create_dto.acceptanceCriteria,
        priority: create_dto.priority,
        storyPoints: create_dto.storyPoints,
        status: 'To Do',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mock_stories_service.create.mockResolvedValue(expected_story);

      const result = await controller.create(create_dto);

      expect(service.create).toHaveBeenCalledWith(create_dto);
      expect(result).toEqual(expected_story);
      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('should return all stories', async () => {
      const expected_stories = [
        {
          id: randomUUID(),
          title: 'Story 1',
          description: 'Description 1',
          acceptanceCriteria: 'Criteria 1',
          priority: 'High',
          storyPoints: 5,
          status: 'To Do',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: randomUUID(),
          title: 'Story 2',
          description: 'Description 2',
          acceptanceCriteria: 'Criteria 2',
          priority: 'Medium',
          storyPoints: 3,
          status: 'In Progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mock_stories_service.findAll.mockResolvedValue(expected_stories);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expected_stories);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a story by id', async () => {
      const story_id = randomUUID();
      const expected_story = {
        id: story_id,
        title: 'Test Story',
        description: 'Test Description',
        acceptanceCriteria: 'Test Criteria',
        priority: 'High',
        storyPoints: 5,
        status: 'To Do',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mock_stories_service.findOne.mockResolvedValue(expected_story);

      const result = await controller.findOne(story_id);

      expect(service.findOne).toHaveBeenCalledWith(story_id);
      expect(result).toEqual(expected_story);
    });

    it('should throw NotFoundException when story not found', async () => {
      const story_id = randomUUID();
      mock_stories_service.findOne.mockRejectedValue(
        new NotFoundException(`Story with ID ${story_id} not found`),
      );

      await expect(controller.findOne(story_id)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(story_id);
    });
  });

  describe('update', () => {
    it('should update an existing story', async () => {
      const story_id = randomUUID();
      const update_dto: UpdateStoryDto = {
        title: 'Updated Title',
        status: 'In Progress',
      };

      const expected_story = {
        id: story_id,
        title: update_dto.title,
        description: 'Original Description',
        acceptanceCriteria: 'Original Criteria',
        priority: 'High',
        storyPoints: 5,
        status: update_dto.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mock_stories_service.update.mockResolvedValue(expected_story);

      const result = await controller.update(story_id, update_dto);

      expect(service.update).toHaveBeenCalledWith(story_id, update_dto);
      expect(result).toEqual(expected_story);
      expect(result.title).toBe(update_dto.title);
    });

    it('should throw NotFoundException when story not found', async () => {
      const story_id = randomUUID();
      const update_dto: UpdateStoryDto = {
        title: 'Updated Title',
      };

      mock_stories_service.update.mockRejectedValue(
        new NotFoundException(`Story with ID ${story_id} not found`),
      );

      await expect(controller.update(story_id, update_dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a story', async () => {
      const story_id = randomUUID();
      mock_stories_service.remove.mockResolvedValue(undefined);

      await controller.remove(story_id);

      expect(service.remove).toHaveBeenCalledWith(story_id);
    });

    it('should call remove service method', () => {
      const story_id = randomUUID();
      mock_stories_service.remove.mockResolvedValue(undefined);

      controller.remove(story_id);

      expect(service.remove).toHaveBeenCalledWith(story_id);
    });
  });

  describe('search', () => {
    it('should return stories matching search query', async () => {
      const query = 'test';
      const expected_stories = [
        {
          id: randomUUID(),
          title: 'Test Story',
          description: 'Test Description',
          acceptanceCriteria: 'Test Criteria',
          priority: 'High',
          storyPoints: 5,
          status: 'To Do',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mock_stories_service.search.mockResolvedValue(expected_stories);

      const result = await controller.search(query);

      expect(service.search).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected_stories);
    });

    it('should handle empty query', async () => {
      const query = '';
      const expected_stories: any[] = [];

      mock_stories_service.search.mockResolvedValue(expected_stories);

      const result = await controller.search(query);

      expect(service.search).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected_stories);
    });
  });
});


