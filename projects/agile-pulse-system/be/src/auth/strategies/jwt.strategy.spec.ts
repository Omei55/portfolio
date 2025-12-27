import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { jwt_constants } from '../constants';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return user object with user_id, email, and roles', async () => {
      const payload = {
        sub: 'user-id-123',
        email: 'test@example.com',
        roles: ['admin', 'viewer'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        user_id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      });
    });

    it('should handle payload with single role', async () => {
      const payload = {
        sub: 'user-id-456',
        email: 'user@example.com',
        roles: ['viewer'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        user_id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      });
    });

    it('should handle payload with empty roles array', async () => {
      const payload = {
        sub: 'user-id-789',
        email: 'user2@example.com',
        roles: [],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        user_id: payload.sub,
        email: payload.email,
        roles: [],
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with correct JWT configuration', () => {
      const strategy_instance = new JwtStrategy();

      expect(strategy_instance).toBeDefined();
      expect(jwt_constants.secret).toBeDefined();
    });
  });
});
