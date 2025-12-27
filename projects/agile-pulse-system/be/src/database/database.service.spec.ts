import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { DatabaseService } from './database.service';
import { UserEntity } from '../auth/entities/user.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { randomUUID } from 'crypto';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let data_source: DataSource;
  let user_repository: Repository<UserEntity>;
  let story_repository: Repository<StoryEntity>;

  const mock_user_repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };

  const mock_story_repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };

  const mock_data_source = {
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DataSource,
          useValue: mock_data_source,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    data_source = module.get<DataSource>(DataSource);

    mock_data_source.getRepository.mockImplementation((entity) => {
      if (entity === UserEntity) {
        return mock_user_repository;
      }
      if (entity === StoryEntity) {
        return mock_story_repository;
      }
      return mock_user_repository;
    });

    user_repository = data_source.getRepository(UserEntity);
    story_repository = data_source.getRepository(StoryEntity);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create_one', () => {
    it('should create and save a new entity', async () => {
      const user_data = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        roles: ['viewer'],
      };

      const created_user = {
        id: randomUUID(),
        ...user_data,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mock_user_repository.create.mockReturnValue(created_user);
      mock_user_repository.save.mockResolvedValue(created_user);

      const result = await service.create_one(UserEntity, user_data);

      expect(data_source.getRepository).toHaveBeenCalledWith(UserEntity);
      expect(user_repository.create).toHaveBeenCalledWith(user_data);
      expect(user_repository.save).toHaveBeenCalledWith(created_user);
      expect(result).toEqual(created_user);
    });
  });

  describe('find', () => {
    it('should find all entities', async () => {
      const users: UserEntity[] = [
        {
          id: randomUUID(),
          email: 'user1@example.com',
          password_hash: 'hash1',
          full_name: 'User 1',
          roles: ['viewer'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: randomUUID(),
          email: 'user2@example.com',
          password_hash: 'hash2',
          full_name: 'User 2',
          roles: ['admin'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mock_user_repository.find.mockResolvedValue(users);

      const result = await service.find(UserEntity);

      expect(data_source.getRepository).toHaveBeenCalledWith(UserEntity);
      expect(user_repository.find).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(users);
    });

    it('should find entities with options', async () => {
      const options = {
        where: { email: 'admin@example.com' },
      };

      const users: UserEntity[] = [
        {
          id: randomUUID(),
          email: 'admin@example.com',
          password_hash: 'hash',
          full_name: 'Admin User',
          roles: ['admin'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mock_user_repository.find.mockResolvedValue(users);

      const result = await service.find(UserEntity, options);

      expect(user_repository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual(users);
    });
  });

  describe('find_one', () => {
    it('should find one entity by criteria', async () => {
      const user_id = randomUUID();
      const user: UserEntity = {
        id: user_id,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        roles: ['viewer'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const options = {
        where: { id: user_id },
      };

      mock_user_repository.findOne.mockResolvedValue(user);

      const result = await service.find_one(UserEntity, options);

      expect(data_source.getRepository).toHaveBeenCalledWith(UserEntity);
      expect(user_repository.findOne).toHaveBeenCalledWith(options);
      expect(result).toEqual(user);
    });

    it('should return null when entity not found', async () => {
      const options = {
        where: { id: randomUUID() },
      };

      mock_user_repository.findOne.mockResolvedValue(null);

      const result = await service.find_one(UserEntity, options);

      expect(result).toBeNull();
    });
  });

  describe('update_one', () => {
    it('should update an existing entity', async () => {
      const user_id = randomUUID();
      const existing_user: UserEntity = {
        id: user_id,
        email: 'test@example.com',
        password_hash: 'old_hash',
        full_name: 'Old Name',
        roles: ['viewer'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const update_data = {
        full_name: 'New Name',
      };

      const updated_user: UserEntity = {
        ...existing_user,
        ...update_data,
      };

      const criteria = {
        where: { id: user_id },
      };

      mock_user_repository.findOne.mockResolvedValue(existing_user);
      mock_user_repository.merge.mockReturnValue(updated_user);
      mock_user_repository.save.mockResolvedValue(updated_user);

      const result = await service.update_one(
        UserEntity,
        criteria as any,
        update_data,
      );

      expect(user_repository.findOne).toHaveBeenCalledWith(criteria);
      expect(user_repository.merge).toHaveBeenCalledWith(
        existing_user,
        update_data,
      );
      expect(user_repository.save).toHaveBeenCalledWith(updated_user);
      expect(result).toEqual(updated_user);
    });

    it('should return null when entity not found', async () => {
      const criteria = {
        where: { id: randomUUID() },
      };

      const update_data = {
        full_name: 'New Name',
      };

      mock_user_repository.findOne.mockResolvedValue(null);

      const result = await service.update_one(
        UserEntity,
        criteria as any,
        update_data,
      );

      expect(user_repository.findOne).toHaveBeenCalledWith(criteria);
      expect(user_repository.merge).not.toHaveBeenCalled();
      expect(user_repository.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('delete_one', () => {
    it('should delete an existing entity', async () => {
      const user_id = randomUUID();
      const user: UserEntity = {
        id: user_id,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        roles: ['viewer'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const criteria = {
        where: { id: user_id },
      };

      mock_user_repository.findOne.mockResolvedValue(user);
      mock_user_repository.remove.mockResolvedValue(user);

      await service.delete_one(UserEntity, criteria);

      expect(user_repository.findOne).toHaveBeenCalledWith(criteria);
      expect(user_repository.remove).toHaveBeenCalledWith(user);
    });

    it('should do nothing when entity not found', async () => {
      const criteria = {
        where: { id: randomUUID() },
      };

      mock_user_repository.findOne.mockResolvedValue(null);

      await service.delete_one(UserEntity, criteria);

      expect(user_repository.findOne).toHaveBeenCalledWith(criteria);
      expect(user_repository.remove).not.toHaveBeenCalled();
    });
  });
});
