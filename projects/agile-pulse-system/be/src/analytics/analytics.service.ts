import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SprintEntity } from '../sprints/entities/sprint.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import {
  SprintAnalyticsDto,
  StoryAnalyticsDto,
  OverallAnalyticsDto,
  BurndownDataPoint,
  TrendData,
  VelocityTrendPoint,
  CreationTrendPoint,
  CompletionTrendPoint,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SprintEntity)
    private readonly sprintsRepository: Repository<SprintEntity>,
    @InjectRepository(StoryEntity)
    private readonly storiesRepository: Repository<StoryEntity>,
  ) {}

  async getSprintAnalytics(sprintName: string): Promise<SprintAnalyticsDto> {
    const sprint = await this.sprintsRepository.findOne({
      where: { name: sprintName },
    });

    if (!sprint) {
      throw new Error(`Sprint with name "${sprintName}" not found`);
    }

    const stories = await this.storiesRepository.find({
      where: { sprint: sprintName },
    });

    const totalStories = stories.length;
    const completedStories = stories.filter(
      (s) => s.status === 'Done' || s.status === 'Completed',
    ).length;
    const inProgressStories = stories.filter(
      (s) => s.status === 'In Progress',
    ).length;
    const todoStories = stories.filter((s) => s.status === 'To Do').length;

    const totalStoryPoints = stories.reduce(
      (sum, story) => sum + (story.story_points || 0),
      0,
    );

    const completedStoryPoints = stories
      .filter((s) => s.status === 'Done' || s.status === 'Completed')
      .reduce((sum, story) => sum + (story.story_points || 0), 0);

    const completionRate =
      totalStories > 0 ? (completedStories / totalStories) * 100 : 0;

    const velocity = completedStoryPoints;

    const averageStoryPoints =
      totalStories > 0 ? totalStoryPoints / totalStories : 0;

    // Group by status
    const storiesByStatus = stories.reduce(
      (acc, story) => {
        acc[story.status] = (acc[story.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by priority
    const storiesByPriority = stories.reduce(
      (acc, story) => {
        acc[story.priority] = (acc[story.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by assignee
    const storiesByAssignee = stories
      .filter((s) => s.assignee)
      .reduce(
        (acc, story) => {
          acc[story.assignee!] = (acc[story.assignee!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Calculate time-based metrics
    let daysRemaining: number | undefined;
    let daysElapsed: number | undefined;
    let sprintProgress = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sprint.start_date && sprint.end_date) {
      const startDate = new Date(sprint.start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(sprint.end_date);
      endDate.setHours(0, 0, 0, 0);

      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (today >= startDate && today <= endDate) {
        daysElapsed = Math.ceil(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        sprintProgress = (daysElapsed / totalDays) * 100;
      } else if (today < startDate) {
        daysRemaining = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        sprintProgress = 0;
      } else {
        daysRemaining = 0;
        sprintProgress = 100;
      }
    }

    // Generate burndown data
    const burndownData = this.generateBurndownData(
      sprint,
      stories,
      totalStoryPoints,
    );

    // Ensure dates are properly formatted (handle both Date objects and strings)
    const formatDate = (date: Date | string | null | undefined): Date | undefined => {
      if (!date) return undefined;
      if (date instanceof Date) return date;
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? undefined : parsed;
      }
      return undefined;
    };

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      startDate: formatDate(sprint.start_date),
      endDate: formatDate(sprint.end_date),
      totalStories,
      completedStories,
      inProgressStories,
      todoStories,
      totalStoryPoints,
      completedStoryPoints,
      completionRate: Math.round(completionRate * 100) / 100,
      velocity,
      averageStoryPoints: Math.round(averageStoryPoints * 100) / 100,
      storiesByStatus,
      storiesByPriority,
      storiesByAssignee,
      daysRemaining,
      daysElapsed,
      sprintProgress: Math.round(sprintProgress * 100) / 100,
      burndownData,
    };
  }

  private generateBurndownData(
    sprint: SprintEntity,
    stories: StoryEntity[],
    totalPoints: number,
  ): BurndownDataPoint[] {
    if (!sprint.start_date || !sprint.end_date) {
      return [];
    }

    const startDate = new Date(sprint.start_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(sprint.end_date);
    endDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (totalDays <= 0) {
      return [];
    }

    const dataPoints: BurndownDataPoint[] = [];
    const dailyVelocity = totalPoints / totalDays;

    // Generate data points for each day
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);

      // Calculate actual remaining points (stories not completed by this date)
      const completedByDate = stories
        .filter((story) => {
          if (story.status === 'Done' || story.status === 'Completed') {
            const updatedDate = new Date(story.updated_at);
            updatedDate.setHours(0, 0, 0, 0);
            return updatedDate <= currentDate;
          }
          return false;
        })
        .reduce((sum, story) => sum + (story.story_points || 0), 0);

      const remainingPoints = Math.max(0, totalPoints - completedByDate);
      const idealRemaining = Math.max(0, totalPoints - dailyVelocity * i);

      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        remainingPoints: Math.round(remainingPoints * 100) / 100,
        idealRemaining: Math.round(idealRemaining * 100) / 100,
      });
    }

    return dataPoints;
  }

  async getStoryAnalytics(): Promise<StoryAnalyticsDto> {
    const stories = await this.storiesRepository.find();

    const totalStories = stories.length;

    // Group by status
    const storiesByStatus = stories.reduce(
      (acc, story) => {
        acc[story.status] = (acc[story.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by priority
    const storiesByPriority = stories.reduce(
      (acc, story) => {
        acc[story.priority] = (acc[story.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by sprint
    const storiesBySprint = stories
      .filter((s) => s.sprint)
      .reduce(
        (acc, story) => {
          acc[story.sprint!] = (acc[story.sprint!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Group by assignee
    const storiesByAssignee = stories
      .filter((s) => s.assignee)
      .reduce(
        (acc, story) => {
          acc[story.assignee!] = (acc[story.assignee!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Group by epic
    const storiesByEpic = stories
      .filter((s) => s.epic)
      .reduce(
        (acc, story) => {
          acc[story.epic!] = (acc[story.epic!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const totalStoryPoints = stories.reduce(
      (sum, story) => sum + (story.story_points || 0),
      0,
    );

    const averageStoryPoints =
      totalStories > 0 ? totalStoryPoints / totalStories : 0;

    const unassignedStories = stories.filter(
      (s) => !s.sprint || s.sprint === '',
    ).length;

    // MVP Stories: stories with Critical or High priority
    const mvpStories = stories.filter((s) =>
      ['Critical', 'High'].includes(s.priority),
    ).length;

    // Sprint-Ready Stories: have story points, acceptance criteria, not done
    const sprintReadyStories = stories.filter(
      (s) =>
        s.story_points !== null &&
        s.story_points !== undefined &&
        s.acceptance_criteria &&
        s.acceptance_criteria.trim() !== '' &&
        s.status !== 'Done' &&
        s.status !== 'Completed',
    ).length;

    const storiesWithValue = stories.filter((s) => s.value !== null).length;
    const storiesWithEffort = stories.filter((s) => s.effort !== null).length;

    const valueSum = stories
      .filter((s) => s.value !== null)
      .reduce((sum, story) => sum + (story.value || 0), 0);
    const averageValue = storiesWithValue > 0 ? valueSum / storiesWithValue : 0;

    const effortSum = stories
      .filter((s) => s.effort !== null)
      .reduce((sum, story) => sum + (story.effort || 0), 0);
    const averageEffort =
      storiesWithEffort > 0 ? effortSum / storiesWithEffort : 0;

    const valueEffortRatio =
      averageEffort > 0 ? averageValue / averageEffort : 0;

    // Recent stories (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentStories = stories.filter(
      (s) => new Date(s.created_at) >= sevenDaysAgo,
    ).length;

    return {
      totalStories,
      mvpStories,
      sprintReadyStories,
      storiesByStatus,
      storiesByPriority,
      storiesBySprint,
      storiesByAssignee,
      averageStoryPoints: Math.round(averageStoryPoints * 100) / 100,
      totalStoryPoints,
      unassignedStories,
      storiesWithValue,
      storiesWithEffort,
      averageValue: Math.round(averageValue * 100) / 100,
      averageEffort: Math.round(averageEffort * 100) / 100,
      valueEffortRatio: Math.round(valueEffortRatio * 100) / 100,
      storiesByEpic,
      recentStories,
    };
  }

  async getOverallAnalytics(): Promise<OverallAnalyticsDto> {
    const sprints = await this.sprintsRepository.find();
    const stories = await this.storiesRepository.find();

    const totalSprints = sprints.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSprints = sprints.filter((sprint) => {
      if (!sprint.start_date || !sprint.end_date) return false;
      try {
        const startDate = new Date(sprint.start_date);
        const endDate = new Date(sprint.end_date);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return today >= startDate && today <= endDate;
      } catch (error) {
        console.warn('Error processing sprint dates for active sprints:', error);
        return false;
      }
    }).length;

    const completedSprints = sprints.filter((sprint) => {
      if (!sprint.end_date) return false;
      try {
        const endDate = new Date(sprint.end_date);
        if (isNaN(endDate.getTime())) return false;
        endDate.setHours(0, 0, 0, 0);
        return today > endDate;
      } catch (error) {
        console.warn('Error processing sprint dates for completed sprints:', error);
        return false;
      }
    }).length;

    const totalStories = stories.length;
    
    // MVP Stories: Stories with Critical or High priority
    const mvpStories = stories.filter((story) =>
      ['Critical', 'High'].includes(story.priority),
    ).length;

    // Sprint-Ready Stories: Stories that are not in a sprint, have priority/status, and are not Done
    const sprintReadyStories = stories.filter(
      (story) =>
        !story.sprint &&
        story.priority &&
        story.status &&
        story.status !== 'Done',
    ).length;

    const completedStories = stories.filter(
      (s) => s.status === 'Done' || s.status === 'Completed',
    ).length;
    const inProgressStories = stories.filter(
      (s) => s.status === 'In Progress',
    ).length;
    const todoStories = stories.filter((s) => s.status === 'To Do').length;

    const totalStoryPoints = stories.reduce(
      (sum, story) => sum + (story.story_points || 0),
      0,
    );

    const completedStoryPoints = stories
      .filter((s) => s.status === 'Done' || s.status === 'Completed')
      .reduce((sum, story) => sum + (story.story_points || 0), 0);

    const overallCompletionRate =
      totalStories > 0 ? (completedStories / totalStories) * 100 : 0;

    // Calculate sprint analytics for all sprints
    // Use error handling to prevent crashes if individual sprint analytics fail
    const sprintAnalyticsPromises = sprints.map((sprint) =>
      this.getSprintAnalytics(sprint.name).catch((error) => {
        console.warn(`Error getting analytics for sprint ${sprint.name}:`, error);
        return null;
      }),
    );
    const sprintAnalyticsResults = await Promise.all(sprintAnalyticsPromises);
    const sprintAnalytics = sprintAnalyticsResults.filter((sa) => sa !== null);

    // Calculate average velocity from completed sprints
    const completedSprintAnalytics = sprintAnalytics.filter((sa) => {
      if (!sa || !sa.endDate) return false;
      try {
        const endDate = new Date(sa.endDate);
        if (isNaN(endDate.getTime())) return false;
        endDate.setHours(0, 0, 0, 0);
        return today > endDate;
      } catch (error) {
        console.warn('Error processing endDate for sprint analytics:', error);
        return false;
      }
    });

    const averageSprintVelocity =
      completedSprintAnalytics.length > 0
        ? completedSprintAnalytics.reduce((sum, sa) => sum + sa.velocity, 0) /
          completedSprintAnalytics.length
        : 0;

    // Get story analytics
    const storyAnalytics = await this.getStoryAnalytics();

    // Generate trends
    const trends = await this.generateTrends(sprints, stories);

    return {
      totalSprints,
      activeSprints,
      completedSprints,
      totalStories,
      mvpStories,
      sprintReadyStories,
      completedStories,
      inProgressStories,
      todoStories,
      totalStoryPoints,
      completedStoryPoints,
      overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
      averageSprintVelocity: Math.round(averageSprintVelocity * 100) / 100,
      sprintAnalytics,
      storyAnalytics,
      trends,
    };
  }

  private async generateTrends(
    sprints: SprintEntity[],
    stories: StoryEntity[],
  ): Promise<TrendData> {
    // Helper function to safely convert date to string
    const dateToString = (date: Date | string | null | undefined): string => {
      if (!date) {
        return new Date().toISOString().split('T')[0];
      }
      try {
        if (date instanceof Date) {
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } else if (typeof date === 'string') {
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
          // Try to extract YYYY-MM-DD format from string
          const match = date.match(/^\d{4}-\d{2}-\d{2}/);
          if (match) {
            return match[0];
          }
        }
      } catch (error) {
        console.warn('Error processing date:', error);
      }
      return new Date().toISOString().split('T')[0];
    };

    // Velocity trend
    const velocityTrend: VelocityTrendPoint[] = sprints
      .filter((s) => s.end_date != null)
      .map((sprint) => {
        const sprintStories = stories.filter((s) => s.sprint === sprint.name);
        const velocity = sprintStories
          .filter((s) => s.status === 'Done' || s.status === 'Completed')
          .reduce((sum, story) => sum + (story.story_points || 0), 0);

        // Handle end_date which might be a Date object or string (after JSON serialization)
        // TypeORM returns Date objects, but JSON serialization converts them to strings
        const endDateStr = dateToString(sprint.end_date as Date | string | null | undefined);

        return {
          sprintName: sprint.name,
          velocity,
          date: endDateStr,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Story creation trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentStories = stories.filter(
      (s) => new Date(s.created_at) >= thirtyDaysAgo,
    );

    const creationTrendMap = new Map<string, number>();
    recentStories.forEach((story) => {
      const date = new Date(story.created_at).toISOString().split('T')[0];
      creationTrendMap.set(date, (creationTrendMap.get(date) || 0) + 1);
    });

    const creationTrend: CreationTrendPoint[] = Array.from(
      creationTrendMap.entries(),
    )
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Completion trend (last 30 days)
    const completionTrendMap = new Map<
      string,
      { completed: number; total: number }
    >();

    recentStories.forEach((story) => {
      const date = new Date(story.updated_at).toISOString().split('T')[0];
      const current = completionTrendMap.get(date) || {
        completed: 0,
        total: 0,
      };
      current.total++;
      if (story.status === 'Done' || story.status === 'Completed') {
        current.completed++;
      }
      completionTrendMap.set(date, current);
    });

    const completionTrend: CompletionTrendPoint[] = Array.from(
      completionTrendMap.entries(),
    )
      .map(([date, data]) => ({
        date,
        completed: data.completed,
        total: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      sprintVelocityTrend: velocityTrend,
      storyCreationTrend: creationTrend,
      completionTrend,
    };
  }
}
