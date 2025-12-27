export class SprintAnalyticsDto {
  sprintId: string;
  sprintName: string;
  startDate?: Date;
  endDate?: Date;
  totalStories: number;
  completedStories: number;
  inProgressStories: number;
  todoStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completionRate: number; // percentage
  velocity: number; // story points completed
  averageStoryPoints: number;
  storiesByStatus: Record<string, number>;
  storiesByPriority: Record<string, number>;
  storiesByAssignee: Record<string, number>;
  daysRemaining?: number;
  daysElapsed?: number;
  sprintProgress: number; // percentage based on time
  burndownData?: BurndownDataPoint[];
}

export class BurndownDataPoint {
  date: string;
  remainingPoints: number;
  idealRemaining: number;
}

export class StoryAnalyticsDto {
  totalStories: number;
  mvpStories: number; // stories with Critical or High priority
  sprintReadyStories: number; // stories ready for sprint (have story points, acceptance criteria, not done)
  storiesByStatus: Record<string, number>;
  storiesByPriority: Record<string, number>;
  storiesBySprint: Record<string, number>;
  storiesByAssignee: Record<string, number>;
  averageStoryPoints: number;
  totalStoryPoints: number;
  unassignedStories: number;
  storiesWithValue: number;
  storiesWithEffort: number;
  averageValue: number;
  averageEffort: number;
  valueEffortRatio: number; // average value / average effort
  storiesByEpic: Record<string, number>;
  recentStories: number; // stories created in last 7 days
}

export class OverallAnalyticsDto {
  totalSprints: number;
  activeSprints: number;
  completedSprints: number;
  totalStories: number;
  mvpStories: number; // stories with Critical or High priority
  sprintReadyStories: number; // stories ready for sprint
  completedStories: number;
  inProgressStories: number;
  todoStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  overallCompletionRate: number;
  averageSprintVelocity: number;
  sprintAnalytics: SprintAnalyticsDto[];
  storyAnalytics: StoryAnalyticsDto;
  trends: TrendData;
}

export class TrendData {
  sprintVelocityTrend: VelocityTrendPoint[];
  storyCreationTrend: CreationTrendPoint[];
  completionTrend: CompletionTrendPoint[];
}

export class VelocityTrendPoint {
  sprintName: string;
  velocity: number;
  date: string;
}

export class CreationTrendPoint {
  date: string;
  count: number;
}

export class CompletionTrendPoint {
  date: string;
  completed: number;
  total: number;
}
