import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { DatabaseService } from '../database/database.service';
import { ProjectEntity } from './entities/project.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { randomUUID } from 'crypto';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let databaseService: DatabaseService;
  let usersRepository: Repository<UserEntity>;

  const mockDatabaseService = {
    find_one: jest.fn(),
    create_one: jest.fn(),
    find: jest.fn(),
    delete_one: jest.fn(),
  };

  const mockUsersRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    usersRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const createProjectDto: CreateProjectDto = {
      name: 'New Project',
      description: 'Project Description',
    };

    const userId = randomUUID();

    const mockProject: ProjectEntity = {
      id: randomUUID(),
      name: createProjectDto.name,
      description: createProjectDto.description,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    } as ProjectEntity;

    it('should create a project successfully', async () => {
      mockDatabaseService.create_one.mockResolvedValue(mockProject);

      const result = await service.createProject(createProjectDto, userId);

      expect(result).toMatchObject({
        id: mockProject.id,
        name: createProjectDto.name,
        description: createProjectDto.description,
        created_by: userId,
      });
      expect(mockDatabaseService.create_one).toHaveBeenCalledWith(
        ProjectEntity,
        {
          name: createProjectDto.name,
          description: createProjectDto.description,
          created_by: userId,
        },
      );
    });

    it('should create a project without description', async () => {
      const dtoWithoutDescription: CreateProjectDto = {
        name: 'Project Without Description',
      };

      const projectWithoutDescription: ProjectEntity = {
        id: randomUUID(),
        name: dtoWithoutDescription.name,
        description: null,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      } as ProjectEntity;

      mockDatabaseService.create_one.mockResolvedValue(projectWithoutDescription);

      const result = await service.createProject(
        dtoWithoutDescription,
        userId,
      );

      expect(result.name).toBe(dtoWithoutDescription.name);
      expect(result.description).toBeNull();
    });

    it('should create a project without userId', async () => {
      const projectWithoutUserId = {
        ...mockProject,
        created_by: null,
      };

      mockDatabaseService.create_one.mockResolvedValue(projectWithoutUserId);

      const result = await service.createProject(createProjectDto);

      expect(result.created_by).toBeNull();
    });
  });

  describe('getAllProjects', () => {
    const mockProjects: ProjectEntity[] = [
      {
        id: randomUUID(),
        name: 'Project 1',
        description: 'Description 1',
        created_by: randomUUID(),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      } as ProjectEntity,
      {
        id: randomUUID(),
        name: 'Project 2',
        description: 'Description 2',
        created_by: randomUUID(),
        created_at: new Date('2024-01-03'),
        updated_at: new Date('2024-01-04'),
      } as ProjectEntity,
    ];

    it('should return all projects', async () => {
      mockDatabaseService.find.mockResolvedValue(mockProjects);

      const result = await service.getAllProjects();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: mockProjects[0].id,
        name: mockProjects[0].name,
        description: mockProjects[0].description,
        created_by: mockProjects[0].created_by,
      });
      expect(mockDatabaseService.find).toHaveBeenCalledWith(ProjectEntity, {
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array when no projects exist', async () => {
      mockDatabaseService.find.mockResolvedValue([]);

      const result = await service.getAllProjects();

      expect(result).toEqual([]);
    });
  });

  describe('addMember', () => {
    const projectId = randomUUID();
    const userId = randomUUID();
    const addMemberDto: AddMemberDto = {
      user_id: userId,
    };

    const mockProject: ProjectEntity = {
      id: projectId,
      name: 'Test Project',
      description: 'Test Description',
      created_at: new Date(),
      updated_at: new Date(),
    } as ProjectEntity;

    const mockUser: UserEntity = {
      id: userId,
      email: 'user@example.com',
      full_name: 'Test User',
      roles: ['user'],
      created_at: new Date(),
      updated_at: new Date(),
    } as UserEntity;

    const mockProjectMember: ProjectMemberEntity = {
      id: randomUUID(),
      project_id: projectId,
      user_id: userId,
      joined_at: new Date(),
    } as ProjectMemberEntity;

    it('should add a member to a project successfully', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(mockProject);
        }
        if (entity === UserEntity) {
          return Promise.resolve(mockUser);
        }
        if (entity === ProjectMemberEntity) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });
      mockDatabaseService.create_one.mockResolvedValue(mockProjectMember);

      const result = await service.addMember(projectId, addMemberDto);

      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe(userId);
      expect(result.project_id).toBe(projectId);
      expect(result.message).toBe('Member added successfully');
      expect(mockDatabaseService.find_one).toHaveBeenCalledTimes(3);
      expect(mockDatabaseService.create_one).toHaveBeenCalledWith(
        ProjectMemberEntity,
        {
          project_id: projectId,
          user_id: userId,
        },
      );
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await expect(service.addMember(projectId, addMemberDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addMember(projectId, addMemberDto)).rejects.toThrow(
        'Project not found',
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(mockProject);
        }
        if (entity === UserEntity) {
          return Promise.resolve(null);
        }
        if (entity === ProjectMemberEntity) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await expect(service.addMember(projectId, addMemberDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addMember(projectId, addMemberDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw ConflictException if user is already a member', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(mockProject);
        }
        if (entity === UserEntity) {
          return Promise.resolve(mockUser);
        }
        if (entity === ProjectMemberEntity) {
          return Promise.resolve(mockProjectMember);
        }
        return Promise.resolve(null);
      });

      await expect(service.addMember(projectId, addMemberDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.addMember(projectId, addMemberDto)).rejects.toThrow(
        'User is already a member of this project',
      );
    });
  });

  describe('removeMember', () => {
    const projectId = randomUUID();
    const userId = randomUUID();

    const mockProject: ProjectEntity = {
      id: projectId,
      name: 'Test Project',
      created_at: new Date(),
      updated_at: new Date(),
    } as ProjectEntity;

    const mockUser: UserEntity = {
      id: userId,
      email: 'user@example.com',
      full_name: 'Test User',
      created_at: new Date(),
      updated_at: new Date(),
    } as UserEntity;

    const mockMembership: ProjectMemberEntity = {
      id: randomUUID(),
      project_id: projectId,
      user_id: userId,
      joined_at: new Date(),
    } as ProjectMemberEntity;

    it('should remove a member from a project successfully', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(mockProject);
        }
        if (entity === UserEntity) {
          return Promise.resolve(mockUser);
        }
        if (entity === ProjectMemberEntity) {
          return Promise.resolve(mockMembership);
        }
        return Promise.resolve(null);
      });
      mockDatabaseService.delete_one.mockResolvedValue(undefined);

      const result = await service.removeMember(projectId, userId);

      expect(result.message).toBe('Member removed successfully');
      expect(result.user_id).toBe(userId);
      expect(result.project_id).toBe(projectId);
      expect(mockDatabaseService.delete_one).toHaveBeenCalledWith(
        ProjectMemberEntity,
        {
          where: {
            project_id: projectId,
            user_id: userId,
          },
        },
      );
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await expect(service.removeMember(projectId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeMember(projectId, userId)).rejects.toThrow(
        'Project not found',
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(mockProject);
        }
        if (entity === UserEntity) {
          return Promise.resolve(null);
        }
        if (entity === ProjectMemberEntity) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await expect(service.removeMember(projectId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeMember(projectId, userId)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw NotFoundException if user is not a member', async () => {
      mockDatabaseService.find_one.mockImplementation((entity, options) => {
        if (entity === ProjectEntity) {
          return Promise.resolve(mockProject);
        }
        if (entity === UserEntity) {
          return Promise.resolve(mockUser);
        }
        if (entity === ProjectMemberEntity) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await expect(service.removeMember(projectId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeMember(projectId, userId)).rejects.toThrow(
        'User is not a member of this project',
      );
    });
  });

  describe('getProjectMembers', () => {
    const projectId = randomUUID();
    const userId = randomUUID();

    const mockProject: ProjectEntity = {
      id: projectId,
      name: 'Test Project',
      created_at: new Date(),
      updated_at: new Date(),
    } as ProjectEntity;

    const mockUser: UserEntity = {
      id: userId,
      email: 'user@example.com',
      full_name: 'Test User',
      roles: ['user'],
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    } as UserEntity;

    const mockMembers: ProjectMemberEntity[] = [
      {
        id: randomUUID(),
        project_id: projectId,
        user_id: userId,
        joined_at: new Date(),
        user: mockUser,
      } as ProjectMemberEntity,
    ];

    it('should return all project members with user details', async () => {
      mockDatabaseService.find_one.mockResolvedValue(mockProject);
      mockDatabaseService.find.mockResolvedValue(mockMembers);

      const result = await service.getProjectMembers(projectId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe(userId);
      expect(result[0].project_id).toBe(projectId);
      expect(result[0].user).toMatchObject({
        id: userId,
        email: mockUser.email,
        full_name: mockUser.full_name,
        roles: mockUser.roles,
      });
      expect(mockDatabaseService.find).toHaveBeenCalledWith(
        ProjectMemberEntity,
        {
          where: { project_id: projectId },
          relations: ['user'],
        },
      );
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockDatabaseService.find_one.mockResolvedValue(null);

      await expect(service.getProjectMembers(projectId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProjectMembers(projectId)).rejects.toThrow(
        'Project not found',
      );
    });

    it('should return empty array when project has no members', async () => {
      mockDatabaseService.find_one.mockResolvedValue(mockProject);
      mockDatabaseService.find.mockResolvedValue([]);

      const result = await service.getProjectMembers(projectId);

      expect(result).toEqual([]);
    });
  });

  describe('searchUsers', () => {
    const mockUsers: UserEntity[] = [
      {
        id: randomUUID(),
        email: 'user1@example.com',
        full_name: 'User One',
        roles: ['user'],
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as UserEntity,
      {
        id: randomUUID(),
        email: 'user2@example.com',
        full_name: 'User Two',
        roles: ['admin'],
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as UserEntity,
    ];

    it('should return all users when query is empty', async () => {
      mockUsersRepository.find.mockResolvedValue(mockUsers);

      const result = await service.searchUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: mockUsers[0].id,
        email: mockUsers[0].email,
        full_name: mockUsers[0].full_name,
        roles: mockUsers[0].roles,
      });
      expect(mockUsersRepository.find).toHaveBeenCalled();
    });

    it('should return all users when query is only whitespace', async () => {
      mockUsersRepository.find.mockResolvedValue(mockUsers);

      const result = await service.searchUsers('   ');

      expect(result).toHaveLength(2);
      expect(mockUsersRepository.find).toHaveBeenCalled();
    });

    it('should search users by email or name', async () => {
      const query = 'user1';
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUsers[0]]),
      };
      mockUsersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchUsers(query);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe(mockUsers[0].email);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user.email ILIKE :search OR user.full_name ILIKE :search',
        { search: `%${query}%` },
      );
    });

    it('should handle empty search results', async () => {
      const query = 'nonexistent';
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockUsersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchUsers(query);

      expect(result).toEqual([]);
    });
  });

  describe('searchUsersNotInProject', () => {
    const projectId = randomUUID();
    const userId1 = randomUUID();
    const userId2 = randomUUID();
    const userId3 = randomUUID();

    const mockProject: ProjectEntity = {
      id: projectId,
      name: 'Test Project',
      created_at: new Date(),
      updated_at: new Date(),
    } as ProjectEntity;

    const mockProjectMembers: ProjectMemberEntity[] = [
      {
        id: randomUUID(),
        project_id: projectId,
        user_id: userId1,
        joined_at: new Date(),
      } as ProjectMemberEntity,
    ];

    const mockAllUsers: UserEntity[] = [
      {
        id: userId1,
        email: 'member@example.com',
        full_name: 'Member User',
        roles: ['user'],
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as UserEntity,
      {
        id: userId2,
        email: 'available1@example.com',
        full_name: 'Available User 1',
        roles: ['user'],
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as UserEntity,
      {
        id: userId3,
        email: 'available2@example.com',
        full_name: 'Available User 2',
        roles: ['admin'],
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as UserEntity,
    ];

    it('should return users not in project when no query provided', async () => {
      mockDatabaseService.find_one.mockResolvedValue(mockProject);
      mockDatabaseService.find.mockResolvedValue(mockProjectMembers);

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAllUsers),
      };
      mockUsersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchUsersNotInProject(projectId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(userId2);
      expect(result[1].id).toBe(userId3);
      expect(result.every((u) => u.id !== userId1)).toBe(true);
    });

    it('should filter users by query and exclude project members', async () => {
      const query = 'available';
      mockDatabaseService.find_one.mockResolvedValue(mockProject);
      mockDatabaseService.find.mockResolvedValue(mockProjectMembers);

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          mockAllUsers[1],
          mockAllUsers[2],
        ]),
      };
      mockUsersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchUsersNotInProject(projectId, query);

      expect(result).toHaveLength(2);
      expect(result.every((u) => u.email.includes('available'))).toBe(true);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user.email ILIKE :search OR user.full_name ILIKE :search',
        { search: `%${query}%` },
      );
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockDatabaseService.find_one.mockResolvedValue(null);

      await expect(
        service.searchUsersNotInProject(projectId, 'query'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.searchUsersNotInProject(projectId, 'query'),
      ).rejects.toThrow('Project not found');
    });

    it('should handle empty query string', async () => {
      mockDatabaseService.find_one.mockResolvedValue(mockProject);
      mockDatabaseService.find.mockResolvedValue(mockProjectMembers);

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAllUsers),
      };
      mockUsersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchUsersNotInProject(projectId, '');

      expect(result).toHaveLength(2);
      expect(queryBuilder.where).not.toHaveBeenCalled();
    });
  });
});


