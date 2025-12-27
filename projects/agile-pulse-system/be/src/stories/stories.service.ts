import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { StoryEntity } from './entities/story.entity';
import { StoryResponseDto } from './dto/story-response.dto';
import { FilterQueryDto } from './dto/filter-query.dto';
import {
  PaginatedStoriesResponseDto,
  PaginationMetaDto,
} from './dto/paginated-response.dto';
import { StoryStatusChangedEvent } from '../notifications/events/story-status-changed.event';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(StoryEntity)
    private readonly storiesRepository: Repository<StoryEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private toResponseDto(story: StoryEntity): StoryResponseDto {
    return {
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptance_criteria,
      priority: story.priority,
      storyPoints: story.story_points,
      assignee: story.assignee,
      status: story.status,
      sprint: story.sprint,
      epic: story.epic,
      tags: story.tags ?? [],
      value: story.value,
      effort: story.effort,
      hasTests: story.has_tests ?? false,
      hasBlockers: story.has_blockers ?? false,
      createdAt: story.created_at,
      updatedAt: story.updated_at,
    };
  }

  async create(create_story_dto: CreateStoryDto): Promise<StoryResponseDto> {
    const story = this.storiesRepository.create({
      title: create_story_dto.title,
      description: create_story_dto.description,
      acceptance_criteria: create_story_dto.acceptanceCriteria,
      priority: create_story_dto.priority || 'Medium',
      story_points: create_story_dto.storyPoints ?? null,
      assignee: create_story_dto.assignee ?? null,
      status: create_story_dto.status || 'To Do',
      sprint: create_story_dto.sprint ?? null,
      epic: create_story_dto.epic ?? null,
      tags: Array.isArray(create_story_dto.tags) ? create_story_dto.tags : [],
      value: create_story_dto.value ?? null,
      effort: create_story_dto.effort ?? null,
      has_tests: create_story_dto.hasTests ?? false,
      has_blockers: create_story_dto.hasBlockers ?? false,
    });

    const savedStory = await this.storiesRepository.save(story);
    return this.toResponseDto(savedStory);
  }

  async findAll(
    filters?: FilterQueryDto,
  ): Promise<StoryResponseDto[] | PaginatedStoriesResponseDto> {
    const queryBuilder = this.buildFilterQuery(filters);

    // Check if pagination is requested
    if (filters?.page && filters?.limit) {
      return this.findAllPaginated(queryBuilder, filters);
    }

    // Return all results without pagination
    const stories = await queryBuilder.getMany();
    return stories.map((story) => this.toResponseDto(story));
  }

  private buildFilterQuery(
    filters?: FilterQueryDto,
  ): SelectQueryBuilder<StoryEntity> {
    const queryBuilder = this.storiesRepository.createQueryBuilder('story');

    if (!filters) {
      // Default ordering if no filters
      queryBuilder
        .orderBy('story.updated_at', 'DESC')
        .addOrderBy('story.created_at', 'DESC');
      return queryBuilder;
    }

    // Priority filter - support single or multiple
    if (filters.priorities && filters.priorities.length > 0) {
      queryBuilder.andWhere('story.priority IN (:...priorities)', {
        priorities: filters.priorities,
      });
    } else if (filters.priority) {
      queryBuilder.andWhere('story.priority = :priority', {
        priority: filters.priority,
      });
    }

    // Status filter - support single or multiple
    if (filters.statuses && filters.statuses.length > 0) {
      queryBuilder.andWhere('story.status IN (:...statuses)', {
        statuses: filters.statuses,
      });
    } else if (filters.status) {
      queryBuilder.andWhere('story.status = :status', {
        status: filters.status,
      });
    }

    // Story points range filter
    if (filters.storyPointsMin !== undefined) {
      queryBuilder.andWhere(
        '(story.story_points IS NOT NULL AND story.story_points >= :storyPointsMin)',
        {
          storyPointsMin: filters.storyPointsMin,
        },
      );
    }

    if (filters.storyPointsMax !== undefined) {
      queryBuilder.andWhere(
        '(story.story_points IS NOT NULL AND story.story_points <= :storyPointsMax)',
        {
          storyPointsMax: filters.storyPointsMax,
        },
      );
    }

    // Sprint filter - support single or multiple
    if (filters.sprints && filters.sprints.length > 0) {
      queryBuilder.andWhere('story.sprint IN (:...sprints)', {
        sprints: filters.sprints,
      });
    } else if (filters.sprint) {
      queryBuilder.andWhere('story.sprint = :sprint', {
        sprint: filters.sprint,
      });
    }

    // Epic filter
    if (filters.epic) {
      queryBuilder.andWhere('story.epic = :epic', {
        epic: filters.epic,
      });
    }

    // Assignee filter - support single or multiple
    if (filters.assignees && filters.assignees.length > 0) {
      queryBuilder.andWhere('story.assignee IN (:...assignees)', {
        assignees: filters.assignees,
      });
    } else if (filters.assignee) {
      queryBuilder.andWhere('story.assignee = :assignee', {
        assignee: filters.assignee,
      });
    }

    // Tags filter - stories that contain any of the provided tags
    if (filters.tags && filters.tags.length > 0) {
      // For simple-json columns, TypeORM stores them as JSON strings
      // We search for tags in the JSON array format
      const tagConditions = filters.tags.map((tag, index) => {
        const paramName = `tag${index}`;
        queryBuilder.setParameter(paramName, `%"${tag}"%`);
        return `(story.tags::text ILIKE :${paramName})`;
      });
      queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`);
    }

    // Value range filter
    if (filters.valueMin !== undefined) {
      queryBuilder.andWhere(
        '(story.value IS NOT NULL AND story.value >= :valueMin)',
        {
          valueMin: filters.valueMin,
        },
      );
    }

    if (filters.valueMax !== undefined) {
      queryBuilder.andWhere(
        '(story.value IS NOT NULL AND story.value <= :valueMax)',
        {
          valueMax: filters.valueMax,
        },
      );
    }

    // Effort range filter
    if (filters.effortMin !== undefined) {
      queryBuilder.andWhere(
        '(story.effort IS NOT NULL AND story.effort >= :effortMin)',
        {
          effortMin: filters.effortMin,
        },
      );
    }

    if (filters.effortMax !== undefined) {
      queryBuilder.andWhere(
        '(story.effort IS NOT NULL AND story.effort <= :effortMax)',
        {
          effortMax: filters.effortMax,
        },
      );
    }

    // Search query - searches in title, description, and acceptance criteria
    if (filters.search) {
      const searchTerm = `%${filters.search.trim()}%`;
      queryBuilder.andWhere(
        '(story.title ILIKE :search OR story.description ILIKE :search OR story.acceptance_criteria ILIKE :search)',
        {
          search: searchTerm,
        },
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'updatedAt';
    const sortOrder = filters.sortOrder?.toUpperCase() || 'DESC';

    switch (sortBy) {
      case 'title':
        queryBuilder.orderBy('story.title', sortOrder as 'ASC' | 'DESC');
        break;
      case 'priority':
        queryBuilder.orderBy('story.priority', sortOrder as 'ASC' | 'DESC');
        break;
      case 'status':
        queryBuilder.orderBy('story.status', sortOrder as 'ASC' | 'DESC');
        break;
      case 'storyPoints':
        queryBuilder.orderBy(
          'story.story_points',
          sortOrder as 'ASC' | 'DESC',
        );
        break;
      case 'createdAt':
        queryBuilder.orderBy('story.created_at', sortOrder as 'ASC' | 'DESC');
        break;
      case 'updatedAt':
        queryBuilder.orderBy('story.updated_at', sortOrder as 'ASC' | 'DESC');
        break;
      case 'assignee':
        queryBuilder.orderBy('story.assignee', sortOrder as 'ASC' | 'DESC');
        break;
      case 'sprint':
        queryBuilder.orderBy('story.sprint', sortOrder as 'ASC' | 'DESC');
        break;
      default:
        queryBuilder
          .orderBy('story.updated_at', 'DESC')
          .addOrderBy('story.created_at', 'DESC');
    }

    return queryBuilder;
  }

  private async findAllPaginated(
    queryBuilder: SelectQueryBuilder<StoryEntity>,
    filters: FilterQueryDto,
  ): Promise<PaginatedStoriesResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    // Clone query builder for counting total records
    const countQueryBuilder = queryBuilder.clone();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute queries in parallel
    const [stories, total] = await Promise.all([
      queryBuilder.getMany(),
      countQueryBuilder.getCount(),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    return {
      data: stories.map((story) => this.toResponseDto(story)),
      meta,
    };
  }

  async findOne(id: string): Promise<StoryResponseDto> {
    const story = await this.storiesRepository.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return this.toResponseDto(story);
  }

  async update(
    id: string,
    update_story_dto: UpdateStoryDto,
    changedByUserId?: string,
    changedByName?: string,
  ): Promise<StoryResponseDto> {
    const story = await this.storiesRepository.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    const previousStatus = story.status;
    const newStatus = update_story_dto.status ?? story.status;

    const updated_story = Object.assign(story, {
      title: update_story_dto.title ?? story.title,
      description: update_story_dto.description ?? story.description,
      acceptance_criteria:
        update_story_dto.acceptanceCriteria ?? story.acceptance_criteria,
      priority: update_story_dto.priority ?? story.priority,
      story_points: update_story_dto.storyPoints ?? story.story_points,
      assignee: update_story_dto.assignee ?? story.assignee,
      status: newStatus,
      sprint: update_story_dto.sprint ?? story.sprint,
      epic: update_story_dto.epic ?? story.epic,
      tags: Array.isArray(update_story_dto.tags)
        ? update_story_dto.tags
        : (story.tags ?? []),
      value: update_story_dto.value ?? story.value,
      effort: update_story_dto.effort ?? story.effort,
      has_tests:
        update_story_dto.hasTests ?? story.has_tests ?? false,
      has_blockers:
        update_story_dto.hasBlockers ?? story.has_blockers ?? false,
    });

    const savedStory = await this.storiesRepository.save(updated_story);
    const storyResponse = this.toResponseDto(savedStory);

    // Emit event if status changed
    if (previousStatus !== newStatus) {
      const event = new StoryStatusChangedEvent(
        storyResponse,
        previousStatus,
        newStatus,
        changedByName || changedByUserId || undefined,
      );
      this.eventEmitter.emit('story.status.changed', event);
    }

    return storyResponse;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.storiesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return { message: 'Story deleted successfully' };
  }

  async search(query: string): Promise<StoryResponseDto[]> {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
      const result = await this.findAll();
      return Array.isArray(result) ? result : result.data;
    }

    const stories = await this.storiesRepository
      .createQueryBuilder('story')
      .where('story.title ILIKE :search OR story.description ILIKE :search', {
        search: `%${trimmedQuery}%`,
      })
      .orderBy('story.updated_at', 'DESC')
      .addOrderBy('story.created_at', 'DESC')
      .getMany();

    return stories.map((story) => this.toResponseDto(story));
  }

  async exportStories(
    storyIds: string[] | undefined,
    format: 'json' | 'csv',
    target: 'jira' | 'taiga' | 'generic',
  ): Promise<{ data: string; filename: string; mimeType: string }> {
    let stories: StoryEntity[];
    if (storyIds && storyIds.length > 0) {
      stories = await this.storiesRepository.find({
        where: storyIds.map((id) => ({ id })),
      });
    } else {
      stories = await this.storiesRepository.find({
        order: { created_at: 'DESC' },
      });
    }

    const mappedStories = stories.map((story) =>
      this.mapStoryForExport(story, target),
    );

    if (format === 'json') {
      return {
        data: JSON.stringify(mappedStories, null, 2),
        filename: `stories_export_${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
      };
    } else {
      return {
        data: this.generateCSV(mappedStories),
        filename: `stories_export_${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv',
      };
    }
  }

  private mapStoryForExport(
    story: StoryEntity,
    target: 'jira' | 'taiga' | 'generic',
  ): any {
    const baseStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptance_criteria,
      priority: story.priority,
      storyPoints: story.story_points,
      assignee: story.assignee,
      status: story.status,
      sprint: story.sprint,
      epic: story.epic,
      tags: story.tags || [],
      value: story.value,
      effort: story.effort,
      createdAt: story.created_at?.toISOString(),
      updatedAt: story.updated_at?.toISOString(),
    };

    if (target === 'jira') {
      // Jira field mapping
      return {
        summary: story.title,
        description: story.description,
        issuetype: { name: 'Story' },
        priority: { name: this.mapPriorityToJira(story.priority) },
        storyPoints: story.story_points,
        assignee: story.assignee ? { name: story.assignee } : null,
        status: this.mapStatusToJira(story.status),
        labels: story.tags || [],
        customfield_10020: story.sprint, // Sprint field in Jira
        epic: story.epic,
        acceptanceCriteria: story.acceptance_criteria,
        value: story.value,
        effort: story.effort,
        created: story.created_at?.toISOString(),
        updated: story.updated_at?.toISOString(),
      };
    } else if (target === 'taiga') {
      // Taiga field mapping
      return {
        subject: story.title,
        description: story.description,
        tags: story.tags || [],
        assigned_to: story.assignee || null,
        status: this.mapStatusToTaiga(story.status),
        priority: this.mapPriorityToTaiga(story.priority),
        storyPoints: story.story_points,
        epic: story.epic,
        acceptanceCriteria: story.acceptance_criteria,
        sprint: story.sprint,
        value: story.value,
        effort: story.effort,
        created_date: story.created_at?.toISOString(),
        modified_date: story.updated_at?.toISOString(),
      };
    } else {
      // Generic format
      return baseStory;
    }
  }

  private mapPriorityToJira(priority: string): string {
    const mapping: Record<string, string> = {
      Critical: 'Highest',
      High: 'High',
      Medium: 'Medium',
      Low: 'Low',
    };
    return mapping[priority] || 'Medium';
  }

  private mapStatusToJira(status: string): string {
    const mapping: Record<string, string> = {
      'To Do': 'To Do',
      'In Progress': 'In Progress',
      'In Review': 'In Review',
      Done: 'Done',
    };
    return mapping[status] || 'To Do';
  }

  private mapPriorityToTaiga(priority: string): number {
    const mapping: Record<string, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };
    return mapping[priority] || 2;
  }

  private mapStatusToTaiga(status: string): number {
    const mapping: Record<string, number> = {
      'To Do': 1,
      'In Progress': 2,
      'In Review': 3,
      Done: 4,
    };
    return mapping[status] || 1;
  }

  private generateCSV(stories: any[]): string {
    if (stories.length === 0) {
      return '';
    }

    const headers = Object.keys(stories[0]);
    const csvHeaders = headers.join(',');
    const csvRows = stories.map((story) =>
      headers
        .map((header) => {
          const value = story[header];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value).replace(/"/g, '""');
          }
          return String(value).replace(/"/g, '""');
        })
        .map((val) => `"${val}"`)
        .join(','),
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  async getAnalytics() {
    const allStories = await this.storiesRepository.find();

    const totalStories = allStories.length;

    // MVP Stories: Stories with Critical or High priority
    const mvpStories = allStories.filter((story) =>
      ['Critical', 'High'].includes(story.priority),
    ).length;

    // Sprint-Ready Stories: Stories that are not in a sprint, have priority/status, and are not Done
    const sprintReadyStories = allStories.filter(
      (story) =>
        !story.sprint &&
        story.priority &&
        story.status &&
        story.status !== 'Done',
    ).length;

    return {
      totalStories,
      mvpStories,
      sprintReadyStories,
    };
  }
}
