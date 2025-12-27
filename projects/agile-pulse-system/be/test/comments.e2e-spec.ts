import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from '../src/comments/entities/comment.entity';
import { StoryEntity } from '../src/stories/entities/story.entity';
import { UserEntity } from '../src/auth/entities/user.entity';
import { AuthService } from '../src/auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

describe('CommentsController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let commentRepository: Repository<CommentEntity>;
  let storyRepository: Repository<StoryEntity>;
  let userRepository: Repository<UserEntity>;

  let testUser: UserEntity;
  let testStory: StoryEntity;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    commentRepository = moduleFixture.get<Repository<CommentEntity>>(
      getRepositoryToken(CommentEntity),
    );
    storyRepository = moduleFixture.get<Repository<StoryEntity>>(
      getRepositoryToken(StoryEntity),
    );
    userRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  beforeEach(async () => {
    // Clean up
    await commentRepository.delete({});
    await storyRepository.delete({});
    await userRepository.delete({});

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10);
    testUser = userRepository.create({
      email: `test-${randomUUID()}@example.com`,
      password_hash: passwordHash,
      full_name: 'Test User',
      roles: ['user'],
    });
    testUser = await userRepository.save(testUser);

    // Login to get auth token
    const loginResponse = await authService.login_user({
      email: testUser.email,
      password: 'password123',
    });
    authToken = loginResponse.access_token;

    // Create test story
    testStory = storyRepository.create({
      title: 'Test Story',
      description: 'Test Description',
      acceptance_criteria: 'Test Criteria',
      priority: 'Medium',
      status: 'To Do',
    });
    testStory = await storyRepository.save(testStory);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/comments (POST)', () => {
    it('should create a comment successfully', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment',
          storyId: testStory.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('This is a test comment');
          expect(res.body.storyId).toBe(testStory.id);
          expect(res.body.userId).toBe(testUser.id);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .send({
          content: 'This is a test comment',
          storyId: testStory.id,
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '', // Empty content
          storyId: testStory.id,
        })
        .expect(400);
    });

    it('should return 404 if story does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment',
          storyId: randomUUID(),
        })
        .expect(404);
    });
  });

  describe('/api/comments (GET)', () => {
    it('should return all comments', async () => {
      // Create a comment first
      const comment = commentRepository.create({
        content: 'Test comment',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      await commentRepository.save(comment);

      return request(app.getHttpServer())
        .get('/api/comments')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          const foundComment = res.body.find((c: any) => c.id === comment.id);
          expect(foundComment).toBeDefined();
          expect(foundComment.content).toBe('Test comment');
        });
    });

    it('should filter comments by storyId', async () => {
      // Create comments for different stories
      const anotherStory = storyRepository.create({
        title: 'Another Story',
        description: 'Description',
        acceptance_criteria: 'Criteria',
        priority: 'Medium',
        status: 'To Do',
      });
      await storyRepository.save(anotherStory);

      const comment1 = commentRepository.create({
        content: 'Comment for story 1',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      await commentRepository.save(comment1);

      const comment2 = commentRepository.create({
        content: 'Comment for story 2',
        story_id: anotherStory.id,
        user_id: testUser.id,
      });
      await commentRepository.save(comment2);

      return request(app.getHttpServer())
        .get(`/api/comments?storyId=${testStory.id}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((comment: any) => {
            expect(comment.storyId).toBe(testStory.id);
          });
          const foundComment = res.body.find((c: any) => c.id === comment1.id);
          expect(foundComment).toBeDefined();
        });
    });
  });

  describe('/api/comments/:id (GET)', () => {
    it('should return a comment by id', async () => {
      const comment = commentRepository.create({
        content: 'Test comment',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .get(`/api/comments/${savedComment.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(savedComment.id);
          expect(res.body.content).toBe('Test comment');
          expect(res.body.storyId).toBe(testStory.id);
        });
    });

    it('should return 404 if comment does not exist', () => {
      return request(app.getHttpServer())
        .get(`/api/comments/${randomUUID()}`)
        .expect(404);
    });
  });

  describe('/api/comments/:id (PATCH)', () => {
    it('should update a comment successfully', async () => {
      const comment = commentRepository.create({
        content: 'Original comment',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .patch(`/api/comments/${savedComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated comment',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toBe('Updated comment');
          expect(res.body.id).toBe(savedComment.id);
        });
    });

    it('should return 401 without authentication', async () => {
      const comment = commentRepository.create({
        content: 'Original comment',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .patch(`/api/comments/${savedComment.id}`)
        .send({
          content: 'Updated comment',
        })
        .expect(401);
    });

    it('should return 403 if user is not the comment owner', async () => {
      // Create another user
      const passwordHash = await bcrypt.hash('password123', 10);
      const otherUser = userRepository.create({
        email: `other-${randomUUID()}@example.com`,
        password_hash: passwordHash,
        full_name: 'Other User',
        roles: ['user'],
      });
      await userRepository.save(otherUser);

      // Create comment by other user
      const comment = commentRepository.create({
        content: 'Original comment',
        story_id: testStory.id,
        user_id: otherUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .patch(`/api/comments/${savedComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated comment',
        })
        .expect(403);
    });

    it('should return 400 with empty content', async () => {
      const comment = commentRepository.create({
        content: 'Original comment',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .patch(`/api/comments/${savedComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '   ',
        })
        .expect(400);
    });
  });

  describe('/api/comments/:id (DELETE)', () => {
    it('should delete a comment successfully', async () => {
      const comment = commentRepository.create({
        content: 'Comment to delete',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .delete(`/api/comments/${savedComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 401 without authentication', async () => {
      const comment = commentRepository.create({
        content: 'Comment to delete',
        story_id: testStory.id,
        user_id: testUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .delete(`/api/comments/${savedComment.id}`)
        .expect(401);
    });

    it('should return 403 if user is not the comment owner', async () => {
      // Create another user
      const passwordHash = await bcrypt.hash('password123', 10);
      const otherUser = userRepository.create({
        email: `other-${randomUUID()}@example.com`,
        password_hash: passwordHash,
        full_name: 'Other User',
        roles: ['user'],
      });
      await userRepository.save(otherUser);

      // Create comment by other user
      const comment = commentRepository.create({
        content: 'Comment to delete',
        story_id: testStory.id,
        user_id: otherUser.id,
      });
      const savedComment = await commentRepository.save(comment);

      return request(app.getHttpServer())
        .delete(`/api/comments/${savedComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 if comment does not exist', () => {
      return request(app.getHttpServer())
        .delete(`/api/comments/${randomUUID()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});



