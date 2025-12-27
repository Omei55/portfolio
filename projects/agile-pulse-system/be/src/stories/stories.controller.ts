import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { ExportStoriesDto } from './dto/export-stories.dto';
import { FilterQueryDto } from './dto/filter-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadinessCheckerService } from './readiness-checker.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Controller('api/stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(
    private readonly stories_service: StoriesService,
    private readonly readiness_checker: ReadinessCheckerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() create_story_dto: CreateStoryDto): Promise<ApiResponseDto> {
    const story = await this.stories_service.create(create_story_dto);
    return ApiResponseDto.created(story, 'Story created successfully');
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  findAll(@Query() filterQueryDto: FilterQueryDto) {
    return this.stories_service.findAll(filterQueryDto);
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<ApiResponseDto> {
    const stories = await this.stories_service.search(query);
    return ApiResponseDto.success(stories, 'Search completed successfully');
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportStories(
    @Body() exportDto: ExportStoriesDto,
    @Res() res: Response,
  ) {
    const { data, filename, mimeType } = await this.stories_service.exportStories(
      exportDto.storyIds,
      exportDto.format,
      exportDto.target,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  }

  @Get(':id/readiness')
  checkReadiness(@Param('id') id: string) {
    return this.readiness_checker.checkReadiness(id);
  }

  @Get('analytics')
  getAnalytics() {
    return this.stories_service.getAnalytics();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const story = await this.stories_service.findOne(id);
    return ApiResponseDto.success(story, 'Story retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() update_story_dto: UpdateStoryDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto> {
    const userId = user?.user_id || user?.sub || user?.id;
    const userName = user?.full_name || user?.email || 'Unknown User';
    const story = await this.stories_service.update(id, update_story_dto, userId, userName);
    return ApiResponseDto.success(story, 'Story updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.stories_service.remove(id);
  }
}
