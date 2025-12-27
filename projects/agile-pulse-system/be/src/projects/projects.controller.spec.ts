import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { randomUUID } from 'crypto';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProjectsService = {
    createProject: jest.fn(),
    getAllProjects: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    getProjectMembers: jest.fn(),
    searchUsers: jest.fn(),
    searchUsersNotInProject: jest.fn(),
  };

  const mockDatabaseService = {
    find_one: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ProjectMemberGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
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
    const mockRequest = {
      user: {
        user_id: userId,
        email: 'user@example.com',
        roles: ['user'],
      },
    };

    const mockResponse = {
      id: randomUUID(),
      name: createProjectDto.name,
      description: createProjectDto.description,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create a project with user_id from request', async () => {
      mockProjectsService.createProject.mockResolvedValue(mockResponse);

      const result = await controller.createProject(
        createProjectDto,
        mockRequest,
      );

      expect(service.createProject).toHaveBeenCalledWith(
        createProjectDto,
        userId,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle request with user.sub', async () => {
      const requestWithSub = {
        user: {
          sub: userId,
          email: 'user@example.com',
        },
      };

      mockProjectsService.createProject.mockResolvedValue(mockResponse);

      const result = await controller.createProject(
        createProjectDto,
        requestWithSub,
      );

      expect(service.createProject).toHaveBeenCalledWith(
        createProjectDto,
        userId,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle request with user.id', async () => {
      const requestWithId = {
        user: {
          id: userId,
          email: 'user@example.com',
        },
      };

      mockProjectsService.createProject.mockResolvedValue(mockResponse);

      const result = await controller.createProject(
        createProjectDto,
        requestWithId,
      );

      expect(service.createProject).toHaveBeenCalledWith(
        createProjectDto,
        userId,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle request without user', async () => {
      const requestWithoutUser = {};

      mockProjectsService.createProject.mockResolvedValue({
        ...mockResponse,
        created_by: null,
      });

      const result = await controller.createProject(
        createProjectDto,
        requestWithoutUser,
      );

      expect(service.createProject).toHaveBeenCalledWith(
        createProjectDto,
        undefined,
      );
      expect(result.created_by).toBeNull();
    });
  });

  describe('getAllProjects', () => {
    const mockProjects = [
      {
        id: randomUUID(),
        name: 'Project 1',
        description: 'Description 1',
        created_by: randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Project 2',
        description: 'Description 2',
        created_by: randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    it('should return all projects', async () => {
      mockProjectsService.getAllProjects.mockResolvedValue(mockProjects);

      const result = await controller.getAllProjects();

      expect(service.getAllProjects).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });
  });

  describe('searchUsers', () => {
    const searchUsersDto: SearchUsersDto = {
      query: 'test',
    };

    const mockUsers = [
      {
        id: randomUUID(),
        email: 'test@example.com',
        full_name: 'Test User',
        roles: ['user'],
        avatar_url: null,
      },
    ];

    it('should search users with query', async () => {
      mockProjectsService.searchUsers.mockResolvedValue(mockUsers);

      const result = await controller.searchUsers(searchUsersDto);

      expect(service.searchUsers).toHaveBeenCalledWith(searchUsersDto.query);
      expect(result).toEqual(mockUsers);
    });

    it('should search users without query', async () => {
      const emptySearchDto: SearchUsersDto = {};
      mockProjectsService.searchUsers.mockResolvedValue(mockUsers);

      const result = await controller.searchUsers(emptySearchDto);

      expect(service.searchUsers).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('addMember', () => {
    const projectId = randomUUID();
    const addMemberDto: AddMemberDto = {
      user_id: randomUUID(),
    };

    const mockResponse = {
      id: randomUUID(),
      user_id: addMemberDto.user_id,
      project_id: projectId,
      joined_at: new Date(),
      message: 'Member added successfully',
    };

    it('should add a member to a project', async () => {
      mockProjectsService.addMember.mockResolvedValue(mockResponse);

      const result = await controller.addMember(projectId, addMemberDto);

      expect(service.addMember).toHaveBeenCalledWith(projectId, addMemberDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('removeMember', () => {
    const projectId = randomUUID();
    const userId = randomUUID();

    const mockResponse = {
      message: 'Member removed successfully',
      user_id: userId,
      project_id: projectId,
    };

    it('should remove a member from a project', async () => {
      mockProjectsService.removeMember.mockResolvedValue(mockResponse);

      const result = await controller.removeMember(projectId, userId);

      expect(service.removeMember).toHaveBeenCalledWith(projectId, userId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProjectMembers', () => {
    const projectId = randomUUID();

    const mockMembers = [
      {
        id: randomUUID(),
        user_id: randomUUID(),
        project_id: projectId,
        joined_at: new Date(),
        user: {
          id: randomUUID(),
          email: 'member@example.com',
          full_name: 'Member User',
          roles: ['user'],
          avatar_url: null,
        },
      },
    ];

    it('should return all project members', async () => {
      mockProjectsService.getProjectMembers.mockResolvedValue(mockMembers);

      const result = await controller.getProjectMembers(projectId);

      expect(service.getProjectMembers).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(mockMembers);
    });
  });

  describe('searchUsersNotInProject', () => {
    const projectId = randomUUID();
    const searchUsersDto: SearchUsersDto = {
      query: 'available',
    };

    const mockUsers = [
      {
        id: randomUUID(),
        email: 'available@example.com',
        full_name: 'Available User',
        roles: ['user'],
        avatar_url: null,
      },
    ];

    it('should search users not in project with query', async () => {
      mockProjectsService.searchUsersNotInProject.mockResolvedValue(mockUsers);

      const result = await controller.searchUsersNotInProject(
        projectId,
        searchUsersDto,
      );

      expect(service.searchUsersNotInProject).toHaveBeenCalledWith(
        projectId,
        searchUsersDto.query,
      );
      expect(result).toEqual(mockUsers);
    });

    it('should search users not in project without query', async () => {
      const emptySearchDto: SearchUsersDto = {};
      mockProjectsService.searchUsersNotInProject.mockResolvedValue(mockUsers);

      const result = await controller.searchUsersNotInProject(
        projectId,
        emptySearchDto,
      );

      expect(service.searchUsersNotInProject).toHaveBeenCalledWith(
        projectId,
        undefined,
      );
      expect(result).toEqual(mockUsers);
    });
  });
});


