import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsIn,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterQueryDto {
  // Priority filter - can filter by single value or array
  @IsOptional()
  @IsString()
  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  priority?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['Low', 'Medium', 'High', 'Critical'], { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((p: string) => p.trim());
    }
    return value;
  })
  priorities?: string[];

  // Status filter - can filter by single value or array
  @IsOptional()
  @IsString()
  @IsIn(['To Do', 'In Progress', 'In Review', 'Done'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['To Do', 'In Progress', 'In Review', 'Done'], { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s: string) => s.trim());
    }
    return value;
  })
  statuses?: string[];

  // Story points range filter
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  storyPointsMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  storyPointsMax?: number;

  // Sprint filter
  @IsOptional()
  @IsString()
  sprint?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s: string) => s.trim());
    }
    return value;
  })
  sprints?: string[];

  // Epic filter
  @IsOptional()
  @IsString()
  epic?: string;

  // Assignee filter
  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((a: string) => a.trim());
    }
    return value;
  })
  assignees?: string[];

  // Tags filter - can filter by any of the provided tags
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((t: string) => t.trim());
    }
    return value;
  })
  tags?: string[];

  // Value range filter
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  valueMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  valueMax?: number;

  // Effort range filter
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  effortMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  effortMax?: number;

  // Search query - searches in title and description
  @IsOptional()
  @IsString()
  search?: string;

  // Sorting
  @IsOptional()
  @IsString()
  @IsIn([
    'title',
    'priority',
    'status',
    'storyPoints',
    'createdAt',
    'updatedAt',
    'assignee',
    'sprint',
  ])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';

  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

