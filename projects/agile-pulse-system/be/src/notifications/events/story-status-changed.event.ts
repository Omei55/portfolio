import { StoryResponseDto } from '../../stories/dto/story-response.dto';

export class StoryStatusChangedEvent {
  constructor(
    public readonly story: StoryResponseDto,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly changedBy?: string,
  ) {}
}

