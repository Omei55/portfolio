import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentEntity } from './entities/comment.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { TaskEntity } from '../tasks/entities/task.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { randomUUID } from 'crypto';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: Repository<CommentEntity>;
  let storyRepository: Repository<StoryEntity>;
  let taskRepository: Repository<TaskEntity>;
  let userRepository: Repository<UserEntity>;

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockStoryRepository = {
    findOne: jest.fn(),
  };

  const mockTaskRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(CommentEntity),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(StoryEntity),
          useValue: mockStoryRepository,
        },
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepository = module.get<Repository<CommentEntity>>(
      getRepositoryToken(CommentEntity),
    );
    storyRepository = module.get<Repository<StoryEntity>>(
      getRepositoryToken(StoryEntity),
    );
    taskRepository = module.get<Repository<TaskEntity>>(
      getRepositoryToken(TaskEntity),
    );
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const user_id = randomUUID();
    const story_id = randomUUID();
    const createCommentDto: CreateCommentDto = {
      content: 'Test comment content',
      storyId: story_id,
    };

    const mockStory: StoryEntity = {
      id: story_id,
      title: 'Test Story',
      description: 'Test Description',
      acceptance_criteria: 'Test Criteria',
      priority: 'Medium',
      status: 'To Do',
      created_at: new Date(),
      updated_at: new Date(),
    } as StoryEntity;

    const mockUser: UserEntity = {
      id: user_id,
      email: 'test@example.com',
      full_name: 'Test User',
      password_hash: 'hash',
      roles: ['user'],
      created_at: new Date(),
      updated_at: new Date(),
    } as UserEntity;

    const mockComment: CommentEntity = {
      id: randomUUID(),
      content: createCommentDto.content,
      story_id: story_id,
      user_id: user_id,
      created_at: new Date(),
      updated_at: new Date(),
      story: mockStory,
      user: mockUser,
    } as CommentEntity;

    it('should create a comment successfully', async () => {
      mockStoryRepository.findOne.mockResolvedValue(mockStory);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);
      mockCommentRepository.findOne.mockResolvedValue({
        ...mockComment,
        user: mockUser,
      });

      const result = await service.create(createCommentDto, user_id);

      expect(result).toHaveProperty('id');
      expect(result.content).toBe(createCommentDto.content);
      expect(result.storyId).toBe(story_id);
      expect(result.userId).toBe(user_id);
      expect(mockStoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: story_id },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: user_id },
      });
    });

    it('should throw NotFoundException if story does not exist', async () => {
      mockStoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createCommentDto, user_id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockStoryRepository.findOne.mockResolvedValue(mockStory);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createCommentDto, user_id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    const story_id = randomUUID();
    const user_id = randomUUID();

    const mockComments: CommentEntity[] = [
      {
        id: randomUUID(),
        content: 'Comment 1',
        story_id: story_id,
        user_id: user_id,
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: user_id,
          email: 'user@example.com',
          full_name: 'User Name',
        } as UserEntity,
      } as CommentEntity,
    ];

    it('should return all comments when no storyId provided', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockComments),
      };
      mockCommentRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Comment 1');
    });

    it('should filter comments by storyId when provided', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockComments),
      };
      mockCommentRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll(story_id);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'comment.story_id = :storyId',
        { storyId: story_id },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    const comment_id = randomUUID();
    const user_id = randomUUID();

    const mockComment: CommentEntity = {
      id: comment_id,
      content: 'Test comment',
      story_id: randomUUID(),
      user_id: user_id,
      created_at: new Date(),
      updated_at: new Date(),
      user: {
        id: user_id,
        email: 'user@example.com',
        full_name: 'User Name',
      } as UserEntity,
    } as CommentEntity;

    it('should return a comment by id', async () => {
      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne(comment_id);

      expect(result).toHaveProperty('id', comment_id);
      expect(result.content).toBe('Test comment');
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(comment_id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const comment_id = randomUUID();
    const user_id = randomUUID();
    const updateCommentDto: UpdateCommentDto = {
      content: 'Updated comment content',
    };

    const mockComment: CommentEntity = {
      id: comment_id,
      content: 'Original content',
      story_id: randomUUID(),
      user_id: user_id,
      created_at: new Date(),
      updated_at: new Date(),
      user: {
        id: user_id,
        email: 'user@example.com',
        full_name: 'User Name',
      } as UserEntity,
    } as CommentEntity;

    it('should update a comment successfully', async () => {
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.save.mockResolvedValue({
        ...mockComment,
        content: updateCommentDto.content,
      });

      const result = await service.update(comment_id, updateCommentDto, user_id);

      expect(result.content).toBe(updateCommentDto.content);
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(comment_id, updateCommentDto, user_id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the comment owner', async () => {
      const different_user_id = randomUUID();
      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.update(comment_id, updateCommentDto, different_user_id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if trying to change storyId', async () => {
      const new_story_id = randomUUID();
      const updateWithStoryId: UpdateCommentDto = {
        content: 'Updated content',
        storyId: new_story_id,
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.update(comment_id, updateWithStoryId, user_id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if content is empty', async () => {
      const emptyContentDto: UpdateCommentDto = {
        content: '   ',
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.update(comment_id, emptyContentDto, user_id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const comment_id = randomUUID();
    const user_id = randomUUID();

    const mockComment: CommentEntity = {
      id: comment_id,
      content: 'Comment to delete',
      story_id: randomUUID(),
      user_id: user_id,
      created_at: new Date(),
      updated_at: new Date(),
    } as CommentEntity;

    it('should delete a comment successfully', async () => {
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(comment_id, user_id);

      expect(mockCommentRepository.delete).toHaveBeenCalledWith(comment_id);
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(comment_id, user_id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the comment owner', async () => {
      const different_user_id = randomUUID();
      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.remove(comment_id, different_user_id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});



