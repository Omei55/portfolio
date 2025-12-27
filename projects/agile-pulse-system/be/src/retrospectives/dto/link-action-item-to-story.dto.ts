import { IsUUID, IsNotEmpty } from 'class-validator';

export class LinkActionItemToStoryDto {
  @IsUUID()
  @IsNotEmpty()
  storyId: string;
}

