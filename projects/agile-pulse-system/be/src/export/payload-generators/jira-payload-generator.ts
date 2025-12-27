import { StoryResponseDto } from '../../stories/dto/story-response.dto';
import { ExportConfig, JiraAuthType } from '../dto/export-stories.dto';

/**
 * Maps Agile Pulse priority to Jira priority
 */
function mapPriorityToJira(priority: string): string {
  const priorityMap: Record<string, string> = {
    High: 'Highest',
    Medium: 'Medium',
    Low: 'Lowest',
  };
  return priorityMap[priority] || 'Medium';
}

/**
 * Maps Agile Pulse status to Jira status
 */
function mapStatusToJira(status: string): string {
  const statusMap: Record<string, string> = {
    'To Do': 'To Do',
    'In Progress': 'In Progress',
    'Done': 'Done',
  };
  return statusMap[status] || 'To Do';
}

/**
 * Generates Jira issue payload from user story
 */
export class JiraPayloadGenerator {
  /**
   * Generate Jira issue creation payload
   */
  static generatePayload(story: StoryResponseDto, config: ExportConfig): any {
    const payload: any = {
      fields: {
        project: {
          key: config.projectKey,
        },
        summary: story.title,
        description: this.formatDescription(story),
        issuetype: {
          name: config.issueType || 'Story',
        },
        priority: {
          name: mapPriorityToJira(story.priority),
        },
      },
    };

    // Add optional fields
    if (story.storyPoints) {
      payload.fields.customfield_10016 = story.storyPoints; // Story Points field (may vary by Jira instance)
    }

    if (story.assignee) {
      payload.fields.assignee = {
        name: story.assignee,
      };
    }

    // Add labels from tags
    if (story.tags && story.tags.length > 0) {
      payload.fields.labels = story.tags;
    }

    // Add epic link if available
    if (story.epic) {
      payload.fields.customfield_10011 = story.epic; // Epic Link field (may vary)
    }

    return payload;
  }

  /**
   * Format story description with acceptance criteria
   */
  private static formatDescription(story: StoryResponseDto): string {
    let description = story.description || '';

    if (story.acceptanceCriteria) {
      description += '\n\n*Acceptance Criteria:*\n';
      const criteria = story.acceptanceCriteria
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `* ${line.trim()}`);
      description += criteria.join('\n');
    }

    if (story.value !== null && story.value !== undefined) {
      description += `\n\n*Value:* ${story.value}/10`;
    }

    if (story.effort !== null && story.effort !== undefined) {
      description += `\n*Effort:* ${story.effort}/10`;
    }

    if (story.sprint) {
      description += `\n*Sprint:* ${story.sprint}`;
    }

    return description.trim();
  }

  /**
   * Get Jira API endpoint for creating issues
   */
  static getCreateIssueEndpoint(baseUrl: string): string {
    const cleanUrl = baseUrl.replace(/\/$/, '');
    return `${cleanUrl}/rest/api/2/issue`;
  }

  /**
   * Get authentication headers for Jira
   */
  static getAuthHeaders(auth: any): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (auth.type === JiraAuthType.BASIC && auth.username && auth.password) {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      headers.Authorization = `Basic ${credentials}`;
    } else if (auth.type === JiraAuthType.API_TOKEN && auth.username && auth.apiToken) {
      const credentials = Buffer.from(`${auth.username}:${auth.apiToken}`).toString('base64');
      headers.Authorization = `Basic ${credentials}`;
    } else if (auth.type === JiraAuthType.OAUTH && auth.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    return headers;
  }
}


