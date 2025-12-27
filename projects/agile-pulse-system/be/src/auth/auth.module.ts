import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwt_constants } from './constants';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwt_constants.secret,
      signOptions: { expiresIn: jwt_constants.expires_in },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
