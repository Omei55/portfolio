import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mock_reflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mock_reflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const create_mock_context = (user: any, handler?: any): ExecutionContext => {
    const mock_handler = handler || (() => {});
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: () => mock_handler,
      getClass: () => class TestClass {},
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      mock_reflector.getAllAndOverride.mockReturnValue(null);

      const context = create_mock_context({
        user_id: 'user-id',
        email: 'test@example.com',
        roles: ['viewer'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should return true when required roles array is empty', () => {
      mock_reflector.getAllAndOverride.mockReturnValue([]);

      const context = create_mock_context({
        user_id: 'user-id',
        email: 'test@example.com',
        roles: ['viewer'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      mock_reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = create_mock_context({
        user_id: 'user-id',
        email: 'test@example.com',
        roles: ['admin', 'viewer'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      mock_reflector.getAllAndOverride.mockReturnValue(['admin', 'editor']);

      const context = create_mock_context({
        user_id: 'user-id',
        email: 'test@example.com',
        roles: ['editor'],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has no roles', () => {
      mock_reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = create_mock_context({
        user_id: 'user-id',
        email: 'test@example.com',
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('roles_missing');
    });

    it('should throw ForbiddenException when user roles is not an array', () => {
      mock_reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = create_mock_context({
        user_id: 'user-id',
        email: 'test@example.com',
        roles: 'admin',
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('roles_missing');
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      mock_reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = create_mock_context({
        user_id: 'user-id',
        email: 'test@example.com',
        roles: ['viewer'],
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('insufficient_role');
    });

    it('should throw ForbiddenException when user is not present in request', () => {
      mock_reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = create_mock_context(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('roles_missing');
    });
  });
});
