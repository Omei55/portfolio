import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  SprintAnalyticsDto,
  StoryAnalyticsDto,
  OverallAnalyticsDto,
} from './dto/analytics-response.dto';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overall')
  async getOverallAnalytics(): Promise<OverallAnalyticsDto> {
    return this.analyticsService.getOverallAnalytics();
  }

  @Get('sprint/:sprintName')
  async getSprintAnalytics(
    @Param('sprintName') sprintName: string,
  ): Promise<SprintAnalyticsDto> {
    return this.analyticsService.getSprintAnalytics(sprintName);
  }

  @Get('stories')
  async getStoryAnalytics(): Promise<StoryAnalyticsDto> {
    return this.analyticsService.getStoryAnalytics();
  }
}
