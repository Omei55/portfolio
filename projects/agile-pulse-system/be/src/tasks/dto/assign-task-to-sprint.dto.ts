import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTaskToSprintDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  sprintId: string;
}

