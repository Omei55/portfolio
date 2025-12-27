import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StoriesService } from '../stories/stories.service';
import { ExportStoriesDto, ExportPlatform } from './dto/export-stories.dto';
import { ExportResponseDto, ExportResult } from './dto/export-response.dto';
import { JiraPayloadGenerator } from './payload-generators/jira-payload-generator';
import { TaigaPayloadGenerator } from './payload-generators/taiga-payload-generator';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly storiesService: StoriesService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Export stories to external platform (Jira or Taiga)
   */
  async exportStories(exportDto: ExportStoriesDto): Promise<ExportResponseDto> {
    this.logger.log(
      `Starting export of ${exportDto.storyIds.length} stories to ${exportDto.config.platform}`,
    );

    const results: ExportResult[] = [];
    let successful = 0;
    let failed = 0;

    // Fetch all stories
    const stories = await Promise.all(
      exportDto.storyIds.map((id) =>
        this.storiesService.findOne(id).catch((error) => {
          this.logger.error(`Failed to fetch story ${id}: ${error.message}`);
          return null;
        }),
      ),
    );

    // Export each story
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const storyId = exportDto.storyIds[i];

      if (!story) {
        results.push({
          storyId,
          success: false,
          error: 'Story not found',
        });
        failed++;
        continue;
      }

      try {
        const result = await this.exportSingleStory(story, exportDto.config);
        results.push({
          storyId,
          success: true,
          externalId: result.externalId,
        });
        successful++;
        this.logger.log(
          `Successfully exported story ${storyId} to ${exportDto.config.platform}. External ID: ${result.externalId}`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          storyId,
          success: false,
          error: errorMessage,
        });
        failed++;
        this.logger.error(
          `Failed to export story ${storyId} to ${exportDto.config.platform}: ${errorMessage}`,
        );
      }
    }

    const response: ExportResponseDto = {
      platform: exportDto.config.platform,
      totalStories: exportDto.storyIds.length,
      successful,
      failed,
      results,
    };

    this.logger.log(
      `Export completed: ${successful} successful, ${failed} failed out of ${exportDto.storyIds.length} total`,
    );

    return response;
  }

  /**
   * Export a single story to external platform
   */
  private async exportSingleStory(
    story: any,
    config: any,
  ): Promise<{ externalId: string }> {
    let payload: any;
    let endpoint: string;
    let headers: Record<string, string>;

    if (config.platform === ExportPlatform.JIRA) {
      payload = JiraPayloadGenerator.generatePayload(story, config);
      endpoint = JiraPayloadGenerator.getCreateIssueEndpoint(config.baseUrl);
      headers = JiraPayloadGenerator.getAuthHeaders(config.auth);
    } else if (config.platform === ExportPlatform.TAIGA) {
      payload = TaigaPayloadGenerator.generatePayload(story, config);
      endpoint = TaigaPayloadGenerator.getCreateUserStoryEndpoint(config.baseUrl);
      headers = TaigaPayloadGenerator.getAuthHeaders(config.auth);
    } else {
      throw new HttpException(`Unsupported platform: ${config.platform}`, HttpStatus.BAD_REQUEST);
    }

    // Log request (without sensitive data)
    this.logger.debug(`Exporting story ${story.id} to ${config.platform}`);
    this.logger.debug(`Endpoint: ${endpoint}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

    // Make API call with retry logic
    const response = await this.makeApiRequestWithRetry(endpoint, payload, headers, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    });

    // Extract external ID from response
    let externalId: string;
    if (config.platform === ExportPlatform.JIRA) {
      externalId = response.key || response.id;
    } else if (config.platform === ExportPlatform.TAIGA) {
      externalId = response.id?.toString() || response.ref?.toString();
    } else {
      externalId = response.id?.toString() || 'unknown';
    }

    this.logger.debug(`Response from ${config.platform}: ${JSON.stringify(response, null, 2)}`);

    return { externalId };
  }

  /**
   * Make API request with retry logic and exponential backoff
   */
  private async makeApiRequestWithRetry(
    url: string,
    payload: any,
    headers: Record<string, string>,
    options: RetryOptions = {},
  ): Promise<any> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Use HttpService from NestJS
        const response = await firstValueFrom(
          this.httpService.post(url, payload, { headers }),
        );

        const responseData = response.data;

        // Log response
        this.logger.debug(`API Response Status: ${response.status}`);
        this.logger.debug(`API Response Body: ${JSON.stringify(responseData, null, 2)}`);

        return responseData;
      } catch (error: any) {
        const status = error?.response?.status || error?.status || 500;
        const errorMessage =
          error?.response?.data?.errorMessages?.join(', ') ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          `HTTP ${status}: ${error?.response?.statusText || 'Unknown error'}`;

        lastError = new Error(errorMessage);

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (status >= 400 && status < 500 && status !== 429) {
          throw new HttpException(errorMessage, status);
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          this.logger.error(
            `API request failed after ${maxRetries + 1} attempts: ${lastError.message}`,
          );
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
        this.logger.warn(
          `API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${lastError.message}`,
        );

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Unknown error during API request');
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

