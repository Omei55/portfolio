import { PartialType } from '@nestjs/mapped-types';
import { CreateStoryDto } from './create-story.dto';

export class UpdateStoryDto extends PartialType(CreateStoryDto) {
  title?: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: string;
  storyPoints?: number;
  assignee?: string;
  status?: string;
  sprint?: string;
  epic?: string;
  tags?: string[];
  value?: number;
  effort?: number;
}
