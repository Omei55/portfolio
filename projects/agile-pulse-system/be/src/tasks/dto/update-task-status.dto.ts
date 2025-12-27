import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'])
  status: string;
}

