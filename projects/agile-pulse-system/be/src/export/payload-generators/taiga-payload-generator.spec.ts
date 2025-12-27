import { TaigaPayloadGenerator } from './taiga-payload-generator';
import { StoryResponseDto } from '../../stories/dto/story-response.dto';
import { ExportConfig, ExportPlatform, TaigaAuthType } from '../dto/export-stories.dto';

describe('TaigaPayloadGenerator', () => {
  const mockStory: StoryResponseDto = {
    id: 'story-1',
    title: 'Test Story',
    description: 'This is a test story',
    acceptanceCriteria: 'Criteria 1\nCriteria 2',
    priority: 'High',
    storyPoints: 5,
    assignee: 'john.doe',
    status: 'In Progress',
    sprint: 'Sprint 1',
    epic: '123',
    tags: ['frontend', 'urgent'],
    value: 8,
    effort: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfig: ExportConfig = {
    platform: ExportPlatform.TAIGA,
    baseUrl: 'https://api.taiga.io',
    projectKey: '123456',
    auth: {
      type: TaigaAuthType.TOKEN,
      token: 'taiga-token-123',
    },
  };

  describe('generatePayload', () => {
    it('should generate correct Taiga payload with all fields', () => {
      const payload = TaigaPayloadGenerator.generatePayload(mockStory, mockConfig);

      expect(payload.project).toBe(123456);
      expect(payload.subject).toBe('Test Story');
      expect(payload.priority).toBe(4);
      expect(payload.points).toBe(5);
      expect(payload.assigned_to).toBe('john.doe');
      expect(payload.tags).toEqual(['frontend', 'urgent']);
      expect(payload.epic).toBe(123);
    });

    it('should format description with acceptance criteria', () => {
      const payload = TaigaPayloadGenerator.generatePayload(mockStory, mockConfig);

      expect(payload.description).toContain('This is a test story');
      expect(payload.description).toContain('**Acceptance Criteria:**');
      expect(payload.description).toContain('* Criteria 1');
      expect(payload.description).toContain('* Criteria 2');
    });

    it('should include value and effort in description', () => {
      const payload = TaigaPayloadGenerator.generatePayload(mockStory, mockConfig);

      expect(payload.description).toContain('**Value:** 8/10');
      expect(payload.description).toContain('**Effort:** 3/10');
    });

    it('should handle story without optional fields', () => {
      const minimalStory: StoryResponseDto = {
        ...mockStory,
        storyPoints: undefined,
        assignee: undefined,
        tags: undefined,
        epic: undefined,
        value: undefined,
        effort: undefined,
        sprint: undefined,
      };

      const payload = TaigaPayloadGenerator.generatePayload(minimalStory, mockConfig);

      expect(payload.subject).toBe('Test Story');
      expect(payload.points).toBeUndefined();
      expect(payload.assigned_to).toBeUndefined();
      expect(payload.tags).toBeUndefined();
      expect(payload.epic).toBeUndefined();
    });

    it('should map priority correctly', () => {
      const priorities = [
        { input: 'High', expected: 4 },
        { input: 'Medium', expected: 2 },
        { input: 'Low', expected: 1 },
        { input: 'Unknown', expected: 2 },
      ];

      priorities.forEach(({ input, expected }) => {
        const story = { ...mockStory, priority: input };
        const payload = TaigaPayloadGenerator.generatePayload(story, mockConfig);
        expect(payload.priority).toBe(expected);
      });
    });
  });

  describe('getCreateUserStoryEndpoint', () => {
    it('should return correct endpoint URL', () => {
      const endpoint = TaigaPayloadGenerator.getCreateUserStoryEndpoint('https://api.taiga.io');
      expect(endpoint).toBe('https://api.taiga.io/api/v1/userstories');
    });

    it('should handle URL with trailing slash', () => {
      const endpoint = TaigaPayloadGenerator.getCreateUserStoryEndpoint('https://api.taiga.io/');
      expect(endpoint).toBe('https://api.taiga.io/api/v1/userstories');
    });
  });

  describe('getAuthHeaders', () => {
    it('should generate Bearer token headers', () => {
      const auth = {
        type: TaigaAuthType.TOKEN,
        token: 'taiga-token-123',
      };

      const headers = TaigaPayloadGenerator.getAuthHeaders(auth);

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toBe('Bearer taiga-token-123');
    });
  });
});


