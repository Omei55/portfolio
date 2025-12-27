import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { SprintEntity } from '../sprints/entities/sprint.entity';
import { StoryEntity } from '../stories/entities/story.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SprintEntity, StoryEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
