import { IsString, IsOptional, IsUUID, IsDateString, IsIn } from 'class-validator';

export class UpdateActionItemDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  storyId?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  priority?: string;
}

