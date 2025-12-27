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
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Controller('api/comments')
export class CommentsController {
  constructor(private readonly comments_service: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() create_comment_dto: CreateCommentDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto> {
    if (!user || !user.user_id) {
      throw new ForbiddenException('User not authenticated');
    }
    const comment = await this.comments_service.create(create_comment_dto, user.user_id);
    return ApiResponseDto.created(comment, 'Comment created successfully');
  }

  @Get()
  async findAll(
    @Query('storyId') story_id?: string,
    @Query('taskId') task_id?: string,
  ): Promise<ApiResponseDto> {
    const comments = await this.comments_service.findAll(story_id, task_id);
    return ApiResponseDto.success(comments, 'Comments retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const comment = await this.comments_service.findOne(id);
    return ApiResponseDto.success(comment, 'Comment retrieved successfully');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() update_comment_dto: UpdateCommentDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto> {
    if (!user || !user.user_id) {
      throw new ForbiddenException('User not authenticated');
    }
    const comment = await this.comments_service.update(id, update_comment_dto, user.user_id);
    return ApiResponseDto.success(comment, 'Comment updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user: any): Promise<ApiResponseDto> {
    if (!user || !user.user_id) {
      throw new ForbiddenException('User not authenticated');
    }
    await this.comments_service.remove(id, user.user_id);
    return ApiResponseDto.noContent('Comment deleted successfully');
  }
}



