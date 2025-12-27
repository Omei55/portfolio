import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min, Max, IsIn, IsBoolean } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  acceptanceCriteria: string;

  @IsString()
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  priority?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  storyPoints?: number;

  @IsString()
  @IsOptional()
  assignee?: string;

  @IsString()
  @IsOptional()
  @IsIn(['To Do', 'In Progress', 'In Review', 'Done'])
  status?: string;

  @IsString()
  @IsOptional()
  sprint?: string;

  @IsString()
  @IsOptional()
  epic?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  value?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  effort?: number;

  @IsBoolean()
  @IsOptional()
  hasTests?: boolean;

  @IsBoolean()
  @IsOptional()
  hasBlockers?: boolean;
}

