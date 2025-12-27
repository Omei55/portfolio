import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { SprintEntity } from './entities/sprint.entity';
import { StoryEntity } from '../stories/entities/story.entity';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(SprintEntity)
    private readonly sprints_repository: Repository<SprintEntity>,
    @InjectRepository(StoryEntity)
    private readonly stories_repository: Repository<StoryEntity>,
  ) {}

  async create(
    createSprintDto: CreateSprintDto,
  ): Promise<{ sprint: SprintEntity; message: string }> {
    // Parse and normalize dates to date-only (remove time component)
    const startDateInput = new Date(createSprintDto.startDate);
    const endDateInput = new Date(createSprintDto.endDate);

    // Normalize to UTC midnight for consistent comparison
    const startDate = new Date(
      Date.UTC(
        startDateInput.getUTCFullYear(),
        startDateInput.getUTCMonth(),
        startDateInput.getUTCDate(),
      ),
    );
    const endDate = new Date(
      Date.UTC(
        endDateInput.getUTCFullYear(),
        endDateInput.getUTCMonth(),
        endDateInput.getUTCDate(),
      ),
    );

    // Validate date range
    if (endDate < startDate) {
      throw new BadRequestException(
        'End date must be greater than or equal to start date',
      );
    }

    // Check if sprint with same name already exists
    const existingByName = await this.sprints_repository.findOne({
      where: { name: createSprintDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `Sprint with name "${createSprintDto.name}" already exists`,
      );
    }

    // Check for overlapping sprints (only check sprints with valid dates)
    // Two date ranges overlap if: start1 <= end2 AND end1 >= start2
    const overlappingSprint = await this.sprints_repository
      .createQueryBuilder('sprint')
      .where('sprint.start_date IS NOT NULL')
      .andWhere('sprint.end_date IS NOT NULL')
      .andWhere('sprint.start_date <= :endDate', { endDate })
      .andWhere('sprint.end_date >= :startDate', { startDate })
      .getOne();

    if (overlappingSprint) {
      // Format dates for better error message
      const formatDate = (date: Date | null): string => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      const overlapStart = formatDate(overlappingSprint.start_date);
      const overlapEnd = formatDate(overlappingSprint.end_date);
      const newStart = formatDate(startDate);
      const newEnd = formatDate(endDate);

      throw new ConflictException(
        `Sprint overlaps with existing sprint: "${overlappingSprint.name}" (${overlapStart} to ${overlapEnd}). Your sprint: ${newStart} to ${newEnd}`,
      );
    }

    const sprint = this.sprints_repository.create({
      name: createSprintDto.name,
      start_date: startDate,
      end_date: endDate,
      description: createSprintDto.description,
    });

    const savedSprint = await this.sprints_repository.save(sprint);
    return {
      sprint: savedSprint,
      message: 'Sprint created successfully',
    };
  }

  async findAll(): Promise<SprintEntity[]> {
    return this.sprints_repository.find({
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<SprintEntity> {
    const sprint = await this.sprints_repository.findOne({ where: { id } });
    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found`);
    }
    return sprint;
  }

  async update(
    id: string,
    updateSprintDto: UpdateSprintDto,
  ): Promise<SprintEntity> {
    const sprint = await this.findOne(id);

    if (updateSprintDto.name && updateSprintDto.name !== sprint.name) {
      const existing = await this.sprints_repository.findOne({
        where: { name: updateSprintDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Sprint with name "${updateSprintDto.name}" already exists`,
        );
      }
    }

    if (updateSprintDto.startDate || updateSprintDto.endDate) {
      const startDate = updateSprintDto.startDate
        ? new Date(updateSprintDto.startDate)
        : sprint.start_date;
      const endDate = updateSprintDto.endDate
        ? new Date(updateSprintDto.endDate)
        : sprint.end_date;

      if (endDate < startDate) {
        throw new BadRequestException(
          'End date must be greater than or equal to start date',
        );
      }

      // Check for overlapping sprints (excluding current sprint and only check sprints with valid dates)
      const overlappingSprint = await this.sprints_repository
        .createQueryBuilder('sprint')
        .where('sprint.id != :id', { id })
        .andWhere('sprint.start_date IS NOT NULL')
        .andWhere('sprint.end_date IS NOT NULL')
        .andWhere('sprint.start_date <= :endDate', { endDate })
        .andWhere('sprint.end_date >= :startDate', { startDate })
        .getOne();

      if (overlappingSprint) {
        throw new ConflictException(
          `Sprint overlaps with existing sprint: "${overlappingSprint.name}"`,
        );
      }
    }

    Object.assign(sprint, {
      name: updateSprintDto.name ?? sprint.name,
      start_date: updateSprintDto.startDate
        ? new Date(updateSprintDto.startDate)
        : sprint.start_date,
      end_date: updateSprintDto.endDate
        ? new Date(updateSprintDto.endDate)
        : sprint.end_date,
      description: updateSprintDto.description ?? sprint.description,
    });

    return this.sprints_repository.save(sprint);
  }

  async remove(id: string): Promise<{ message: string }> {
    const sprint = await this.findOne(id);
    await this.sprints_repository.remove(sprint);
    return { message: 'Sprint deleted successfully' };
  }

  async getUnassignedStories(): Promise<StoryEntity[]> {
    return this.stories_repository.find({
      where: [{ sprint: null }, { sprint: '' }],
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getSprintStories(sprintName: string): Promise<StoryEntity[]> {
    const sprint = await this.sprints_repository.findOne({
      where: { name: sprintName },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with name "${sprintName}" not found`);
    }

    return this.stories_repository.find({
      where: { sprint: sprintName },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getSprintStats(sprintName: string) {
    const sprint = await this.sprints_repository.findOne({
      where: { name: sprintName },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with name "${sprintName}" not found`);
    }

    const stories = await this.getSprintStories(sprintName);

    const totalPoints = stories.reduce(
      (sum, story) => sum + (story.story_points || 0),
      0,
    );

    const statusCounts = stories.reduce(
      (acc, story) => {
        acc[story.status] = (acc[story.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        description: sprint.description,
        goal: sprint.goal,
      },
      story_count: stories.length,
      total_points: totalPoints,
      status_counts: statusCounts,
    };
  }

  async assignStoryToSprint(
    storyId: string,
    sprintName: string,
  ): Promise<{ story: StoryEntity; message: string }> {
    const story = await this.stories_repository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }

    const sprint = await this.sprints_repository.findOne({
      where: { name: sprintName },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with name "${sprintName}" not found`);
    }

    story.sprint = sprintName;
    const savedStory = await this.stories_repository.save(story);
    return {
      story: savedStory,
      message: 'Story assigned to sprint successfully',
    };
  }

  async unassignStoryFromSprint(
    storyId: string,
  ): Promise<{ story: StoryEntity; message: string }> {
    const story = await this.stories_repository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }

    story.sprint = null;
    const savedStory = await this.stories_repository.save(story);
    return {
      story: savedStory,
      message: 'Story unassigned from sprint successfully',
    };
  }
}

