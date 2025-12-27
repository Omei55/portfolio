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
} from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Controller('api/sprints')
export class SprintsController {
  constructor(private readonly sprints_service: SprintsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() create_sprint_dto: CreateSprintDto): Promise<ApiResponseDto> {
    const sprint = await this.sprints_service.create(create_sprint_dto);
    return ApiResponseDto.created(sprint, 'Sprint created successfully');
  }

  @Get()
  async findAll(): Promise<ApiResponseDto> {
    const sprints = await this.sprints_service.findAll();
    return ApiResponseDto.success(sprints, 'Sprints retrieved successfully');
  }

  @Get('unassigned/stories')
  async getUnassignedStories(): Promise<ApiResponseDto> {
    const stories = await this.sprints_service.getUnassignedStories();
    return ApiResponseDto.success(stories, 'Unassigned stories retrieved successfully');
  }

  @Get('name/:name/stories')
  async getSprintStoriesByName(@Param('name') name: string): Promise<ApiResponseDto> {
    const stories = await this.sprints_service.getSprintStories(name);
    return ApiResponseDto.success(stories, 'Sprint stories retrieved successfully');
  }

  @Get('name/:name/stats')
  async getSprintStatsByName(@Param('name') name: string): Promise<ApiResponseDto> {
    const stats = await this.sprints_service.getSprintStats(name);
    return ApiResponseDto.success(stats, 'Sprint statistics retrieved successfully');
  }

  @Post('name/:name/assign/:storyId')
  async assignStoryToSprintByName(
    @Param('name') name: string,
    @Param('storyId') storyId: string,
  ): Promise<ApiResponseDto> {
    const story = await this.sprints_service.assignStoryToSprint(storyId, name);
    return ApiResponseDto.success(story, 'Story assigned to sprint successfully');
  }

  @Post('unassign/:storyId')
  async unassignStoryFromSprint(@Param('storyId') storyId: string): Promise<ApiResponseDto> {
    const story = await this.sprints_service.unassignStoryFromSprint(storyId);
    return ApiResponseDto.success(story, 'Story unassigned from sprint successfully');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const sprint = await this.sprints_service.findOne(id);
    return ApiResponseDto.success(sprint, 'Sprint retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() update_sprint_dto: UpdateSprintDto,
  ): Promise<ApiResponseDto> {
    const sprint = await this.sprints_service.update(id, update_sprint_dto);
    return ApiResponseDto.success(sprint, 'Sprint updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.sprints_service.remove(id);
  }
}
