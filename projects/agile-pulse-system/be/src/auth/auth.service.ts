import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DatabaseService } from '../database/database.service';
import { UserEntity } from './entities/user.entity';
import { AuthUser } from './interfaces/user.interface';
import { ConflictException as CustomConflictException } from '../common/errors/exceptions/conflict.exception';
import { UnauthorizedException as CustomUnauthorizedException } from '../common/errors/exceptions/unauthorized.exception';
import { ErrorCode } from '../common/errors/error-codes.enum';

@Injectable()
export class AuthService {
  constructor(
    private jwt_service: JwtService,
    private database_service: DatabaseService,
  ) {}

  async register_user(register_dto: RegisterDto) {
    const existing_user = await this.database_service.find_one(UserEntity, {
      where: { email: register_dto.email },
    });
    if (existing_user) {
      throw new CustomConflictException(
        `User with email '${register_dto.email}' already exists`,
        ErrorCode.USER_ALREADY_EXISTS,
      );
    }

    const password_hash = await bcrypt.hash(register_dto.password, 10);

    const new_user = (await this.database_service.create_one(UserEntity, {
      email: register_dto.email,
      password_hash,
      full_name: register_dto.full_name,
      roles: register_dto.roles,
      avatar_url: register_dto.avatar_url,
    })) as UserEntity;

    return this.build_safe_user(new_user);
  }

  async login_user(login_dto: LoginDto) {
    const user = await this.validate_user(login_dto.email, login_dto.password);

    const payload = { sub: user.id, email: user.email, roles: user.roles };
    const access_token = await this.jwt_service.signAsync(payload);

    return {
      access_token,
      expires_in: '1h',
      user: this.build_safe_user(user),
    };
  }

  async validate_user(email: string, password: string): Promise<UserEntity> {
    const user = (await this.database_service.find_one(UserEntity, {
      where: { email },
    })) as UserEntity | null;
    if (!user) {
      throw new CustomUnauthorizedException(
        'Invalid email or password',
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    const password_valid = await bcrypt.compare(password, user.password_hash);
    if (!password_valid) {
      throw new CustomUnauthorizedException(
        'Invalid email or password',
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    return user;
  }

  build_safe_user(user: UserEntity): AuthUser {
    const { password_hash, ...safe_user } = user;
    return safe_user;
  }

  async list_users() {
    const users = (await this.database_service.find(
      UserEntity,
    )) as UserEntity[];
    return users.map((user) => this.build_safe_user(user));
  }
}
