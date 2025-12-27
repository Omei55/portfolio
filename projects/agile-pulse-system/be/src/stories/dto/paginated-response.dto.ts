import { StoryResponseDto } from './story-response.dto';

export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class PaginatedStoriesResponseDto {
  data: StoryResponseDto[];
  meta: PaginationMetaDto;
}

