import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryEntity } from './entities/story.entity';
import { CheckReadinessResponseDto } from './dto/check-readiness.dto';

@Injectable()
export class ReadinessCheckerService {
  constructor(
    @InjectRepository(StoryEntity)
    private readonly storiesRepository: Repository<StoryEntity>,
  ) {}

  async checkReadiness(storyId: string): Promise<CheckReadinessResponseDto> {
    const story = await this.storiesRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }

    const checklist = {
      points: {
        value: story.story_points ?? null,
        required: true,
        passed: story.story_points !== null && story.story_points !== undefined && story.story_points > 0,
      },
      priority: {
        value: story.priority ?? 'Medium',
        required: true,
        passed: story.priority !== null && story.priority !== undefined && story.priority.trim() !== '',
      },
      estimation: {
        value: story.story_points ?? null,
        required: true,
        passed: story.story_points !== null && story.story_points !== undefined && story.story_points > 0,
      },
      tests: {
        value: story.has_tests ?? false,
        required: true,
        passed: story.has_tests === true,
      },
      blockers: {
        value: story.has_blockers ?? false,
        required: true,
        passed: story.has_blockers === false,
      },
      mvpTag: {
        value: story.tags?.includes('MVP') ?? false,
        required: false,
        passed: true, // MVP tag is optional, so it always passes
      },
    };

    const failedChecks: string[] = [];

    if (!checklist.points.passed) {
      failedChecks.push('Points must be entered');
    }
    if (!checklist.priority.passed) {
      failedChecks.push('Priority must be set');
    }
    if (!checklist.estimation.passed) {
      failedChecks.push('Estimation must be entered');
    }
    if (!checklist.tests.passed) {
      failedChecks.push('Tests must be created');
    }
    if (!checklist.blockers.passed) {
      failedChecks.push('Blockers must be resolved');
    }

    const isReady = failedChecks.length === 0;

    return {
      status: isReady ? 'Ready' : 'Incomplete',
      isReady,
      failedChecks,
      checklist,
    };
  }
}

