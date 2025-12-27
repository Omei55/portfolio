import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('/api/auth')
export class AuthController {
  constructor(private auth_service: AuthService) {}

  @Post('/register')
  async register(@Body() register_dto: RegisterDto) {
    return this.auth_service.register_user(register_dto);
  }

  @Post('/login')
  async login(@Body() login_dto: LoginDto) {
    return this.auth_service.login_user(login_dto);
  }

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Request() request: any) {
    return {
      user_id: request.user.user_id,
      email: request.user.email,
      roles: request.user.roles,
    };
  }

  @Get('/users')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async list_users() {
    return this.auth_service.list_users();
  }

  @Get('/users/for-assignment')
  @UseGuards(JwtAuthGuard)
  async list_users_for_assignment() {
    return this.auth_service.list_users();
  }
}
