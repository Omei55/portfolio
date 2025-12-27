import { IsString, IsNotEmpty, IsUUID, MaxLength, IsOptional, ValidateIf } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsUUID()
  @IsOptional()
  storyId?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  // Ensure at least one of storyId or taskId is provided
  @ValidateIf((o) => !o.storyId && !o.taskId)
  @IsNotEmpty({ message: 'Either storyId or taskId must be provided' })
  _validateStoryOrTask?: never;
}



