import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let auth_service: AuthService;

  const mock_auth_service = {
    register_user: jest.fn(),
    login_user: jest.fn(),
    list_users: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mock_auth_service,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    auth_service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const register_dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        roles: ['viewer'],
      };

      const expected_user = {
        id: 'user-id',
        email: register_dto.email,
        full_name: register_dto.full_name,
        roles: register_dto.roles,
      };

      mock_auth_service.register_user.mockResolvedValue(expected_user);

      const result = await controller.register(register_dto);

      expect(auth_service.register_user).toHaveBeenCalledWith(register_dto);
      expect(result).toEqual(expected_user);
    });

    it('should throw ConflictException when user already exists', async () => {
      const register_dto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        full_name: 'Existing User',
        roles: ['viewer'],
      };

      mock_auth_service.register_user.mockRejectedValue(
        new ConflictException('user_exists'),
      );

      await expect(controller.register(register_dto)).rejects.toThrow(
        ConflictException,
      );
      expect(auth_service.register_user).toHaveBeenCalledWith(register_dto);
    });
  });

  describe('login', () => {
    it('should login a user and return access token', async () => {
      const login_dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expected_response = {
        access_token: 'jwt-token',
        expires_in: '1h',
        user: {
          id: 'user-id',
          email: login_dto.email,
          full_name: 'Test User',
          roles: ['viewer'],
        },
      };

      mock_auth_service.login_user.mockResolvedValue(expected_response);

      const result = await controller.login(login_dto);

      expect(auth_service.login_user).toHaveBeenCalledWith(login_dto);
      expect(result).toEqual(expected_response);
      expect(result).toHaveProperty('access_token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const login_dto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mock_auth_service.login_user.mockRejectedValue(
        new UnauthorizedException('invalid_credentials'),
      );

      await expect(controller.login(login_dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(auth_service.login_user).toHaveBeenCalledWith(login_dto);
    });
  });

  describe('profile', () => {
    it('should return user profile from request', async () => {
      const mock_request = {
        user: {
          user_id: 'user-id',
          email: 'test@example.com',
          roles: ['viewer'],
        },
      };

      const result = await controller.profile(mock_request);

      expect(result).toEqual({
        user_id: mock_request.user.user_id,
        email: mock_request.user.email,
        roles: mock_request.user.roles,
      });
    });
  });

  describe('list_users', () => {
    it('should return list of users', async () => {
      const expected_users = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          full_name: 'User 1',
          roles: ['viewer'],
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          full_name: 'User 2',
          roles: ['admin'],
        },
      ];

      mock_auth_service.list_users.mockResolvedValue(expected_users);

      const result = await controller.list_users();

      expect(auth_service.list_users).toHaveBeenCalled();
      expect(result).toEqual(expected_users);
    });
  });
});
