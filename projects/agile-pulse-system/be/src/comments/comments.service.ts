import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { StoryEntity } from '../stories/entities/story.entity';
import { TaskEntity } from '../tasks/entities/task.entity';
import { UserEntity } from '../auth/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(StoryEntity)
    private readonly storiesRepository: Repository<StoryEntity>,
    @InjectRepository(TaskEntity)
    private readonly tasksRepository: Repository<TaskEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  private toResponseDto(comment: CommentEntity): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      storyId: comment.story_id,
      taskId: comment.task_id,
      userId: comment.user_id,
      authorName: (comment.user as any)?.full_name,
      authorEmail: (comment.user as any)?.email,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    };
  }

  async create(
    create_comment_dto: CreateCommentDto,
    user_id: string,
  ): Promise<CommentResponseDto> {
    // Validate that either storyId or taskId is provided
    if (!create_comment_dto.storyId && !create_comment_dto.taskId) {
      throw new BadRequestException('Either storyId or taskId must be provided');
    }

    if (create_comment_dto.storyId && create_comment_dto.taskId) {
      throw new BadRequestException('Cannot provide both storyId and taskId');
    }

    // Verify story exists if storyId is provided
    if (create_comment_dto.storyId) {
      const story = await this.storiesRepository.findOne({
        where: { id: create_comment_dto.storyId },
      });

      if (!story) {
        throw new NotFoundException(
          `Story with ID ${create_comment_dto.storyId} not found`,
        );
      }
    }

    // Verify task exists if taskId is provided
    if (create_comment_dto.taskId) {
      const task = await this.tasksRepository.findOne({
        where: { id: create_comment_dto.taskId },
      });

      if (!task) {
        throw new NotFoundException(
          `Task with ID ${create_comment_dto.taskId} not found`,
        );
      }
    }

    // Verify user exists
    const user = await this.usersRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    // Create comment
    const comment = this.commentsRepository.create({
      content: create_comment_dto.content.trim(),
      story_id: create_comment_dto.storyId || null,
      task_id: create_comment_dto.taskId || null,
      user_id: user_id,
    });

    const savedComment = await this.commentsRepository.save(comment);

    // Load relations for response
    const commentWithRelations = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    return this.toResponseDto(commentWithRelations!);
  }

  async findAll(story_id?: string, task_id?: string): Promise<CommentResponseDto[]> {
    const queryBuilder = this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .orderBy('comment.created_at', 'ASC');

    if (story_id) {
      queryBuilder.where('comment.story_id = :storyId', { storyId: story_id });
    } else if (task_id) {
      queryBuilder.where('comment.task_id = :taskId', { taskId: task_id });
    }

    const comments = await queryBuilder.getMany();
    return comments.map((comment) => this.toResponseDto(comment));
  }

  async findOne(id: string): Promise<CommentResponseDto> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return this.toResponseDto(comment);
  }

  async update(
    id: string,
    update_comment_dto: UpdateCommentDto,
    user_id: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Check authorization - only comment owner can update
    if (comment.user_id !== user_id) {
      throw new ForbiddenException(
        'You do not have permission to update this comment',
      );
    }

    // Prevent storyId from being changed
    if (update_comment_dto.storyId && update_comment_dto.storyId !== comment.story_id) {
      throw new BadRequestException('Cannot change the story associated with a comment');
    }

    // Update content if provided
    if (update_comment_dto.content !== undefined) {
      const trimmedContent = update_comment_dto.content.trim();
      if (!trimmedContent) {
        throw new BadRequestException('Comment content cannot be empty');
      }
      comment.content = trimmedContent;
    }

    const savedComment = await this.commentsRepository.save(comment);
    return this.toResponseDto(savedComment);
  }

  async remove(id: string, user_id: string): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Check authorization - only comment owner can delete
    if (comment.user_id !== user_id) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    const result = await this.commentsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
  }
}



