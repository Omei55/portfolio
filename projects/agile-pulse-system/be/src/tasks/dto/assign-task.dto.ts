import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AssignTaskDto {
  @IsString()
  @IsNotEmpty()
  assigneeId: string;

  @IsString()
  @IsOptional()
  note?: string;
}

