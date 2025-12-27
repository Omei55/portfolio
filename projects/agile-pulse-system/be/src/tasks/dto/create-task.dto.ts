import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsDateString,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  priority?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  storyId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  sprintId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedHours?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

