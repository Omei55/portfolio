import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { AuthService } from './auth.service';
import { jwt_constants } from './constants';
import { RegisterDto } from './dto/register.dto';
import { DatabaseService } from '../database/database.service';
import { UserEntity } from './entities/user.entity';

describe('AuthService', () => {
  let auth_service: AuthService;
  let database_service: DatabaseService;
  let records: UserEntity[];

  beforeEach(async () => {
    records = [];

    const database_service_mock: Partial<
      Record<keyof DatabaseService, jest.Mock>
    > = {
      create_one: jest.fn(async (_entity, data) => {
        const now = new Date();
        const record = {
          id: randomUUID(),
          email: data.email,
          password_hash: data.password_hash,
          full_name: data.full_name,
          roles: data.roles,
          avatar_url: data.avatar_url,
          created_at: now,
          updated_at: now,
        } as UserEntity;
        records.push(record);
        return record;
      }),
      find_one: jest.fn(async (_entity, options) => {
        const where = (options.where || {}) as Record<string, unknown>;
        const email = where.email as string | undefined;
        const id = where.id as string | undefined;
        if (email) {
          return records.find((record) => record.email === email) ?? null;
        }
        if (id) {
          return records.find((record) => record.id === id) ?? null;
        }
        return null;
      }),
      find: jest.fn(async () => records),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: jwt_constants.secret,
          signOptions: { expiresIn: jwt_constants.expires_in },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: database_service_mock,
        },
      ],
    }).compile();

    auth_service = module.get<AuthService>(AuthService);
    database_service = module.get<DatabaseService>(DatabaseService);
  });

  it('registers a new user', async () => {
    const register_dto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      full_name: 'Test User',
      roles: ['admin'],
    };

    const user = await auth_service.register_user(register_dto);

    expect(user).toHaveProperty('id');
    expect(user).toMatchObject({
      email: register_dto.email,
      full_name: register_dto.full_name,
      roles: ['admin'],
    });
  });

  it('rejects duplicate user registration', async () => {
    const register_dto: RegisterDto = {
      email: 'duplicate@example.com',
      password: 'password123',
      full_name: 'Duplicate User',
      roles: ['viewer'],
    };

    await auth_service.register_user(register_dto);

    await expect(auth_service.register_user(register_dto)).rejects.toThrow();
    expect(database_service.create_one).toHaveBeenCalledTimes(1);
  });

  it('issues a token on successful login', async () => {
    const register_dto: RegisterDto = {
      email: 'login@example.com',
      password: 'password123',
      full_name: 'Login User',
      roles: ['viewer'],
    };

    await auth_service.register_user(register_dto);

    const login_response = await auth_service.login_user({
      email: register_dto.email,
      password: register_dto.password,
    });

    expect(login_response).toHaveProperty('access_token');
    expect(login_response.user.email).toBe(register_dto.email);
  });
});
