import { IsString, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateRetroItemDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  votes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}

