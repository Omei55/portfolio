export class SprintStatsDto {
  total_stories: number;
  total_points: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_assignee: Record<string, number>;
}



