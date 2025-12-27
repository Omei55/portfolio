import { StoryResponseDto } from '../../stories/dto/story-response.dto';
import { ExportConfig } from '../dto/export-stories.dto';

/**
 * Maps Agile Pulse priority to Taiga priority
 */
function mapPriorityToTaiga(priority: string): number {
  const priorityMap: Record<string, number> = {
    High: 4, // High priority
    Medium: 2, // Normal priority
    Low: 1, // Low priority
  };
  return priorityMap[priority] || 2;
}

/**
 * Maps Agile Pulse status to Taiga status
 */
function mapStatusToTaiga(status: string): number {
  // Taiga uses status IDs, we'll use common defaults
  // These should be configured per project
  const statusMap: Record<string, number> = {
    'To Do': 1,
    'In Progress': 2,
    'Done': 3,
  };
  return statusMap[status] || 1;
}

/**
 * Generates Taiga user story payload from user story
 */
export class TaigaPayloadGenerator {
  /**
   * Generate Taiga user story creation payload
   */
  static generatePayload(story: StoryResponseDto, config: ExportConfig): any {
    const payload: any = {
      project: parseInt(config.projectKey, 10),
      subject: story.title,
      description: this.formatDescription(story),
      priority: mapPriorityToTaiga(story.priority),
    };

    // Add optional fields
    if (story.storyPoints) {
      payload.points = story.storyPoints;
    }

    if (story.assignee) {
      // Taiga uses user ID, but we'll try with username/email
      // In production, you'd need to resolve username to user ID
      payload.assigned_to = story.assignee;
    }

    // Add tags
    if (story.tags && story.tags.length > 0) {
      payload.tags = story.tags;
    }

    // Add epic reference if available
    if (story.epic) {
      payload.epic = parseInt(story.epic, 10);
    }

    return payload;
  }

  /**
   * Format story description with acceptance criteria
   */
  private static formatDescription(story: StoryResponseDto): string {
    let description = story.description || '';

    if (story.acceptanceCriteria) {
      description += '\n\n**Acceptance Criteria:**\n';
      const criteria = story.acceptanceCriteria
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `* ${line.trim()}`);
      description += criteria.join('\n');
    }

    if (story.value !== null && story.value !== undefined) {
      description += `\n\n**Value:** ${story.value}/10`;
    }

    if (story.effort !== null && story.effort !== undefined) {
      description += `\n**Effort:** ${story.effort}/10`;
    }

    if (story.sprint) {
      description += `\n**Sprint:** ${story.sprint}`;
    }

    return description.trim();
  }

  /**
   * Get Taiga API endpoint for creating user stories
   */
  static getCreateUserStoryEndpoint(baseUrl: string): string {
    const cleanUrl = baseUrl.replace(/\/$/, '');
    return `${cleanUrl}/api/v1/userstories`;
  }

  /**
   * Get authentication headers for Taiga
   */
  static getAuthHeaders(auth: any): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    return headers;
  }
}


