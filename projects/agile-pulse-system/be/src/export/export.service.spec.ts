import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ExportService } from './export.service';
import { StoriesService } from '../stories/stories.service';
import { ExportStoriesDto, ExportPlatform, JiraAuthType } from './dto/export-stories.dto';
import { StoryResponseDto } from '../stories/dto/story-response.dto';

// Mock fetch globally
global.fetch = jest.fn();

describe('ExportService', () => {
  let service: ExportService;
  let storiesService: StoriesService;

  const mockStory: StoryResponseDto = {
    id: 'story-1',
    title: 'Test Story',
    description: 'Test description',
    acceptanceCriteria: 'Test criteria',
    priority: 'High',
    storyPoints: 5,
    assignee: 'john.doe',
    status: 'In Progress',
    sprint: 'Sprint 1',
    epic: 'EPIC-1',
    tags: ['tag1'],
    value: 8,
    effort: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: StoriesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    storiesService = module.get<StoriesService>(StoriesService);
    jest.clearAllMocks();
  });

  describe('exportStories', () => {
    it('should successfully export stories to Jira', async () => {
      const exportDto: ExportStoriesDto = {
        storyIds: ['story-1'],
        config: {
          platform: ExportPlatform.JIRA,
          baseUrl: 'https://test.atlassian.net',
          projectKey: 'TEST',
          issueType: 'Story',
          auth: {
            type: JiraAuthType.API_TOKEN,
            username: 'test@example.com',
            apiToken: 'token123',
          },
        },
      };

      jest.spyOn(storiesService, 'findOne').mockResolvedValue(mockStory);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ key: 'TEST-1', id: '12345' }),
        text: async () => JSON.stringify({ key: 'TEST-1', id: '12345' }),
      });

      const result = await service.exportStories(exportDto);

      expect(result.platform).toBe('jira');
      expect(result.totalStories).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].externalId).toBe('TEST-1');
    });

    it('should handle export failures gracefully', async () => {
      const exportDto: ExportStoriesDto = {
        storyIds: ['story-1'],
        config: {
          platform: ExportPlatform.JIRA,
          baseUrl: 'https://test.atlassian.net',
          projectKey: 'TEST',
          issueType: 'Story',
          auth: {
            type: JiraAuthType.API_TOKEN,
            username: 'test@example.com',
            apiToken: 'token123',
          },
        },
      };

      jest.spyOn(storiesService, 'findOne').mockResolvedValue(mockStory);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ errorMessages: ['Invalid project key'] }),
        text: async () => JSON.stringify({ errorMessages: ['Invalid project key'] }),
      });

      const result = await service.exportStories(exportDto);

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });

    it('should handle missing stories', async () => {
      const exportDto: ExportStoriesDto = {
        storyIds: ['story-1', 'story-2'],
        config: {
          platform: ExportPlatform.JIRA,
          baseUrl: 'https://test.atlassian.net',
          projectKey: 'TEST',
          issueType: 'Story',
          auth: {
            type: JiraAuthType.API_TOKEN,
            username: 'test@example.com',
            apiToken: 'token123',
          },
        },
      };

      jest
        .spyOn(storiesService, 'findOne')
        .mockResolvedValueOnce(mockStory)
        .mockRejectedValueOnce(new Error('Story not found'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ key: 'TEST-1', id: '12345' }),
        text: async () => JSON.stringify({ key: 'TEST-1', id: '12345' }),
      });

      const result = await service.exportStories(exportDto);

      expect(result.totalStories).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBe('Story not found');
    });

    it('should retry on server errors', async () => {
      const exportDto: ExportStoriesDto = {
        storyIds: ['story-1'],
        config: {
          platform: ExportPlatform.JIRA,
          baseUrl: 'https://test.atlassian.net',
          projectKey: 'TEST',
          issueType: 'Story',
          auth: {
            type: JiraAuthType.API_TOKEN,
            username: 'test@example.com',
            apiToken: 'token123',
          },
        },
      };

      jest.spyOn(storiesService, 'findOne').mockResolvedValue(mockStory);

      // First two calls fail with 500, third succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
          text: async () => '{}',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
          text: async () => '{}',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ key: 'TEST-1', id: '12345' }),
          text: async () => JSON.stringify({ key: 'TEST-1', id: '12345' }),
        });

      const result = await service.exportStories(exportDto);

      expect(result.successful).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors (4xx)', async () => {
      const exportDto: ExportStoriesDto = {
        storyIds: ['story-1'],
        config: {
          platform: ExportPlatform.JIRA,
          baseUrl: 'https://test.atlassian.net',
          projectKey: 'TEST',
          issueType: 'Story',
          auth: {
            type: JiraAuthType.API_TOKEN,
            username: 'test@example.com',
            apiToken: 'token123',
          },
        },
      };

      jest.spyOn(storiesService, 'findOne').mockResolvedValue(mockStory);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ errorMessages: ['Unauthorized'] }),
        text: async () => JSON.stringify({ errorMessages: ['Unauthorized'] }),
      });

      const result = await service.exportStories(exportDto);

      expect(result.failed).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});


