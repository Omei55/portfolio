import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { randomUUID } from 'crypto';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockCommentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const user_id = randomUUID();
    const story_id = randomUUID();
    const createCommentDto: CreateCommentDto = {
      content: 'Test comment',
      storyId: story_id,
    };

    const mockUser = {
      user_id: user_id,
      email: 'test@example.com',
      roles: ['user'],
    };

    const mockResponse = {
      id: randomUUID(),
      content: createCommentDto.content,
      storyId: story_id,
      userId: user_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a comment', async () => {
      mockCommentsService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createCommentDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createCommentDto, user_id);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    const story_id = randomUUID();
    const mockComments = [
      {
        id: randomUUID(),
        content: 'Comment 1',
        storyId: story_id,
        userId: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all comments when no storyId provided', async () => {
      mockCommentsService.findAll.mockResolvedValue(mockComments);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(mockComments);
    });

    it('should filter comments by storyId when provided', async () => {
      mockCommentsService.findAll.mockResolvedValue(mockComments);

      const result = await controller.findAll(story_id);

      expect(service.findAll).toHaveBeenCalledWith(story_id, undefined);
      expect(result).toEqual(mockComments);
    });
  });

  describe('findOne', () => {
    const comment_id = randomUUID();
    const mockComment = {
      id: comment_id,
      content: 'Test comment',
      storyId: randomUUID(),
      userId: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return a comment by id', async () => {
      mockCommentsService.findOne.mockResolvedValue(mockComment);

      const result = await controller.findOne(comment_id);

      expect(service.findOne).toHaveBeenCalledWith(comment_id);
      expect(result).toEqual(mockComment);
    });
  });

  describe('update', () => {
    const comment_id = randomUUID();
    const user_id = randomUUID();
    const updateCommentDto: UpdateCommentDto = {
      content: 'Updated comment',
    };

    const mockUser = {
      user_id: user_id,
      email: 'test@example.com',
      roles: ['user'],
    };

    const mockResponse = {
      id: comment_id,
      content: updateCommentDto.content,
      storyId: randomUUID(),
      userId: user_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update a comment', async () => {
      mockCommentsService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(comment_id, updateCommentDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(
        comment_id,
        updateCommentDto,
        user_id,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    const comment_id = randomUUID();
    const user_id = randomUUID();

    const mockUser = {
      user_id: user_id,
      email: 'test@example.com',
      roles: ['user'],
    };

    it('should delete a comment', async () => {
      mockCommentsService.remove.mockResolvedValue(undefined);

      await controller.remove(comment_id, mockUser);

      expect(service.remove).toHaveBeenCalledWith(comment_id, user_id);
    });
  });
});



