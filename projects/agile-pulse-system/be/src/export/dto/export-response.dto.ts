export class ExportResult {
  storyId: string;
  success: boolean;
  externalId?: string; // Jira issue key or Taiga story ID
  error?: string;
}

export class ExportResponseDto {
  platform: string;
  totalStories: number;
  successful: number;
  failed: number;
  results: ExportResult[];
}


