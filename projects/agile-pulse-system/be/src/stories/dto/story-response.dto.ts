export class StoryResponseDto {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: string;
  storyPoints?: number;
  assignee?: string;
  status: string;
  sprint?: string;
  epic?: string;
  tags: string[];
  value?: number;
  effort?: number;
  hasTests: boolean;
  hasBlockers: boolean;
  createdAt: Date;
  updatedAt: Date;
}

