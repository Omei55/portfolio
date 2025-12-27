import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create-comment.dto';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(5000)
  content?: string;

  // Note: storyId should not be updated, but we keep it optional for PartialType
  // In practice, storyId updates should be restricted in the service
}



