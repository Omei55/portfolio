import { JiraPayloadGenerator } from './jira-payload-generator';
import { StoryResponseDto } from '../../stories/dto/story-response.dto';
import { ExportConfig, ExportPlatform, JiraAuthType } from '../dto/export-stories.dto';

describe('JiraPayloadGenerator', () => {
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
    epic: 'EPIC-1',
    tags: ['frontend', 'urgent'],
    value: 8,
    effort: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfig: ExportConfig = {
    platform: ExportPlatform.JIRA,
    baseUrl: 'https://test.atlassian.net',
    projectKey: 'TEST',
    issueType: 'Story',
    auth: {
      type: JiraAuthType.API_TOKEN,
      username: 'test@example.com',
      apiToken: 'token123',
    },
  };

  describe('generatePayload', () => {
    it('should generate correct Jira payload with all fields', () => {
      const payload = JiraPayloadGenerator.generatePayload(mockStory, mockConfig);

      expect(payload.fields.project.key).toBe('TEST');
      expect(payload.fields.summary).toBe('Test Story');
      expect(payload.fields.issuetype.name).toBe('Story');
      expect(payload.fields.priority.name).toBe('Highest');
      expect(payload.fields.customfield_10016).toBe(5);
      expect(payload.fields.assignee.name).toBe('john.doe');
      expect(payload.fields.labels).toEqual(['frontend', 'urgent']);
    });

    it('should format description with acceptance criteria', () => {
      const payload = JiraPayloadGenerator.generatePayload(mockStory, mockConfig);

      expect(payload.fields.description).toContain('This is a test story');
      expect(payload.fields.description).toContain('*Acceptance Criteria:*');
      expect(payload.fields.description).toContain('* Criteria 1');
      expect(payload.fields.description).toContain('* Criteria 2');
    });

    it('should include value and effort in description', () => {
      const payload = JiraPayloadGenerator.generatePayload(mockStory, mockConfig);

      expect(payload.fields.description).toContain('*Value:* 8/10');
      expect(payload.fields.description).toContain('*Effort:* 3/10');
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

      const payload = JiraPayloadGenerator.generatePayload(minimalStory, mockConfig);

      expect(payload.fields.summary).toBe('Test Story');
      expect(payload.fields.customfield_10016).toBeUndefined();
      expect(payload.fields.assignee).toBeUndefined();
      expect(payload.fields.labels).toBeUndefined();
    });

    it('should map priority correctly', () => {
      const priorities = [
        { input: 'High', expected: 'Highest' },
        { input: 'Medium', expected: 'Medium' },
        { input: 'Low', expected: 'Lowest' },
        { input: 'Unknown', expected: 'Medium' },
      ];

      priorities.forEach(({ input, expected }) => {
        const story = { ...mockStory, priority: input };
        const payload = JiraPayloadGenerator.generatePayload(story, mockConfig);
        expect(payload.fields.priority.name).toBe(expected);
      });
    });
  });

  describe('getCreateIssueEndpoint', () => {
    it('should return correct endpoint URL', () => {
      const endpoint = JiraPayloadGenerator.getCreateIssueEndpoint('https://test.atlassian.net');
      expect(endpoint).toBe('https://test.atlassian.net/rest/api/2/issue');
    });

    it('should handle URL with trailing slash', () => {
      const endpoint = JiraPayloadGenerator.getCreateIssueEndpoint('https://test.atlassian.net/');
      expect(endpoint).toBe('https://test.atlassian.net/rest/api/2/issue');
    });
  });

  describe('getAuthHeaders', () => {
    it('should generate Basic auth headers for API token', () => {
      const auth = {
        type: JiraAuthType.API_TOKEN,
        username: 'test@example.com',
        apiToken: 'token123',
      };

      const headers = JiraPayloadGenerator.getAuthHeaders(auth);

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toContain('Basic');
    });

    it('should generate Basic auth headers for basic auth', () => {
      const auth = {
        type: JiraAuthType.BASIC,
        username: 'user',
        password: 'pass',
      };

      const headers = JiraPayloadGenerator.getAuthHeaders(auth);

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toContain('Basic');
    });

    it('should generate Bearer token for OAuth', () => {
      const auth = {
        type: JiraAuthType.OAUTH,
        accessToken: 'oauth-token-123',
      };

      const headers = JiraPayloadGenerator.getAuthHeaders(auth);

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toBe('Bearer oauth-token-123');
    });
  });
});


