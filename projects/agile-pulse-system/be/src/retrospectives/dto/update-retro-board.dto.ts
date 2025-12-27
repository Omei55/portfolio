import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateRetroBoardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sprintId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsDateString()
  @IsOptional()
  retroDate?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'completed', 'archived'])
  status?: string;
}

