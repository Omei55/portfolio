import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  full_name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles: string[];

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
